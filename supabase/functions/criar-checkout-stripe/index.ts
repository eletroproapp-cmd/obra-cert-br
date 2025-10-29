import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret ausente");
      return new Response(
        JSON.stringify({ error: "Stripe não configurado. Adicione a STRIPE_SECRET_KEY." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planType, origin } = await req.json();
    if (!planType) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Cliente autenticado com o token do usuário
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Cliente admin (para updates quando RLS bloquear)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Obter usuário autenticado
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      console.error("getUser error:", userErr);
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // Obter price_id do plano no banco, se existir
    const { data: planRow } = await supabase
      .from("subscription_plans")
      .select("stripe_price_id")
      .eq("plan_type", planType)
      .single();

    // Fallback de mapa local (apenas se precisar)
    const priceMap: Record<string, string | undefined> = {
      basic: undefined,
      professional: undefined,
    };

    const priceId = planRow?.stripe_price_id || priceMap[planType];
    if (!priceId) {
      return new Response(
        JSON.stringify({
          error:
            "Plano sem price_id configurado. Configure os preços do Stripe para este plano.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar/validar customer no Stripe
    let customerId: string | undefined;

    const { data: subRow } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (subRow?.stripe_customer_id) {
      try {
        const existing = await stripe.customers.retrieve(subRow.stripe_customer_id);
        // @ts-ignore
        if (existing && !(existing as any).deleted) customerId = (existing as any).id;
      } catch (e: any) {
        if (!(e && e.raw && e.raw.code === "resource_missing")) throw e;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      // Tentar salvar no banco com usuário logado; se falhar por RLS, usa admin
      const updatePayload = { stripe_customer_id: customerId } as const;
      const { error: updErr } = await supabase
        .from("user_subscriptions")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (updErr) {
        console.warn("RLS bloqueou update, usando admin:", updErr?.message);
        await supabaseAdmin
          .from("user_subscriptions")
          .update(updatePayload)
          .eq("user_id", user.id);
      }
    }

    const successUrl = `${origin || req.headers.get("origin") || ""}/configuracoes?tab=plano&success=true`;
    const cancelUrl = `${origin || req.headers.get("origin") || ""}/configuracoes?tab=plano&canceled=true`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id, plan_type: planType },
    });

    if (!session.url) {
      throw new Error("Stripe não retornou URL de checkout");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro ao criar checkout:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro desconhecido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
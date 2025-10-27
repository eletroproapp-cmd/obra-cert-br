import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const { planType } = await req.json();
    
    // Mapear planType para price_id do Stripe
    const priceMap: Record<string, string> = {
      'basic': 'price_1SMsxeLKBkplmgbyChFmeJM6',
      'professional': 'price_1SMsj2LKBkplmgbyRB6qgZQX',
    };

    const priceId = priceMap[planType];
    if (!priceId) {
      throw new Error('Plano inválido');
    }

    // Pegar o usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Buscar ou criar customer do Stripe
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseServiceKey,
      },
    });

    const user = await userResponse.json();
    if (!user.id) {
      throw new Error('Usuário não encontrado');
    }

    let customerId: string | undefined;
    const subscriptionResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${user.id}&select=stripe_customer_id`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    
    const subscriptions = await subscriptionResponse.json();
    
    if (subscriptions[0]?.stripe_customer_id) {
      // Validar se o customer existe na conta/ambiente atual do Stripe
      try {
        const existing = await stripe.customers.retrieve(subscriptions[0].stripe_customer_id);
        // Se recuperar com sucesso, usamos o ID retornado
        // @ts-ignore - Stripe types allow both Customer & DeletedCustomer
        if (existing && !(existing as any).deleted) {
          // @ts-ignore
          customerId = existing.id as string;
        }
      } catch (e: any) {
        // Se o customer não existir nesta conta, iremos criar um novo
        if (!(e && e.raw && e.raw.code === 'resource_missing')) {
          throw e;
        }
      }
    }

    if (!customerId) {
      // Criar novo customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Atualizar subscription com customer_id
      await fetch(
        `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            stripe_customer_id: customerId,
          }),
        }
      );
    }

    // Criar checkout session (usa customer se válido, senão usa customer_email)
    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/configuracoes?tab=plano&success=true`,
      cancel_url: `${req.headers.get('origin')}/configuracoes?tab=plano&canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

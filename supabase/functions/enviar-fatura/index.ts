import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.1";
import DOMPurify from "https://esm.sh/isomorphic-dompurify@2.14.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const sanitize = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FaturaEmailRequest {
  faturaId: string;
  clienteEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check rate limit: 10 requests per hour
    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        _user_id: user.id,
        _function_name: 'enviar-fatura',
        _max_requests: 10,
        _window_minutes: 60
      });

    if (rateLimitError || !rateLimitOk) {
      console.log("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { faturaId, clienteEmail }: FaturaEmailRequest = await req.json();

    if (!faturaId || typeof faturaId !== 'string' || faturaId.length !== 36) {
      return new Response(
        JSON.stringify({ error: "ID de fatura inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clienteEmail || !emailRegex.test(clienteEmail)) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: fatura, error: faturaError } = await supabaseClient
      .from("faturas")
      .select(`
        *,
        clientes:cliente_id (nome, email),
        fatura_items (*)
      `)
      .eq("id", faturaId)
      .eq("user_id", user.id)
      .single();

    if (faturaError || !fatura) {
      return new Response(
        JSON.stringify({ error: "Fatura não encontrada ou acesso negado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const items = fatura.fatura_items
      .map((item: any, index: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sanitize(item.descricao)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sanitize(String(item.quantidade))}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sanitize(item.unidade || 'un')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">R$ ${Number(item.valor_unitario).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">R$ ${Number(item.valor_total).toFixed(2)}</td>
        </tr>
      `)
      .join("");

    const emailResponse = await resend.emails.send({
      from: "EletroPro <onboarding@resend.dev>",
      to: [clienteEmail],
      subject: `Fatura ${sanitize(fatura.numero)} - ${sanitize(fatura.titulo)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #333;">Fatura ${sanitize(fatura.numero)}</h1>
          <h2 style="color: #666;">${sanitize(fatura.titulo)}</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Cliente:</strong> ${sanitize(fatura.clientes.nome)}</p>
            <p><strong>Status:</strong> ${sanitize(fatura.status)}</p>
            <p><strong>Vencimento:</strong> ${new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}</p>
            ${fatura.forma_pagamento ? `<p><strong>Forma de Pagamento:</strong> ${sanitize(fatura.forma_pagamento)}</p>` : ''}
            ${fatura.descricao ? `<p><strong>Descrição:</strong> ${sanitize(fatura.descricao)}</p>` : ''}
          </div>

          <h3>Itens da Fatura:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">#</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Descrição</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Qtd</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Un</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Valor Unit.</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <div style="text-align: right; margin: 20px 0;">
            <h2 style="color: #333;">Total: R$ ${Number(fatura.valor_total).toFixed(2)}</h2>
          </div>

          ${fatura.observacoes ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #333;">
              <strong>Observações:</strong>
              <p>${sanitize(fatura.observacoes)}</p>
            </div>
          ` : ''}

          <div style="margin: 30px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
            <strong>⚠️ Atenção:</strong>
            <p>Pagamento deve ser realizado até ${new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            Este é um e-mail automático. Para mais informações, entre em contato conosco.
          </p>
        </div>
      `,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Erro ao enviar fatura:", error);
    return new Response(
      JSON.stringify({ error: "Não foi possível enviar a fatura" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

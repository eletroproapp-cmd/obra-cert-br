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

interface OrcamentoEmailRequest {
  orcamentoId: string;
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
        _function_name: 'enviar-orcamento',
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

    const { orcamentoId, clienteEmail }: OrcamentoEmailRequest = await req.json();

    if (!orcamentoId || typeof orcamentoId !== 'string' || orcamentoId.length !== 36) {
      return new Response(
        JSON.stringify({ error: "ID de orçamento inválido" }),
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

    const { data: orcamento, error: orcamentoError } = await supabaseClient
      .from("orcamentos")
      .select(`
        *,
        clientes:cliente_id (nome, email),
        orcamento_items (*)
      `)
      .eq("id", orcamentoId)
      .eq("user_id", user.id)
      .single();

    if (orcamentoError || !orcamento) {
      return new Response(
        JSON.stringify({ error: "Orçamento não encontrado ou acesso negado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const items = orcamento.orcamento_items
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
      subject: `Orçamento ${sanitize(orcamento.numero)} - ${sanitize(orcamento.titulo)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #333;">Orçamento ${sanitize(orcamento.numero)}</h1>
          <h2 style="color: #666;">${sanitize(orcamento.titulo)}</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Cliente:</strong> ${sanitize(orcamento.clientes.nome)}</p>
            <p><strong>Status:</strong> ${sanitize(orcamento.status)}</p>
            <p><strong>Validade:</strong> ${sanitize(String(orcamento.validade_dias))} dias</p>
            ${orcamento.descricao ? `<p><strong>Descrição:</strong> ${sanitize(orcamento.descricao)}</p>` : ''}
          </div>

          <h3>Itens do Orçamento:</h3>
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
            <h2 style="color: #333;">Total: R$ ${Number(orcamento.valor_total).toFixed(2)}</h2>
          </div>

          ${orcamento.observacoes ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #333;">
              <strong>Observações:</strong>
              <p>${sanitize(orcamento.observacoes)}</p>
            </div>
          ` : ''}

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
    console.error("Erro ao enviar orçamento:", error);
    return new Response(
      JSON.stringify({ error: "Não foi possível enviar o orçamento" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

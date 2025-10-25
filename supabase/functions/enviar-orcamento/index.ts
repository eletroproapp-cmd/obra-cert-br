import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { orcamentoId, clienteEmail }: OrcamentoEmailRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: orcamento, error: orcamentoError } = await supabase
      .from("orcamentos")
      .select(`
        *,
        clientes:cliente_id (nome, email),
        orcamento_items (*)
      `)
      .eq("id", orcamentoId)
      .single();

    if (orcamentoError || !orcamento) {
      throw new Error("Orçamento não encontrado");
    }

    const items = orcamento.orcamento_items
      .map((item: any, index: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.descricao}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantidade}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.unidade || 'un'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">R$ ${Number(item.valor_unitario).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">R$ ${Number(item.valor_total).toFixed(2)}</td>
        </tr>
      `)
      .join("");

    const emailResponse = await resend.emails.send({
      from: "EletroPro <onboarding@resend.dev>",
      to: [clienteEmail],
      subject: `Orçamento ${orcamento.numero} - ${orcamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #333;">Orçamento ${orcamento.numero}</h1>
          <h2 style="color: #666;">${orcamento.titulo}</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Cliente:</strong> ${orcamento.clientes.nome}</p>
            <p><strong>Status:</strong> ${orcamento.status}</p>
            <p><strong>Validade:</strong> ${orcamento.validade_dias} dias</p>
            ${orcamento.descricao ? `<p><strong>Descrição:</strong> ${orcamento.descricao}</p>` : ''}
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
              <p>${orcamento.observacoes}</p>
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

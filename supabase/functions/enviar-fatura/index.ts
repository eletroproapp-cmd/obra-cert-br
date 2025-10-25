import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { faturaId, clienteEmail }: FaturaEmailRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        *,
        clientes:cliente_id (nome, email),
        fatura_items (*)
      `)
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    const items = fatura.fatura_items
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
      subject: `Fatura ${fatura.numero} - ${fatura.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #333;">Fatura ${fatura.numero}</h1>
          <h2 style="color: #666;">${fatura.titulo}</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Cliente:</strong> ${fatura.clientes.nome}</p>
            <p><strong>Status:</strong> ${fatura.status}</p>
            <p><strong>Vencimento:</strong> ${new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}</p>
            ${fatura.forma_pagamento ? `<p><strong>Forma de Pagamento:</strong> ${fatura.forma_pagamento}</p>` : ''}
            ${fatura.descricao ? `<p><strong>Descrição:</strong> ${fatura.descricao}</p>` : ''}
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
              <p>${fatura.observacoes}</p>
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

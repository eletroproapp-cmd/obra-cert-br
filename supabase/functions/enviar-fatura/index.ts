import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FaturaItem {
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

interface FaturaData {
  numero?: string;
  titulo: string;
  items: FaturaItem[];
  valorTotal: number;
  dataVencimento: string;
  observacoes?: string;
}

interface RequestBody {
  clienteEmail: string;
  clienteNome: string;
  fatura: FaturaData;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clienteEmail, clienteNome, fatura }: RequestBody = await req.json();

    console.log("Enviando fatura para:", clienteEmail);

    // Formatar data de vencimento
    const dataVencimento = new Date(fatura.dataVencimento).toLocaleDateString('pt-BR');

    // Gerar tabela de itens HTML
    const itemsHtml = fatura.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: left;">${item.descricao}</td>
        <td style="padding: 12px; text-align: center;">${item.quantidade}</td>
        <td style="padding: 12px; text-align: center;">${item.unidade}</td>
        <td style="padding: 12px; text-align: right;">R$ ${item.valor_unitario.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">R$ ${item.valor_total.toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura - EletroPro</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fb8c00, #ff9800); color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px; font-weight: bold;">EletroPro</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Fatura de Pagamento</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <!-- Greeting -->
      <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0;">
        Olá <strong>${clienteNome}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 0 0 30px 0;">
        Segue abaixo a fatura referente ao serviço de <strong>${fatura.titulo}</strong>.
      </p>

      ${
        fatura.numero
          ? `
      <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ff9800;">
        <p style="margin: 0; color: #e65100; font-size: 14px;">Número da Fatura</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #ff9800;">${fatura.numero}</p>
      </div>
      `
          : ""
      }

      <!-- Vencimento Destaque -->
      <div style="background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-weight: 600; font-size: 16px;">
          📅 Data de Vencimento: <span style="font-size: 20px; font-weight: bold;">${dataVencimento}</span>
        </p>
      </div>

      <!-- Items Table -->
      <div style="margin: 30px 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f7fafc;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0;">Descrição</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0;">Qtd</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0;">Und</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0;">Valor Unit.</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0;">Total</th>
            </tr>
          </thead>
          <tbody style="color: #4a5568;">
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #fff3e0;">
              <td colspan="4" style="padding: 16px; text-align: right; font-weight: 600; font-size: 16px; color: #2d3748;">
                Valor Total a Pagar:
              </td>
              <td style="padding: 16px; text-align: right; font-weight: bold; font-size: 20px; color: #ff9800;">
                R$ ${fatura.valorTotal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${
        fatura.observacoes
          ? `
      <!-- Observações -->
      <div style="margin: 30px 0; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #2d3748;">Observações:</p>
        <p style="margin: 0; color: #4a5568; line-height: 1.6; white-space: pre-wrap;">${fatura.observacoes}</p>
      </div>
      `
          : ""
      }

      <!-- Payment Info -->
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #1565c0;">Informações de Pagamento</p>
        <p style="margin: 0; color: #1976d2; font-size: 14px; line-height: 1.6;">
          Para efetuar o pagamento, entre em contato conosco.<br>
          Caso já tenha realizado o pagamento, desconsidere este email.
        </p>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; margin: 40px 0 30px 0;">
        <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0;">
          Dúvidas sobre esta fatura? Fale conosco!
        </p>
      </div>

      <!-- Footer Message -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; margin-top: 30px;">
        <p style="font-size: 14px; color: #718096; line-height: 1.6; margin: 0;">
          Atenciosamente,<br>
          <strong style="color: #2d3748;">Equipe EletroPro</strong><br>
          Soluções Elétricas Profissionais
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #718096;">
        © ${new Date().getFullYear()} EletroPro - Todos os direitos reservados
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "EletroPro <onboarding@resend.dev>",
      to: [clienteEmail],
      subject: `Fatura${fatura.numero ? " " + fatura.numero : ""} - ${fatura.titulo} - Vencimento ${dataVencimento}`,
      html: htmlContent,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email:", error);
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

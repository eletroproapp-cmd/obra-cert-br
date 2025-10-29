import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json();

    console.log(`Enviando email de boas-vindas para: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "EletroPro <noreply@send.eletroproapp.com>",
      to: [email],
      subject: "Bem-vindo ao EletroPro! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #1EAEDB 0%, #33C3F0 100%);
                padding: 40px 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .header h1 {
                color: white;
                margin: 0;
                font-size: 32px;
              }
              .content {
                background: white;
                padding: 40px 30px;
                border: 1px solid #e0e0e0;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background: #1EAEDB;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
              }
              .feature {
                background: #f8f9fa;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
                border-left: 4px solid #1EAEDB;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⚡ Bem-vindo ao EletroPro!</h1>
            </div>
            
            <div class="content">
              <h2>Olá${name ? `, ${name}` : ''}! 👋</h2>
              
              <p>Estamos muito felizes em ter você no <strong>EletroPro</strong>, o sistema completo de gestão para eletricistas profissionais!</p>
              
              <p>Com o EletroPro, você pode:</p>
              
              <div class="feature">
                ✅ <strong>Criar orçamentos profissionais</strong> em minutos
              </div>
              
              <div class="feature">
                ✅ <strong>Gerenciar clientes</strong> e histórico de serviços
              </div>
              
              <div class="feature">
                ✅ <strong>Emitir faturas</strong> e controlar pagamentos
              </div>
              
              <div class="feature">
                ✅ <strong>Catálogo de materiais e serviços</strong> sempre atualizado
              </div>
              
              <div class="feature">
                ✅ <strong>Conformidade NBR 5410</strong> com checklist automatizado
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/dashboard" class="button">
                  Acessar Minha Conta
                </a>
              </p>
              
              <p><strong>Precisa de ajuda?</strong><br>
              Nossa equipe está pronta para ajudar. Responda este email ou visite nossa central de ajuda.</p>
              
              <p>Vamos juntos profissionalizar seu negócio! ⚡</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe EletroPro</strong></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} EletroPro. Todos os direitos reservados.</p>
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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
});

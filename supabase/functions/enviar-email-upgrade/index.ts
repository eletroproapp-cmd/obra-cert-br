import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { email, name, planName, price } = await req.json();

    console.log(`Enviando email de upgrade para: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "EletroPro <onboarding@resend.dev>",
      to: [email],
      subject: `🎉 Upgrade confirmado - Plano ${planName}`,
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
                background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
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
              .plan-box {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 2px solid #10b981;
                padding: 25px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
              }
              .plan-box h2 {
                color: #10b981;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .price {
                font-size: 36px;
                font-weight: bold;
                color: #059669;
              }
              .feature {
                background: #f8f9fa;
                padding: 12px;
                margin: 8px 0;
                border-radius: 5px;
                border-left: 4px solid #10b981;
              }
              .button {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
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
              <h1>🎉 Upgrade Confirmado!</h1>
            </div>
            
            <div class="content">
              <h2>Parabéns${name ? `, ${name}` : ''}! 🚀</h2>
              
              <p>Seu upgrade para o plano <strong>${planName}</strong> foi confirmado com sucesso!</p>
              
              <div class="plan-box">
                <h2>Plano ${planName}</h2>
                <div class="price">R$ ${price}/mês</div>
              </div>
              
              <p><strong>O que mudou?</strong></p>
              
              <p>Agora você tem acesso a recursos exclusivos:</p>
              
              ${planName === 'Básico' ? `
                <div class="feature">✨ <strong>50 clientes</strong></div>
                <div class="feature">✨ <strong>100 orçamentos por mês</strong></div>
                <div class="feature">✨ <strong>50 faturas por mês</strong></div>
                <div class="feature">✨ <strong>10 instalações ativas</strong></div>
                <div class="feature">✨ <strong>500 materiais no catálogo</strong></div>
                <div class="feature">✨ <strong>5 funcionários</strong></div>
                <div class="feature">✨ <strong>Suporte prioritário</strong></div>
              ` : `
                <div class="feature">✨ <strong>Clientes ilimitados</strong></div>
                <div class="feature">✨ <strong>Orçamentos ilimitados</strong></div>
                <div class="feature">✨ <strong>Faturas ilimitadas</strong></div>
                <div class="feature">✨ <strong>Instalações ilimitadas</strong></div>
                <div class="feature">✨ <strong>Materiais ilimitados</strong></div>
                <div class="feature">✨ <strong>Funcionários ilimitados</strong></div>
                <div class="feature">✨ <strong>Suporte premium 24/7</strong></div>
                <div class="feature">✨ <strong>API de integração</strong></div>
                <div class="feature">✨ <strong>Relatórios avançados</strong></div>
              `}
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/dashboard" class="button">
                  Explorar Recursos
                </a>
              </p>
              
              <p><strong>Detalhes da assinatura:</strong></p>
              <ul>
                <li>Plano: ${planName}</li>
                <li>Valor: R$ ${price}/mês</li>
                <li>Renovação automática mensal</li>
              </ul>
              
              <p>Se tiver alguma dúvida, nossa equipe está à disposição!</p>
              
              <p>Obrigado por confiar no EletroPro! ⚡</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe EletroPro</strong></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} EletroPro. Todos os direitos reservados.</p>
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

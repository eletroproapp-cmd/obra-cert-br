import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  redirectTo?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: ResetPasswordRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error("Variáveis do backend ausentes");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Use o redirectTo recebido do app para garantir domínio correto
    const finalRedirectTo = redirectTo ?? "";
    console.log("Gerando link de recuperação:", { email, finalRedirectTo });

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: finalRedirectTo ? { redirectTo: finalRedirectTo } : undefined,
    });

    if (linkError) {
      console.error("Erro generateLink:", linkError);
      const msg = String((linkError as any)?.message || (linkError as any)?.error_description || (linkError as any)?.name || "");
      if (/not found/i.test(msg)) {
        // Evitar enumeração de usuários: sempre responder 200 mesmo se email não existir
        console.log("Email não encontrado, retornando sucesso para evitar enumeração.");
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      throw linkError;
    }

    const actionLink = (linkData as any)?.properties?.action_link || (linkData as any)?.action_link;
    const hashedToken = (linkData as any)?.properties?.hashed_token || (linkData as any)?.hashed_token;
    // Preferir link direto para o app com token_hash para evitar problemas de assinatura com access_token
    const appLink = finalRedirectTo && hashedToken
      ? `${finalRedirectTo}${finalRedirectTo.includes('?') ? '&' : '?'}type=recovery&token_hash=${encodeURIComponent(hashedToken)}`
      : actionLink;
    console.log("Links:", { actionLink, hashedToken, appLink });
    if (!appLink) throw new Error("Não foi possível gerar o link de recuperação");

    const emailResponse = await resend.emails.send({
      from: "EletroPro <noreply@send.eletroproapp.com>",
      to: [email],
      subject: "Redefinir sua senha - EletroPro",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #1a73e8; margin-bottom: 10px; }
            .content { margin-bottom: 30px; }
            .button { display: inline-block; background-color: #1a73e8; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; margin: 20px 0; }
            .button:hover { background-color: #1557b0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666; text-align: center; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="logo">⚡ EletroPro</div></div>
            <div class="content">
              <h2>Redefinir sua senha</h2>
              <p>Olá,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta EletroPro.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center;"><a href="${appLink}" class="button">Redefinir Senha</a></div>
              <div class="warning"><strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança.</div>
              <p>Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá inalterada.</p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} EletroPro. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de reset enviado:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Erro enviar-reset-senha:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
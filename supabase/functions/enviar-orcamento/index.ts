import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const sanitize = (input: string): string => {
  return input.replace(/<[^>]*>/g, '').trim();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrcamentoEmailRequest {
  orcamentoId: string;
  clienteEmail: string;
  customSubject?: string;
  customBody?: string;
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

    const { orcamentoId, clienteEmail, customSubject, customBody }: OrcamentoEmailRequest = await req.json();

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
        clientes:cliente_id (nome, email)
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

    // Buscar empresa info
    const { data: empresa } = await supabaseClient
      .from("empresas")
      .select("nome_fantasia")
      .eq("user_id", user.id)
      .single();

    let assunto = customSubject || `Seu Orçamento ${sanitize(orcamento.numero)}`;
    let corpoHtml = "";

    if (customBody) {
      // Usar corpo personalizado do usuário (converter texto simples para HTML preservando quebras de linha)
      corpoHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${sanitize(customBody)}</div>
          </div>
        </div>
      `;
    } else {
      // Buscar template personalizado
      const { data: template } = await supabaseClient
        .from("email_templates")
        .select("assunto, corpo_html")
        .eq("user_id", user.id)
        .eq("tipo", "novo_orcamento")
        .eq("ativo", true)
        .single();

      if (template) {
        // Usar template personalizado
        if (!customSubject) {
          assunto = template.assunto
            .replace(/{{numero}}/g, sanitize(orcamento.numero))
            .replace(/{{cliente_nome}}/g, sanitize(orcamento.clientes.nome));
        }

        corpoHtml = template.corpo_html
          .replace(/{{numero}}/g, sanitize(orcamento.numero))
          .replace(/{{cliente_nome}}/g, sanitize(orcamento.clientes.nome))
          .replace(/{{titulo}}/g, sanitize(orcamento.titulo || ''))
          .replace(/{{status}}/g, sanitize(orcamento.status || ''))
          .replace(/{{validade_dias}}/g, String(orcamento.validade_dias || 30))
          .replace(/{{valor_total}}/g, `R$ ${Number(orcamento.valor_total || 0).toFixed(2)}`);
      } else {
      // Template padrão profissional
      corpoHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Prezado(a) <strong>${sanitize(orcamento.clientes.nome)}</strong>,</p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Agradecemos o seu contato e a oportunidade de apresentar nossa proposta comercial.
            </p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Segue em anexo o orçamento <strong>${sanitize(orcamento.numero)}</strong> conforme solicitado.
            </p>
            
            <div style="background-color: #f5f5f5; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Orçamento:</strong> ${sanitize(orcamento.numero)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Valor:</strong> R$ ${Number(orcamento.valor_total || 0).toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Validade:</strong> ${orcamento.validade_dias || 30} dias</p>
            </div>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Estamos à disposição para esclarecimentos adicionais e aguardamos seu retorno.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #333; margin-bottom: 5px;">Atenciosamente,</p>
              <p style="font-size: 14px; color: #6366f1; font-weight: 600; margin: 0;">${sanitize(empresa?.nome_fantasia || 'Nossa Empresa')}</p>
            </div>
          </div>
          
          <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
            Este é um email automático. Por favor, não responda diretamente a esta mensagem.
          </p>
        </div>
      `;
      }
    }

    // Buscar configuração de email da empresa
    const { data: empresaConfig } = await supabaseClient
      .from("empresas")
      .select("email")
      .eq("user_id", user.id)
      .single();
    
    let fromEmail: string;
    const empresaEmail = empresaConfig?.email || '';
    const domain = empresaEmail.split('@')[1]?.toLowerCase() || '';
    const publicDomains = new Set([
      'gmail.com','hotmail.com','outlook.com','yahoo.com','live.com','icloud.com',
      'bol.com.br','uol.com.br','terra.com.br','yahoo.com.br','hotmail.com.br','outlook.com.br','gmail.com.br'
    ]);
    if (empresaEmail && !publicDomains.has(domain)) {
      fromEmail = `${sanitize(empresa?.nome_fantasia || 'EletroPro')} <${empresaEmail}>`;
    } else {
      fromEmail = 'EletroPro <no-reply@send.eletroproapp.com>';
      if (empresaEmail) console.log('Domínio de email não verificado/público. Usando remetente padrão.');
    }

    // Gerar token público para o orçamento
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    const { error: tokenError } = await supabaseClient
      .from("orcamento_tokens")
      .insert({
        orcamento_id: orcamentoId,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("Erro ao criar token:", tokenError);
    }

    // Gerar link público do orçamento  
    const baseUrl = Deno.env.get("SUPABASE_URL")?.includes("supabase.co") 
      ? "https://62540ff3-2df8-4ad5-a58c-0892f80772f9.lovableproject.com"
      : "http://localhost:5173";
    const orcamentoUrl = `${baseUrl}/publico/orcamento/${token}`;

    // Adicionar link no email
    const emailComLink = corpoHtml.replace(
      '</div>',
      `
        <div style="margin: 30px 0; text-align: center;">
          <a href="${orcamentoUrl}" 
             style="display: inline-block; padding: 12px 30px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Ver Orçamento Completo
          </a>
        </div>
      </div>`
    );

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [clienteEmail],
      subject: assunto,
      html: emailComLink,
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

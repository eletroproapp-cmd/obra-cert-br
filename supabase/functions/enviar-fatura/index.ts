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
        clientes:cliente_id (nome, email)
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

    // Buscar empresa info
    const { data: empresa } = await supabaseClient
      .from("empresas")
      .select("nome_fantasia")
      .eq("user_id", user.id)
      .single();

    // Buscar template personalizado
    const { data: template } = await supabaseClient
      .from("email_templates")
      .select("assunto, corpo_html")
      .eq("user_id", user.id)
      .eq("tipo", "nova_fatura")
      .eq("ativo", true)
      .single();

    let assunto = `Sua Fatura ${sanitize(fatura.numero)}`;
    let corpoHtml = "";

    if (template) {
      // Usar template personalizado
      assunto = template.assunto
        .replace(/{{numero}}/g, sanitize(fatura.numero))
        .replace(/{{cliente_nome}}/g, sanitize(fatura.clientes.nome));

      corpoHtml = template.corpo_html
        .replace(/{{numero}}/g, sanitize(fatura.numero))
        .replace(/{{cliente_nome}}/g, sanitize(fatura.clientes.nome))
        .replace(/{{titulo}}/g, sanitize(fatura.titulo || ''))
        .replace(/{{status}}/g, sanitize(fatura.status || ''))
        .replace(/{{data_vencimento}}/g, new Date(fatura.data_vencimento).toLocaleDateString('pt-BR'))
        .replace(/{{forma_pagamento}}/g, sanitize(fatura.forma_pagamento || ''))
        .replace(/{{valor_total}}/g, `R$ ${Number(fatura.valor_total || 0).toFixed(2)}`);
    } else {
      // Template padrão profissional
      const diasVencimento = Math.ceil((new Date(fatura.data_vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const statusVencimento = diasVencimento < 0 ? 'VENCIDA' : diasVencimento === 0 ? 'Vence HOJE' : `Vence em ${diasVencimento} dias`;
      
      corpoHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Prezado(a) <strong>${sanitize(fatura.clientes.nome)}</strong>,</p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Segue em anexo a fatura <strong>${sanitize(fatura.numero)}</strong> referente aos serviços prestados.
            </p>
            
            <div style="background-color: #f5f5f5; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Fatura:</strong> ${sanitize(fatura.numero)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Valor:</strong> R$ ${Number(fatura.valor_total || 0).toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Vencimento:</strong> ${new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')} (${statusVencimento})</p>
              ${fatura.forma_pagamento ? `<p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Forma de Pagamento:</strong> ${sanitize(fatura.forma_pagamento)}</p>` : ''}
            </div>
            
            ${diasVencimento <= 3 && diasVencimento >= 0 ? `
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️ Atenção:</strong> Prazo de vencimento próximo!</p>
            </div>
            ` : ''}
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Estamos à disposição para esclarecimentos adicionais.
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

    // Buscar configuração de email da empresa
    const { data: empresaConfig } = await supabaseClient
      .from("empresas")
      .select("email")
      .eq("user_id", user.id)
      .single();
    
    const fromEmail = empresaConfig?.email 
      ? `${sanitize(empresa?.nome_fantasia || 'EletroPro')} <${empresaConfig.email}>`
      : "Seu App <no-reply@send.eletroproapp.com>";

    // Gerar token público para a fatura
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 dias

    const { error: tokenError } = await supabaseClient
      .from("fatura_tokens")
      .insert({
        fatura_id: faturaId,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("Erro ao criar token:", tokenError);
    }

    // Gerar link público da fatura
    const baseUrl = Deno.env.get("SUPABASE_URL")?.includes("supabase.co") 
      ? "https://62540ff3-2df8-4ad5-a58c-0892f80772f9.lovableproject.com"
      : "http://localhost:5173";
    const faturaUrl = `${baseUrl}/publico/fatura/${token}`;

    // Adicionar link no email
    const emailComLink = corpoHtml.replace(
      '</div>',
      `
        <div style="margin: 30px 0; text-align: center;">
          <a href="${faturaUrl}" 
             style="display: inline-block; padding: 12px 30px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Ver Fatura Completa
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

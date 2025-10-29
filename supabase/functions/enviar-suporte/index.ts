import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Attachment {
  filename: string;
  content: string; // base64
  contentType: string;
}

interface SupportRequest {
  tipo: 'feedback' | 'suporte';
  assunto: string;
  mensagem: string;
  anexos?: Attachment[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Usuário não autenticado');
    }

    const { tipo, assunto, mensagem, anexos } = await req.json() as SupportRequest;

    // Buscar informações da empresa do usuário
    const { data: empresa } = await supabaseClient
      .from('empresas')
      .select('nome_fantasia, telefone, email')
      .eq('user_id', user.id)
      .single();

    const empresaNome = empresa?.nome_fantasia || 'Não informado';
    const empresaTelefone = empresa?.telefone || 'Não informado';
    const empresaEmail = empresa?.email || 'Não informado';

    // Definir destinatário e título baseado no tipo
    const isSupport = tipo === 'suporte';
    const destinatario = isSupport ? 'suporte@eletropro.com' : 'feedback@eletropro.com';
    const tipoLabel = isSupport ? 'Suporte' : 'Feedback';

    // Construir email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 4px; }
            .label { font-weight: bold; color: #667eea; }
            .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nova Solicitação de ${tipoLabel}</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <p><span class="label">De:</span> ${user.email}</p>
                <p><span class="label">Empresa:</span> ${empresaNome}</p>
                <p><span class="label">Telefone:</span> ${empresaTelefone}</p>
                <p><span class="label">Email da Empresa:</span> ${empresaEmail}</p>
              </div>
              
              <div class="info-box">
                <p><span class="label">Assunto:</span> ${assunto}</p>
              </div>
              
              <div class="message-box">
                <p class="label">Mensagem:</p>
                <p style="margin-top: 10px; white-space: pre-wrap;">${mensagem}</p>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                Recebido em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Preparar anexos para o Resend
    const attachments = anexos?.map(anexo => ({
      filename: anexo.filename,
      content: anexo.content,
    })) || [];

    // Enviar email via Resend
    const emailPayload: any = {
      from: 'EletroPro <noreply@send.eletroproapp.com>',
      to: [destinatario],
      reply_to: user.email,
      subject: `[${tipoLabel}] ${assunto}`,
      html: htmlContent,
    };

    // Adicionar anexos se houver
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Erro ao enviar email: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `${tipoLabel} enviado com sucesso!` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmitirNFeRequest {
  faturaId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Criar cliente Supabase com credenciais do usuário (respeita RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Check rate limit: 20 requests per day (stricter for NF-e due to legal implications)
    const { data: rateLimitOk, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        _user_id: user.id,
        _function_name: 'emitir-nfe',
        _max_requests: 20,
        _window_minutes: 1440 // 24 hours
      });

    if (rateLimitError || !rateLimitOk) {
      console.log("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente amanhã." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { faturaId }: EmitirNFeRequest = await req.json();

    console.log('Iniciando emissão de NF-e para fatura:', faturaId);

    // Buscar dados da fatura com itens e cliente
    const { data: fatura, error: faturaError } = await supabase
      .from('faturas')
      .select(`
        *,
        fatura_items(*),
        clientes(*)
      `)
      .eq('id', faturaId)
      .eq('user_id', user.id)
      .single();

    if (faturaError || !fatura) {
      return new Response(
        JSON.stringify({ error: 'Operação não pode ser concluída' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Buscar dados da empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (empresaError || !empresa) {
      return new Response(
        JSON.stringify({ error: 'Configuração incompleta. Contate o administrador.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Validar se empresa tem certificado digital configurado
    if (!empresa.certificado_digital_tipo || empresa.certificado_digital_tipo === 'nenhum') {
      return new Response(
        JSON.stringify({ 
          error: 'Certificado digital não configurado',
          details: 'Configure o certificado digital nas configurações da empresa para emitir NF-e.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Validar CNPJ
    if (!empresa.cnpj) {
      return new Response(
        JSON.stringify({ 
          error: 'CNPJ não configurado',
          details: 'Configure o CNPJ da empresa nas configurações para emitir NF-e.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Validar dados do cliente
    if (!fatura.clientes?.cpf_cnpj) {
      return new Response(
        JSON.stringify({ 
          error: 'CPF/CNPJ do cliente não encontrado',
          details: 'O cliente precisa ter CPF ou CNPJ cadastrado para emitir NF-e.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Atualizar status da fatura para processando
    await supabase
      .from('faturas')
      .update({ nfe_status: 'processando' })
      .eq('id', faturaId);

    // NOTA: Aqui seria feita a integração real com SEFAZ/Prefeitura
    // Por enquanto, vamos simular a emissão
    
    console.log('Simulando emissão de NF-e...');
    console.log('Empresa:', empresa.nome_fantasia, '- CNPJ:', empresa.cnpj);
    console.log('Cliente:', fatura.clientes?.nome, '- CPF/CNPJ:', fatura.clientes?.cpf_cnpj);
    console.log('Valor total:', fatura.valor_total);
    console.log('Ambiente:', empresa.ambiente_nfe);

    // Simular geração de chave de acesso (44 dígitos)
    const chaveAcesso = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
    const numeroNFe = empresa.proximo_numero_nfe || 1;
    const serieNFe = empresa.serie_nfe || '1';
    
    // Simular XML da NF-e
    const xmlNFe = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00">
  <NFe>
    <infNFe versao="4.00" Id="NFe${chaveAcesso}">
      <ide>
        <cUF>35</cUF>
        <cNF>00000001</cNF>
        <natOp>Venda de Mercadoria</natOp>
        <mod>55</mod>
        <serie>${serieNFe}</serie>
        <nNF>${numeroNFe}</nNF>
        <dhEmi>${new Date().toISOString()}</dhEmi>
        <tpNF>1</tpNF>
        <tpAmb>${empresa.ambiente_nfe === 'producao' ? '1' : '2'}</tpAmb>
      </ide>
      <emit>
        <CNPJ>${empresa.cnpj}</CNPJ>
        <xNome>${empresa.nome_fantasia}</xNome>
      </emit>
      <dest>
        <CNPJ>${fatura.clientes?.cpf_cnpj}</CNPJ>
        <xNome>${fatura.clientes?.nome}</xNome>
      </dest>
      <total>
        <ICMSTot>
          <vNF>${fatura.valor_total}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

    // Atualizar fatura com dados da NF-e
    const { error: updateError } = await supabase
      .from('faturas')
      .update({
        nfe_status: 'emitida',
        nfe_numero: numeroNFe.toString(),
        nfe_serie: serieNFe,
        nfe_chave_acesso: chaveAcesso,
        nfe_protocolo: `${Math.floor(Math.random() * 900000000000000) + 100000000000000}`,
        nfe_data_emissao: new Date().toISOString(),
        nfe_xml: xmlNFe,
      })
      .eq('id', faturaId);

    if (updateError) {
      throw updateError;
    }

    // Incrementar número da próxima NF-e
    await supabase
      .from('empresas')
      .update({ proximo_numero_nfe: numeroNFe + 1 })
      .eq('id', empresa.id);

    console.log('NF-e emitida com sucesso!');
    console.log('Chave de acesso:', chaveAcesso);
    console.log('Número:', numeroNFe, 'Série:', serieNFe);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'NF-e emitida com sucesso',
        nfe: {
          numero: numeroNFe,
          serie: serieNFe,
          chave_acesso: chaveAcesso,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erro ao emitir NF-e:', error);

    return new Response(
      JSON.stringify({ error: 'Não foi possível emitir a NF-e. Tente novamente.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

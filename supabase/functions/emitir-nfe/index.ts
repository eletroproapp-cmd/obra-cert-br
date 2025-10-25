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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Não autorizado');
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
      throw new Error('Fatura não encontrada');
    }

    // Buscar dados da empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (empresaError || !empresa) {
      throw new Error('Dados da empresa não encontrados');
    }

    // Validar se empresa tem certificado digital configurado
    if (!empresa.certificado_digital_tipo || empresa.certificado_digital_tipo === 'nenhum') {
      throw new Error('Certificado digital não configurado. Configure nas Configurações.');
    }

    // Validar CNPJ
    if (!empresa.cnpj) {
      throw new Error('CNPJ da empresa não configurado');
    }

    // Validar dados do cliente
    if (!fatura.clientes?.cpf_cnpj) {
      throw new Error('CPF/CNPJ do cliente não informado');
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
    
    // Se houver faturaId, marcar como erro
    if (error.faturaId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('faturas')
        .update({ nfe_status: 'erro' })
        .eq('id', error.faturaId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

-- Adicionar campos para templates de PDF na tabela empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS template_orcamento TEXT DEFAULT 'ORÇAMENTO Nº {numero}

Data: {data}
Validade: {validade}

DADOS DO CLIENTE:
{cliente_nome}
{cliente_endereco}
{cliente_contato}

ITENS:
{itens}

OBSERVAÇÕES:
{observacoes}

Valor Total: R$ {valor_total}',
ADD COLUMN IF NOT EXISTS template_fatura TEXT DEFAULT 'FATURA Nº {numero}

Data de Emissão: {data_emissao}
Vencimento: {data_vencimento}

DADOS DO CLIENTE:
{cliente_nome}
{cliente_endereco}
{cliente_contato}

ITENS:
{itens}

OBSERVAÇÕES:
{observacoes}

Valor Total: R$ {valor_total}
Forma de Pagamento: {forma_pagamento}';
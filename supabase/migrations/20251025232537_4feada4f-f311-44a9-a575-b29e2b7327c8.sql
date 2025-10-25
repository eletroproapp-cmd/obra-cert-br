-- Adicionar campos para NF-e nas faturas
ALTER TABLE public.faturas
ADD COLUMN IF NOT EXISTS nfe_numero TEXT,
ADD COLUMN IF NOT EXISTS nfe_serie TEXT,
ADD COLUMN IF NOT EXISTS nfe_chave_acesso TEXT,
ADD COLUMN IF NOT EXISTS nfe_protocolo TEXT,
ADD COLUMN IF NOT EXISTS nfe_data_emissao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nfe_xml TEXT,
ADD COLUMN IF NOT EXISTS nfe_status TEXT DEFAULT 'nao_emitida' CHECK (nfe_status IN ('nao_emitida', 'processando', 'emitida', 'cancelada', 'erro'));

-- Adicionar campos de certificado digital e configurações fiscais na empresa
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS certificado_digital_tipo TEXT CHECK (certificado_digital_tipo IN ('A1', 'A3', 'nenhum')),
ADD COLUMN IF NOT EXISTS certificado_digital_validade DATE,
ADD COLUMN IF NOT EXISTS certificado_digital_arquivo TEXT,
ADD COLUMN IF NOT EXISTS ambiente_nfe TEXT DEFAULT 'homologacao' CHECK (ambiente_nfe IN ('producao', 'homologacao')),
ADD COLUMN IF NOT EXISTS serie_nfe TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS proximo_numero_nfe INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS csc_token TEXT,
ADD COLUMN IF NOT EXISTS csc_id TEXT;

-- Índices para melhorar performance de busca por NF-e
CREATE INDEX IF NOT EXISTS idx_faturas_nfe_numero ON public.faturas(nfe_numero);
CREATE INDEX IF NOT EXISTS idx_faturas_nfe_chave ON public.faturas(nfe_chave_acesso);
CREATE INDEX IF NOT EXISTS idx_faturas_nfe_status ON public.faturas(nfe_status);
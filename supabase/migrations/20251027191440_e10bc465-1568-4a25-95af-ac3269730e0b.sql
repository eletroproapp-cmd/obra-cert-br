-- Adicionar campos de personalização de documentos na tabela empresas
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#1EAEDB',
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#33C3F0',
ADD COLUMN IF NOT EXISTS fonte_documento TEXT DEFAULT 'Arial',
ADD COLUMN IF NOT EXISTS tamanho_fonte INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS estilo_borda TEXT DEFAULT 'simples',
ADD COLUMN IF NOT EXISTS mostrar_logo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS observacoes_padrao TEXT,
ADD COLUMN IF NOT EXISTS termos_condicoes TEXT;
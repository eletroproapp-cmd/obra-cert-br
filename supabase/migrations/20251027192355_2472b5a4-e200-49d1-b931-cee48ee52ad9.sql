-- Add visibility control fields to empresas table
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS mostrar_nome_fantasia boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_razao_social boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_cnpj boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_endereco boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_telefone boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_website boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_regime_tributario boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_inscricao_estadual boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_inscricao_municipal boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS slogan text;
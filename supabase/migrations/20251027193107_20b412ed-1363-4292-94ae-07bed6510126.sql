-- Add regime tributario and inscricoes fields to clientes table
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS regime_tributario text,
ADD COLUMN IF NOT EXISTS inscricao_estadual text,
ADD COLUMN IF NOT EXISTS inscricao_municipal text;
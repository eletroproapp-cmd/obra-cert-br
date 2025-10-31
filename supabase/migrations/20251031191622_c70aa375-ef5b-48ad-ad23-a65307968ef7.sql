-- Adicionar coluna ativo na tabela projeto_etapas
ALTER TABLE projeto_etapas 
ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
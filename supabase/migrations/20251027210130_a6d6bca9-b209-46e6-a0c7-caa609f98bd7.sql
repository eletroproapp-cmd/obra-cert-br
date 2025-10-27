-- Adicionar colunas para cores de bordas
ALTER TABLE public.empresas
ADD COLUMN cor_borda_secoes text DEFAULT '#E5E7EB',
ADD COLUMN cor_borda_linhas text DEFAULT '#E5E7EB';
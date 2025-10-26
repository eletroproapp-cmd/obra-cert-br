-- Alterar coluna numero para usar a função como DEFAULT
ALTER TABLE public.orcamentos 
ALTER COLUMN numero SET DEFAULT generate_orcamento_numero();
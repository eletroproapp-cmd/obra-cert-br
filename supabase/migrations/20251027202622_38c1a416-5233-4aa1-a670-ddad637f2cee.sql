-- Adicionar colunas para controle de numeração de orçamentos e faturas
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS proximo_numero_orcamento integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS proximo_numero_fatura integer DEFAULT 1;

COMMENT ON COLUMN public.empresas.proximo_numero_orcamento IS 'Próximo número a ser usado para orçamentos';
COMMENT ON COLUMN public.empresas.proximo_numero_fatura IS 'Próximo número a ser usado para faturas';
-- Adicionar coluna projeto_id na tabela orcamentos
ALTER TABLE public.orcamentos
ADD COLUMN projeto_id uuid REFERENCES public.projetos(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de consultas
CREATE INDEX idx_orcamentos_projeto_id ON public.orcamentos(projeto_id);
-- Create table for project progress tracking
CREATE TABLE IF NOT EXISTS public.projeto_etapas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etapa text NOT NULL,
  progresso numeric NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  ordem integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projeto_etapas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Usuários podem ver etapas de seus projetos"
  ON public.projeto_etapas
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar etapas em seus projetos"
  ON public.projeto_etapas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar etapas de seus projetos"
  ON public.projeto_etapas
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar etapas de seus projetos"
  ON public.projeto_etapas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projeto_etapas_projeto_id ON public.projeto_etapas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_etapas_user_id ON public.projeto_etapas(user_id);

-- Insert default electrical work stages for existing projects
INSERT INTO public.projeto_etapas (projeto_id, user_id, etapa, ordem, progresso)
SELECT 
  p.id,
  p.user_id,
  etapa.nome,
  etapa.ordem,
  0
FROM public.projetos p
CROSS JOIN (
  VALUES 
    ('Projeto Elétrico', 1),
    ('Aprovação na Concessionária', 2),
    ('Compra de Materiais', 3),
    ('Instalação de Eletrodutos', 4),
    ('Passagem de Fiação', 5),
    ('Instalação de Quadros', 6),
    ('Instalação de Tomadas e Interruptores', 7),
    ('Instalação de Luminárias', 8),
    ('Teste e Energização', 9),
    ('Vistoria Final', 10)
) AS etapa(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.projeto_etapas pe 
  WHERE pe.projeto_id = p.id AND pe.etapa = etapa.nome
);
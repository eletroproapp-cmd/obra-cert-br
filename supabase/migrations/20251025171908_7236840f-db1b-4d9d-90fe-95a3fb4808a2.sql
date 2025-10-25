-- Criar tabela para catálogo de serviços (mão de obra)
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  codigo TEXT,
  unidade TEXT DEFAULT 'h' CHECK (unidade IN ('h', 'dia', 'un', 'servico')),
  preco_hora NUMERIC NOT NULL DEFAULT 0,
  tempo_estimado NUMERIC DEFAULT 1,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Usuários podem ver seus próprios serviços"
ON public.servicos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios serviços"
ON public.servicos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios serviços"
ON public.servicos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios serviços"
ON public.servicos
FOR DELETE
USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON public.servicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
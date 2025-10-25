-- Tabela de instalações
CREATE TABLE IF NOT EXISTS public.instalacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'Em Planejamento' CHECK (status IN ('Em Planejamento', 'Em Andamento', 'Concluída', 'Cancelada')),
  endereco TEXT,
  data_inicio DATE,
  data_conclusao_prevista DATE,
  data_conclusao_real DATE,
  valor_total DECIMAL(10, 2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tarefas (planejamento)
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instalacao_id UUID REFERENCES public.instalacoes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída', 'Cancelada')),
  prioridade TEXT DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')),
  data_vencimento DATE,
  responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Policies para instalações
CREATE POLICY "Usuários podem ver suas próprias instalações"
  ON public.instalacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias instalações"
  ON public.instalacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias instalações"
  ON public.instalacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias instalações"
  ON public.instalacoes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para tarefas
CREATE POLICY "Usuários podem ver suas próprias tarefas"
  ON public.tarefas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias tarefas"
  ON public.tarefas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias tarefas"
  ON public.tarefas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias tarefas"
  ON public.tarefas FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_instalacoes_updated_at
  BEFORE UPDATE ON public.instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
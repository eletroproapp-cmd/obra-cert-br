-- Criar tabela de funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  cargo TEXT,
  salario_hora NUMERIC,
  email TEXT,
  telefone TEXT,
  data_admissao DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de registros de horas (timesheet)
CREATE TABLE public.timesheet_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id),
  instalacao_id UUID REFERENCES public.instalacoes(id),
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  horas_totais NUMERIC GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (hora_fim::time - hora_inicio::time)) / 3600
  ) STORED,
  tipo_trabalho TEXT NOT NULL,
  descricao TEXT,
  aprovado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_registros ENABLE ROW LEVEL SECURITY;

-- RLS Policies para funcionarios
CREATE POLICY "Usuários podem ver seus próprios funcionários"
  ON public.funcionarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios funcionários"
  ON public.funcionarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios funcionários"
  ON public.funcionarios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios funcionários"
  ON public.funcionarios FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para timesheet_registros
CREATE POLICY "Usuários podem ver seus próprios registros"
  ON public.timesheet_registros FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios registros"
  ON public.timesheet_registros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios registros"
  ON public.timesheet_registros FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios registros"
  ON public.timesheet_registros FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at em funcionarios
CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em timesheet_registros
CREATE TRIGGER update_timesheet_registros_updated_at
  BEFORE UPDATE ON public.timesheet_registros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_funcionarios_user_id ON public.funcionarios(user_id);
CREATE INDEX idx_timesheet_registros_user_id ON public.timesheet_registros(user_id);
CREATE INDEX idx_timesheet_registros_funcionario_id ON public.timesheet_registros(funcionario_id);
CREATE INDEX idx_timesheet_registros_data ON public.timesheet_registros(data);
-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  contato_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de materiais (catálogo)
CREATE TABLE IF NOT EXISTS public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  categoria TEXT NOT NULL,
  descricao TEXT,
  unidade TEXT DEFAULT 'un',
  preco_custo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  preco_venda DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estoque_atual DECIMAL(10, 2) DEFAULT 0,
  estoque_minimo DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

-- Policies para fornecedores
CREATE POLICY "Usuários podem ver seus próprios fornecedores"
  ON public.fornecedores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios fornecedores"
  ON public.fornecedores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios fornecedores"
  ON public.fornecedores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios fornecedores"
  ON public.fornecedores FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para materiais
CREATE POLICY "Usuários podem ver seus próprios materiais"
  ON public.materiais FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios materiais"
  ON public.materiais FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios materiais"
  ON public.materiais FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios materiais"
  ON public.materiais FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
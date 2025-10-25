-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado', 'Em Análise')),
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  validade_dias INTEGER DEFAULT 30,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS public.orcamento_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unidade TEXT DEFAULT 'un',
  valor_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_items ENABLE ROW LEVEL SECURITY;

-- Policies para clientes
CREATE POLICY "Usuários podem ver seus próprios clientes"
  ON public.clientes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios clientes"
  ON public.clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios clientes"
  ON public.clientes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para orçamentos
CREATE POLICY "Usuários podem ver seus próprios orçamentos"
  ON public.orcamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios orçamentos"
  ON public.orcamentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios orçamentos"
  ON public.orcamentos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios orçamentos"
  ON public.orcamentos FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para itens de orçamento
CREATE POLICY "Usuários podem ver itens de seus orçamentos"
  ON public.orcamento_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos
      WHERE orcamentos.id = orcamento_items.orcamento_id
      AND orcamentos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar itens em seus orçamentos"
  ON public.orcamento_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orcamentos
      WHERE orcamentos.id = orcamento_items.orcamento_id
      AND orcamentos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens de seus orçamentos"
  ON public.orcamento_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos
      WHERE orcamentos.id = orcamento_items.orcamento_id
      AND orcamentos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar itens de seus orçamentos"
  ON public.orcamento_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos
      WHERE orcamentos.id = orcamento_items.orcamento_id
      AND orcamentos.user_id = auth.uid()
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número do orçamento
CREATE OR REPLACE FUNCTION public.generate_orcamento_numero()
RETURNS TEXT AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  numero TEXT;
BEGIN
  ano := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 10) AS INTEGER)), 0) + 1
  INTO sequencia
  FROM public.orcamentos
  WHERE numero LIKE 'ORC-' || ano || '-%';
  
  numero := 'ORC-' || ano || '-' || LPAD(sequencia::TEXT, 3, '0');
  
  RETURN numero;
END;
$$ LANGUAGE plpgsql SET search_path = public;
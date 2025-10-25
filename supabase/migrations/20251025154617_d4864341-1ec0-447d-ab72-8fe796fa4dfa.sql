-- Tabela de faturas
CREATE TABLE IF NOT EXISTS public.faturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Vencido', 'Cancelado')),
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens da fatura
CREATE TABLE IF NOT EXISTS public.fatura_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unidade TEXT DEFAULT 'un',
  valor_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatura_items ENABLE ROW LEVEL SECURITY;

-- Policies para faturas
CREATE POLICY "Usuários podem ver suas próprias faturas"
  ON public.faturas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias faturas"
  ON public.faturas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias faturas"
  ON public.faturas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias faturas"
  ON public.faturas FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para itens de fatura
CREATE POLICY "Usuários podem ver itens de suas faturas"
  ON public.fatura_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.faturas
      WHERE faturas.id = fatura_items.fatura_id
      AND faturas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar itens em suas faturas"
  ON public.fatura_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.faturas
      WHERE faturas.id = fatura_items.fatura_id
      AND faturas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens de suas faturas"
  ON public.fatura_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.faturas
      WHERE faturas.id = fatura_items.fatura_id
      AND faturas.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar itens de suas faturas"
  ON public.fatura_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.faturas
      WHERE faturas.id = fatura_items.fatura_id
      AND faturas.user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_faturas_updated_at
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número da fatura
CREATE OR REPLACE FUNCTION public.generate_fatura_numero()
RETURNS TEXT AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  numero TEXT;
BEGIN
  ano := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 10) AS INTEGER)), 0) + 1
  INTO sequencia
  FROM public.faturas
  WHERE numero LIKE 'FAT-' || ano || '-%';
  
  numero := 'FAT-' || ano || '-' || LPAD(sequencia::TEXT, 3, '0');
  
  RETURN numero;
END;
$$ LANGUAGE plpgsql SET search_path = public;
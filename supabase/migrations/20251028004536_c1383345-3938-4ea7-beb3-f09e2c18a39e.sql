-- Criar tabela para tokens de visualização pública de orçamentos
CREATE TABLE IF NOT EXISTS public.orcamento_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0
);

-- Criar tabela para tokens de visualização pública de faturas
CREATE TABLE IF NOT EXISTS public.fatura_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0
);

-- Adicionar campos de assinatura aos orçamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS assinatura_url TEXT,
ADD COLUMN IF NOT EXISTS assinado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assinante_nome TEXT;

-- Adicionar campos de assinatura às faturas
ALTER TABLE public.faturas
ADD COLUMN IF NOT EXISTS assinatura_url TEXT,
ADD COLUMN IF NOT EXISTS assinado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assinante_nome TEXT;

-- Enable RLS
ALTER TABLE public.orcamento_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatura_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para orcamento_tokens
CREATE POLICY "Usuários podem criar tokens de seus orçamentos"
ON public.orcamento_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orcamentos
    WHERE orcamentos.id = orcamento_tokens.orcamento_id
    AND orcamentos.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem ver tokens de seus orçamentos"
ON public.orcamento_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos
    WHERE orcamentos.id = orcamento_tokens.orcamento_id
    AND orcamentos.user_id = auth.uid()
  )
);

CREATE POLICY "Visualização pública com token válido"
ON public.orcamento_tokens
FOR SELECT
USING (true);

-- Políticas para fatura_tokens
CREATE POLICY "Usuários podem criar tokens de suas faturas"
ON public.fatura_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.faturas
    WHERE faturas.id = fatura_tokens.fatura_id
    AND faturas.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem ver tokens de suas faturas"
ON public.fatura_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.faturas
    WHERE faturas.id = fatura_tokens.fatura_id
    AND faturas.user_id = auth.uid()
  )
);

CREATE POLICY "Visualização pública com token válido"
ON public.fatura_tokens
FOR SELECT
USING (true);

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_unique_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orcamento_tokens_token ON public.orcamento_tokens(token);
CREATE INDEX IF NOT EXISTS idx_orcamento_tokens_orcamento_id ON public.orcamento_tokens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_fatura_tokens_token ON public.fatura_tokens(token);
CREATE INDEX IF NOT EXISTS idx_fatura_tokens_fatura_id ON public.fatura_tokens(fatura_id);
-- Criar tabela de empresas/perfil
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_fantasia text NOT NULL,
  razao_social text,
  cnpj text,
  inscricao_estadual text,
  inscricao_municipal text,
  regime_tributario text DEFAULT 'Simples Nacional',
  endereco text,
  cidade text,
  estado text,
  cep text,
  telefone text,
  email text,
  website text,
  logo_url text,
  cor_primaria text DEFAULT '#1EAEDB',
  cor_secundaria text DEFAULT '#33C3F0',
  observacoes_padrao text,
  termos_condicoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver sua própria empresa"
  ON public.empresas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar sua própria empresa"
  ON public.empresas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria empresa"
  ON public.empresas FOR UPDATE
  USING (auth.uid() = user_id);

-- Adicionar campos de controle de estoque aos materiais (se não existirem)
ALTER TABLE public.materiais 
  ADD COLUMN IF NOT EXISTS estoque_minimo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_atual numeric DEFAULT 0;

-- Adicionar campo de forma de pagamento às faturas (se não existir)
ALTER TABLE public.faturas
  ADD COLUMN IF NOT EXISTS forma_pagamento text;

-- Criar tabela de movimentações de estoque
CREATE TABLE public.movimentacoes_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'entrada', 'saida', 'ajuste'
  quantidade numeric NOT NULL,
  motivo text,
  referencia_id uuid, -- ID do orçamento/fatura que causou a movimentação
  referencia_tipo text, -- 'orcamento', 'fatura'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para movimentações
CREATE POLICY "Usuários podem ver suas próprias movimentações"
  ON public.movimentacoes_estoque FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias movimentações"
  ON public.movimentacoes_estoque FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_movimentacoes_estoque_material ON public.movimentacoes_estoque(material_id);
CREATE INDEX idx_movimentacoes_estoque_user ON public.movimentacoes_estoque(user_id);
CREATE INDEX idx_empresas_user ON public.empresas(user_id);
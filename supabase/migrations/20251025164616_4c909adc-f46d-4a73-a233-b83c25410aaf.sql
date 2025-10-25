-- Tabela para armazenar checklists NBR 5410
CREATE TABLE public.nbr5410_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  fatura_id UUID REFERENCES public.faturas(id) ON DELETE SET NULL,
  
  -- Dados do projeto
  tipo_imovel TEXT NOT NULL, -- residencial, comercial, industrial
  area_total NUMERIC,
  num_comodos INTEGER,
  
  -- Cargas especiais
  tem_chuveiro BOOLEAN DEFAULT false,
  tem_ar_condicionado BOOLEAN DEFAULT false,
  tem_forno_eletrico BOOLEAN DEFAULT false,
  tem_aquecedor BOOLEAN DEFAULT false,
  tem_piscina BOOLEAN DEFAULT false,
  
  -- Checklist de conformidade (JSON com perguntas e respostas)
  checklist_data JSONB DEFAULT '{}',
  
  -- Validações e alertas
  alertas JSONB DEFAULT '[]',
  status TEXT DEFAULT 'em_andamento', -- em_andamento, concluido, aprovado
  
  -- Observações técnicas
  observacoes TEXT,
  premissas_tecnicas TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.nbr5410_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios checklists"
  ON public.nbr5410_checklists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios checklists"
  ON public.nbr5410_checklists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios checklists"
  ON public.nbr5410_checklists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios checklists"
  ON public.nbr5410_checklists FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_nbr5410_checklists_updated_at
  BEFORE UPDATE ON public.nbr5410_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para sugestões de materiais/orçamento
CREATE TABLE public.nbr5410_sugestoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.nbr5410_checklists(id) ON DELETE CASCADE,
  
  -- Item sugerido
  tipo TEXT NOT NULL, -- circuito, material, equipamento
  descricao TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  unidade TEXT DEFAULT 'un',
  
  -- Justificativa NBR 5410
  norma_referencia TEXT, -- ex: "6.5.4.6 - Circuitos de tomadas"
  justificativa TEXT,
  
  -- Preço (se disponível do catálogo)
  material_id UUID REFERENCES public.materiais(id),
  valor_unitario NUMERIC,
  valor_total NUMERIC,
  
  -- Status
  adicionado_orcamento BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies para sugestões
ALTER TABLE public.nbr5410_sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sugestões de seus checklists"
  ON public.nbr5410_sugestoes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.nbr5410_checklists
    WHERE nbr5410_checklists.id = nbr5410_sugestoes.checklist_id
    AND nbr5410_checklists.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem criar sugestões em seus checklists"
  ON public.nbr5410_sugestoes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.nbr5410_checklists
    WHERE nbr5410_checklists.id = nbr5410_sugestoes.checklist_id
    AND nbr5410_checklists.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem atualizar sugestões de seus checklists"
  ON public.nbr5410_sugestoes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.nbr5410_checklists
    WHERE nbr5410_checklists.id = nbr5410_sugestoes.checklist_id
    AND nbr5410_checklists.user_id = auth.uid()
  ));

CREATE POLICY "Usuários podem deletar sugestões de seus checklists"
  ON public.nbr5410_sugestoes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.nbr5410_checklists
    WHERE nbr5410_checklists.id = nbr5410_sugestoes.checklist_id
    AND nbr5410_checklists.user_id = auth.uid()
  ));
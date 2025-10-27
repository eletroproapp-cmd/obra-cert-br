-- Criar tabela para modelos de email
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('novo_orcamento', 'reenvio_orcamento', 'nova_fatura', 'reenvio_fatura', 'fatura_liquidada')),
  assunto TEXT NOT NULL,
  corpo_html TEXT NOT NULL,
  variaveis_disponiveis TEXT[] DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tipo)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios templates"
  ON public.email_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios templates"
  ON public.email_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios templates"
  ON public.email_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir templates padrão para cada usuário existente
INSERT INTO public.email_templates (user_id, nome, tipo, assunto, corpo_html, variaveis_disponiveis)
SELECT 
  id,
  'Novo Orçamento',
  'novo_orcamento',
  'Orçamento {{numero}} - {{titulo}}',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
    <h1 style="color: #333;">Orçamento {{numero}}</h1>
    <h2 style="color: #666;">{{titulo}}</h2>
    <div style="margin: 20px 0;">
      <p><strong>Cliente:</strong> {{cliente_nome}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <p><strong>Validade:</strong> {{validade_dias}} dias</p>
      <p><strong>Descrição:</strong> {{descricao}}</p>
    </div>
    <h3>Itens do Orçamento:</h3>
    {{tabela_itens}}
    <div style="text-align: right; margin: 20px 0;">
      <h2 style="color: #333;">Total: R$ {{valor_total}}</h2>
    </div>
    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #333;">
      <strong>Observações:</strong>
      <p>{{observacoes}}</p>
    </div>
    <p style="color: #666; font-size: 12px; margin-top: 40px;">
      Este é um e-mail automático. Para mais informações, entre em contato conosco.
    </p>
  </div>',
  ARRAY['numero', 'titulo', 'cliente_nome', 'status', 'validade_dias', 'descricao', 'tabela_itens', 'valor_total', 'observacoes']
FROM auth.users
ON CONFLICT (user_id, tipo) DO NOTHING;
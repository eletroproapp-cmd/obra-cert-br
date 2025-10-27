-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  endereco_obra TEXT,
  data_inicio DATE,
  data_termino DATE,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'assinado', 'em_curso', 'perdido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_projetos_user_id ON public.projetos(user_id);
CREATE INDEX idx_projetos_cliente_id ON public.projetos(cliente_id);
CREATE INDEX idx_projetos_status ON public.projetos(status);

-- Trigger para updated_at
CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON public.projetos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios projetos"
  ON public.projetos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios projetos"
  ON public.projetos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios projetos"
  ON public.projetos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios projetos"
  ON public.projetos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar bucket de storage para fotos dos projetos
INSERT INTO storage.buckets (id, name, public)
VALUES ('projeto-fotos', 'projeto-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para fotos dos projetos
CREATE POLICY "Usuários podem ver fotos dos seus projetos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'projeto-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem fazer upload de fotos dos seus projetos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'projeto-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem atualizar fotos dos seus projetos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'projeto-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar fotos dos seus projetos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'projeto-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);
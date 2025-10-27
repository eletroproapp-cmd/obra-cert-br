-- Adicionar coluna para posição da logo
ALTER TABLE public.empresas
ADD COLUMN logo_position text DEFAULT 'center' CHECK (logo_position IN ('left', 'center', 'right'));
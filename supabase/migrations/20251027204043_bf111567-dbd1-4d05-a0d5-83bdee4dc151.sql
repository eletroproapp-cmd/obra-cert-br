-- Atualizar valores padrão das cores para roxo/índigo
ALTER TABLE public.empresas
ALTER COLUMN cor_primaria SET DEFAULT '#6366F1',
ALTER COLUMN cor_secundaria SET DEFAULT '#E5E7EB';

-- Atualizar registros existentes que ainda usam as cores antigas
UPDATE public.empresas
SET 
  cor_primaria = '#6366F1'
WHERE cor_primaria = '#1EAEDB' OR cor_primaria IS NULL;

UPDATE public.empresas
SET 
  cor_secundaria = '#E5E7EB'
WHERE cor_secundaria = '#33C3F0' OR cor_secundaria IS NULL;
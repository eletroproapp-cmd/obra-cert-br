-- Adicionar campo para controlar a exibição da marca d'água EletroPro
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS ocultar_marca_eletropro boolean DEFAULT false;

COMMENT ON COLUMN public.empresas.ocultar_marca_eletropro IS 'Permite ocultar a marca d''água EletroPro nos documentos (disponível apenas para planos pagos)';
-- Add tipo_pessoa field to empresas table
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS tipo_pessoa text DEFAULT 'juridica' CHECK (tipo_pessoa IN ('fisica', 'juridica'));
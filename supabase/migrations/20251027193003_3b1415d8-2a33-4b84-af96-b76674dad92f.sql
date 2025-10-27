-- Add tipo_pessoa field to clientes table
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS tipo_pessoa text DEFAULT 'juridica' CHECK (tipo_pessoa IN ('fisica', 'juridica'));
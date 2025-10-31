-- Add projeto_id to faturas to allow linking invoices to projects
ALTER TABLE public.faturas
ADD COLUMN IF NOT EXISTS projeto_id uuid NULL;

-- Create an index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_faturas_projeto_id ON public.faturas (projeto_id);

-- Add a foreign key to projetos, set null on delete
ALTER TABLE public.faturas
  ADD CONSTRAINT fk_faturas_projeto
  FOREIGN KEY (projeto_id)
  REFERENCES public.projetos(id)
  ON DELETE SET NULL;
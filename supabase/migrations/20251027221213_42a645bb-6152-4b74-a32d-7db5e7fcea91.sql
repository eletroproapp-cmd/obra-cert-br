-- Add projeto_id to timesheet_registros
ALTER TABLE public.timesheet_registros 
ADD COLUMN projeto_id UUID REFERENCES public.projetos(id);

-- Add index for better query performance
CREATE INDEX idx_timesheet_registros_projeto_id ON public.timesheet_registros(projeto_id);
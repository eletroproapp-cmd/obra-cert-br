-- Corrigir política de DELETE para permitir que owners excluam suas próprias faturas
DROP POLICY IF EXISTS "Owners and admins can delete faturas" ON public.faturas;

CREATE POLICY "Users can delete their own faturas"
ON public.faturas
FOR DELETE
USING (auth.uid() = user_id);
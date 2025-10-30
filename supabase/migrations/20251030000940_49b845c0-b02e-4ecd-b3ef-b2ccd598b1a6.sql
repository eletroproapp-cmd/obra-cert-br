-- Fix RLS to allow INSERT/UPDATE/DELETE for admins on promo_codes
DROP POLICY IF EXISTS "Admins podem gerenciar códigos promocionais" ON public.promo_codes;

-- Allow admins to INSERT promo codes
CREATE POLICY "Admins podem inserir códigos"
ON public.promo_codes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to UPDATE promo codes
CREATE POLICY "Admins podem atualizar códigos"
ON public.promo_codes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to DELETE promo codes
CREATE POLICY "Admins podem deletar códigos"
ON public.promo_codes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to SELECT all promo codes (in addition to public active ones)
CREATE POLICY "Admins podem ver todos os códigos"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
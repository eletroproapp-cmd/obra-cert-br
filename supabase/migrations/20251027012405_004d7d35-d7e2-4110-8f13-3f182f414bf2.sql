-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user', 'accountant');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Apply role-based policies to sensitive operations

-- Only admins can delete faturas
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias faturas" ON public.faturas;
CREATE POLICY "Owners and admins can delete faturas"
  ON public.faturas FOR DELETE
  USING (
    auth.uid() = user_id 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Accountants, managers, and admins can view all faturas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias faturas" ON public.faturas;
CREATE POLICY "Users can view their faturas or privileged users view all"
  ON public.faturas FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'accountant')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Owners, managers, and admins can update timesheet_registros
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios registros" ON public.timesheet_registros;
CREATE POLICY "Owners, managers, and admins can update timesheets"
  ON public.timesheet_registros FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Managers and admins can view all instalacoes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias instalações" ON public.instalacoes;
CREATE POLICY "Users can view their instalacoes or privileged users view all"
  ON public.instalacoes FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Helper function to get current user's roles
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
$$;
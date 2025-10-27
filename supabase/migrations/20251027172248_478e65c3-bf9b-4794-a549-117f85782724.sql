-- Criar enum de roles (já existe app_role, vamos expandir)
-- Verificar se já existe e adicionar novos valores se necessário
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'accountant', 'super_admin');
  ELSE
    -- Adicionar super_admin se não existir
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Criar tabela user_roles se não existir
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar função segura para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- Criar função para obter roles do usuário atual
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

-- Policies para user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Atualizar policies existentes para usar roles
DROP POLICY IF EXISTS "Super admins podem ver todas assinaturas" ON public.user_subscriptions;
CREATE POLICY "Super admins podem ver todas assinaturas"
ON public.user_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins podem atualizar assinaturas" ON public.user_subscriptions;
CREATE POLICY "Super admins podem atualizar assinaturas"
ON public.user_subscriptions
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins podem gerenciar planos" ON public.subscription_plans;
CREATE POLICY "Super admins podem gerenciar planos"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins podem ver todo uso" ON public.usage_tracking;
CREATE POLICY "Super admins podem ver todo uso"
ON public.usage_tracking
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Policies adicionais para managers e accountants
DROP POLICY IF EXISTS "Users can view their instalacoes or privileged users view all" ON public.instalacoes;
CREATE POLICY "Users can view their instalacoes or privileged users view all"
ON public.instalacoes
FOR SELECT
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can view their faturas or privileged users view all" ON public.faturas;
CREATE POLICY "Users can view their faturas or privileged users view all"
ON public.faturas
FOR SELECT
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'accountant') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Owners and admins can delete faturas" ON public.faturas;
CREATE POLICY "Owners and admins can delete faturas"
ON public.faturas
FOR DELETE
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owners, managers, and admins can update timesheets" ON public.timesheet_registros;
CREATE POLICY "Owners, managers, and admins can update timesheets"
ON public.timesheet_registros
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'admin')
);

-- Criar função para buscar assinaturas com emails dos usuários
CREATE OR REPLACE FUNCTION public.get_subscriptions_with_emails()
RETURNS TABLE (
  user_id uuid,
  email text,
  plan_type text,
  status text,
  created_at timestamptz,
  current_period_end timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.user_id,
    au.email,
    us.plan_type,
    us.status,
    us.created_at,
    us.current_period_end
  FROM user_subscriptions us
  LEFT JOIN auth.users au ON au.id = us.user_id
  ORDER BY us.created_at DESC;
$$;
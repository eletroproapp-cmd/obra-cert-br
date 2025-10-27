-- ============================================
-- FASE 1: ESTRUTURA DE BANCO DE DADOS SAAS (Parte 2)
-- ============================================

-- 1. Criar enums para planos e status
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'professional');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- 2. Criar tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL,
  stripe_price_id TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar tabela de assinaturas dos usuários
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. Criar tabela de rastreamento de uso
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_type, period_start)
);

-- 5. Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para subscription_plans
CREATE POLICY "Todos podem ver planos"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

CREATE POLICY "Super admins podem gerenciar planos"
  ON public.subscription_plans
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- 7. Políticas RLS para user_subscriptions
CREATE POLICY "Usuários podem ver sua própria assinatura"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins podem ver todas assinaturas"
  ON public.user_subscriptions
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Sistema pode criar assinaturas"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins podem atualizar assinaturas"
  ON public.user_subscriptions
  FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

-- 8. Políticas RLS para usage_tracking
CREATE POLICY "Usuários podem ver seu próprio uso"
  ON public.usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins podem ver todo uso"
  ON public.usage_tracking
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Sistema pode gerenciar rastreamento"
  ON public.usage_tracking
  FOR ALL
  USING (true);

-- 9. Função para verificar limites do usuário
CREATE OR REPLACE FUNCTION public.check_user_limit(
  _user_id UUID,
  _resource_type TEXT,
  _limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- Calcular período atual (mês corrente)
  v_period_start := date_trunc('month', now());
  v_period_end := v_period_start + interval '1 month';
  
  -- Buscar contagem atual
  SELECT COALESCE(count, 0)
  INTO v_current_count
  FROM usage_tracking
  WHERE user_id = _user_id
    AND resource_type = _resource_type
    AND period_start = v_period_start;
  
  -- Retornar se ainda está dentro do limite
  RETURN v_current_count < _limit;
END;
$$;

-- 10. Função para incrementar uso
CREATE OR REPLACE FUNCTION public.increment_usage(
  _user_id UUID,
  _resource_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  v_period_start := date_trunc('month', now());
  v_period_end := v_period_start + interval '1 month';
  
  INSERT INTO usage_tracking (user_id, resource_type, period_start, period_end, count)
  VALUES (_user_id, _resource_type, v_period_start, v_period_end, 1)
  ON CONFLICT (user_id, resource_type, period_start)
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    updated_at = now();
END;
$$;

-- 11. Função para criar assinatura free automaticamente
CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;

-- 12. Trigger para criar assinatura free em novos usuários
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription();

-- 13. Triggers para updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Popular planos de assinatura
INSERT INTO public.subscription_plans (plan_type, name, price_monthly, features, limits) VALUES
(
  'free',
  'Grátis',
  0.00,
  '["3 orçamentos por mês", "10 clientes", "1 usuário", "Suporte por email"]'::jsonb,
  '{"orcamentos_por_mes": 3, "clientes": 10, "usuarios": 1, "faturas_por_mes": 5, "materiais": 20, "servicos": 10}'::jsonb
),
(
  'basic',
  'Básico',
  9.90,
  '["Orçamentos ilimitados", "50 clientes", "2 usuários", "Gestão de estoque", "Suporte prioritário"]'::jsonb,
  '{"orcamentos_por_mes": -1, "clientes": 50, "usuarios": 2, "faturas_por_mes": -1, "materiais": 100, "servicos": 50}'::jsonb
),
(
  'professional',
  'Profissional',
  29.90,
  '["Tudo do Básico", "Clientes ilimitados", "5 usuários", "Emissão de NF-e", "Relatórios avançados", "API de integração", "Suporte premium"]'::jsonb,
  '{"orcamentos_por_mes": -1, "clientes": -1, "usuarios": 5, "faturas_por_mes": -1, "materiais": -1, "servicos": -1}'::jsonb
);

-- 15. Criar super admin com o email fornecido
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar o user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eletroproapp@gmail.com';
  
  -- Se o usuário existir, adicionar role de super_admin
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
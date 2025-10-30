-- Criar tabela de códigos promocionais
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'professional')),
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de histórico de ajustes de assinatura
CREATE TABLE public.subscription_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  adjusted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_plan TEXT,
  new_plan TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('manual', 'promo_code')),
  reference_code TEXT,
  duration_days INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de uso de códigos promocionais
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_code_usage_user ON public.promo_code_usage(user_id);
CREATE INDEX idx_subscription_adjustments_user ON public.subscription_adjustments(user_id);

-- RLS para promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar códigos promocionais"
ON public.promo_codes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos podem ver códigos ativos"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS para subscription_adjustments
ALTER TABLE public.subscription_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os ajustes"
ON public.subscription_adjustments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver seus próprios ajustes"
ON public.subscription_adjustments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem criar ajustes"
ON public.subscription_adjustments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS para promo_code_usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio uso"
ON public.promo_code_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode registrar uso"
ON public.promo_code_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Função para aplicar código promocional
CREATE OR REPLACE FUNCTION public.apply_promo_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_code promo_codes;
  v_current_subscription user_subscriptions;
  v_new_period_end TIMESTAMPTZ;
BEGIN
  -- Buscar código promocional
  SELECT * INTO v_promo_code
  FROM promo_codes
  WHERE code = p_code
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF v_promo_code IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Código inválido, expirado ou já atingiu o limite de uso'
    );
  END IF;
  
  -- Verificar se usuário já usou este código
  IF EXISTS(
    SELECT 1 FROM promo_code_usage
    WHERE promo_code_id = v_promo_code.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Você já utilizou este código promocional'
    );
  END IF;
  
  -- Buscar assinatura atual
  SELECT * INTO v_current_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- Calcular nova data de término
  IF v_current_subscription.current_period_end > now() THEN
    v_new_period_end := v_current_subscription.current_period_end + (v_promo_code.duration_days || ' days')::INTERVAL;
  ELSE
    v_new_period_end := now() + (v_promo_code.duration_days || ' days')::INTERVAL;
  END IF;
  
  -- Atualizar assinatura
  UPDATE user_subscriptions
  SET 
    plan_type = v_promo_code.plan_type,
    status = 'active',
    current_period_end = v_new_period_end,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar uso do código
  INSERT INTO promo_code_usage (promo_code_id, user_id)
  VALUES (v_promo_code.id, p_user_id);
  
  -- Incrementar contador de uso
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = v_promo_code.id;
  
  -- Registrar ajuste
  INSERT INTO subscription_adjustments (
    user_id,
    previous_plan,
    new_plan,
    adjustment_type,
    reference_code,
    duration_days
  ) VALUES (
    p_user_id,
    v_current_subscription.plan_type,
    v_promo_code.plan_type,
    'promo_code',
    p_code,
    v_promo_code.duration_days
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Código promocional aplicado com sucesso!',
    'plan_type', v_promo_code.plan_type,
    'duration_days', v_promo_code.duration_days,
    'new_period_end', v_new_period_end
  );
END;
$$;

-- Trigger para updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
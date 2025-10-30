-- Fix apply_promo_code function to cast plan_type correctly
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
  
  -- Atualizar assinatura (com cast correto do plan_type)
  UPDATE user_subscriptions
  SET 
    plan_type = v_promo_code.plan_type::subscription_plan,
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
    v_current_subscription.plan_type::text,
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
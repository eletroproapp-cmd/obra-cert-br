-- Modificar a função process_referral para não criar recompensas automaticamente
CREATE OR REPLACE FUNCTION public.process_referral(p_referred_user_id uuid, p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referral_id uuid;
  v_result jsonb;
BEGIN
  -- Buscar usuário que indicou pelo código
  SELECT user_id INTO v_referrer_user_id
  FROM referral_codes
  WHERE code = p_referral_code;
  
  IF v_referrer_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de indicação inválido');
  END IF;
  
  -- Verificar se usuário já foi indicado
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_user_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já foi indicado por alguém');
  END IF;
  
  -- Não permitir auto-indicação
  IF v_referrer_user_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode usar seu próprio código');
  END IF;
  
  -- Criar registro de indicação com status pending
  INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code, status)
  VALUES (v_referrer_user_id, p_referred_user_id, p_referral_code, 'pending')
  RETURNING id INTO v_referral_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'referral_id', v_referral_id,
    'message', 'Indicação registrada! As recompensas serão aplicadas quando você assinar um plano.'
  );
END;
$$;

-- Criar função para processar recompensas baseadas no plano
CREATE OR REPLACE FUNCTION public.process_referral_rewards(p_user_id uuid, p_plan_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral record;
  v_referrer_subscription record;
  v_discount_amount numeric;
  v_result jsonb;
BEGIN
  -- Buscar indicação onde o usuário é o indicado
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_user_id = p_user_id 
    AND status = 'pending'
  LIMIT 1;
  
  -- Se não houver indicação pendente, retornar
  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nenhuma indicação pendente');
  END IF;
  
  -- Aplicar recompensas baseadas no plano escolhido
  IF p_plan_type = 'basic' THEN
    -- Plano Básico: 50% de desconto no próximo mês para quem indicou
    SELECT * INTO v_referrer_subscription
    FROM user_subscriptions
    WHERE user_id = v_referral.referrer_user_id;
    
    -- Calcular desconto de 50% baseado no plano atual do indicador
    IF v_referrer_subscription.plan_type = 'basic' THEN
      v_discount_amount := 4.95; -- 50% de R$ 9,90
    ELSIF v_referrer_subscription.plan_type = 'professional' THEN
      v_discount_amount := 14.95; -- 50% de R$ 29,90
    ELSE
      v_discount_amount := 4.95; -- Default para plano básico
    END IF;
    
    -- Criar recompensa de desconto para quem indicou
    INSERT INTO referral_rewards (
      user_id, 
      referral_id, 
      reward_type, 
      reward_value, 
      status, 
      expires_at
    )
    VALUES (
      v_referral.referrer_user_id, 
      v_referral.id, 
      'discount_50_percent', 
      v_discount_amount,
      'pending',
      now() + interval '1 year'
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Recompensa criada: 50% de desconto no próximo mês para o indicador'
    );
    
  ELSIF p_plan_type = 'professional' THEN
    -- Plano Professional: 30 dias de acesso para o indicado
    INSERT INTO referral_rewards (
      user_id, 
      referral_id, 
      reward_type, 
      reward_value, 
      status, 
      expires_at
    )
    VALUES (
      p_user_id, 
      v_referral.id, 
      'free_month', 
      30,
      'pending',
      now() + interval '1 year'
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'message', '30 dias de acesso gratuito concedidos ao indicado'
    );
  ELSE
    -- Plano gratuito não gera recompensas
    RETURN jsonb_build_object('success', false, 'message', 'Plano gratuito não gera recompensas');
  END IF;
  
  -- Marcar indicação como completa
  UPDATE referrals 
  SET status = 'completed', 
      completed_at = now(),
      reward_granted = true
  WHERE id = v_referral.id;
  
  RETURN v_result;
END;
$$;
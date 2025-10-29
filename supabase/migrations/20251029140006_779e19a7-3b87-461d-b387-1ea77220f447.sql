-- Atualizar função de recompensas de indicação
CREATE OR REPLACE FUNCTION public.process_referral_rewards(p_user_id uuid, p_plan_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Plano gratuito não gera recompensas
  IF p_plan_type = 'free' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Plano gratuito não gera recompensas');
  END IF;
  
  -- Indicado que assina qualquer plano pago ganha 30 dias grátis
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
  
  -- Indicador ganha 50% de desconto no próximo mês
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
  
  -- Marcar indicação como completa
  UPDATE referrals 
  SET status = 'completed', 
      completed_at = now(),
      reward_granted = true
  WHERE id = v_referral.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Recompensas aplicadas: 30 dias grátis para o indicado e 50% de desconto para o indicador'
  );
END;
$function$;
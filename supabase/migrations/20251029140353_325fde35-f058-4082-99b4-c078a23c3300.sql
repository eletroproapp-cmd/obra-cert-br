-- Atualizar função de recompensas de indicação
CREATE OR REPLACE FUNCTION public.process_referral_rewards(p_user_id uuid, p_plan_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral record;
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
  
  -- Indicador também ganha 30 dias grátis
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
    'free_month', 
    30,
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
    'message', 'Recompensas aplicadas: 30 dias grátis para indicado e indicador'
  );
END;
$function$;
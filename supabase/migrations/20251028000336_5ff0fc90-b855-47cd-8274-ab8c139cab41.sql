-- Adicionar campo chave_pix na tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN chave_pix text;

-- Criar tabela de códigos de indicação
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela de indicações
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, rewarded
  reward_granted boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(referred_user_id)
);

-- Criar tabela de recompensas
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  reward_type text NOT NULL DEFAULT 'free_month', -- free_month, discount, etc
  reward_value integer NOT NULL DEFAULT 30, -- dias grátis
  status text NOT NULL DEFAULT 'pending', -- pending, applied, expired
  expires_at timestamp with time zone,
  applied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para referral_codes
CREATE POLICY "Usuários podem ver seu próprio código"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio código"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sistema pode ver códigos"
ON public.referral_codes FOR SELECT
USING (true);

-- Políticas RLS para referrals
CREATE POLICY "Usuários podem ver suas indicações"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Sistema pode criar indicações"
ON public.referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar indicações"
ON public.referrals FOR UPDATE
USING (true);

-- Políticas RLS para referral_rewards
CREATE POLICY "Usuários podem ver suas recompensas"
ON public.referral_rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar recompensas"
ON public.referral_rewards FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar recompensas"
ON public.referral_rewards FOR UPDATE
USING (true);

-- Função para gerar código único de indicação
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Gera código de 8 caracteres alfanuméricos
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE referral_codes.code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Função para processar indicação e conceder recompensas
CREATE OR REPLACE FUNCTION process_referral(
  p_referred_user_id uuid,
  p_referral_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Criar registro de indicação
  INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code, status, completed_at)
  VALUES (v_referrer_user_id, p_referred_user_id, p_referral_code, 'completed', now())
  RETURNING id INTO v_referral_id;
  
  -- Criar recompensa para quem indicou (30 dias)
  INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, status, expires_at)
  VALUES (
    v_referrer_user_id, 
    v_referral_id, 
    'free_month', 
    30,
    'pending',
    now() + interval '1 year'
  );
  
  -- Criar recompensa para quem foi indicado (30 dias)
  INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, status, expires_at)
  VALUES (
    p_referred_user_id, 
    v_referral_id, 
    'free_month', 
    30,
    'pending',
    now() + interval '1 year'
  );
  
  -- Marcar indicação como recompensada
  UPDATE referrals 
  SET reward_granted = true
  WHERE id = v_referral_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'referral_id', v_referral_id,
    'message', 'Indicação processada! Vocês ganharam 30 dias grátis cada um!'
  );
END;
$$;
-- Secure helper to create promo codes as admin without hitting RLS directly
CREATE OR REPLACE FUNCTION public.create_promo_code(
  p_code text,
  p_plan_type text,
  p_duration_days integer,
  p_max_uses integer,
  p_expires_at timestamptz
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Only admins can use this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.promo_codes (
    code,
    plan_type,
    duration_days,
    max_uses,
    expires_at,
    created_by
  ) VALUES (
    upper(p_code),
    p_plan_type,
    p_duration_days,
    p_max_uses,
    p_expires_at,
    auth.uid()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
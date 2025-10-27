-- Create rate limiting infrastructure
CREATE TABLE IF NOT EXISTS public.edge_function_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, function_name)
);

-- Enable RLS on rate limits table
ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
  ON public.edge_function_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage rate limits (SECURITY DEFINER functions will handle this)
CREATE POLICY "System can manage rate limits"
  ON public.edge_function_rate_limits FOR ALL
  USING (true);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _function_name TEXT,
  _max_requests INT,
  _window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Get current rate limit record
  SELECT request_count, window_start
  INTO v_count, v_window_start
  FROM edge_function_rate_limits
  WHERE user_id = _user_id
    AND function_name = _function_name
  FOR UPDATE;

  -- If no record or window expired, reset counter
  IF NOT FOUND OR v_window_start < NOW() - (_window_minutes || ' minutes')::INTERVAL THEN
    INSERT INTO edge_function_rate_limits (user_id, function_name, request_count, window_start)
    VALUES (_user_id, _function_name, 1, NOW())
    ON CONFLICT (user_id, function_name)
    DO UPDATE SET request_count = 1, window_start = NOW();
    RETURN TRUE;
  END IF;

  -- Check if limit exceeded
  IF v_count >= _max_requests THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  UPDATE edge_function_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = _user_id AND function_name = _function_name;

  RETURN TRUE;
END;
$$;
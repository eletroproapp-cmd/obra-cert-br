-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS fatura_numero_seq;

-- Update function to use sequence (thread-safe)
CREATE OR REPLACE FUNCTION public.generate_fatura_numero()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_ano TEXT;
  v_sequencia INTEGER;
  v_numero TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');
  v_sequencia := nextval('fatura_numero_seq');
  v_numero := 'FAT-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');
  RETURN v_numero;
END;
$function$;

-- Align sequence with current max for this year to avoid collisions
DO $$
DECLARE
  v_ano TEXT := TO_CHAR(NOW(), 'YYYY');
  v_max INT;
BEGIN
  SELECT COALESCE(MAX(CAST(split_part(numero, '-', 3) AS INT)), 0)
    INTO v_max
  FROM public.faturas
  WHERE numero LIKE 'FAT-' || v_ano || '-%';

  PERFORM setval('fatura_numero_seq', v_max, true);
END $$;
-- Fix ambiguous "numero" reference in generator functions by qualifying column and renaming local variables

-- Orçamento number generator
CREATE OR REPLACE FUNCTION public.generate_orcamento_numero()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_ano TEXT;
  v_sequencia INTEGER;
  v_numero TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(o.numero FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
  FROM public.orcamentos AS o
  WHERE o.numero LIKE 'ORC-' || v_ano || '-%';

  v_numero := 'ORC-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');

  RETURN v_numero;
END;
$function$;

-- Fatura number generator
CREATE OR REPLACE FUNCTION public.generate_fatura_numero()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_ano TEXT;
  v_sequencia INTEGER;
  v_numero TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(f.numero FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
  FROM public.faturas AS f
  WHERE f.numero LIKE 'FAT-' || v_ano || '-%';

  v_numero := 'FAT-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');

  RETURN v_numero;
END;
$function$;
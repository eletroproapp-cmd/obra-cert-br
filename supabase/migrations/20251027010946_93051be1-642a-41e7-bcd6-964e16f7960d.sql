-- Add explicit SECURITY INVOKER to all database functions for security best practices

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_orcamento_numero()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
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

CREATE OR REPLACE FUNCTION public.generate_fatura_numero()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
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

CREATE OR REPLACE FUNCTION public.generate_material_codigo()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_ano TEXT;
  v_sequencia INTEGER;
  v_codigo TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(m.codigo FROM 9) AS INTEGER)), 0) + 1
    INTO v_sequencia
  FROM public.materiais AS m
  WHERE m.codigo LIKE 'MAT-' || v_ano || '-%';

  v_codigo := 'MAT-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');

  RETURN v_codigo;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_servico_codigo()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_ano TEXT;
  v_sequencia INTEGER;
  v_codigo TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(s.codigo FROM 9) AS INTEGER)), 0) + 1
    INTO v_sequencia
  FROM public.servicos AS s
  WHERE s.codigo LIKE 'SRV-' || v_ano || '-%';

  v_codigo := 'SRV-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');

  RETURN v_codigo;
END;
$function$;
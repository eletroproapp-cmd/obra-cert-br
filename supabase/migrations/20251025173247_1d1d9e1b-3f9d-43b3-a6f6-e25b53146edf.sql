-- Criar função para gerar código de material
CREATE OR REPLACE FUNCTION public.generate_material_codigo()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
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

-- Criar função para gerar código de serviço
CREATE OR REPLACE FUNCTION public.generate_servico_codigo()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
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
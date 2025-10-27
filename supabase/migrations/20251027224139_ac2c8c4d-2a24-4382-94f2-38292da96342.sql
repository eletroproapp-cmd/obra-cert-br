-- Criar sequência para números de orçamento
CREATE SEQUENCE IF NOT EXISTS orcamento_numero_seq;

-- Atualizar função para usar sequência (thread-safe)
CREATE OR REPLACE FUNCTION public.generate_orcamento_numero()
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
  
  -- Usar sequência thread-safe
  v_sequencia := nextval('orcamento_numero_seq');
  
  v_numero := 'ORC-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');
  
  RETURN v_numero;
END;
$function$;
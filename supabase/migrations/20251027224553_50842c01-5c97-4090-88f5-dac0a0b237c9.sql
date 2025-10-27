DO $$
DECLARE
  v_ano TEXT := TO_CHAR(NOW(), 'YYYY');
  v_max INT;
BEGIN
  -- Encontrar o maior sufixo numérico já usado neste ano
  SELECT COALESCE(MAX(CAST(split_part(numero, '-', 3) AS INT)), 0)
    INTO v_max
  FROM public.orcamentos
  WHERE numero LIKE 'ORC-' || v_ano || '-%';

  -- Ajustar a sequência para evitar colisões (próximo nextval retornará v_max+1)
  PERFORM setval('orcamento_numero_seq', v_max, true);
END $$;
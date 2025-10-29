-- Corrigir limites do plano Gratuito
UPDATE subscription_plans
SET 
  limits = jsonb_build_object(
    'clientes', 50,
    'orcamentos_mes', 10,
    'faturas_mes', 5,
    'materiais', 20,
    'projetos', 5
  ),
  features = jsonb_build_array(
    '50 clientes',
    '10 orçamentos por mês',
    '5 faturas por mês',
    '20 materiais no catálogo',
    '5 projetos',
    '1 usuário',
    'Suporte por email'
  )
WHERE plan_type = 'free';
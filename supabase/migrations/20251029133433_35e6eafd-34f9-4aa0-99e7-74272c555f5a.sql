-- Atualizar limites do plano Free
UPDATE subscription_plans
SET limits = jsonb_build_object(
  'clientes', 100,
  'orcamentos_mes', 10,
  'faturas_mes', 5,
  'materiais', 50
)
WHERE plan_type = 'free';

-- Atualizar limites do plano Basic
UPDATE subscription_plans
SET 
  limits = jsonb_build_object(
    'clientes', 50,
    'orcamentos_mes', 100,
    'faturas_mes', 50,
    'materiais', 500,
    'funcionarios', 5
  ),
  features = jsonb_build_object(
    'funcionarios', true,
    'suporte_prioritario', true
  )
WHERE plan_type = 'basic';

-- Atualizar limites do plano Professional (manter ilimitado mas remover instalações)
UPDATE subscription_plans
SET limits = jsonb_build_object(
  'clientes', 999999,
  'orcamentos_mes', 999999,
  'faturas_mes', 999999,
  'materiais', 999999,
  'funcionarios', 999999
)
WHERE plan_type = 'professional';
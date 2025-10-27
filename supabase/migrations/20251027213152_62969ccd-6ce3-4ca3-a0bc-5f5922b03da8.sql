-- Atualizar limites dos planos para incluir funcionarios
UPDATE subscription_plans
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{funcionarios}',
  '5'::jsonb
)
WHERE plan_type = 'free';

UPDATE subscription_plans
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{funcionarios}',
  '20'::jsonb
)
WHERE plan_type = 'basic';

UPDATE subscription_plans
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{funcionarios}',
  '999999'::jsonb
)
WHERE plan_type = 'professional';
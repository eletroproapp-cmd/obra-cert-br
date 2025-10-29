-- Atualizar limite de projetos no plano gratuito
UPDATE subscription_plans
SET limits = jsonb_set(
  limits,
  '{projetos}',
  '5'::jsonb
)
WHERE plan_type = 'free';
-- Tornar todos os recursos ilimitados no plano Professional
-- Isto corrige prompts indevidos de upgrade em clientes, orçamentos, materiais, faturas e outros

-- Garante que o JSON de limites exista
UPDATE subscription_plans
SET limits = COALESCE(limits, '{}'::jsonb)
WHERE plan_type = 'professional';

-- Faz merge dos limites com valores altos (tratados como ilimitados pelo frontend)
UPDATE subscription_plans
SET limits = limits || '{
  "clientes": 999999,
  "materiais": 999999,
  "funcionarios": 999999,
  "orcamentos": 999999,
  "orcamentos_mes": 999999,
  "faturas": 999999,
  "faturas_mes": 999999,
  "instalacoes": 999999,
  "fornecedores": 999999
}'::jsonb
WHERE plan_type = 'professional';
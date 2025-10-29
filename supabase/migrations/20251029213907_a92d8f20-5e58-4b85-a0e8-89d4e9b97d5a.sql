-- Adicionar Suporte Premium no plano Profissional
UPDATE subscription_plans
SET 
  features = jsonb_build_array(
    'Tudo do Básico',
    'Orçamentos ilimitados',
    'Faturas ilimitadas',
    'Clientes ilimitados',
    'Funcionários ilimitados',
    'Materiais ilimitados',
    'Checklist NBR 5410',
    'Emissão de NF-e',
    'Suporte Premium'
  )
WHERE plan_type = 'professional';
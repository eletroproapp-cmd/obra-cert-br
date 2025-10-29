-- Reorganizar features dos planos

-- Plano Gratuito: remover "1 usuário"
UPDATE subscription_plans
SET 
  features = jsonb_build_array(
    '50 clientes',
    '10 orçamentos por mês',
    '5 faturas por mês',
    '20 materiais no catálogo',
    '5 projetos',
    'Suporte por email'
  )
WHERE plan_type = 'free';

-- Plano Básico: remover NBR 5410, adicionar Suporte Premium
UPDATE subscription_plans
SET 
  features = jsonb_build_object(
    'clientes', '100 clientes',
    'orcamentos', '50 orçamentos/mês',
    'faturas', '50 faturas/mês',
    'materiais', '500 materiais',
    'funcionarios', '10 funcionários',
    'suporte', 'Suporte Premium'
  )
WHERE plan_type = 'basic';

-- Plano Profissional: adicionar NBR 5410, remover features extras
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
    'Emissão de NF-e'
  )
WHERE plan_type = 'professional';
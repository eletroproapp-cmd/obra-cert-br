-- Corrigir limites dos planos de assinatura

-- Plano Gratuito: limites mais baixos
UPDATE subscription_plans
SET 
  limits = jsonb_build_object(
    'clientes', 10,
    'orcamentos_mes', 3,
    'faturas_mes', 3,
    'materiais', 20,
    'projetos', 2
  ),
  features = jsonb_build_array(
    '3 orçamentos por mês',
    '3 faturas por mês',
    '10 clientes',
    '20 materiais',
    '1 usuário',
    'Suporte por email'
  )
WHERE plan_type = 'free';

-- Plano Básico: bons limites para pequenos negócios
UPDATE subscription_plans
SET 
  limits = jsonb_build_object(
    'clientes', 100,
    'orcamentos_mes', 50,
    'faturas_mes', 50,
    'materiais', 500,
    'funcionarios', 10,
    'projetos', 20
  ),
  features = jsonb_build_object(
    'orcamentos', '50 orçamentos/mês',
    'faturas', '50 faturas/mês',
    'clientes', '100 clientes',
    'materiais', '500 materiais',
    'funcionarios', '10 funcionários',
    'suporte', 'Suporte prioritário',
    'nbr5410', 'Checklist NBR 5410'
  )
WHERE plan_type = 'basic';

-- Plano Profissional: ilimitado
UPDATE subscription_plans
SET 
  limits = jsonb_build_object(
    'clientes', 999999,
    'orcamentos_mes', 999999,
    'faturas_mes', 999999,
    'materiais', 999999,
    'funcionarios', 999999,
    'projetos', 999999,
    'timesheets', 999999
  ),
  features = jsonb_build_array(
    'Tudo do Básico',
    'Orçamentos ilimitados',
    'Faturas ilimitadas',
    'Clientes ilimitados',
    'Funcionários ilimitados',
    'Emissão de NF-e',
    'Relatórios avançados',
    'API de integração',
    '5 usuários',
    'Suporte premium 24/7'
  )
WHERE plan_type = 'professional';
-- Atualizar Price IDs do Stripe para os planos
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SNdCPLKBkplmgbywYz4GBVe'
WHERE plan_type = 'basic';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1SNdDtLKBkplmgbyLsGvLB3C'
WHERE plan_type = 'professional';
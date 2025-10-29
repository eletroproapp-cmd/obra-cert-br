-- Atualizar Price IDs do Stripe nos planos
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SNdCPLKBkplmgbywYz4GBV'
WHERE plan_type = 'basic';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1SNdDtLKBkplmgbyLsGvLB3C'
WHERE plan_type = 'professional';
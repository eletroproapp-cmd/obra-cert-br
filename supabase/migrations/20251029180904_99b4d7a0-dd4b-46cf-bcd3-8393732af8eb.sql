-- Atualizar Price IDs do Stripe para modo de teste
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SMsxeLKBkplmgbyChFmeJM6'
WHERE plan_type = 'basic';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1SMsj2LKBkplmgbyRB6qgZQX'
WHERE plan_type = 'professional';
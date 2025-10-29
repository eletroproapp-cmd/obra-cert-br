-- Limpar Price IDs inválidos do Stripe
UPDATE subscription_plans 
SET stripe_price_id = NULL
WHERE plan_type IN ('basic', 'professional');
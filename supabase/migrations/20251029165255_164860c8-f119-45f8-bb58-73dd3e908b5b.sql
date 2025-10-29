-- Add payment detail fields to empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS banco_nome TEXT,
  ADD COLUMN IF NOT EXISTS banco_codigo TEXT,
  ADD COLUMN IF NOT EXISTS agencia TEXT,
  ADD COLUMN IF NOT EXISTS conta TEXT,
  ADD COLUMN IF NOT EXISTS tipo_conta TEXT,
  ADD COLUMN IF NOT EXISTS titular_nome TEXT,
  ADD COLUMN IF NOT EXISTS titular_documento TEXT,
  ADD COLUMN IF NOT EXISTS instrucoes_pagamento TEXT;

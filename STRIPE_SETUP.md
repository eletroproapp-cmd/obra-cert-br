# Configuração do Stripe para Sistema de Assinaturas

## Passo 1: Criar Produtos e Preços no Stripe

Acesse o [Dashboard do Stripe](https://dashboard.stripe.com) e crie os seguintes produtos:

### Plano Básico
1. Vá em **Produtos** → **Adicionar produto**
2. Nome: **Plano Básico**
3. Preço: **R$ 9,90** (ou seu valor)
4. Cobrança: **Recorrente** - Mensal
5. Copie o **Price ID** (começa com `price_`)

### Plano Profissional
1. Vá em **Produtos** → **Adicionar produto**
2. Nome: **Plano Profissional**
3. Preço: **R$ 29,90** (ou seu valor)
4. Cobrança: **Recorrente** - Mensal
5. Copie o **Price ID** (começa com `price_`)

## Passo 2: Atualizar Price IDs no Código

Edite o arquivo `supabase/functions/criar-checkout-stripe/index.ts` na linha ~20:

```typescript
const priceMap: Record<string, string> = {
  'basic': 'price_XXXXXXXXXX', // Substitua pelo Price ID do Plano Básico
  'professional': 'price_YYYYYYYY', // Substitua pelo Price ID do Plano Profissional
};
```

## Passo 3: Configurar Webhook do Stripe

1. No Dashboard do Stripe, vá em **Desenvolvedores** → **Webhooks**
2. Clique em **Adicionar endpoint**
3. URL do endpoint: `https://ovnmwhzlwgfvrrjxuplp.supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Webhook Secret** (começa com `whsec_`)
6. Adicione o secret usando o comando ou interface do Lovable:
   - Nome: `STRIPE_WEBHOOK_SECRET`
   - Valor: O webhook secret copiado

## Passo 4: Testar

1. Faça login no sistema
2. Vá em **Configurações** → **Plano**
3. Clique em **Fazer Upgrade** em um dos planos pagos
4. Complete o checkout de teste no Stripe
5. Você será redirecionado de volta e seu plano será atualizado automaticamente

## Modo de Teste vs Produção

- **Teste**: Use chaves que começam com `sk_test_` e `whsec_test_`
- **Produção**: Use chaves que começam com `sk_live_` e `whsec_live_`

⚠️ **IMPORTANTE**: Nunca compartilhe suas chaves secretas do Stripe!

## Problemas Comuns

1. **Erro 401**: Verifique se a chave do Stripe está correta
2. **Webhook não funciona**: Confirme que o webhook secret está configurado
3. **Plano não atualiza**: Verifique os logs da edge function `stripe-webhook`

# Sistema de Assinaturas EletroPro

## Visão Geral

Sistema completo de assinaturas com integração Stripe, gerenciamento de limites de recursos e notificações por email.

## Estrutura de Planos

### 📦 Gratuito (Free)
- **Preço**: R$ 0/mês
- **Limites**:
  - 5 clientes
  - 10 orçamentos por mês
  - 5 faturas por mês
  - 2 instalações ativas
  - 50 materiais no catálogo

### 💼 Básico
- **Preço**: R$ 9,90/mês
- **Limites**:
  - 50 clientes
  - 100 orçamentos por mês
  - 50 faturas por mês
  - 10 instalações ativas
  - 500 materiais no catálogo
  - 5 funcionários
- **Extras**:
  - Suporte prioritário

### 🚀 Profissional
- **Preço**: R$ 29,90/mês
- **Recursos**:
  - ✨ **Tudo ilimitado**
  - Suporte premium 24/7
  - API de integração
  - Relatórios avançados

## Implementação Técnica

### Database

#### Tabelas Principais
- `subscription_plans` - Definições de planos
- `user_subscriptions` - Assinaturas dos usuários
- `usage_tracking` - Rastreamento de uso de recursos
- `user_roles` - Sistema de permissões

#### Funções de Banco
- `check_user_limit()` - Verifica se usuário pode criar recurso
- `increment_usage()` - Incrementa contador de uso
- `has_role()` - Verifica permissões de usuário
- `get_my_roles()` - Retorna roles do usuário atual

### Edge Functions

#### Pagamentos
- **criar-checkout-stripe** - Cria sessão de checkout no Stripe
- **cancelar-assinatura** - Cancela assinatura (mantém até fim do período)
- **stripe-webhook** - Processa eventos do Stripe

#### Emails (Resend)
- **enviar-email-boas-vindas** - Email ao criar conta
- **enviar-email-upgrade** - Email de confirmação de upgrade

### Frontend

#### Hooks
- `useSubscription` - Gerencia dados de assinatura e limites
- `useAdminCheck` - Verifica se usuário é admin

#### Componentes
- `PlansTab` - Interface de gerenciamento de planos
- `UsageLimitAlert` - Alerta de limite próximo/atingido
- `PlanUpgradeDialog` - Dialog de upgrade quando limite atingido
- `UsageCard` - Card com uso atual vs limites

## Fluxo de Upgrade

1. **Usuário clica "Fazer Upgrade"**
   - Frontend chama `criar-checkout-stripe`
   - Edge function cria sessão no Stripe
   - Usuário é redirecionado para checkout Stripe

2. **Pagamento Confirmado**
   - Stripe envia webhook `checkout.session.completed`
   - Webhook atualiza `user_subscriptions`
   - Envia email de confirmação via `enviar-email-upgrade`

3. **Gerenciamento Contínuo**
   - Webhook `customer.subscription.updated` - Atualiza status
   - Webhook `customer.subscription.deleted` - Volta para free

## Controle de Limites

### Como Funciona

```typescript
// Verificar limite antes de criar recurso
const limitCheck = checkLimit('clientes');

if (!limitCheck.allowed) {
  // Mostrar dialog de upgrade
  setShowUpgradeDialog(true);
  return;
}

// Criar recurso
await createResource();

// Sistema automaticamente incrementa contador
```

### Recursos com Limites
- `clientes`
- `orcamentos`
- `faturas`
- `instalacoes`
- `materiais`
- `funcionarios`

## Sistema de Roles

### Roles Disponíveis
- `super_admin` - Acesso total, gerencia todos usuários
- `admin` - Gerencia própria organização
- `manager` - Visualiza instalações e timesheets de todos
- `accountant` - Visualiza faturas de todos

### Segurança
- ✅ Roles armazenados em tabela separada (não em profile)
- ✅ Funções SECURITY DEFINER evitam recursão RLS
- ✅ Verificação server-side em todas operações críticas

## Dashboard Admin

Acessível em `/admin` (apenas para admins):
- 📊 Estatísticas de assinaturas
- 💰 MRR (Monthly Recurring Revenue)
- 👥 Lista de todos usuários e planos
- 📈 Conversão Free → Pago

## Emails Automatizados

### Boas-vindas
Enviado ao criar conta:
- Resumo dos recursos
- Links úteis
- Call-to-action para dashboard

### Confirmação de Upgrade
Enviado após pagamento confirmado:
- Detalhes do plano contratado
- Novos recursos disponíveis
- Informações de cobrança

### Futuros (Recomendado)
- Lembrete de renovação (3 dias antes)
- Confirmação de cancelamento
- Downgrade para free (após expiração)

## Configuração

### Variáveis de Ambiente
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### Stripe
1. Criar produtos e preços
2. Configurar webhook endpoint
3. Copiar IDs dos preços para `criar-checkout-stripe`

### Resend
1. Criar conta em resend.com
2. Verificar domínio
3. Gerar API key

## Testes

### Testar Upgrade
1. Login como usuário free
2. Ir em Configurações → Plano
3. Clicar "Fazer Upgrade"
4. Usar cartão de teste Stripe: `4242 4242 4242 4242`
5. Verificar webhook recebido
6. Confirmar email enviado

### Testar Limites
1. Criar recursos até atingir limite
2. Tentar criar mais um
3. Verificar alert e dialog de upgrade

### Testar Cancelamento
1. Usuario com plano pago
2. Configurações → Plano → Cancelar Assinatura
3. Verificar badge "Cancelamento agendado"
4. Assinatura permanece ativa até fim do período

## Troubleshooting

### Webhook não processa
- Verificar `STRIPE_WEBHOOK_SECRET` correto
- Checar logs: `lov-edge-function-logs stripe-webhook`
- Confirmar endpoint configurado no Stripe

### Email não envia
- Verificar `RESEND_API_KEY` configurado
- Domínio verificado no Resend
- Checar logs da edge function

### Limite não atualiza
- Verificar função `increment_usage()` sendo chamada
- Checar `usage_tracking` no banco
- Período de rastreamento (mensal)

## Melhorias Futuras

### Prioridade Alta
- [ ] Portal de cliente Stripe (gerenciar cartão)
- [ ] Histórico de faturas
- [ ] Cupons de desconto

### Prioridade Média
- [ ] Plano anual (desconto)
- [ ] Add-ons (recursos extras)
- [ ] Métricas de churn

### Prioridade Baixa
- [ ] Multi-currency
- [ ] Faturamento por uso
- [ ] Trials gratuitos

## Suporte

Para dúvidas ou problemas:
1. Verificar logs de edge functions
2. Checar status do Stripe/Resend
3. Consultar documentação oficial
4. Abrir issue no repositório

---

✨ **Sistema 100% funcional e pronto para produção!**

import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { UsageCard } from "./UsageCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Ideal para começar',
    features: [
      '5 clientes',
      '10 orçamentos por mês',
      '5 faturas por mês',
      '2 instalações ativas',
      '50 materiais no catálogo'
    ],
    limitations: ['Recursos básicos', 'Suporte por email']
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 9,90',
    period: '/mês',
    description: 'Para pequenos negócios',
    highlight: true,
    features: [
      '50 clientes',
      '100 orçamentos por mês',
      '50 faturas por mês',
      '10 instalações ativas',
      '500 materiais no catálogo',
      '5 funcionários',
      'Suporte prioritário'
    ]
  },
  {
    id: 'professional',
    name: 'Profissional',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Para empresas em crescimento',
    features: [
      'Clientes ilimitados',
      'Orçamentos ilimitados',
      'Faturas ilimitadas',
      'Instalações ilimitadas',
      'Materiais ilimitados',
      'Funcionários ilimitados',
      'Suporte premium 24/7',
      'API de integração',
      'Relatórios avançados'
    ]
  }
];

export const PlansTab = () => {
  const { subscription, plan, loading } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }
    
    setUpgrading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('criar-checkout-stripe', {
        body: { planType: planId, origin: window.location.origin },
      });

      if (error) throw error;

      if (data?.url) {
        const url = data.url as string;
        try {
          if (window.top) {
            // Quebrar o iframe do preview para evitar bloqueio do Stripe (X-Frame-Options)
            (window.top as Window).location.href = url;
          } else {
            window.location.href = url;
          }
        } catch {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPlanId = subscription?.plan_type || 'free';

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
          <CardDescription>
            Você está no plano <strong>{plan?.name || 'Gratuito'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">
                R$ {plan?.price_monthly.toFixed(2) || '0,00'}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
              {subscription?.status === 'active' && (
                <Badge variant="secondary" className="mt-2">
                  <Zap className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
            {subscription?.cancel_at_period_end && (
              <Badge variant="destructive">
                Cancela em {new Date(subscription.current_period_end!).toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Card */}
      <UsageCard />

      {/* Available Plans */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Planos Disponíveis</h3>
          <p className="text-sm text-muted-foreground">
            Escolha o plano ideal para o seu negócio
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((planItem) => {
            const isCurrent = planItem.id === currentPlanId;
            const order = ['free', 'basic', 'professional'] as const;
            const isUpgrade = order.indexOf(planItem.id as typeof order[number]) > 
                             order.indexOf(currentPlanId as typeof order[number]);

            return (
              <Card 
                key={planItem.id}
                className={`relative ${
                  planItem.highlight 
                    ? 'border-primary shadow-lg' 
                    : isCurrent 
                      ? 'border-primary/50' 
                      : ''
                }`}
              >
                {planItem.highlight && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="shadow-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Recomendado
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                  <CardDescription>{planItem.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">{planItem.price}</span>
                    <span className="text-muted-foreground">{planItem.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2 mb-6">
                    {planItem.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {planItem.limitations && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Limitações:</p>
                      <ul className="space-y-1">
                        {planItem.limitations.map((limitation, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    onClick={() => handleUpgrade(planItem.id)}
                    variant={isCurrent ? "outline" : planItem.highlight ? "default" : "secondary"}
                    className="w-full mt-4"
                    disabled={isCurrent || upgrading || !isUpgrade}
                  >
                    {upgrading ? (
                      'Processando...'
                    ) : isCurrent ? (
                      'Plano Atual'
                    ) : isUpgrade ? (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Fazer Upgrade
                      </>
                    ) : (
                      'Downgrade não disponível'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing info placeholder */}
      {currentPlanId !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Informações de Pagamento</CardTitle>
            <CardDescription>
              Gerencie seus métodos de pagamento e histórico de faturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Integração com Stripe em breve. Configure suas chaves de API para habilitar pagamentos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

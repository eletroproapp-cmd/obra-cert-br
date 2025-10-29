import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { UsageCard } from "./UsageCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Ideal para começar',
    features: [
      '100 clientes',
      '10 orçamentos por mês',
      '5 faturas por mês',
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
      'Suporte Premium'
    ]
  }
];

export const PlansTab = () => {
  const { subscription, plan, loading, refetch } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success("Pagamento em processamento", {
        description: "Seu plano será atualizado em alguns instantes. Aguarde...",
      });
      
      // Limpar parâmetros da URL
      setSearchParams({});
      
      // Recarregar dados e enviar email de upgrade após 3 segundos
      setTimeout(async () => {
        await refetch();
        
        // Buscar informações do usuário e plano para enviar email
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('plan_type, subscription_plans(name, price_monthly)')
            .eq('user_id', user?.id)
            .single();
          
          if (user && subData) {
            const planData = subData.subscription_plans as any;
            await supabase.functions.invoke('enviar-email-upgrade', {
              body: {
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                planName: planData?.name || 'Premium',
                price: planData?.price_monthly || 0
              }
            });
          }
        } catch (error) {
          console.error('Erro ao enviar email de upgrade:', error);
        }
      }, 3000);
    } else if (canceled === 'true') {
      toast.error("Pagamento cancelado", {
        description: "Você cancelou o processo de upgrade.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetch]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }
    
    setUpgrading(true);
    
    // Abre pop-up imediatamente para não ser bloqueado pelo navegador
    const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
    
    try {
      const { data, error } = await supabase.functions.invoke('criar-checkout-stripe', {
        body: { planType: planId, origin: window.location.origin },
      });

      if (error) throw error;

      if (data?.url) {
        const url = data.url as string;
        toast.success("Abrindo checkout...");

        if (popup) {
          try {
            popup.location.href = url;
          } catch {
            // Se alguma política bloquear, faz fallback
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        } else {
          // Se pop-up foi bloqueado, tenta redirecionar a janela atual
          try {
            if (window.top) {
              (window.top as Window).location.href = url;
            } else {
              window.location.href = url;
            }
          } catch {
            window.location.href = url;
          }
        }
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
      if (popup && !popup.closed) popup.close();
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Ela permanecerá ativa até o final do período pago.')) {
      return;
    }

    setCanceling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cancelar-assinatura');

      if (error) throw error;

      toast.success("Assinatura cancelada", {
        description: "Sua assinatura permanecerá ativa até o final do período pago.",
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error('Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setCanceling(false);
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
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>
                Você está no plano <strong>{plan?.name || 'Gratuito'}</strong>
              </CardDescription>
            </div>
            <Badge 
              variant={subscription?.status === 'active' ? 'default' : 'secondary'}
              className="text-sm px-3 py-1"
            >
              {subscription?.status === 'active' ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Ativo
                </>
              ) : (
                subscription?.status || 'Inativo'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                R$ {plan?.price_monthly?.toFixed(2) || '0,00'}
                <span className="text-base font-normal text-muted-foreground ml-1">/mês</span>
              </p>
              {subscription?.current_period_end && (
                <p className="text-sm text-muted-foreground mt-2">
                  Renovação em: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            {subscription?.cancel_at_period_end ? (
              <Badge variant="destructive">
                Cancelamento agendado para {new Date(subscription.current_period_end!).toLocaleDateString('pt-BR')}
              </Badge>
            ) : currentPlanId !== 'free' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelSubscription}
                disabled={canceling}
              >
                {canceling ? 'Cancelando...' : 'Cancelar Assinatura'}
              </Button>
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
            <CardTitle>Gerenciar Assinatura</CardTitle>
            <CardDescription>
              Controle sua assinatura e forma de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Forma de Pagamento</p>
                <p className="text-sm text-muted-foreground">
                  Gerenciado pelo Stripe
                </p>
              </div>
              <Badge variant="outline">Cartão de Crédito</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Próxima Cobrança</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.current_period_end 
                    ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                    : 'Não disponível'}
                </p>
              </div>
              <p className="font-bold text-primary">
                R$ {plan?.price_monthly?.toFixed(2) || '0,00'}
              </p>
            </div>
            
            {!subscription?.cancel_at_period_end && (
              <p className="text-xs text-muted-foreground">
                💡 Sua assinatura renova automaticamente. Você pode cancelar a qualquer momento.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

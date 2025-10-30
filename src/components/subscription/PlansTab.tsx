import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Settings } from "lucide-react";
import { UsageCard } from "./UsageCard";
import { PromoCodeInput } from "./PromoCodeInput";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Ideal para começar',
    features: [
      '50 clientes',
      '10 orçamentos por mês',
      '5 faturas por mês',
      '20 materiais no catálogo',
      '5 projetos'
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
      '100 clientes',
      '50 orçamentos por mês',
      '50 faturas por mês',
      '500 materiais no catálogo',
      '10 funcionários',
      'Suporte Premium'
    ]
  },
  {
    id: 'professional',
    name: 'Profissional',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Para empresas em crescimento',
    features: [
      'Tudo do Básico',
      'Orçamentos ilimitados',
      'Faturas ilimitadas',
      'Clientes ilimitados',
      'Funcionários ilimitados',
      'Materiais ilimitados',
      'Checklist NBR 5410',
      'Emissão de NF-e',
      'Suporte Premium'
    ]
  }
];

export const PlansTab = () => {
  const { subscription, plan, loading, refetch } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceIdsConfigured, setPriceIdsConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const navigate = useNavigate();

  // Check if price IDs are configured
  useEffect(() => {
    const checkPriceIds = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('stripe_price_id, plan_type')
          .in('plan_type', ['basic', 'professional']);
        
        if (!error && data) {
          const hasBasic = data.some(p => p.plan_type === 'basic' && p.stripe_price_id);
          const hasPro = data.some(p => p.plan_type === 'professional' && p.stripe_price_id);
          setPriceIdsConfigured(hasBasic && hasPro);
        }
      } catch (error) {
        console.error('Erro ao verificar Price IDs:', error);
      } finally {
        setCheckingConfig(false);
      }
    };
    
    checkPriceIds();
  }, []);

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
    if (!priceIdsConfigured) {
      toast.error("Configuração pendente", {
        description: "Os preços do Stripe ainda não foram configurados."
      });
      return;
    }

    const user = await supabase.auth.getUser();
    if (!user?.data?.user) {
      toast.error("Você precisa estar logado para fazer upgrade");
      return;
    }
    
    setUpgrading(true);
    
    try {
      console.log('🚀 Iniciando checkout para plano:', planId);
      console.log('📍 Origin:', window.location.origin);
      
      const { data, error } = await supabase.functions.invoke('criar-checkout-stripe', {
        body: { planType: planId, origin: window.location.origin },
      });

      console.log('📦 Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('❌ Erro retornado no data:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log('✅ URL de checkout recebida:', data.url);
        toast.success("Redirecionando para checkout...");
        // Usar window.top para escapar do iframe do Lovable preview
        // Stripe Checkout não funciona dentro de iframes
        setTimeout(() => {
          console.log('🔄 Redirecionando no top level...');
          if (window.top) {
            window.top.location.href = data.url;
          } else {
            window.location.href = data.url;
          }
        }, 500);
      } else {
        console.error('❌ Nenhuma URL retornada. Data completo:', JSON.stringify(data));
        throw new Error('URL de checkout não recebida');
      }
    } catch (error: any) {
      console.error('💥 Erro capturado:', error);
      console.error('💥 Tipo do erro:', typeof error);
      console.error('💥 Error message:', error?.message);
      console.error('💥 Error stack:', error?.stack);
      
      const errorMsg = error?.message || 'Erro ao processar pagamento';
      
      if (errorMsg.includes('price_id') || errorMsg.includes('Stripe') || errorMsg.includes('Price ID')) {
        toast.error('Configuração necessária', {
          description: 'Os preços do Stripe precisam ser configurados primeiro.',
        });
      } else {
        toast.error('Erro ao processar pagamento', {
          description: errorMsg,
        });
      }
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
      {/* Configuration Alert */}
      {!checkingConfig && !priceIdsConfigured && (
        <Alert variant="destructive">
          <Settings className="h-4 w-4" />
          <AlertTitle>Configuração Necessária</AlertTitle>
          <AlertDescription className="space-y-3">
            <div>
              Os preços do Stripe precisam ser configurados antes de fazer upgrade.
              <br />
              <strong>Você precisa:</strong>
              <br />
              1. Copiar os Price IDs do Stripe (começam com "price_")
              <br />
              2. Configurá-los na página Admin
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin')}
              className="w-full sm:w-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              Ir para Admin
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Promo Code Input */}
      <PromoCodeInput onSuccess={refetch} />

      {/* Current Plan Status */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>
                Você está no plano <strong>{plan?.name || 'Gratuito'}</strong>
              </CardDescription>
            </div>
            <Badge 
              variant={subscription?.status === 'active' ? 'default' : 'secondary'}
              className="text-sm px-3 py-1 w-fit"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <Badge variant="destructive" className="w-fit">
                Cancelamento agendado para {new Date(subscription.current_period_end!).toLocaleDateString('pt-BR')}
              </Badge>
            ) : currentPlanId !== 'free' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="w-full sm:w-auto"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                
                <CardHeader className="text-center pb-6 pt-6">
                  <CardTitle className="text-xl sm:text-2xl">{planItem.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{planItem.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">{planItem.price}</span>
                    <span className="text-sm sm:text-base text-muted-foreground">{planItem.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4">
                  <ul className="space-y-2 mb-4 sm:mb-6">
                    {planItem.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{feature}</span>
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
                    disabled={isCurrent || upgrading || !isUpgrade || (!priceIdsConfigured && planItem.id !== 'free')}
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

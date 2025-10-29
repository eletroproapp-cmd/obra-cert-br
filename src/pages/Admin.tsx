import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, TrendingUp, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionStats {
  total_users: number;
  free_users: number;
  basic_users: number;
  professional_users: number;
  active_subscriptions: number;
  monthly_revenue: number;
}

interface UserSubscription {
  user_id: string;
  plan_type: string;
  status: string;
  created_at: string;
  current_period_end: string | null;
}

const Admin = () => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [basicPriceId, setBasicPriceId] = useState("");
  const [professionalPriceId, setProfessionalPriceId] = useState("");
  const [savingPrices, setSavingPrices] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Acesso negado");
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      // Buscar todas as assinaturas
      const { data: subs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type, status, created_at, current_period_end')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      setSubscriptions(subs || []);

      // Buscar Price IDs do Stripe
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('plan_type, stripe_price_id');

      if (plans) {
        const basicPlan = plans.find(p => p.plan_type === 'basic');
        const professionalPlan = plans.find(p => p.plan_type === 'professional');
        
        setBasicPriceId(basicPlan?.stripe_price_id || '');
        setProfessionalPriceId(professionalPlan?.stripe_price_id || '');
      }

      // Calcular estatísticas
      const stats: SubscriptionStats = {
        total_users: subs?.length || 0,
        free_users: subs?.filter(s => s.plan_type === 'free').length || 0,
        basic_users: subs?.filter(s => s.plan_type === 'basic').length || 0,
        professional_users: subs?.filter(s => s.plan_type === 'professional').length || 0,
        active_subscriptions: subs?.filter(s => s.status === 'active' && s.plan_type !== 'free').length || 0,
        monthly_revenue: (
          (subs?.filter(s => s.plan_type === 'basic' && s.status === 'active').length || 0) * 9.90 +
          (subs?.filter(s => s.plan_type === 'professional' && s.status === 'active').length || 0) * 29.90
        )
      };

      setStats(stats);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStripePrices = async () => {
    if (!basicPriceId || !professionalPriceId) {
      toast.error('Preencha ambos os Price IDs');
      return;
    }

    if (!basicPriceId.startsWith('price_') || !professionalPriceId.startsWith('price_')) {
      toast.error('Price IDs devem começar com "price_"');
      return;
    }

    setSavingPrices(true);
    try {
      const { error: basicError } = await supabase
        .from('subscription_plans')
        .update({ stripe_price_id: basicPriceId })
        .eq('plan_type', 'basic');

      if (basicError) throw basicError;

      const { error: proError } = await supabase
        .from('subscription_plans')
        .update({ stripe_price_id: professionalPriceId })
        .eq('plan_type', 'professional');

      if (proError) throw proError;

      toast.success('Price IDs configurados com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSavingPrices(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral de assinaturas e usuários</p>
        </div>

        {/* Stripe Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Configuração do Stripe</CardTitle>
            </div>
            <CardDescription>
              Configure os Price IDs dos planos de assinatura do Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="basic-price">Plano Básico (R$ 9,90/mês)</Label>
                <Input
                  id="basic-price"
                  placeholder="price_xxxxxxxxxxxxx"
                  value={basicPriceId}
                  onChange={(e) => setBasicPriceId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole aqui o Price ID do plano básico do Stripe
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professional-price">Plano Profissional (R$ 29,90/mês)</Label>
                <Input
                  id="professional-price"
                  placeholder="price_xxxxxxxxxxxxx"
                  value={professionalPriceId}
                  onChange={(e) => setProfessionalPriceId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole aqui o Price ID do plano profissional do Stripe
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <Button 
                onClick={handleSaveStripePrices}
                disabled={savingPrices}
              >
                {savingPrices ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              
              <a 
                href="https://dashboard.stripe.com/products" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Abrir Dashboard do Stripe →
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_subscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.basic_users} Básico + {stats?.professional_users} Pro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats?.monthly_revenue.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Gratuitos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.free_users || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Assinaturas</CardTitle>
            <CardDescription>
              Lista completa de usuários e seus planos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma assinatura encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.user_id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-mono text-sm">{sub.user_id.substring(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">
                          Criado em: {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          sub.plan_type === 'professional' ? 'default' :
                          sub.plan_type === 'basic' ? 'secondary' :
                          'outline'
                        }>
                          {sub.plan_type === 'professional' ? 'Profissional' :
                           sub.plan_type === 'basic' ? 'Básico' :
                           'Gratuito'}
                        </Badge>
                        
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;

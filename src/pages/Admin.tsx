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
import { Users, CreditCard, TrendingUp, AlertCircle, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  email?: string;
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
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      // Buscar todas as assinaturas com emails usando a função SQL
      const { data: subs, error: subsError } = await supabase
        .rpc('get_subscriptions_with_emails' as any) as { data: UserSubscription[] | null, error: any };

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
      const subscriptionsList = subs || [];
      const stats: SubscriptionStats = {
        total_users: subscriptionsList.length,
        free_users: subscriptionsList.filter(s => s.plan_type === 'free').length,
        basic_users: subscriptionsList.filter(s => s.plan_type === 'basic').length,
        professional_users: subscriptionsList.filter(s => s.plan_type === 'professional').length,
        active_subscriptions: subscriptionsList.filter(s => s.status === 'active' && s.plan_type !== 'free').length,
        monthly_revenue: (
          subscriptionsList.filter(s => s.plan_type === 'basic' && s.status === 'active').length * 9.90 +
          subscriptionsList.filter(s => s.plan_type === 'professional' && s.status === 'active').length * 29.90
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('deletar-usuario', {
        body: { userId: userToDelete }
      });

      if (error) throw error;

      toast.success('Usuário deletado com sucesso!');
      setUserToDelete(null);
      loadData(); // Recarregar dados
    } catch (error: any) {
      toast.error('Erro ao deletar usuário: ' + error.message);
    } finally {
      setDeleting(false);
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

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Gerenciar Usuários</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>
                Altere planos e gerencie assinaturas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/promo-codes')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Códigos Promocionais</CardTitle>
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>
                Crie e gerencie cupons de desconto
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Stripe Dashboard</CardTitle>
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>
                <a 
                  href="https://dashboard.stripe.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Abrir Stripe →
                </a>
              </CardDescription>
            </CardHeader>
          </Card>
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
                        <p className="font-medium text-sm">{sub.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {sub.user_id.substring(0, 13)}...
                        </p>
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

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUserToDelete(sub.user_id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.
                Todos os dados relacionados ao usuário serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deletando...' : 'Deletar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Admin;

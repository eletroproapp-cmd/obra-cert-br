import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, DollarSign, FileText, Users, Wrench, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface DashboardMetrics {
  totalReceitas: number;
  totalDespesas: number;
  totalOrcamentos: number;
  orcamentosPendentes: number;
  totalFaturas: number;
  faturasPendentes: number;
  instalacoes: number;
  materiaisBaixoEstoque: number;
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalReceitas: 0,
    totalDespesas: 0,
    totalOrcamentos: 0,
    orcamentosPendentes: 0,
    totalFaturas: 0,
    faturasPendentes: 0,
    instalacoes: 0,
    materiaisBaixoEstoque: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar orçamentos
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('valor_total, status')
        .eq('user_id', user.id);

      // Carregar faturas
      const { data: faturas } = await supabase
        .from('faturas')
        .select('valor_total, status')
        .eq('user_id', user.id);

      // Carregar instalações
      const { data: instalacoes } = await supabase
        .from('instalacoes')
        .select('id, status')
        .eq('user_id', user.id);

      // Carregar materiais com estoque baixo
      const { data: materiais } = await supabase
        .from('materiais')
        .select('estoque_atual, estoque_minimo')
        .eq('user_id', user.id);

      const totalReceitas = faturas?.filter(f => f.status === 'Paga').reduce((sum, f) => sum + Number(f.valor_total), 0) || 0;
      const totalDespesas = 0; // Será implementado quando houver módulo de despesas
      const totalOrcamentos = orcamentos?.length || 0;
      const orcamentosPendentes = orcamentos?.filter(o => o.status === 'Pendente').length || 0;
      const totalFaturas = faturas?.length || 0;
      const faturasPendentes = faturas?.filter(f => f.status === 'Pendente').length || 0;
      const materiaisBaixoEstoque = materiais?.filter(m => Number(m.estoque_atual) <= Number(m.estoque_minimo)).length || 0;

      setMetrics({
        totalReceitas,
        totalDespesas,
        totalOrcamentos,
        orcamentosPendentes,
        totalFaturas,
        faturasPendentes,
        instalacoes: instalacoes?.length || 0,
        materiaisBaixoEstoque,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar métricas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Visão geral do seu negócio</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">R$ {metrics.totalReceitas.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Faturas pagas
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrcamentos}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.orcamentosPendentes} pendentes
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalFaturas}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.faturasPendentes} pendentes
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instalações</CardTitle>
              <Wrench className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.instalacoes}</div>
              <p className="text-xs text-muted-foreground">
                Obras em andamento
              </p>
            </CardContent>
          </Card>
        </div>

        {metrics.materiaisBaixoEstoque > 0 && (
          <Card className="mt-6 border-l-4 border-l-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Atenção: Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Você tem {metrics.materiaisBaixoEstoque} {metrics.materiaisBaixoEstoque === 1 ? 'material' : 'materiais'} com estoque abaixo do mínimo.
                <Link to="/catalogo" className="ml-2 text-primary hover:underline">
                  Verificar catálogo
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/orcamentos" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Novo Orçamento</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
              <Link to="/faturas" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nova Fatura</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
              <Link to="/relatorios" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ver Relatórios</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receitas</span>
                <span className="font-bold text-success">R$ {metrics.totalReceitas.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Despesas</span>
                <span className="font-bold text-destructive">R$ {metrics.totalDespesas.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lucro</span>
                <span className="font-bold text-primary">
                  R$ {(metrics.totalReceitas - metrics.totalDespesas).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, DollarSign, FileText, Users, Wrench, TrendingUp, AlertTriangle, Calendar, Clock, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, isToday, isFuture, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface Agendamento {
  id: string;
  titulo: string;
  cliente: string | null;
  data_inicio: string;
  status: string;
  tipo: string;
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
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  useEffect(() => {
    loadMetrics();
  }, [dataInicio, dataFim]);

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar orçamentos
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('valor_total, status')
        .eq('user_id', user.id);

      // Carregar faturas (filtradas por data de pagamento para receitas)
      const { data: faturas } = await supabase
        .from('faturas')
        .select('valor_total, status, data_pagamento')
        .eq('user_id', user.id);

      // Carregar despesas (filtradas por data)
      const { data: despesas } = await supabase
        .from('despesas')
        .select('valor, data')
        .eq('user_id', user.id)
        .gte('data', dataInicio)
        .lte('data', dataFim);

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

      // Calcular receitas (faturas pagas dentro do período)
      const totalReceitas = faturas?.filter(f => 
        f.status === 'Pago' && 
        f.data_pagamento && 
        f.data_pagamento >= dataInicio && 
        f.data_pagamento <= dataFim
      ).reduce((sum, f) => sum + Number(f.valor_total), 0) || 0;

      // Calcular despesas
      const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0;

      const totalOrcamentos = orcamentos?.length || 0;
      const orcamentosPendentes = orcamentos?.filter(o => o.status === 'Pendente').length || 0;
      const totalFaturas = faturas?.length || 0;
      const faturasPendentes = faturas?.filter(f => f.status === 'Pendente').length || 0;
      const materiaisBaixoEstoque = materiais?.filter(m => Number(m.estoque_atual) <= Number(m.estoque_minimo)).length || 0;

      // Carregar agendamentos próximos
      const { data: agendamentosData } = await supabase
        .from('agendamentos')
        .select('id, titulo, cliente, data_inicio, status, tipo')
        .eq('user_id', user.id)
        .gte('data_inicio', new Date().toISOString())
        .order('data_inicio', { ascending: true })
        .limit(5);

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
      setAgendamentos(agendamentosData || []);
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

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
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

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resumo Financeiro</CardTitle>
                <Link to="/despesas">
                  <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                    Ver despesas
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtros de Data */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio" className="text-xs font-medium flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      Data Início
                    </Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataFim" className="text-xs font-medium">
                      Data Fim
                    </Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Receitas</p>
                    <p className="font-bold text-success">R$ {metrics.totalReceitas.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                    <p className="font-bold text-destructive">R$ {metrics.totalDespesas.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Lucro</p>
                    <p className="font-bold text-primary">
                      R$ {(metrics.totalReceitas - metrics.totalDespesas).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      {
                        name: 'Financeiro',
                        Receitas: metrics.totalReceitas,
                        Despesas: metrics.totalDespesas,
                        Lucro: metrics.totalReceitas - metrics.totalDespesas,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Legend />
                    <Bar dataKey="Receitas" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Lucro" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Agendamentos
              </CardTitle>
              <Link to="/planejamento">
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                  Ver todos
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {agendamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum agendamento próximo
              </p>
            ) : (
              <div className="space-y-3">
                {agendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{agendamento.titulo}</p>
                        {agendamento.cliente && (
                          <p className="text-xs text-muted-foreground">{agendamento.cliente}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(parseISO(agendamento.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(agendamento.data_inicio), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

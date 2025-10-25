import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, TrendingUp, DollarSign, FileText, Calendar } from "lucide-react";

interface RelatorioFinanceiro {
  receitas: number;
  despesas: number;
  lucro: number;
  orcamentosEmitidos: number;
  orcamentosAprovados: number;
  faturasEmitidas: number;
  faturasPagas: number;
  taxaConversao: number;
}

const Relatorios = () => {
  const [periodo, setPeriodo] = useState("mes");
  const [loading, setLoading] = useState(true);
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro>({
    receitas: 0,
    despesas: 0,
    lucro: 0,
    orcamentosEmitidos: 0,
    orcamentosAprovados: 0,
    faturasEmitidas: 0,
    faturasPagas: 0,
    taxaConversao: 0,
  });

  useEffect(() => {
    loadRelatorio();
  }, [periodo]);

  const loadRelatorio = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataInicio = getDataInicio(periodo);

      // Carregar orçamentos
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('valor_total, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dataInicio);

      // Carregar faturas
      const { data: faturas } = await supabase
        .from('faturas')
        .select('valor_total, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dataInicio);

      const orcamentosEmitidos = orcamentos?.length || 0;
      const orcamentosAprovados = orcamentos?.filter(o => o.status === 'Aprovado').length || 0;
      const faturasEmitidas = faturas?.length || 0;
      const faturasPagas = faturas?.filter(f => f.status === 'Paga').length || 0;
      const receitas = faturas?.filter(f => f.status === 'Paga').reduce((sum, f) => sum + Number(f.valor_total), 0) || 0;
      const despesas = 0; // Será implementado quando houver módulo de despesas
      const lucro = receitas - despesas;
      const taxaConversao = orcamentosEmitidos > 0 ? (orcamentosAprovados / orcamentosEmitidos) * 100 : 0;

      setRelatorio({
        receitas,
        despesas,
        lucro,
        orcamentosEmitidos,
        orcamentosAprovados,
        faturasEmitidas,
        faturasPagas,
        taxaConversao,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDataInicio = (periodo: string) => {
    const hoje = new Date();
    switch (periodo) {
      case 'semana':
        return new Date(hoje.setDate(hoje.getDate() - 7)).toISOString();
      case 'mes':
        return new Date(hoje.setMonth(hoje.getMonth() - 1)).toISOString();
      case 'trimestre':
        return new Date(hoje.setMonth(hoje.getMonth() - 3)).toISOString();
      case 'ano':
        return new Date(hoje.setFullYear(hoje.getFullYear() - 1)).toISOString();
      default:
        return new Date(hoje.setMonth(hoje.getMonth() - 1)).toISOString();
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">Análise detalhada do desempenho do seu negócio</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="mes">Último Mês</SelectItem>
                <SelectItem value="trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ano">Último Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resumo">
              <BarChart className="mr-2 h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="receitas">
              <DollarSign className="mr-2 h-4 w-4" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="orcamentos">
              <FileText className="mr-2 h-4 w-4" />
              Orçamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-success">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    R$ {relatorio.receitas.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {relatorio.faturasPagas} faturas pagas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-destructive">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">
                    R$ {relatorio.despesas.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Em desenvolvimento
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Lucro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    R$ {relatorio.lucro.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Receitas - Despesas
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance de Vendas</CardTitle>
                <CardDescription>Análise de conversão e desempenho</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Orçamentos Emitidos</span>
                      <span className="font-bold">{relatorio.orcamentosEmitidos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Orçamentos Aprovados</span>
                      <span className="font-bold text-success">{relatorio.orcamentosAprovados}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                      <span className="font-bold text-primary">{relatorio.taxaConversao.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Faturas Emitidas</span>
                      <span className="font-bold">{relatorio.faturasEmitidas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Faturas Pagas</span>
                      <span className="font-bold text-success">{relatorio.faturasPagas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Faturas Pendentes</span>
                      <span className="font-bold text-accent">
                        {relatorio.faturasEmitidas - relatorio.faturasPagas}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receitas">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Receitas</CardTitle>
                <CardDescription>Análise detalhada das receitas por período</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gráficos e análises detalhadas serão implementados em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orcamentos">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Orçamentos</CardTitle>
                <CardDescription>Desempenho e conversão de orçamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gráficos e análises detalhadas serão implementados em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, DollarSign, FileText, Calendar, Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface Transacao {
  id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  categoria: string;
  valor: number;
  status: string;
}

interface OrcamentoDetalhado {
  id: string;
  numero: string;
  data: string;
  cliente: string;
  titulo: string;
  valor: number;
  status: string;
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
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [orcamentosDetalhados, setOrcamentosDetalhados] = useState<OrcamentoDetalhado[]>([]);

  useEffect(() => {
    loadRelatorio();
  }, [periodo]);

  const loadRelatorio = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataInicio = getDataInicio(periodo);

      // Carregar orçamentos detalhados
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('id, numero, titulo, valor_total, status, created_at, cliente_id, clientes(nome)')
        .eq('user_id', user.id)
        .gte('created_at', dataInicio)
        .order('created_at', { ascending: false });

      // Carregar faturas com clientes
      const { data: faturas } = await supabase
        .from('faturas')
        .select('id, numero, titulo, valor_total, status, created_at, cliente_id, clientes(nome)')
        .eq('user_id', user.id)
        .gte('created_at', dataInicio);

      // Carregar despesas
      const { data: despesasData } = await supabase
        .from('despesas')
        .select('id, descricao, categoria, valor, data, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dataInicio);

      // Carregar receitas diversas
      const { data: receitasData } = await supabase
        .from('receitas')
        .select('id, descricao, categoria, valor, data, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dataInicio);

      const orcamentosEmitidos = orcamentos?.length || 0;
      const orcamentosAprovados = orcamentos?.filter(o => o.status === 'Aprovado').length || 0;
      const faturasEmitidas = faturas?.length || 0;
      const faturasPagas = faturas?.filter(f => f.status === 'Pago').length || 0;
      const receitasFaturas = faturas?.filter(f => f.status === 'Pago').reduce((sum, f) => sum + Number(f.valor_total), 0) || 0;
      const receitasDiversas = receitasData?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
      const receitas = receitasFaturas + receitasDiversas;
      const despesas = despesasData?.reduce((sum, d) => sum + Number(d.valor), 0) || 0;
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

      // Preparar transações (entradas e saídas)
      const transacoesArray: Transacao[] = [];
      
      // Adicionar faturas pagas como entradas
      faturas?.filter(f => f.status === 'Pago').forEach(fatura => {
        transacoesArray.push({
          id: fatura.id,
          data: new Date(fatura.created_at).toLocaleDateString('pt-BR'),
          tipo: 'entrada',
          descricao: fatura.titulo,
          categoria: `Fatura ${fatura.numero}`,
          valor: Number(fatura.valor_total),
          status: fatura.status
        });
      });

      // Adicionar receitas diversas como entradas
      receitasData?.forEach(receita => {
        transacoesArray.push({
          id: receita.id,
          data: new Date(receita.data).toLocaleDateString('pt-BR'),
          tipo: 'entrada',
          descricao: receita.descricao,
          categoria: receita.categoria,
          valor: Number(receita.valor),
          status: 'Recebido'
        });
      });

      // Adicionar despesas como saídas
      despesasData?.forEach(despesa => {
        transacoesArray.push({
          id: despesa.id,
          data: new Date(despesa.data).toLocaleDateString('pt-BR'),
          tipo: 'saida',
          descricao: despesa.descricao,
          categoria: despesa.categoria,
          valor: Number(despesa.valor),
          status: 'Pago'
        });
      });

      // Ordenar por data (mais recentes primeiro)
      transacoesArray.sort((a, b) => {
        const dataA = a.data.split('/').reverse().join('');
        const dataB = b.data.split('/').reverse().join('');
        return dataB.localeCompare(dataA);
      });

      setTransacoes(transacoesArray);

      // Preparar orçamentos detalhados
      const orcamentosArray: OrcamentoDetalhado[] = orcamentos?.map(orc => ({
        id: orc.id,
        numero: orc.numero,
        data: new Date(orc.created_at).toLocaleDateString('pt-BR'),
        cliente: (orc.clientes as any)?.nome || 'Cliente não informado',
        titulo: orc.titulo,
        valor: Number(orc.valor_total),
        status: orc.status
      })) || [];

      setOrcamentosDetalhados(orcamentosArray);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
      case 'Pago':
        return 'bg-success/10 text-success hover:bg-success/20';
      case 'Pendente':
        return 'bg-accent/10 text-accent hover:bg-accent/20';
      case 'Recusado':
      case 'Cancelado':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const imprimirReceitas = () => {
    window.print();
  };

  const exportarReceitasPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Receitas e Despesas', 14, 20);
    doc.setFontSize(11);
    doc.text(`Período: ${periodo}`, 14, 28);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);

    const tableData = transacoes.map(t => [
      t.data,
      t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      t.descricao,
      t.categoria,
      `R$ ${t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      t.status
    ]);

    autoTable(doc, {
      head: [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Status']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`receitas-despesas-${new Date().getTime()}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  const imprimirOrcamentos = () => {
    window.print();
  };

  const exportarOrcamentosPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Orçamentos', 14, 20);
    doc.setFontSize(11);
    doc.text(`Período: ${periodo}`, 14, 28);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);

    const tableData = orcamentosDetalhados.map(o => [
      o.numero,
      o.data,
      o.cliente,
      o.titulo,
      `R$ ${o.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      o.status
    ]);

    autoTable(doc, {
      head: [['Número', 'Data', 'Cliente', 'Título', 'Valor', 'Status']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`orcamentos-${new Date().getTime()}.pdf`);
    toast.success('PDF exportado com sucesso!');
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Receitas e Despesas</CardTitle>
                    <CardDescription>Todas as entradas e saídas de dinheiro</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={imprimirReceitas}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarReceitasPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transacoes.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transacoes.map((transacao) => (
                          <TableRow key={transacao.id}>
                            <TableCell>{transacao.data}</TableCell>
                            <TableCell>
                              <Badge variant={transacao.tipo === 'entrada' ? 'default' : 'secondary'}>
                                {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{transacao.descricao}</TableCell>
                            <TableCell>{transacao.categoria}</TableCell>
                            <TableCell className={`text-right font-semibold ${
                              transacao.tipo === 'entrada' ? 'text-success' : 'text-destructive'
                            }`}>
                              {transacao.tipo === 'entrada' ? '+' : '-'} R$ {transacao.valor.toLocaleString('pt-BR', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transacao.status)}>
                                {transacao.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma transação encontrada no período selecionado.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orcamentos">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lista de Orçamentos</CardTitle>
                    <CardDescription>Todos os orçamentos com detalhes completos</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={imprimirOrcamentos}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarOrcamentosPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {orcamentosDetalhados.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orcamentosDetalhados.map((orcamento) => (
                          <TableRow key={orcamento.id}>
                            <TableCell className="font-medium">{orcamento.numero}</TableCell>
                            <TableCell>{orcamento.data}</TableCell>
                            <TableCell>{orcamento.cliente}</TableCell>
                            <TableCell>{orcamento.titulo}</TableCell>
                            <TableCell className="text-right font-semibold">
                              R$ {orcamento.valor.toLocaleString('pt-BR', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(orcamento.status)}>
                                {orcamento.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum orçamento encontrado no período selecionado.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;

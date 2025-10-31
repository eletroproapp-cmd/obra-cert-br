import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Clock, Calendar, FileDown, FileSpreadsheet, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TimesheetForm } from "@/components/timesheets/TimesheetForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Timesheet {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  horas_totais: number;
  tipo_trabalho: string;
  descricao: string;
  aprovado: boolean;
  funcionario_id: string;
  funcionarios: {
    nome: string;
  };
  projetos: {
    nome: string;
  } | null;
}

interface Funcionario {
  id: string;
  nome: string;
}

const Timesheets = () => {
  const [registros, setRegistros] = useState<Timesheet[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("todos");

  useEffect(() => {
    loadFuncionarios();
    loadRegistros();
  }, [selectedMonth, selectedFuncionario]);

  const loadFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar funcionários: ' + error.message);
    }
  };

  const loadRegistros = async () => {
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      let query = supabase
        .from('timesheet_registros')
        .select(`
          *,
          funcionarios:funcionario_id (nome),
          projetos:projeto_id (nome)
        `)
        .gte('data', startOfMonth.toISOString().split('T')[0])
        .lte('data', endOfMonth.toISOString().split('T')[0]);

      if (selectedFuncionario !== "todos") {
        query = query.eq('funcionario_id', selectedFuncionario);
      }

      const { data, error } = await query.order('data', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar registros: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingId(undefined);
    loadRegistros();
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const exportToExcel = () => {
    const funcionarioNome = selectedFuncionario === "todos" 
      ? "Todos os Funcionários" 
      : funcionarios.find(f => f.id === selectedFuncionario)?.nome || "";

    const headerData = [
      ['FOLHA DE PONTO'],
      ['Funcionário:', funcionarioNome],
      ['Período:', format(selectedMonth, 'MMMM/yyyy', { locale: ptBR })],
      ['Total de Horas:', totalHoras.toFixed(2) + 'h'],
      ['Horas Aprovadas:', horasAprovadas.toFixed(2) + 'h'],
      [],
    ];

    const tableData = registros.map(r => ({
      'Data': format(new Date(r.data), 'dd/MM/yyyy'),
      'Funcionário': r.funcionarios.nome,
      'Projeto': r.projetos?.nome || 'Sem projeto',
      'Hora Início': r.hora_inicio,
      'Hora Fim': r.hora_fim,
      'Total Horas': r.horas_totais.toFixed(2),
      'Tipo': r.tipo_trabalho,
      'Descrição': r.descricao || '',
      'Status': r.aprovado ? 'Aprovado' : 'Pendente'
    }));

    const ws = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.sheet_add_json(ws, tableData, { origin: -1 });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Folha de Ponto');
    
    const fileName = `folha-ponto-${selectedFuncionario === "todos" ? "geral" : funcionarioNome.replace(/\s/g, '-')}-${format(selectedMonth, 'MM-yyyy')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Exportado para Excel com sucesso!');
  };

  const exportToPDF = async () => {
    try {
      // Carregar informações da empresa para adicionar marca d'água
      const { data: { user } } = await supabase.auth.getUser();
      let ocultarMarca = false;
      
      if (user) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('ocultar_marca_eletropro')
          .eq('user_id', user.id)
          .single();
        
        if (empresaData) {
          ocultarMarca = empresaData.ocultar_marca_eletropro || false;
        }
      }

      const doc = new jsPDF();
      const funcionarioNome = selectedFuncionario === "todos" 
        ? "Todos os Funcionários" 
        : funcionarios.find(f => f.id === selectedFuncionario)?.nome || "";
      
      doc.setFontSize(18);
      doc.text('FOLHA DE PONTO', 14, 15);
      
      doc.setFontSize(12);
      doc.text(`Funcionário: ${funcionarioNome}`, 14, 25);
      doc.text(`Período: ${format(selectedMonth, 'MMMM/yyyy', { locale: ptBR })}`, 14, 32);
      
      doc.setFontSize(10);
      doc.text(`Total de Horas: ${totalHoras.toFixed(2)}h`, 14, 39);
      doc.text(`Horas Aprovadas: ${horasAprovadas.toFixed(2)}h`, 14, 45);
      
      const tableData = registros.map(r => [
        format(new Date(r.data), 'dd/MM/yyyy'),
        r.funcionarios.nome,
        r.projetos?.nome || 'Sem projeto',
        `${r.hora_inicio} - ${r.hora_fim}`,
        r.horas_totais.toFixed(2),
        r.tipo_trabalho,
        r.aprovado ? 'Aprovado' : 'Pendente'
      ]);

      autoTable(doc, {
        startY: 52,
        head: [['Data', 'Funcionário', 'Projeto', 'Horário', 'Horas', 'Tipo', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 8 },
        didDrawPage: function (data) {
          // Adicionar marca d'água no rodapé de cada página
          if (!ocultarMarca) {
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(6);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('Powered by EletroPro', doc.internal.pageSize.getWidth() / 2, pageHeight - 5, { align: 'center' });
          }
        }
      });

      const fileName = `folha-ponto-${selectedFuncionario === "todos" ? "geral" : funcionarioNome.replace(/\s/g, '-')}-${format(selectedMonth, 'MM-yyyy')}.pdf`;
      doc.save(fileName);
      toast.success('Exportado para PDF com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF: ' + error.message);
    }
  };

  const totalHoras = registros.reduce((sum, r) => sum + (r.horas_totais || 0), 0);
  const horasAprovadas = registros.filter(r => r.aprovado).reduce((sum, r) => sum + (r.horas_totais || 0), 0);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Folhas de Ponto</h1>
            <p className="text-muted-foreground">Registro e controle de horas trabalhadas</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filtro de Mês */}
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[140px] justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
              <SelectTrigger className="w-[200px]">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Funcionários</SelectItem>
                {funcionarios.map((func) => (
                  <SelectItem key={func.id} value={func.id}>
                    {func.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="default" onClick={exportToExcel} disabled={registros.length === 0}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="default" onClick={exportToPDF} disabled={registros.length === 0}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="hero" size="default" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalHoras.toFixed(2)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-success/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Horas Aprovadas</CardTitle>
              <div className="p-2 bg-success/10 rounded-full">
                <Clock className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{horasAprovadas.toFixed(2)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((horasAprovadas / totalHoras) * 100 || 0).toFixed(0)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <div className="p-2 bg-accent/10 rounded-full">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{registros.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Entradas no mês</p>
            </CardContent>
          </Card>
        </div>

        {registros.length === 0 ? (
          <Card className="text-center p-12 shadow-lg">
            <div className="p-4 bg-muted/50 rounded-full inline-block mb-4">
              <Clock className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece criando o primeiro registro de horas para {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </p>
            <Button variant="hero" size="lg" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Criar Primeiro Registro
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {registros.map((registro) => (
              <Card
                key={registro.id}
                className="border-border hover:border-primary/50 shadow-soft hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleEdit(registro.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(registro.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${registro.aprovado ? 'bg-success/20 text-success' : 'bg-amber-500/20 text-amber-600'}`}>
                      {registro.aprovado ? '✓ Aprovado' : '⏳ Pendente'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-4 gap-4 pb-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Funcionário</p>
                      <p className="font-semibold text-sm">{registro.funcionarios.nome}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Projeto</p>
                      <p className="font-semibold text-sm">{registro.projetos?.nome || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Horário</p>
                      <p className="font-semibold text-sm">{registro.hora_inicio} → {registro.hora_fim}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Total de Horas</p>
                      <p className="text-xl font-bold text-primary">{registro.horas_totais.toFixed(2)}h</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Tipo:</span>
                      <span className="text-sm font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {registro.tipo_trabalho}
                      </span>
                    </div>
                    {registro.descricao && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{registro.descricao}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingId(undefined);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Registro' : 'Novo Registro de Horas'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Edite as informações do registro de horas' : 'Preencha os dados para criar um novo registro de horas'}
            </DialogDescription>
          </DialogHeader>
          <TimesheetForm onSuccess={handleSuccess} registroId={editingId} />
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default Timesheets;

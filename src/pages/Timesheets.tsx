import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TimesheetForm } from "@/components/timesheets/TimesheetForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Timesheet {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  horas_totais: number;
  tipo_trabalho: string;
  descricao: string;
  aprovado: boolean;
  funcionarios: {
    nome: string;
  };
  instalacoes: {
    titulo: string;
  } | null;
}

const Timesheets = () => {
  const [registros, setRegistros] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadRegistros();
  }, [selectedMonth]);

  const loadRegistros = async () => {
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('timesheet_registros')
        .select(`
          *,
          funcionarios:funcionario_id (nome),
          instalacoes:instalacao_id (titulo)
        `)
        .gte('data', startOfMonth.toISOString().split('T')[0])
        .lte('data', endOfMonth.toISOString().split('T')[0])
        .order('data', { ascending: false });

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

  const totalHoras = registros.reduce((sum, r) => sum + (r.horas_totais || 0), 0);
  const horasAprovadas = registros.filter(r => r.aprovado).reduce((sum, r) => sum + (r.horas_totais || 0), 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Folhas de Ponto</h1>
          <p className="text-muted-foreground">Registro de horas trabalhadas</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Novo Registro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoras.toFixed(2)}h</div>
            <p className="text-xs text-muted-foreground">
              {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Aprovadas</CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{horasAprovadas.toFixed(2)}h</div>
            <p className="text-xs text-muted-foreground">
              {((horasAprovadas / totalHoras) * 100 || 0).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registros.length}</div>
            <p className="text-xs text-muted-foreground">Entradas no mês</p>
          </CardContent>
        </Card>
      </div>

      {registros.length === 0 ? (
        <Card className="text-center p-12">
          <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Nenhum registro de horas neste mês</p>
          <Button variant="hero" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Registro
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registros.map((registro) => (
            <Card
              key={registro.id}
              className="border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
              onClick={() => handleEdit(registro.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(registro.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${registro.aprovado ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'}`}>
                    {registro.aprovado ? 'Aprovado' : 'Pendente'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Funcionário</p>
                    <p className="font-medium">{registro.funcionarios.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projeto</p>
                    <p className="font-medium">{registro.instalacoes?.titulo || 'Sem projeto'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{registro.hora_inicio} - {registro.hora_fim}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-primary">{registro.horas_totais.toFixed(2)}h</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Tipo: <span className="text-foreground font-medium">{registro.tipo_trabalho}</span></p>
                  {registro.descricao && (
                    <p className="text-sm mt-1 text-muted-foreground">{registro.descricao}</p>
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
          </DialogHeader>
          <TimesheetForm onSuccess={handleSuccess} registroId={editingId} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timesheets;

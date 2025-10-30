import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, CheckCircle2, Plus, Download, Share2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendamentoDialog } from "@/components/planejamento/AgendamentoDialog";
import { shareToCalendar } from "@/utils/calendar";
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

interface Agendamento {
  id: string;
  titulo: string;
  descricao: string | null;
  cliente: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  localizacao: string | null;
  status: string;
}

const Planejamento = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAgendamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data_inicio", { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendamentos();
  }, []);

  const getTodayAgendamentos = () => {
    return agendamentos.filter((ag) => isToday(new Date(ag.data_inicio)));
  };

  const getWeekAgendamentos = () => {
    const start = startOfWeek(new Date(), { locale: ptBR });
    const end = endOfWeek(new Date(), { locale: ptBR });
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayAgendamentos = agendamentos.filter((ag) =>
        isSameDay(new Date(ag.data_inicio), day)
      );
      return {
        day,
        agendamentos: dayAgendamentos,
      };
    });
  };

  const handleExportToCalendar = async (agendamento: Agendamento) => {
    const success = await shareToCalendar({
      titulo: agendamento.titulo,
      descricao: agendamento.descricao || undefined,
      localizacao: agendamento.localizacao || undefined,
      data_inicio: agendamento.data_inicio,
      data_fim: agendamento.data_fim,
    });

    if (success) {
      toast.success("Agendamento exportado para o calendário!");
    }
  };

  const handleEdit = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      toast.success("Agendamento excluído com sucesso!");
      loadAgendamentos();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "em_andamento":
        return Zap;
      case "concluido":
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "em_andamento":
        return "text-primary";
      case "concluido":
        return "text-success";
      case "cancelado":
        return "text-destructive";
      default:
        return "text-accent";
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      instalacao: "Instalação",
      manutencao: "Manutenção",
      vistoria: "Vistoria",
      outro: "Outro",
    };
    return labels[tipo] || tipo;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      agendado: "Agendado",
      em_andamento: "Em Andamento",
      concluido: "Concluído",
      cancelado: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Planejamento</h1>
          <p className="text-muted-foreground">
            Gerencie seus compromissos e exporte para a agenda do celular
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAgendamento(null);
            setDialogOpen(true);
          }}
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-border shadow-medium">
          <CardHeader>
            <CardTitle>Calendário de Compromissos</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: agendamentos.map((ag) => new Date(ag.data_inicio)),
              }}
              modifiersClassNames={{
                hasEvent: "bg-primary/10 font-bold",
              }}
            />
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="border-border shadow-medium">
          <CardHeader>
            <CardTitle>Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : getTodayAgendamentos().length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso para hoje
              </p>
            ) : (
              <div className="space-y-4">
                {getTodayAgendamentos().map((agendamento) => {
                  const StatusIcon = getStatusIcon(agendamento.status);
                  return (
                    <div
                      key={agendamento.id}
                      className="flex gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <StatusIcon
                        className={`h-5 w-5 mt-0.5 ${getStatusColor(
                          agendamento.status
                        )}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">
                            {agendamento.titulo}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {format(new Date(agendamento.data_inicio), "HH:mm")}
                          </span>
                        </div>
                        {agendamento.cliente && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {agendamento.cliente}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getStatusLabel(agendamento.status)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExportToCalendar(agendamento)}
                            className="h-6 px-2"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(agendamento)}
                            className="h-6 px-2"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirmDelete(agendamento.id)}
                            className="h-6 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Week View */}
      <Card className="mt-6 border-border shadow-medium">
        <CardHeader>
          <CardTitle>Visão Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[640px]">
              {getWeekAgendamentos().map(({ day, agendamentos: dayAgendamentos }) => (
                <div key={day.toISOString()} className="text-center min-w-[80px]">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
                    {format(day, "EEE", { locale: ptBR })}
                    <br />
                    <span className="text-xs">{format(day, "dd/MM")}</span>
                  </p>
                  <div className="space-y-1">
                    {dayAgendamentos.length === 0 ? (
                      <div className="p-1 md:p-2 text-xs text-muted-foreground">-</div>
                    ) : (
                      dayAgendamentos.slice(0, 3).map((ag) => (
                        <div
                          key={ag.id}
                          className="p-1 md:p-2 bg-primary/10 text-primary text-[10px] md:text-xs rounded cursor-pointer hover:bg-primary/20 transition-colors line-clamp-2"
                          onClick={() => handleEdit(ag)}
                        >
                          {getTipoLabel(ag.tipo)}
                        </div>
                      ))
                    )}
                    {dayAgendamentos.length > 3 && (
                      <div className="text-[10px] md:text-xs text-muted-foreground">
                        +{dayAgendamentos.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <AgendamentoDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAgendamento(null);
        }}
        onSuccess={loadAgendamentos}
        editData={editingAgendamento}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </DashboardLayout>
  );
};

export default Planejamento;

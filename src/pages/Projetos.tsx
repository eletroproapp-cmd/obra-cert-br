import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FolderOpen, MapPin, Calendar, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjetoForm } from "@/components/projetos/ProjetoForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface Projeto {
  id: string;
  nome: string;
  endereco_obra: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  status: string;
  clientes: {
    nome: string;
  } | null;
}

const statusLabels = {
  novo: "Novo",
  assinado: "Assinado",
  em_curso: "Em Curso",
  perdido: "Perdido"
};

const statusColors = {
  novo: "bg-blue-500/20 text-blue-600",
  assinado: "bg-green-500/20 text-green-600",
  em_curso: "bg-yellow-500/20 text-yellow-600",
  perdido: "bg-red-500/20 text-red-600"
};

const Projetos = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjetos();
  }, []);

  const loadProjetos = async () => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select(`
          *,
          clientes:cliente_id (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjetos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar projetos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingId(undefined);
    loadProjetos();
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      toast.success('Projeto excluído com sucesso!');
      loadProjetos();
    } catch (error: any) {
      toast.error('Erro ao excluir projeto: ' + error.message);
    } finally {
      setDeletingId(null);
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
            <h1 className="text-3xl font-bold mb-2">Projetos</h1>
            <p className="text-muted-foreground">Gerencie seus projetos e obras</p>
          </div>
          <Button variant="hero" size="lg" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Novo Projeto
          </Button>
        </div>

        {projetos.length === 0 ? (
          <Card className="text-center p-12">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Nenhum projeto cadastrado</p>
            <Button variant="hero" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Projeto
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projetos.map((projeto) => (
              <Card
                key={projeto.id}
                className="border-border shadow-soft hover:shadow-medium transition-all cursor-pointer relative group"
                onClick={() => handleEdit(projeto.id)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(projeto.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{projeto.nome}</span>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${statusColors[projeto.status as keyof typeof statusColors]}`}>
                      {statusLabels[projeto.status as keyof typeof statusLabels]}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{projeto.clientes?.nome || 'Sem cliente'}</p>
                  </div>
                  {projeto.endereco_obra && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{projeto.endereco_obra}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Início</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {projeto.data_inicio ? format(new Date(projeto.data_inicio), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Término</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {projeto.data_termino ? format(new Date(projeto.data_termino), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
            </DialogHeader>
            <ProjetoForm onSuccess={handleSuccess} projetoId={editingId} />
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.
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

export default Projetos;

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrcamentoForm } from "@/components/orcamentos/OrcamentoForm";
import { OrcamentoDialog } from "@/components/orcamentos/OrcamentoDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageLimitAlert } from "@/components/subscription/UsageLimitAlert";
import { PlanUpgradeDialog } from "@/components/subscription/PlanUpgradeDialog";

interface Orcamento {
  id: string;
  numero: string;
  titulo: string;
  status: string;
  valor_total: number;
  created_at: string;
  projeto_id: string | null;
  clientes: {
    nome: string;
  };
  projetos?: {
    id: string;
    nome: string;
    status: string;
  } | null;
}

const Orcamentos = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [progressByProjeto, setProgressByProjeto] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<string | null>(null);
  const [editingOrcamentoId, setEditingOrcamentoId] = useState<string | undefined>();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [deletingOrcamentoId, setDeletingOrcamentoId] = useState<string | null>(null);
  const { checkLimit, plan, refetch, getUsagePercentage } = useSubscription();

  useEffect(() => {
    loadOrcamentos();
  }, []);

  const loadOrcamentos = async () => {
    try {
      const [orcRes, etapasRes] = await Promise.all([
        supabase
          .from('orcamentos')
          .select(`
            id,
            numero,
            titulo,
            status,
            valor_total,
            created_at,
            projeto_id,
            clientes:cliente_id (nome),
            projetos:projeto_id (id, nome, status)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('projeto_etapas')
          .select('projeto_id, progresso')
      ]);

      if (orcRes.error) throw orcRes.error;
      if (etapasRes.error) throw etapasRes.error;

      setOrcamentos(orcRes.data || []);

      // Calcular progresso médio por projeto
      const progressMap = new Map<string, number>();
      const etapasAgrupadas = new Map<string, number[]>();
      
      (etapasRes.data || []).forEach((etapa: any) => {
        const projId = etapa.projeto_id;
        if (!etapasAgrupadas.has(projId)) {
          etapasAgrupadas.set(projId, []);
        }
        etapasAgrupadas.get(projId)!.push(Number(etapa.progresso));
      });

      etapasAgrupadas.forEach((progressos, projId) => {
        const avg = progressos.length > 0 
          ? Math.round(progressos.reduce((a, b) => a + b, 0) / progressos.length)
          : 0;
        progressMap.set(projId, avg);
      });

      setProgressByProjeto(progressMap);
    } catch (error: any) {
      toast.error('Erro ao carregar orçamentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrcamento = () => {
    const limitCheck = checkLimit('orcamentos_mes');
    
    if (!limitCheck.allowed) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingOrcamentoId(undefined);
    loadOrcamentos();
    refetch();
  };

  const handleEdit = () => {
    if (selectedOrcamento) {
      setEditingOrcamentoId(selectedOrcamento);
      setShowForm(true);
      setSelectedOrcamento(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrcamentoId) return;
    
    try {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', deletingOrcamentoId);

      if (error) throw error;

      toast.success('Orçamento excluído com sucesso!');
      setDeletingOrcamentoId(null);
      setSelectedOrcamento(null);
      loadOrcamentos();
      refetch();
    } catch (error: any) {
      toast.error('Erro ao excluir orçamento: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Aprovado': 'text-success',
      'Pendente': 'text-accent',
      'Rejeitado': 'text-destructive',
      'Em Análise': 'text-primary',
    };
    return colors[status as keyof typeof colors] || 'text-muted-foreground';
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
          <h1 className="text-3xl font-bold mb-2">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie seus orçamentos elétricos</p>
        </div>
        <Button variant="hero" size="lg" onClick={handleNewOrcamento}>
          <Plus className="mr-2 h-5 w-5" />
          Novo Orçamento
        </Button>
      </div>

      {/* Usage Limit Alert */}
      {plan && (
        <UsageLimitAlert
          resourceName="orçamentos este mês"
          current={checkLimit('orcamentos_mes').current}
          limit={checkLimit('orcamentos_mes').limit}
        />
      )}

      {orcamentos.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-muted-foreground mb-4">Nenhum orçamento criado ainda</p>
          <Button variant="hero" onClick={handleNewOrcamento}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Orçamento
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orcamentos.map((orcamento) => (
            <Card
              key={orcamento.id}
              className="border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
              onClick={() => setSelectedOrcamento(orcamento.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{orcamento.numero}</span>
                  <span className={`text-sm font-normal ${getStatusColor(orcamento.status)}`}>
                    {orcamento.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{orcamento.clientes.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">{orcamento.titulo}</p>
                    
                    {orcamento.projetos && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <span className="font-medium">{orcamento.projetos.nome}</span>
                          <span className="text-xs text-muted-foreground">• {orcamento.projetos.status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground min-w-[60px]">Progresso:</span>
                          <Progress 
                            value={progressByProjeto.get(orcamento.projetos.id) || 0} 
                            className="h-2 flex-1 max-w-[200px]" 
                          />
                          <span className="text-xs font-medium text-primary min-w-[35px]">
                            {progressByProjeto.get(orcamento.projetos.id) || 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {orcamento.valor_total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar orçamento */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingOrcamentoId(undefined);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrcamentoId ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
          </DialogHeader>
          <OrcamentoForm onSuccess={handleSuccess} orcamentoId={editingOrcamentoId} />
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar orçamento */}
      <OrcamentoDialog
        orcamentoId={selectedOrcamento}
        open={!!selectedOrcamento}
        onOpenChange={(open) => !open && setSelectedOrcamento(null)}
        onEdit={handleEdit}
        onDelete={() => setDeletingOrcamentoId(selectedOrcamento)}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingOrcamentoId} onOpenChange={(open) => !open && setDeletingOrcamentoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentPlan={plan?.plan_type || 'free'}
        blockedFeature="orçamentos"
      />
    </div>
    </DashboardLayout>
  );
};

export default Orcamentos;

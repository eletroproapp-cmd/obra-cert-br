import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
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
  clientes: {
    nome: string;
  };
}

const Orcamentos = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<string | null>(null);
  const [editingOrcamentoId, setEditingOrcamentoId] = useState<string | undefined>();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { checkLimit, plan, refetch, getUsagePercentage } = useSubscription();

  useEffect(() => {
    loadOrcamentos();
  }, []);

  const loadOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          id,
          numero,
          titulo,
          status,
          valor_total,
          created_at,
          clientes:cliente_id (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrcamentos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar orçamentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrcamento = () => {
    const limitCheck = checkLimit('orcamentos');
    
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
          current={checkLimit('orcamentos').current}
          limit={checkLimit('orcamentos').limit}
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
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{orcamento.clientes.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">{orcamento.titulo}</p>
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
      />

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

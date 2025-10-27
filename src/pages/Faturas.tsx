import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FaturaForm } from "@/components/faturas/FaturaForm";
import { FaturaDialog } from "@/components/faturas/FaturaDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageLimitAlert } from "@/components/subscription/UsageLimitAlert";
import { PlanUpgradeDialog } from "@/components/subscription/PlanUpgradeDialog";

interface Fatura {
  id: string;
  numero: string;
  titulo: string;
  status: string;
  valor_total: number;
  data_vencimento: string;
  created_at: string;
  clientes: {
    nome: string;
  };
}

const Faturas = () => {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<string | null>(null);
  const [editingFaturaId, setEditingFaturaId] = useState<string | undefined>();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { checkLimit, plan, refetch } = useSubscription();

  useEffect(() => {
    loadFaturas();
  }, []);

  const loadFaturas = async () => {
    try {
      const { data, error } = await supabase
        .from('faturas')
        .select(`
          id,
          numero,
          titulo,
          status,
          valor_total,
          data_vencimento,
          created_at,
          clientes:cliente_id (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFaturas(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar faturas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFatura = () => {
    const limitCheck = checkLimit('faturas');
    
    if (!limitCheck.allowed) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingFaturaId(undefined);
    loadFaturas();
    refetch();
  };

  const handleEdit = () => {
    if (selectedFatura) {
      setEditingFaturaId(selectedFatura);
      setShowForm(true);
      setSelectedFatura(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pago': 'text-success',
      'Pendente': 'text-accent',
      'Vencido': 'text-destructive',
      'Cancelado': 'text-muted-foreground',
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
          <h1 className="text-3xl font-bold mb-2">Faturas</h1>
          <p className="text-muted-foreground">Gerencie suas faturas e pagamentos</p>
        </div>
        <Button variant="hero" size="lg" onClick={handleNewFatura}>
          <Plus className="mr-2 h-5 w-5" />
          Nova Fatura
        </Button>
      </div>

      {/* Usage Limit Alert */}
      {plan && (
        <UsageLimitAlert
          resourceName="faturas este mês"
          current={checkLimit('faturas').current}
          limit={checkLimit('faturas').limit}
        />
      )}

      {faturas.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-muted-foreground mb-4">Nenhuma fatura criada ainda</p>
          <Button variant="hero" onClick={handleNewFatura}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeira Fatura
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {faturas.map((fatura) => (
            <Card
              key={fatura.id}
              className="border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
              onClick={() => setSelectedFatura(fatura.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{fatura.numero}</span>
                  <span className={`text-sm font-normal ${getStatusColor(fatura.status)}`}>
                    {fatura.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{fatura.clientes.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vencimento: {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold text-accent">
                      R$ {fatura.valor_total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar fatura */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingFaturaId(undefined);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaturaId ? 'Editar Fatura' : 'Nova Fatura'}</DialogTitle>
          </DialogHeader>
          <FaturaForm onSuccess={handleSuccess} faturaId={editingFaturaId} />
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar fatura */}
      <FaturaDialog
        faturaId={selectedFatura}
        open={!!selectedFatura}
        onOpenChange={(open) => !open && setSelectedFatura(null)}
        onEdit={handleEdit}
      />

      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentPlan={plan?.plan_type || 'free'}
        blockedFeature="faturas"
      />
    </div>
    </DashboardLayout>
  );
};

export default Faturas;

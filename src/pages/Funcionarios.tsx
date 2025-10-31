import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageLimitAlert } from "@/components/subscription/UsageLimitAlert";
import { PlanUpgradeDialog } from "@/components/subscription/PlanUpgradeDialog";
import { ViewModeToggle } from "@/components/shared/ViewModeToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  salario_hora: number;
  email: string;
  telefone: string;
  ativo: boolean;
  data_admissao: string;
}

const Funcionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { checkLimit, plan, refetch } = useSubscription();

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome');

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar funcionários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFuncionario = () => {
    const limitCheck = checkLimit('funcionarios');
    
    if (!limitCheck.allowed) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingId(undefined);
    loadFuncionarios();
    refetch();
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Funcionários</h1>
          <p className="text-muted-foreground text-sm">Gerencie sua equipe</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <Button variant="hero" size="sm" onClick={handleNewFuncionario}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Funcionário</span>
          </Button>
        </div>
      </div>

      {/* Usage Limit Alert */}
      {plan && (
        <UsageLimitAlert
          resourceName="funcionários"
          current={funcionarios.length}
          limit={checkLimit('funcionarios').limit}
        />
      )}

      {funcionarios.length === 0 ? (
        <Card className="text-center p-12">
          <UserCog className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Nenhum funcionário cadastrado</p>
          <Button variant="hero" onClick={handleNewFuncionario}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Funcionário
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {funcionarios.map((funcionario) => (
            <Card
              key={funcionario.id}
              className="border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
              onClick={() => handleEdit(funcionario.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{funcionario.nome}</span>
                  <span className={`text-xs px-2 py-1 rounded ${funcionario.ativo ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {funcionario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Cargo:</span> {funcionario.cargo || '-'}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span> {funcionario.email || '-'}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Telefone:</span> {funcionario.telefone || '-'}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    R$ {funcionario.salario_hora?.toFixed(2) || '0.00'}/hora
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Salário/Hora</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.map((funcionario) => (
                <TableRow 
                  key={funcionario.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(funcionario.id)}
                >
                  <TableCell className="font-medium">{funcionario.nome}</TableCell>
                  <TableCell>{funcionario.cargo || '-'}</TableCell>
                  <TableCell>{funcionario.email || '-'}</TableCell>
                  <TableCell>{funcionario.telefone || '-'}</TableCell>
                  <TableCell className="font-medium text-primary">
                    R$ {funcionario.salario_hora?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${funcionario.ativo ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {funcionario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingId(undefined);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Edite as informações do funcionário' : 'Preencha os dados para cadastrar um novo funcionário'}
            </DialogDescription>
          </DialogHeader>
          <FuncionarioForm onSuccess={handleSuccess} funcionarioId={editingId} />
        </DialogContent>
      </Dialog>

      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentPlan={plan?.plan_type || 'free'}
        blockedFeature="funcionários"
      />
    </div>
    </DashboardLayout>
  );
};

export default Funcionarios;

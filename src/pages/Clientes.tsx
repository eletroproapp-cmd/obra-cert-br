import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageLimitAlert } from "@/components/subscription/UsageLimitAlert";
import { PlanUpgradeDialog } from "@/components/subscription/PlanUpgradeDialog";
import { ViewModeToggle } from "@/components/shared/ViewModeToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
}

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { checkLimit, plan, refetch } = useSubscription();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) throw error;

      setClientes(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewClient = () => {
    const limitCheck = checkLimit('clientes');
    
    if (!limitCheck.allowed) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingCliente(null);
    loadClientes();
    refetch(); // Atualizar contadores de uso
  };

  const handleEdit = (clienteId: string) => {
    setEditingCliente(clienteId);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e contatos</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <Button variant="hero" size="lg" onClick={handleNewClient}>
            <Plus className="mr-2 h-5 w-5" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Usage Limit Alert */}
      {plan && (
        <UsageLimitAlert
          resourceName="clientes"
          current={clientes.length}
          limit={checkLimit('clientes').limit}
        />
      )}

      {clientes.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado ainda</p>
          <Button variant="hero" onClick={handleNewClient}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Cliente
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
                  onClick={() => handleEdit(cliente.id)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-lg">{cliente.nome}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{cliente.telefone}</span>
                    </div>
                  )}
                  {(cliente.cidade || cliente.estado) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{cliente.cidade}{cliente.cidade && cliente.estado ? ', ' : ''}{cliente.estado}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Localização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow 
                  key={cliente.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(cliente.id)}
                >
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell>{cliente.telefone || '-'}</TableCell>
                  <TableCell>
                    {cliente.cidade || cliente.estado 
                      ? `${cliente.cidade || ''}${cliente.cidade && cliente.estado ? ', ' : ''}${cliente.estado || ''}`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingCliente ? 'Edite as informações do cliente' : 'Preencha os dados para cadastrar um novo cliente'}
            </DialogDescription>
          </DialogHeader>
          <ClienteForm onSuccess={handleSuccess} clienteId={editingCliente} />
        </DialogContent>
      </Dialog>

      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentPlan={plan?.plan_type || 'free'}
        blockedFeature="clientes"
      />
    </div>
    </DashboardLayout>
  );
};

export default Clientes;

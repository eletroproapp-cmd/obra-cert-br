import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";

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

  const handleSuccess = () => {
    setShowForm(false);
    setEditingId(undefined);
    loadFuncionarios();
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
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie sua equipe</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Novo Funcionário
        </Button>
      </div>

      {funcionarios.length === 0 ? (
        <Card className="text-center p-12">
          <UserCog className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Nenhum funcionário cadastrado</p>
          <Button variant="hero" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Funcionário
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      )}

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingId(undefined);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>
          <FuncionarioForm onSuccess={handleSuccess} funcionarioId={editingId} />
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default Funcionarios;

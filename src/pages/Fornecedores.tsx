import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Building2, Phone, Mail, Package, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";

interface Fornecedor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  contato_nome: string | null;
}

const Fornecedores = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');

      if (error) throw error;

      setFornecedores(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar fornecedores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingFornecedor(null);
    loadFornecedores();
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setShowForm(true);
  };

  const handleNewFornecedor = () => {
    setEditingFornecedor(null);
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
          <h1 className="text-3xl font-bold mb-2">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores de materiais</p>
        </div>
        <Button variant="hero" size="lg" onClick={handleNewFornecedor}>
          <Plus className="mr-2 h-5 w-5" />
          Novo Fornecedor
        </Button>
      </div>

      {fornecedores.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-muted-foreground mb-4">Nenhum fornecedor cadastrado ainda</p>
          <Button variant="hero" onClick={handleNewFornecedor}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Fornecedor
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedores.map((fornecedor) => (
            <Card key={fornecedor.id} className="border-border shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="text-lg">{fornecedor.nome}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(fornecedor)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fornecedor.cnpj && (
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded">
                        CNPJ: {fornecedor.cnpj}
                      </div>
                    </div>
                  )}
                  {fornecedor.telefone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{fornecedor.telefone}</span>
                    </div>
                  )}
                  {fornecedor.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{fornecedor.email}</span>
                    </div>
                  )}
                  {fornecedor.contato_nome && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Contato: {fornecedor.contato_nome}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingFornecedor(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          </DialogHeader>
          <FornecedorForm fornecedor={editingFornecedor} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default Fornecedores;

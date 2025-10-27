import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClienteForm } from "@/components/clientes/ClienteForm";

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

  const handleSuccess = () => {
    setShowForm(false);
    loadClientes();
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
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e contatos</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Novo Cliente
        </Button>
      </div>

      {clientes.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado ainda</p>
          <Button variant="hero" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Cliente
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="border-border shadow-soft hover:shadow-medium transition-all">
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
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default Clientes;

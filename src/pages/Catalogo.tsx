import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Cable, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaterialForm } from "@/components/catalogo/MaterialForm";

interface Material {
  id: string;
  nome: string;
  categoria: string;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: string;
}

const Catalogo = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadMateriais();
  }, []);

  const loadMateriais = async () => {
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .order('nome');

      if (error) throw error;

      setMateriais(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar materiais: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    loadMateriais();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Catálogo de Materiais</h1>
          <p className="text-muted-foreground">Gerencie materiais elétricos e preços</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Adicionar Material
        </Button>
      </div>

      {materiais.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-muted-foreground mb-4">Nenhum material cadastrado ainda</p>
          <Button variant="hero" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Material
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materiais.map((material) => (
            <Card key={material.id} className="border-border shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cable className="h-5 w-5 text-primary" />
                  <span className="text-lg">{material.nome}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                      {material.categoria}
                    </div>
                    {material.estoque_atual <= material.estoque_minimo && (
                      <div className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Estoque Baixo
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Preço</p>
                    <p className="text-lg font-bold text-primary">
                      R$ {material.preco_venda.toFixed(2)}/{material.unidade}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Estoque</p>
                    <p className="font-medium">
                      {material.estoque_atual} {material.unidade}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Material</DialogTitle>
          </DialogHeader>
          <MaterialForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Catalogo;

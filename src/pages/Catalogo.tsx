import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Cable, AlertTriangle, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaterialForm } from "@/components/catalogo/MaterialForm";
import { ServicoForm } from "@/components/catalogo/ServicoForm";

interface Material {
  id: string;
  nome: string;
  categoria: string;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: string;
}

interface Servico {
  id: string;
  nome: string;
  categoria: string;
  preco_hora: number;
  tempo_estimado: number;
  unidade: string;
}

const Catalogo = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showServicoForm, setShowServicoForm] = useState(false);

  useEffect(() => {
    loadMateriais();
    loadServicos();
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

  const loadServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome');

      if (error) throw error;

      setServicos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar serviços: ' + error.message);
    }
  };

  const handleMaterialSuccess = () => {
    setShowMaterialForm(false);
    loadMateriais();
  };

  const handleServicoSuccess = () => {
    setShowServicoForm(false);
    loadServicos();
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
          <h1 className="text-3xl font-bold mb-2">Catálogo</h1>
          <p className="text-muted-foreground">Gerencie materiais e serviços</p>
        </div>
      </div>

      <Tabs defaultValue="materiais" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="materiais" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Materiais Elétricos</h2>
            <Button variant="hero" onClick={() => setShowMaterialForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Material
            </Button>
          </div>

          {materiais.length === 0 ? (
            <Card className="text-center p-12">
              <p className="text-muted-foreground mb-4">Nenhum material cadastrado ainda</p>
              <Button variant="hero" onClick={() => setShowMaterialForm(true)}>
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
        </TabsContent>

        <TabsContent value="servicos" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Serviços e Mão de Obra</h2>
            <Button variant="hero" onClick={() => setShowServicoForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </div>

          {servicos.length === 0 ? (
            <Card className="text-center p-12">
              <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado ainda</p>
              <Button variant="hero" onClick={() => setShowServicoForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Serviço
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicos.map((servico) => (
                <Card key={servico.id} className="border-border shadow-soft hover:shadow-medium transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      <span className="text-lg">{servico.nome}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded inline-block">
                        {servico.categoria}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Preço</p>
                        <p className="text-lg font-bold text-primary">
                          R$ {servico.preco_hora.toFixed(2)}/{servico.unidade}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Tempo Estimado</p>
                        <p className="font-medium">
                          {servico.tempo_estimado} {servico.unidade}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showMaterialForm} onOpenChange={setShowMaterialForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Material</DialogTitle>
          </DialogHeader>
          <MaterialForm onSuccess={handleMaterialSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showServicoForm} onOpenChange={setShowServicoForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
          </DialogHeader>
          <ServicoForm onSuccess={handleServicoSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Catalogo;

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Cable, AlertTriangle, Wrench, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaterialForm } from "@/components/catalogo/MaterialForm";
import { ServicoForm } from "@/components/catalogo/ServicoForm";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageLimitAlert } from "@/components/subscription/UsageLimitAlert";
import { PlanUpgradeDialog } from "@/components/subscription/PlanUpgradeDialog";

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
  const [editingMaterialId, setEditingMaterialId] = useState<string | undefined>();
  const [editingServicoId, setEditingServicoId] = useState<string | undefined>();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { checkLimit, plan, refetch } = useSubscription();

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

  const handleNewMaterial = () => {
    const limitCheck = checkLimit('materiais');
    
    if (!limitCheck.allowed) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setShowMaterialForm(true);
  };

  const handleMaterialSuccess = () => {
    setShowMaterialForm(false);
    setEditingMaterialId(undefined);
    loadMateriais();
    refetch();
  };

  const handleServicoSuccess = () => {
    setShowServicoForm(false);
    setEditingServicoId(undefined);
    loadServicos();
  };

  const loadExampleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Materiais de exemplo
      const materiais = [
        { nome: 'Fio Flexível 2,5mm²', codigo: 'FIO-2.5', categoria: 'Cabos e Fios', descricao: 'Fio flexível de cobre 2,5mm² para instalações residenciais', unidade: 'm', preco_custo: 2.50, preco_venda: 3.80, estoque_atual: 500, estoque_minimo: 100 },
        { nome: 'Fio Flexível 4mm²', codigo: 'FIO-4', categoria: 'Cabos e Fios', descricao: 'Fio flexível de cobre 4mm² para circuitos de maior potência', unidade: 'm', preco_custo: 4.20, preco_venda: 6.50, estoque_atual: 300, estoque_minimo: 80 },
        { nome: 'Fio Flexível 6mm²', codigo: 'FIO-6', categoria: 'Cabos e Fios', descricao: 'Fio flexível de cobre 6mm² para chuveiros e aquecedores', unidade: 'm', preco_custo: 7.50, preco_venda: 11.20, estoque_atual: 200, estoque_minimo: 50 },
        { nome: 'Cabo Flexível 10mm²', codigo: 'CABO-10', categoria: 'Cabos e Fios', descricao: 'Cabo flexível 10mm² para entrada de energia', unidade: 'm', preco_custo: 15.80, preco_venda: 24.50, estoque_atual: 150, estoque_minimo: 40 },
        { nome: 'Disjuntor 10A Unipolar', codigo: 'DJ-10A-1P', categoria: 'Proteção', descricao: 'Disjuntor termomagnético 10A unipolar curva C', unidade: 'un', preco_custo: 12.00, preco_venda: 18.50, estoque_atual: 50, estoque_minimo: 10 },
        { nome: 'Disjuntor 16A Unipolar', codigo: 'DJ-16A-1P', categoria: 'Proteção', descricao: 'Disjuntor termomagnético 16A unipolar curva C', unidade: 'un', preco_custo: 13.50, preco_venda: 20.00, estoque_atual: 40, estoque_minimo: 10 },
        { nome: 'Disjuntor 25A Bipolar', codigo: 'DJ-25A-2P', categoria: 'Proteção', descricao: 'Disjuntor termomagnético 25A bipolar curva C', unidade: 'un', preco_custo: 28.00, preco_venda: 42.00, estoque_atual: 30, estoque_minimo: 8 },
        { nome: 'DR 25A 30mA Bipolar', codigo: 'DR-25A-30', categoria: 'Proteção', descricao: 'Dispositivo diferencial residual 25A 30mA bipolar', unidade: 'un', preco_custo: 85.00, preco_venda: 128.00, estoque_atual: 20, estoque_minimo: 5 },
        { nome: 'Tomada 10A 2P+T', codigo: 'TOM-10A', categoria: 'Tomadas e Interruptores', descricao: 'Tomada padrão NBR 10A 2P+T', unidade: 'un', preco_custo: 8.50, preco_venda: 13.50, estoque_atual: 100, estoque_minimo: 20 },
        { nome: 'Tomada 20A 2P+T', codigo: 'TOM-20A', categoria: 'Tomadas e Interruptores', descricao: 'Tomada padrão NBR 20A 2P+T para ar-condicionado', unidade: 'un', preco_custo: 12.00, preco_venda: 18.50, estoque_atual: 60, estoque_minimo: 15 },
        { nome: 'Interruptor Simples', codigo: 'INT-SIMP', categoria: 'Tomadas e Interruptores', descricao: 'Interruptor simples 10A', unidade: 'un', preco_custo: 6.50, preco_venda: 10.00, estoque_atual: 80, estoque_minimo: 20 },
        { nome: 'Caixa de Luz 4x2', codigo: 'CX-4X2', categoria: 'Caixas e Eletrodutos', descricao: 'Caixa de embutir 4x2 polegadas', unidade: 'un', preco_custo: 1.80, preco_venda: 3.00, estoque_atual: 200, estoque_minimo: 40 },
        { nome: 'Eletroduto 3/4" PVC', codigo: 'ELET-3/4', categoria: 'Caixas e Eletrodutos', descricao: 'Eletroduto rígido PVC 3/4 polegada com 3 metros', unidade: 'un', preco_custo: 8.00, preco_venda: 12.50, estoque_atual: 100, estoque_minimo: 25 },
        { nome: 'Quadro de Distribuição 12 Disjuntores', codigo: 'QD-12', categoria: 'Quadros', descricao: 'Quadro de distribuição para 12 disjuntores DIN', unidade: 'un', preco_custo: 45.00, preco_venda: 72.00, estoque_atual: 15, estoque_minimo: 5 },
        { nome: 'Luminária LED 18W', codigo: 'LED-18W', categoria: 'Iluminação', descricao: 'Luminária LED 18W redonda branca sobrepor', unidade: 'un', preco_custo: 28.00, preco_venda: 45.00, estoque_atual: 40, estoque_minimo: 10 }
      ];

      const { error: matError } = await supabase
        .from('materiais')
        .insert(materiais.map(m => ({ ...m, user_id: user.id })));

      if (matError) throw matError;

      // Serviços de exemplo
      const servicos = [
        { nome: 'Instalação de Tomada', codigo: 'SV-TOM', categoria: 'Instalação', descricao: 'Instalação de tomada padrão NBR incluindo caixa e eletroduto', preco_hora: 65.00, tempo_estimado: 1.5, unidade: 'h', observacoes: 'Material não incluso' },
        { nome: 'Instalação de Interruptor', codigo: 'SV-INT', categoria: 'Instalação', descricao: 'Instalação de interruptor simples ou paralelo', preco_hora: 55.00, tempo_estimado: 1, unidade: 'h', observacoes: 'Material não incluso' },
        { nome: 'Instalação de Chuveiro Elétrico', codigo: 'SV-CHUV', categoria: 'Instalação', descricao: 'Instalação completa de chuveiro elétrico com disjuntor e fiação adequada', preco_hora: 180.00, tempo_estimado: 3, unidade: 'h', observacoes: 'Material não incluso' },
        { nome: 'Instalação de Ar-Condicionado (Parte Elétrica)', codigo: 'SV-AR', categoria: 'Instalação', descricao: 'Instalação da parte elétrica para ar-condicionado split', preco_hora: 280.00, tempo_estimado: 4, unidade: 'h', observacoes: 'Não inclui instalação refrigeração' },
        { nome: 'Montagem de Quadro de Distribuição', codigo: 'SV-QD', categoria: 'Montagem', descricao: 'Montagem completa de quadro de distribuição com disjuntores e DR', preco_hora: 220.00, tempo_estimado: 4, unidade: 'h', observacoes: 'Material não incluso' },
        { nome: 'Troca de Disjuntor', codigo: 'SV-DJ', categoria: 'Manutenção', descricao: 'Troca de disjuntor no quadro existente', preco_hora: 45.00, tempo_estimado: 0.5, unidade: 'h', observacoes: 'Material não incluso' },
        { nome: 'Instalação de Luminária', codigo: 'SV-LUM', categoria: 'Instalação', descricao: 'Instalação de luminária incluindo ponto elétrico', preco_hora: 65.00, tempo_estimado: 1.5, unidade: 'h', observacoes: 'Material não incluso' },
        { nome: 'Teste de Continuidade', codigo: 'SV-TEST', categoria: 'Inspeção', descricao: 'Teste completo de continuidade e isolação dos circuitos', preco_hora: 120.00, tempo_estimado: 2, unidade: 'h', observacoes: 'Inclui relatório' },
        { nome: 'Projeto Elétrico Residencial', codigo: 'SV-PROJ', categoria: 'Projeto', descricao: 'Projeto elétrico completo conforme NBR 5410', preco_hora: 850.00, tempo_estimado: 12, unidade: 'h', observacoes: 'Inclui memorial e plantas' }
      ];

      const { error: servError } = await supabase
        .from('servicos')
        .insert(servicos.map(s => ({ ...s, user_id: user.id })));

      if (servError) throw servError;

      toast.success('Dados de exemplo carregados com sucesso!');
      loadMateriais();
      loadServicos();
      refetch();
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    }
  };

  const handleEditMaterial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMaterialId(id);
    setShowMaterialForm(true);
  };

  const handleEditServico = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingServicoId(id);
    setShowServicoForm(true);
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
          <h1 className="text-3xl font-bold mb-2">Catálogo</h1>
          <p className="text-muted-foreground">Gerencie materiais e serviços</p>
        </div>
        {materiais.length === 0 && servicos.length === 0 && (
          <Button onClick={loadExampleData} variant="outline">
            Carregar Dados de Exemplo
          </Button>
        )}
      </div>

      <Tabs defaultValue="materiais" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="materiais" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Materiais Elétricos</h2>
            <Button variant="hero" onClick={handleNewMaterial}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Material
            </Button>
          </div>

          {/* Usage Limit Alert */}
          {plan && (
            <UsageLimitAlert
              resourceName="materiais no catálogo"
              current={materiais.length}
              limit={checkLimit('materiais').limit}
            />
          )}

          {materiais.length === 0 ? (
            <Card className="text-center p-12">
              <p className="text-muted-foreground mb-4">Nenhum material cadastrado ainda</p>
              <Button variant="hero" onClick={handleNewMaterial}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Material
              </Button>
            </Card>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiais.map((material) => (
                    <TableRow key={material.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Cable className="h-4 w-4 text-primary" />
                          <span className="font-medium">{material.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded inline-block">
                          {material.categoria}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {material.preco_venda.toFixed(2)}/{material.unidade}
                      </TableCell>
                      <TableCell>
                        {material.estoque_atual} {material.unidade}
                      </TableCell>
                      <TableCell>
                        {material.estoque_atual <= material.estoque_minimo ? (
                          <div className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Estoque Baixo
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">OK</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEditMaterial(material.id, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Tempo Estimado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicos.map((servico) => (
                    <TableRow key={servico.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-primary" />
                          <span className="font-medium">{servico.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded inline-block">
                          {servico.categoria}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {servico.preco_hora.toFixed(2)}/{servico.unidade}
                      </TableCell>
                      <TableCell>
                        {servico.tempo_estimado} {servico.unidade}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEditServico(servico.id, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showMaterialForm} onOpenChange={(open) => {
        setShowMaterialForm(open);
        if (!open) setEditingMaterialId(undefined);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaterialId ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          </DialogHeader>
          <MaterialForm onSuccess={handleMaterialSuccess} materialId={editingMaterialId} />
        </DialogContent>
      </Dialog>

      <Dialog open={showServicoForm} onOpenChange={(open) => {
        setShowServicoForm(open);
        if (!open) setEditingServicoId(undefined);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingServicoId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <ServicoForm onSuccess={handleServicoSuccess} servicoId={editingServicoId} />
        </DialogContent>
      </Dialog>

      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentPlan={plan?.plan_type || 'free'}
        blockedFeature="materiais"
      />
    </div>
    </DashboardLayout>
  );
};

export default Catalogo;

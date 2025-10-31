import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, Calendar, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Orcamento {
  id: string;
  numero: string;
  titulo: string;
  valor_total: number;
  status: string;
  created_at: string;
  cliente_id: string | null;
  clientes: {
    nome: string;
  } | null;
}

interface OrcamentoListTabProps {
  projetoId: string | null | undefined;
}

const statusColors: Record<string, string> = {
  Pendente: "bg-yellow-500/20 text-yellow-600",
  Aprovado: "bg-green-500/20 text-green-600",
  Rejeitado: "bg-red-500/20 text-red-600",
  "Em Análise": "bg-blue-500/20 text-blue-600",
};

export const OrcamentoListTab = ({ projetoId }: OrcamentoListTabProps) => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVincularDialog, setShowVincularDialog] = useState(false);
  const [orcamentosDisponiveis, setOrcamentosDisponiveis] = useState<Orcamento[]>([]);
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState<string>("");

  useEffect(() => {
    if (projetoId && projetoId !== "none") {
      loadOrcamentos();
    } else {
      setOrcamentos([]);
      setLoading(false);
    }
  }, [projetoId]);

  const loadOrcamentos = async () => {
    if (!projetoId || projetoId === "none") return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          clientes:cliente_id (nome)
        `)
        .eq("projeto_id", projetoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar orçamentos:", error);
      toast.error("Erro ao carregar orçamentos do projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleDesvincular = async (orcamentoId: string) => {
    try {
      const { error } = await supabase
        .from("orcamentos")
        .update({ projeto_id: null })
        .eq("id", orcamentoId);

      if (error) throw error;

      toast.success("Orçamento desvinculado do projeto");
      loadOrcamentos();
    } catch (error: any) {
      console.error("Erro ao desvincular orçamento:", error);
      toast.error("Erro ao desvincular orçamento");
    }
  };

  const loadOrcamentosDisponiveis = async () => {
    if (!projetoId || projetoId === "none") return;

    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          clientes:cliente_id (nome)
        `)
        .is("projeto_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrcamentosDisponiveis(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar orçamentos disponíveis:", error);
      toast.error("Erro ao carregar orçamentos disponíveis");
    }
  };

  const handleVincular = async () => {
    if (!selectedOrcamentoId) {
      toast.error("Selecione um orçamento");
      return;
    }

    try {
      const { error } = await supabase
        .from("orcamentos")
        .update({ projeto_id: projetoId })
        .eq("id", selectedOrcamentoId);

      if (error) throw error;

      toast.success("Orçamento vinculado ao projeto");
      setShowVincularDialog(false);
      setSelectedOrcamentoId("");
      loadOrcamentos();
    } catch (error: any) {
      console.error("Erro ao vincular orçamento:", error);
      toast.error("Erro ao vincular orçamento");
    }
  };

  if (!projetoId || projetoId === "none") {
    return (
      <Card className="text-center p-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Vincule orçamentos a este projeto</p>
        <p className="text-sm text-muted-foreground">
          {!projetoId ? "Salve o projeto primeiro para vincular orçamentos" : "Nenhum orçamento vinculado"}
        </p>
        {projetoId && (
          <Button
            className="mt-4"
            onClick={() => {
              loadOrcamentosDisponiveis();
              setShowVincularDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Vincular Orçamento
          </Button>
        )}
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orcamentos.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum orçamento vinculado a este projeto</p>
        <p className="text-sm text-muted-foreground mt-2">
          Vincule orçamentos a este projeto através da página de Orçamentos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Orçamentos Vinculados</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{orcamentos.length} orçamento(s)</Badge>
          <Button
            size="sm"
            onClick={() => {
              loadOrcamentosDisponiveis();
              setShowVincularDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Vincular Orçamento
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {orcamentos.map((orcamento) => (
          <Card key={orcamento.id} className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{orcamento.numero}</span>
                </div>
                <Badge className={statusColors[orcamento.status] || "bg-gray-500/20 text-gray-600"}>
                  {orcamento.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{orcamento.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  Cliente: {orcamento.clientes?.nome || "Sem cliente"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      R$ {orcamento.valor_total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(orcamento.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDesvincular(orcamento.id)}
                >
                  Desvincular
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showVincularDialog} onOpenChange={setShowVincularDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Orçamento ao Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orcamento">Selecione o Orçamento</Label>
              <Select value={selectedOrcamentoId} onValueChange={setSelectedOrcamentoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um orçamento" />
                </SelectTrigger>
                <SelectContent>
                  {orcamentosDisponiveis.map((orc) => (
                    <SelectItem key={orc.id} value={orc.id}>
                      {orc.numero} - {orc.titulo} (R$ {orc.valor_total.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVincularDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleVincular}>
                Vincular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

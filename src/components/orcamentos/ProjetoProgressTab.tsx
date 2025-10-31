import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface Etapa {
  id: string;
  etapa: string;
  progresso: number;
  ordem: number;
}

interface ProjetoProgressTabProps {
  projetoId: string | null | undefined;
}

export const ProjetoProgressTab = ({ projetoId }: ProjetoProgressTabProps) => {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projetoId && projetoId !== "none") {
      loadEtapas();
    } else {
      setEtapas([]);
      setLoading(false);
    }
  }, [projetoId]);

  const loadEtapas = async () => {
    if (!projetoId || projetoId === "none") return;
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check if etapas exist for this project
      const { data: existingEtapas, error: checkError } = await supabase
        .from("projeto_etapas")
        .select("*")
        .eq("projeto_id", projetoId)
        .order("ordem", { ascending: true });

      if (checkError) throw checkError;

      // If no etapas exist, create default ones
      if (!existingEtapas || existingEtapas.length === 0) {
        const defaultEtapas = [
          { etapa: "Projeto Elétrico", ordem: 1 },
          { etapa: "Aprovação na Concessionária", ordem: 2 },
          { etapa: "Compra de Materiais", ordem: 3 },
          { etapa: "Instalação de Eletrodutos", ordem: 4 },
          { etapa: "Passagem de Fiação", ordem: 5 },
          { etapa: "Instalação de Quadros", ordem: 6 },
          { etapa: "Instalação de Tomadas e Interruptores", ordem: 7 },
          { etapa: "Instalação de Luminárias", ordem: 8 },
          { etapa: "Teste e Energização", ordem: 9 },
          { etapa: "Vistoria Final", ordem: 10 },
        ];

        const { data: newEtapas, error: insertError } = await supabase
          .from("projeto_etapas")
          .insert(
            defaultEtapas.map(e => ({
              projeto_id: projetoId,
              user_id: user.id,
              etapa: e.etapa,
              ordem: e.ordem,
              progresso: 0,
            }))
          )
          .select();

        if (insertError) throw insertError;
        setEtapas(newEtapas || []);
      } else {
        setEtapas(existingEtapas);
      }
    } catch (error: any) {
      console.error("Erro ao carregar etapas:", error);
      toast.error("Erro ao carregar etapas do projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleProgressChange = async (etapaId: string, newProgress: number[]) => {
    const progress = newProgress[0];
    
    try {
      const { error } = await supabase
        .from("projeto_etapas")
        .update({ progresso: progress })
        .eq("id", etapaId);

      if (error) throw error;

      setEtapas(etapas.map(e => 
        e.id === etapaId ? { ...e, progresso: progress } : e
      ));
    } catch (error: any) {
      console.error("Erro ao atualizar progresso:", error);
      toast.error("Erro ao atualizar progresso da etapa");
    }
  };

  const calculateOverallProgress = () => {
    if (etapas.length === 0) return 0;
    const total = etapas.reduce((sum, e) => sum + e.progresso, 0);
    return Math.round(total / etapas.length);
  };

  if (!projetoId || projetoId === "none") {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Selecione um projeto para gerenciar o progresso da obra
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-lg font-semibold">Progresso Geral da Obra</Label>
            <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Individual Stages */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Etapas da Obra Elétrica</Label>
        {etapas.map((etapa) => (
          <Card key={etapa.id} className={etapa.progresso === 100 ? "border-success/50 bg-success/5" : ""}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {etapa.progresso === 100 && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    <Label className="font-medium">{etapa.etapa}</Label>
                  </div>
                  <span className="text-lg font-semibold text-primary">{etapa.progresso}%</span>
                </div>
                
                <Slider
                  value={[etapa.progresso]}
                  onValueChange={(value) => handleProgressChange(etapa.id, value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

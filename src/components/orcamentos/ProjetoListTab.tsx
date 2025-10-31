import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { ProjetoProgressTab } from "./ProjetoProgressTab";

interface Projeto {
  id: string;
  nome: string;
  status: string;
  endereco_obra?: string | null;
}

interface EtapaResumo {
  projeto_id: string;
  progresso: number;
}

interface ProjetoListTabProps {
  selectedProjetoId?: string;
  onSelectProjeto: (projetoId: string | "none") => void;
}

export const ProjetoListTab = ({ selectedProjetoId, onSelectProjeto }: ProjetoListTabProps) => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [etapas, setEtapas] = useState<EtapaResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [{ data: projData, error: projError }, { data: etapasData, error: etapasError }] = await Promise.all([
          supabase.from("projetos").select("id, nome, status, endereco_obra").order("nome"),
          supabase.from("projeto_etapas").select("projeto_id, progresso, id"),
        ]);
        if (projError) throw projError;
        if (etapasError) throw etapasError;
        setProjetos(projData || []);
        setEtapas((etapasData || []).map(e => ({ projeto_id: e.projeto_id as string, progresso: Number(e.progresso) })));
      } catch (err: any) {
        console.error("Erro ao carregar projetos/etapas:", err);
        toast.error("Erro ao carregar projetos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progressByProjeto = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    etapas.forEach(e => {
      const agg = map.get(e.projeto_id) || { sum: 0, count: 0 };
      agg.sum += e.progresso;
      agg.count += 1;
      map.set(e.projeto_id, agg);
    });
    const result = new Map<string, number>();
    projetos.forEach(p => {
      const agg = map.get(p.id);
      const avg = agg && agg.count > 0 ? Math.round(agg.sum / agg.count) : 0;
      result.set(p.id, avg);
    });
    return result;
  }, [etapas, projetos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Projetos</Label>
        {projetos.length === 0 ? (
          <div className="text-muted-foreground">Nenhum projeto encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projetos.map((p) => {
              const overall = progressByProjeto.get(p.id) ?? 0;
              const isLinked = selectedProjetoId && selectedProjetoId !== "none" && selectedProjetoId === p.id;
              return (
                <Card key={p.id} className={isLinked ? "border-primary/50" : undefined}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.nome}</CardTitle>
                      {isLinked ? (
                        <span className="text-xs text-primary">Vinculado</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted-foreground">{p.endereco_obra || "Sem endereço"} • {p.status}</div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Progresso</span>
                      <span className="text-sm font-medium text-primary">{overall}%</span>
                    </div>
                    <Progress value={overall} className="h-2" />
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant={isLinked ? "secondary" : "outline"}
                        onClick={() => onSelectProjeto(isLinked ? "none" : p.id)}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        {isLinked ? "Desvincular" : "Vincular ao orçamento"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedProjetoId && selectedProjetoId !== "none" ? (
        <div className="space-y-2">
          <Label className="text-lg font-semibold flex items-center gap-2">
            {projetos.find(p => p.id === selectedProjetoId)?.nome}
            <CheckCircle2 className="h-4 w-4 text-success" />
          </Label>
          <ProjetoProgressTab projetoId={selectedProjetoId} />
        </div>
      ) : null}
    </div>
  );
};

export default ProjetoListTab;

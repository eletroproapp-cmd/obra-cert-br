import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const assistenteSchema = z.object({
  checklistId: z.string().min(1, "Selecione um checklist"),
});

interface Sugestao {
  tipo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  norma_referencia: string;
  justificativa: string;
  valor_unitario?: number;
  valor_total?: number;
}

interface OrcamentoAssistenteProps {
  onComplete?: () => void;
}

export function OrcamentoAssistente({ onComplete }: OrcamentoAssistenteProps) {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(assistenteSchema),
  });

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      const { data, error } = await supabase
        .from("nbr5410_checklists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChecklists(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar checklists:", error);
      toast.error("Erro ao carregar checklists");
    }
  };

  const generateSugestoes = (checklist: any) => {
    const sugestoesGeradas: Sugestao[] = [];

    // Sugestões baseadas em cargas especiais
    if (checklist.tem_chuveiro) {
      sugestoesGeradas.push({
        tipo: "circuito",
        descricao: "Circuito dedicado para chuveiro elétrico 220V",
        quantidade: 1,
        unidade: "circuito",
        norma_referencia: "NBR 5410 (9.5.3)",
        justificativa: "Chuveiro elétrico requer circuito exclusivo",
      });
      
      sugestoesGeradas.push({
        tipo: "material",
        descricao: "Cabo flexível 4mm² (por metro)",
        quantidade: 20,
        unidade: "m",
        norma_referencia: "NBR 5410 (6.2.6)",
        justificativa: "Seção mínima para circuito de chuveiro",
        valor_unitario: 8.5,
        valor_total: 170,
      });

      sugestoesGeradas.push({
        tipo: "equipamento",
        descricao: "Disjuntor bipolar 40A curva C",
        quantidade: 1,
        unidade: "un",
        norma_referencia: "NBR 5410 (5.3)",
        justificativa: "Proteção para chuveiro 6800W (220V)",
        valor_unitario: 45,
        valor_total: 45,
      });
    }

    if (checklist.tem_ar_condicionado) {
      sugestoesGeradas.push({
        tipo: "circuito",
        descricao: "Circuito dedicado para ar condicionado",
        quantidade: 1,
        unidade: "circuito",
        norma_referencia: "NBR 5410 (9.5.3)",
        justificativa: "Ar condicionado requer circuito exclusivo",
      });

      sugestoesGeradas.push({
        tipo: "material",
        descricao: "Cabo flexível 2.5mm²",
        quantidade: 15,
        unidade: "m",
        norma_referencia: "NBR 5410 (6.2.6)",
        justificativa: "Seção para circuito AC até 12.000 BTU",
        valor_unitario: 5.8,
        valor_total: 87,
      });

      sugestoesGeradas.push({
        tipo: "equipamento",
        descricao: "Disjuntor monopolar 20A curva C",
        quantidade: 1,
        unidade: "un",
        norma_referencia: "NBR 5410 (5.3)",
        justificativa: "Proteção para AC 12.000 BTU",
        valor_unitario: 25,
        valor_total: 25,
      });
    }

    // Proteção DR para áreas molhadas (sempre obrigatório)
    sugestoesGeradas.push({
      tipo: "equipamento",
      descricao: "DR bipolar 40A 30mA",
      quantidade: 1,
      unidade: "un",
      norma_referencia: "NBR 5410 (5.1.3.2)",
      justificativa: "Proteção diferencial obrigatória para áreas molhadas",
      valor_unitario: 120,
      valor_total: 120,
    });

    // Quadro de distribuição básico
    sugestoesGeradas.push({
      tipo: "equipamento",
      descricao: "Quadro de distribuição 12 disjuntores",
      quantidade: 1,
      unidade: "un",
      norma_referencia: "NBR 5410 (6.5)",
      justificativa: "Distribuição organizada dos circuitos",
      valor_unitario: 180,
      valor_total: 180,
    });

    // Circuitos de tomadas (estimativa por cômodos)
    const numComodos = checklist.num_comodos || 5;
    const tomadas = Math.ceil(numComodos * 2.5); // ~2.5 tomadas por cômodo
    
    sugestoesGeradas.push({
      tipo: "material",
      descricao: "Tomada 2P+T 10A",
      quantidade: tomadas,
      unidade: "un",
      norma_referencia: "NBR 5410 (9.5.2)",
      justificativa: `Estimativa de ${tomadas} tomadas para ${numComodos} cômodos`,
      valor_unitario: 8,
      valor_total: tomadas * 8,
    });

    // Pontos de luz
    sugestoesGeradas.push({
      tipo: "material",
      descricao: "Interruptor simples",
      quantidade: numComodos,
      unidade: "un",
      norma_referencia: "NBR 5410 (9.5.2)",
      justificativa: `Iluminação para ${numComodos} cômodos`,
      valor_unitario: 6,
      valor_total: numComodos * 6,
    });

    // Aterramento
    sugestoesGeradas.push({
      tipo: "material",
      descricao: "Haste de aterramento 2,4m",
      quantidade: 1,
      unidade: "un",
      norma_referencia: "NBR 5410 (6.4)",
      justificativa: "Sistema de aterramento obrigatório",
      valor_unitario: 65,
      valor_total: 65,
    });

    return sugestoesGeradas;
  };

  const handleChecklistChange = async (checklistId: string) => {
    const checklist = checklists.find((c) => c.id === checklistId);
    setSelectedChecklist(checklist);
    
    if (checklist) {
      const sugestoesGeradas = generateSugestoes(checklist);
      setSugestoes(sugestoesGeradas);
    }
  };

  const salvarSugestoes = async () => {
    if (!selectedChecklist) return;

    setLoading(true);
    try {
      const sugestoesParaSalvar = sugestoes.map((s) => ({
        checklist_id: selectedChecklist.id,
        tipo: s.tipo,
        descricao: s.descricao,
        quantidade: s.quantidade,
        unidade: s.unidade,
        norma_referencia: s.norma_referencia,
        justificativa: s.justificativa,
        valor_unitario: s.valor_unitario,
        valor_total: s.valor_total,
      }));

      const { error } = await supabase
        .from("nbr5410_sugestoes")
        .insert(sugestoesParaSalvar);

      if (error) throw error;

      toast.success("Sugestões salvas com sucesso!");
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error("Erro ao salvar sugestões:", error);
      toast.error("Erro ao salvar sugestões: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = () => {
    return sugestoes.reduce((acc, s) => acc + (s.valor_total || 0), 0);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Assistente de Orçamento Elétrico
        </CardTitle>
        <CardDescription>
          Sugestões automáticas de materiais e circuitos baseadas no checklist NBR 5410
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="checklistId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecione um Checklist</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleChecklistChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um checklist existente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {checklists.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.tipo_imovel} - {new Date(c.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sugestoes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Sugestões Geradas</h4>
                  <Badge variant="secondary">
                    {sugestoes.length} {sugestoes.length === 1 ? "item" : "itens"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {sugestoes.map((sugestao, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {sugestao.tipo}
                              </Badge>
                              <h5 className="font-medium">{sugestao.descricao}</h5>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {sugestao.justificativa}
                            </p>
                            
                            <p className="text-xs text-muted-foreground">
                              Ref: {sugestao.norma_referencia}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-sm">
                                Qtd: {sugestao.quantidade} {sugestao.unidade}
                              </span>
                              {sugestao.valor_total && (
                                <span className="text-sm font-medium">
                                  R$ {sugestao.valor_total.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-lg font-semibold">Total Estimado:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {calcularTotal().toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={salvarSugestoes}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Salvando..." : "Salvar Sugestões"}
                  </Button>
                  
                  <Button type="button" variant="outline" disabled>
                    Adicionar ao Orçamento
                  </Button>
                </div>
              </div>
            )}

            {!selectedChecklist && (
              <div className="text-center py-8 text-muted-foreground">
                Selecione um checklist para gerar sugestões de orçamento
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

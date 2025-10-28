import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";

const checklistSchema = z.object({
  orcamento_id: z.string().optional(),
  tipo_imovel: z.string().min(1, "Tipo de imóvel é obrigatório"),
  cargas_especiais_customizadas: z.array(z.object({
    nome: z.string(),
    potencia: z.number(),
  })).optional(),
  area_total: z.coerce.number().positive().optional(),
  num_comodos: z.coerce.number().int().positive().optional(),
  tem_chuveiro: z.boolean().default(false),
  tem_ar_condicionado: z.boolean().default(false),
  tem_forno_eletrico: z.boolean().default(false),
  tem_aquecedor: z.boolean().default(false),
  tem_piscina: z.boolean().default(false),
  
  // Circuitos e proteção
  circuito_chuveiro_dedicado: z.boolean().default(false),
  circuito_ac_dedicado: z.boolean().default(false),
  secao_cabo_chuveiro_adequada: z.boolean().default(false),
  tem_dr_areas_molhadas: z.boolean().default(false),
  tomadas_areas_molhadas_dr: z.boolean().default(false),
  disjuntores_dimensionados: z.boolean().default(false),
  
  // Aterramento e equipotencialização
  aterramento_presente: z.boolean().default(false),
  equipotencializacao_banheiro: z.boolean().default(false),
  condutor_protecao_adequado: z.boolean().default(false),
  
  // Distribuição e quadros
  quadro_distribuicao_adequado: z.boolean().default(false),
  espaco_reserva_quadro: z.boolean().default(false),
  identificacao_circuitos: z.boolean().default(false),
  barramento_neutro_terra_separados: z.boolean().default(false),
  
  // Instalação e condutores
  secao_minima_iluminacao: z.boolean().default(false),
  secao_minima_tomadas: z.boolean().default(false),
  cores_condutores_padrao: z.boolean().default(false),
  eletrodutos_dimensionados: z.boolean().default(false),
  
  // Pontos de utilização
  tomadas_cozinha_suficientes: z.boolean().default(false),
  tomadas_banheiro_distancia: z.boolean().default(false),
  iluminacao_emergencia: z.boolean().default(false),
  
  // Proteção contra sobretensões
  protecao_surtos_presente: z.boolean().default(false),
  
  observacoes: z.string().optional(),
});

type ChecklistFormData = z.infer<typeof checklistSchema>;

interface ChecklistWizardProps {
  onComplete?: (checklistId: string) => void;
}

export function ChecklistWizard({ onComplete }: ChecklistWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [cargasCustomizadas, setCargasCustomizadas] = useState<Array<{ nome: string; potencia: number }>>([]);
  const [showCargaDialog, setShowCargaDialog] = useState(false);
  const [novaCarga, setNovaCarga] = useState({ nome: "", potencia: "" });
  const [orcamentos, setOrcamentos] = useState<any[]>([]);

  useEffect(() => {
    const loadOrcamentos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, numero, titulo")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar orçamentos:", error);
        return;
      }

      setOrcamentos(data || []);
    };

    loadOrcamentos();
  }, []);

  const form = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      orcamento_id: "",
      tipo_imovel: "",
      cargas_especiais_customizadas: [],
      tem_chuveiro: false,
      tem_ar_condicionado: false,
      tem_forno_eletrico: false,
      tem_aquecedor: false,
      tem_piscina: false,
      circuito_chuveiro_dedicado: false,
      circuito_ac_dedicado: false,
      tem_dr_areas_molhadas: false,
      secao_cabo_chuveiro_adequada: false,
      disjuntores_dimensionados: false,
      aterramento_presente: false,
      tomadas_areas_molhadas_dr: false,
      equipotencializacao_banheiro: false,
      condutor_protecao_adequado: false,
      quadro_distribuicao_adequado: false,
      espaco_reserva_quadro: false,
      identificacao_circuitos: false,
      barramento_neutro_terra_separados: false,
      secao_minima_iluminacao: false,
      secao_minima_tomadas: false,
      cores_condutores_padrao: false,
      eletrodutos_dimensionados: false,
      tomadas_cozinha_suficientes: false,
      tomadas_banheiro_distancia: false,
      iluminacao_emergencia: false,
      protecao_surtos_presente: false,
    },
  });

  const validateStep = async () => {
    const values = form.getValues();
    const newAlertas: string[] = [];

    // Validações básicas NBR 5410
    if (values.tem_chuveiro && !values.circuito_chuveiro_dedicado) {
      newAlertas.push("NBR 5410 (9.5.3): Chuveiro elétrico requer circuito dedicado");
    }
    
    if (values.tem_chuveiro && !values.secao_cabo_chuveiro_adequada) {
      newAlertas.push("NBR 5410 (6.2.6): Seção mínima de 4mm² para circuito de chuveiro");
    }

    if (values.tem_ar_condicionado && !values.circuito_ac_dedicado) {
      newAlertas.push("NBR 5410 (9.5.3): Ar condicionado requer circuito dedicado");
    }

    if (!values.tem_dr_areas_molhadas) {
      newAlertas.push("NBR 5410 (5.1.3.2): Proteção diferencial-residual (DR) obrigatória para áreas molhadas");
    }

    if (!values.tomadas_areas_molhadas_dr) {
      newAlertas.push("NBR 5410 (9.5.1): Tomadas em banheiros e cozinhas devem ter proteção DR de 30mA");
    }

    if (!values.aterramento_presente) {
      newAlertas.push("NBR 5410 (6.4): Sistema de aterramento é obrigatório em toda instalação");
    }

    if (!values.disjuntores_dimensionados) {
      newAlertas.push("NBR 5410 (5.3): Disjuntores devem ser dimensionados conforme corrente do circuito");
    }

    if (!values.equipotencializacao_banheiro) {
      newAlertas.push("NBR 5410 (6.4.2.2): Equipotencialização local obrigatória em banheiros");
    }

    if (!values.quadro_distribuicao_adequado) {
      newAlertas.push("NBR 5410 (6.5.4): Quadro de distribuição deve estar em local de fácil acesso");
    }

    if (!values.identificacao_circuitos) {
      newAlertas.push("NBR 5410 (6.5.4.10): Todos os circuitos devem estar identificados no quadro");
    }

    if (!values.secao_minima_iluminacao) {
      newAlertas.push("NBR 5410 (6.2.6): Seção mínima 1,5mm² para circuitos de iluminação");
    }

    if (!values.secao_minima_tomadas) {
      newAlertas.push("NBR 5410 (6.2.6): Seção mínima 2,5mm² para circuitos de tomadas");
    }

    if (!values.cores_condutores_padrao) {
      newAlertas.push("NBR 5410 (6.1.5.3): Cores dos condutores devem seguir o padrão (azul claro=neutro, verde/amarelo=terra)");
    }

    setAlertas(newAlertas);
    return newAlertas;
  };

  const onSubmit = async (data: ChecklistFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const validationAlertas = await validateStep();

      const checklistData = {
        circuito_chuveiro_dedicado: data.circuito_chuveiro_dedicado,
        circuito_ac_dedicado: data.circuito_ac_dedicado,
        tem_dr_areas_molhadas: data.tem_dr_areas_molhadas,
        secao_cabo_chuveiro_adequada: data.secao_cabo_chuveiro_adequada,
        disjuntores_dimensionados: data.disjuntores_dimensionados,
        aterramento_presente: data.aterramento_presente,
        tomadas_areas_molhadas_dr: data.tomadas_areas_molhadas_dr,
        equipotencializacao_banheiro: data.equipotencializacao_banheiro,
        condutor_protecao_adequado: data.condutor_protecao_adequado,
        quadro_distribuicao_adequado: data.quadro_distribuicao_adequado,
        espaco_reserva_quadro: data.espaco_reserva_quadro,
        identificacao_circuitos: data.identificacao_circuitos,
        barramento_neutro_terra_separados: data.barramento_neutro_terra_separados,
        secao_minima_iluminacao: data.secao_minima_iluminacao,
        secao_minima_tomadas: data.secao_minima_tomadas,
        cores_condutores_padrao: data.cores_condutores_padrao,
        eletrodutos_dimensionados: data.eletrodutos_dimensionados,
        tomadas_cozinha_suficientes: data.tomadas_cozinha_suficientes,
        tomadas_banheiro_distancia: data.tomadas_banheiro_distancia,
        iluminacao_emergencia: data.iluminacao_emergencia,
        protecao_surtos_presente: data.protecao_surtos_presente,
      };

      const { data: checklist, error } = await supabase
        .from("nbr5410_checklists")
        .insert({
          user_id: user.id,
          orcamento_id: data.orcamento_id || null,
          tipo_imovel: data.tipo_imovel,
          area_total: data.area_total,
          num_comodos: data.num_comodos,
          tem_chuveiro: data.tem_chuveiro,
          tem_ar_condicionado: data.tem_ar_condicionado,
          tem_forno_eletrico: data.tem_forno_eletrico,
          tem_aquecedor: data.tem_aquecedor,
          tem_piscina: data.tem_piscina,
          checklist_data: checklistData,
          alertas: validationAlertas,
          status: validationAlertas.length === 0 ? "concluido" : "em_andamento",
          observacoes: data.observacoes,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Checklist salvo com sucesso!");
      if (onComplete && checklist) {
        onComplete(checklist.id);
      }
    } catch (error: any) {
      console.error("Erro ao salvar checklist:", error);
      toast.error("Erro ao salvar checklist: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (step === 2) {
      await validateStep();
    }
    setStep(step + 1);
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Checklist de Conformidade NBR 5410</CardTitle>
        <CardDescription>
          Passo {step} de 3 - {step === 1 ? "Dados do Projeto" : step === 2 ? "Checklist Técnico" : "Validação"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Dados do Projeto */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="orcamento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vincular a um orçamento (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orcamentos.map((orc) => (
                            <SelectItem key={orc.id} value={orc.id}>
                              {orc.numero} - {orc.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_imovel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Imóvel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residencial">Residencial</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="area_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área Total (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="num_comodos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Cômodos</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <h4 className="font-semibold text-sm">Cargas Especiais</h4>
                  
                  <FormField
                    control={form.control}
                    name="tem_chuveiro"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Chuveiro Elétrico</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_ar_condicionado"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Ar Condicionado</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_forno_eletrico"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Forno Elétrico</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_aquecedor"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Aquecedor Elétrico</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_piscina"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Piscina</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Outras Cargas Especiais</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCargaDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Carga
                    </Button>
                  </div>
                  {cargasCustomizadas.length > 0 && (
                    <div className="space-y-2">
                      {cargasCustomizadas.map((carga, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{carga.nome}</p>
                            <p className="text-sm text-muted-foreground">{carga.potencia} kW</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const novasCargasCustomizadas = cargasCustomizadas.filter((_, i) => i !== index);
                              setCargasCustomizadas(novasCargasCustomizadas);
                              form.setValue("cargas_especiais_customizadas", novasCargasCustomizadas);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Checklist Técnico */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Circuitos e Proteção</h4>

                  <FormField
                    control={form.control}
                    name="circuito_chuveiro_dedicado"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Circuito dedicado para chuveiro</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (9.5.3)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secao_cabo_chuveiro_adequada"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Seção mínima 4mm² para chuveiro</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.2.6)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="circuito_ac_dedicado"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Circuito dedicado para ar condicionado</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (9.5.3)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_dr_areas_molhadas"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Proteção DR para áreas molhadas</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (5.1.3.2)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tomadas_areas_molhadas_dr"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Tomadas em banheiro/cozinha com DR 30mA</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (9.5.1)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disjuntores_dimensionados"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Disjuntores corretamente dimensionados</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (5.3)</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Aterramento e Equipotencialização</h4>

                  <FormField
                    control={form.control}
                    name="aterramento_presente"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Sistema de aterramento implementado</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.4)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="equipotencializacao_banheiro"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Equipotencialização local em banheiros</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.4.2.2)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condutor_protecao_adequado"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Condutor de proteção (PE) com seção adequada</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.4.3)</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Quadro de Distribuição</h4>

                  <FormField
                    control={form.control}
                    name="quadro_distribuicao_adequado"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Quadro em local acessível e ventilado</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.5.4)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="espaco_reserva_quadro"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Espaço de reserva de 15% no quadro</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.5.4.11)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="identificacao_circuitos"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Todos os circuitos identificados no quadro</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.5.4.10)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barramento_neutro_terra_separados"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Barramentos de neutro e terra separados</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.4.4.2)</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Condutores e Instalação</h4>

                  <FormField
                    control={form.control}
                    name="secao_minima_iluminacao"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Seção mínima 1,5mm² para iluminação</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.2.6)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secao_minima_tomadas"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Seção mínima 2,5mm² para tomadas</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.2.6)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cores_condutores_padrao"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Cores dos condutores conforme padrão</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.1.5.3) - Azul claro (neutro), Verde/Amarelo (terra)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eletrodutos_dimensionados"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Eletrodutos com taxa de ocupação ≤40%</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (6.2.11.3)</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Pontos de Utilização</h4>

                  <FormField
                    control={form.control}
                    name="tomadas_cozinha_suficientes"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Quantidade mínima de tomadas na cozinha</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (9.5.2) - 1 tomada a cada 3,5m de perímetro</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tomadas_banheiro_distancia"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Tomadas em banheiro a 60cm do box</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (9.1)</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="iluminacao_emergencia"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Iluminação de emergência (quando aplicável)</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (5.8.6) - Obrigatório em edificações comerciais</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Proteção Adicional</h4>

                  <FormField
                    control={form.control}
                    name="protecao_surtos_presente"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Dispositivo de proteção contra surtos (DPS)</FormLabel>
                          <p className="text-xs text-muted-foreground">NBR 5410 (5.4.2) - Recomendado para todas as instalações</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Validação e Observações */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Resultado da Validação</h4>
                  
                  {alertas.length === 0 ? (
                    <div className="flex items-start gap-2 p-4 bg-success/10 border border-success/20 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <p className="font-medium text-success">Checklist Aprovado!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Todos os itens de conformidade básica foram atendidos.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alertas.map((alerta, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">{alerta}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Técnicas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione observações sobre o projeto..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              
              {step < 3 ? (
                <Button type="button" onClick={nextStep} className="ml-auto">
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="ml-auto">
                  {loading ? "Salvando..." : "Salvar Checklist"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Dialog open={showCargaDialog} onOpenChange={setShowCargaDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Carga Especial</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome-carga">Nome da Carga</Label>
            <Input
              id="nome-carga"
              placeholder="Ex: Bomba de Água, Portão Elétrico"
              value={novaCarga.nome}
              onChange={(e) => setNovaCarga({ ...novaCarga, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="potencia-carga">Potência (kW)</Label>
            <Input
              id="potencia-carga"
              type="number"
              step="0.1"
              placeholder="Ex: 1.5"
              value={novaCarga.potencia}
              onChange={(e) => setNovaCarga({ ...novaCarga, potencia: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCargaDialog(false);
              setNovaCarga({ nome: "", potencia: "" });
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!novaCarga.nome || !novaCarga.potencia) {
                toast.error("Preencha todos os campos");
                return;
              }
              const potencia = parseFloat(novaCarga.potencia);
              if (isNaN(potencia) || potencia <= 0) {
                toast.error("Potência inválida");
                return;
              }
              const novasCargasCustomizadas = [...cargasCustomizadas, { nome: novaCarga.nome, potencia }];
              setCargasCustomizadas(novasCargasCustomizadas);
              form.setValue("cargas_especiais_customizadas", novasCargasCustomizadas);
              setShowCargaDialog(false);
              setNovaCarga({ nome: "", potencia: "" });
              toast.success("Carga adicionada com sucesso");
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

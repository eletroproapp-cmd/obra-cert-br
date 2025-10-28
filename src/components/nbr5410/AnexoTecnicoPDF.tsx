import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileDown, FileText } from "lucide-react";
import jsPDF from "jspdf";

interface Checklist {
  id: string;
  tipo_imovel: string;
  area_total: number | null;
  num_comodos: number | null;
  tem_chuveiro: boolean;
  tem_ar_condicionado: boolean;
  tem_forno_eletrico: boolean;
  tem_aquecedor: boolean;
  tem_piscina: boolean;
  checklist_data: any;
  alertas: any;
  status: string;
  observacoes: string | null;
  premissas_tecnicas: string | null;
  created_at: string;
}

export function AnexoTecnicoPDF() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    loadChecklists();
    loadEmpresa();
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

  const loadEmpresa = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setEmpresa(data);
    } catch (error: any) {
      console.error("Erro ao carregar dados da empresa:", error);
    }
  };

  const generatePDF = async () => {
    if (!selectedChecklistId) {
      toast.error("Selecione um checklist");
      return;
    }

    setLoading(true);
    try {
      const checklist = checklists.find((c) => c.id === selectedChecklistId);
      if (!checklist) throw new Error("Checklist não encontrado");

      // Buscar sugestões relacionadas
      const { data: sugestoes } = await supabase
        .from("nbr5410_sugestoes")
        .select("*")
        .eq("checklist_id", selectedChecklistId);

      const pdf = new jsPDF();
      let yPos = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const lineHeight = 7;
      const margin = 20;

      // Função auxiliar para adicionar nova página se necessário
      const checkPageBreak = (additionalSpace = 0) => {
        if (yPos + additionalSpace > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
      };

      // Cabeçalho
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("ANEXO TÉCNICO - NBR 5410", margin, yPos);
      yPos += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text("Instalações Elétricas de Baixa Tensão", margin, yPos);
      yPos += 15;

      // Dados da empresa (se disponível)
      if (empresa) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("Empresa:", margin, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(empresa.nome_fantasia || empresa.razao_social || "", margin + 25, yPos);
        yPos += lineHeight;

        if (empresa.cnpj) {
          pdf.setFont("helvetica", "bold");
          pdf.text("CNPJ:", margin, yPos);
          pdf.setFont("helvetica", "normal");
          pdf.text(empresa.cnpj, margin + 25, yPos);
          yPos += lineHeight;
        }
        yPos += 5;
      }

      // Data de geração
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, margin, yPos);
      yPos += 15;

      checkPageBreak(30);

      // Seção 1: Dados do Projeto
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("1. DADOS DO PROJETO", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Tipo de Imóvel: ${checklist.tipo_imovel}`, margin, yPos);
      yPos += lineHeight;

      if (checklist.area_total) {
        pdf.text(`Área Total: ${checklist.area_total} m²`, margin, yPos);
        yPos += lineHeight;
      }

      if (checklist.num_comodos) {
        pdf.text(`Número de Cômodos: ${checklist.num_comodos}`, margin, yPos);
        yPos += lineHeight;
      }

      yPos += 5;
      pdf.setFont("helvetica", "bold");
      pdf.text("Cargas Especiais:", margin, yPos);
      pdf.setFont("helvetica", "normal");
      yPos += lineHeight;

      const cargasEspeciais = [];
      if (checklist.tem_chuveiro) cargasEspeciais.push("Chuveiro Elétrico");
      if (checklist.tem_ar_condicionado) cargasEspeciais.push("Ar Condicionado");
      if (checklist.tem_forno_eletrico) cargasEspeciais.push("Forno Elétrico");
      if (checklist.tem_aquecedor) cargasEspeciais.push("Aquecedor Elétrico");
      if (checklist.tem_piscina) cargasEspeciais.push("Piscina");

      if (cargasEspeciais.length > 0) {
        cargasEspeciais.forEach((carga) => {
          pdf.text(`• ${carga}`, margin + 5, yPos);
          yPos += lineHeight;
        });
      } else {
        pdf.text("• Nenhuma carga especial identificada", margin + 5, yPos);
        yPos += lineHeight;
      }

      yPos += 10;
      checkPageBreak(50);

      // Seção 2: Checklist de Conformidade
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("2. CHECKLIST DE CONFORMIDADE NBR 5410", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      const checklistItems = [
        {
          label: "Circuito dedicado para chuveiro",
          value: checklist.checklist_data?.circuito_chuveiro_dedicado,
          ref: "NBR 5410 (9.5.3)",
        },
        {
          label: "Seção mínima 4mm² para chuveiro",
          value: checklist.checklist_data?.secao_cabo_chuveiro_adequada,
          ref: "NBR 5410 (6.2.6)",
        },
        {
          label: "Circuito dedicado para ar condicionado",
          value: checklist.checklist_data?.circuito_ac_dedicado,
          ref: "NBR 5410 (9.5.3)",
        },
        {
          label: "Proteção DR para áreas molhadas",
          value: checklist.checklist_data?.tem_dr_areas_molhadas,
          ref: "NBR 5410 (5.1.3.2)",
        },
        {
          label: "Tomadas em banheiro/cozinha com DR 30mA",
          value: checklist.checklist_data?.tomadas_areas_molhadas_dr,
          ref: "NBR 5410 (9.5.1)",
        },
        {
          label: "Sistema de aterramento implementado",
          value: checklist.checklist_data?.aterramento_presente,
          ref: "NBR 5410 (6.4)",
        },
        {
          label: "Disjuntores corretamente dimensionados",
          value: checklist.checklist_data?.disjuntores_dimensionados,
          ref: "NBR 5410 (5.3)",
        },
      ];

      checklistItems.forEach((item) => {
        checkPageBreak(15);
        const status = item.value ? "[✓]" : "[  ]";
        pdf.setFont("helvetica", "normal");
        pdf.text(`${status} ${item.label}`, margin, yPos);
        yPos += lineHeight;
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.text(`    ${item.ref}`, margin, yPos);
        yPos += lineHeight + 2;
        pdf.setFontSize(10);
      });

      yPos += 5;

      // Alertas de Não Conformidade
      const alertasArray = Array.isArray(checklist.alertas) ? checklist.alertas : [];
      if (alertasArray.length > 0) {
        checkPageBreak(30);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Alertas de Não Conformidade:", margin, yPos);
        yPos += 8;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        alertasArray.forEach((alerta: string) => {
          checkPageBreak(10);
          const lines = pdf.splitTextToSize(`• ${alerta}`, 170);
          lines.forEach((line: string) => {
            pdf.text(line, margin, yPos);
            yPos += lineHeight - 1;
          });
        });
        yPos += 5;
      }

      yPos += 10;
      checkPageBreak(50);

      // Seção 3: Premissas Técnicas
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("3. PREMISSAS TÉCNICAS ADOTADAS", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const premissasPadrao = [
        "• Tensão de alimentação: 220V (fase-fase) / 127V (fase-neutro)",
        "• Método de instalação: B1 (condutores em eletroduto aparente)",
        "• Temperatura ambiente: 30°C",
        "• Material dos condutores: Cobre",
        "• Isolação dos condutores: PVC 70°C",
        "• Queda de tensão admissível: 4% para instalação alimentada pela rede",
        "• Fator de potência considerado: 0,92",
        "• Tipo de fornecimento: Bifásico a 3 fios",
      ];

      if (checklist.premissas_tecnicas) {
        const linhasPremissas = pdf.splitTextToSize(checklist.premissas_tecnicas, 170);
        linhasPremissas.forEach((linha: string) => {
          checkPageBreak(10);
          pdf.text(linha, margin, yPos);
          yPos += lineHeight;
        });
      } else {
        premissasPadrao.forEach((premissa) => {
          checkPageBreak(10);
          pdf.text(premissa, margin, yPos);
          yPos += lineHeight;
        });
      }

      yPos += 10;
      checkPageBreak(50);

      // Seção 4: Memorial Descritivo
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("4. MEMORIAL DESCRITIVO", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const memorial = `Este projeto elétrico foi desenvolvido em conformidade com a NBR 5410 - Instalações Elétricas de Baixa Tensão.

A instalação elétrica prevista para este ${checklist.tipo_imovel} contempla todos os requisitos mínimos de segurança estabelecidos pela norma, incluindo:

- Dimensionamento adequado dos condutores conforme capacidade de condução de corrente
- Proteção contra sobrecorrentes e curtos-circuitos através de disjuntores termomagnéticos
- Proteção contra choques elétricos através de dispositivo DR (diferencial residual)
- Sistema de aterramento conforme especificações normativas
- Circuitos dedicados para cargas especiais quando aplicável
- Separação adequada de circuitos de iluminação e tomadas

Todos os materiais especificados devem atender às normas brasileiras aplicáveis e possuir certificação junto aos órgãos competentes.`;

      const linhasMemorial = pdf.splitTextToSize(memorial, 170);
      linhasMemorial.forEach((linha: string) => {
        checkPageBreak(10);
        pdf.text(linha, margin, yPos);
        yPos += lineHeight;
      });

      if (checklist.observacoes) {
        yPos += 5;
        checkPageBreak(15);
        pdf.setFont("helvetica", "bold");
        pdf.text("Observações Adicionais:", margin, yPos);
        yPos += lineHeight;
        pdf.setFont("helvetica", "normal");

        const linhasObs = pdf.splitTextToSize(checklist.observacoes, 170);
        linhasObs.forEach((linha: string) => {
          checkPageBreak(10);
          pdf.text(linha, margin, yPos);
          yPos += lineHeight;
        });
      }

      yPos += 15;
      checkPageBreak(50);

      // Seção 5: Lista de Materiais (se houver sugestões)
      if (sugestoes && sugestoes.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("5. LISTA DE MATERIAIS E SERVIÇOS", margin, yPos);
        yPos += 10;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Item", margin, yPos);
        pdf.text("Descrição", margin + 15, yPos);
        pdf.text("Qtd", margin + 120, yPos);
        pdf.text("Un", margin + 140, yPos);
        pdf.text("Ref. Norma", margin + 155, yPos);
        yPos += lineHeight;

        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos - 2, 190, yPos - 2);
        yPos += 3;

        pdf.setFont("helvetica", "normal");
        sugestoes.forEach((sugestao, index) => {
          checkPageBreak(15);
          pdf.text(`${index + 1}`, margin, yPos);
          
          const descLines = pdf.splitTextToSize(sugestao.descricao, 100);
          pdf.text(descLines[0], margin + 15, yPos);
          
          pdf.text(sugestao.quantidade.toString(), margin + 120, yPos);
          pdf.text(sugestao.unidade, margin + 140, yPos);
          
          const refLines = pdf.splitTextToSize(sugestao.norma_referencia, 30);
          pdf.text(refLines[0], margin + 155, yPos);
          
          yPos += lineHeight + 1;
        });

        yPos += 10;
      }

      // Rodapé final
      checkPageBreak(40);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.text("________________________________________", margin, yPos);
      yPos += lineHeight;
      pdf.text("Responsável Técnico", margin, yPos);
      yPos += lineHeight + 3;
      pdf.setFontSize(8);
      pdf.text("Este documento foi gerado automaticamente pelo sistema EletroPro", margin, yPos);
      yPos += lineHeight - 1;
      pdf.text("e deve ser revisado por profissional habilitado antes da execução.", margin, yPos);

      // Salvar PDF
      const fileName = `Anexo_Tecnico_NBR5410_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      toast.success("PDF gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerar Anexo Técnico NBR 5410
        </CardTitle>
        <CardDescription>
          Relatório completo em PDF com checklist, premissas técnicas e memorial descritivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="checklist-select">Selecione um Checklist</Label>
          <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
            <SelectTrigger id="checklist-select">
              <SelectValue placeholder="Escolha um checklist existente" />
            </SelectTrigger>
            <SelectContent>
              {checklists.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.tipo_imovel} - {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  {c.area_total ? ` - ${c.area_total}m²` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {checklists.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">Nenhum checklist disponível</p>
            <p className="text-sm">Crie um checklist na aba correspondente primeiro</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O anexo técnico incluirá:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Dados completos do projeto</li>
            <li>• Checklist de conformidade NBR 5410 preenchido</li>
            <li>• Premissas técnicas adotadas</li>
            <li>• Memorial descritivo da instalação</li>
            <li>• Lista de materiais e referências normativas</li>
            <li>• Alertas de não conformidade (se houver)</li>
          </ul>
        </div>

        <Button
          onClick={generatePDF}
          disabled={!selectedChecklistId || loading}
          className="w-full"
          size="lg"
        >
          <FileDown className="mr-2 h-5 w-5" />
          {loading ? "Gerando PDF..." : "Gerar Anexo Técnico em PDF"}
        </Button>
      </CardContent>
    </Card>
  );
}

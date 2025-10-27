import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, FileText, Calculator, AlertTriangle, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistWizard } from "@/components/nbr5410/ChecklistWizard";
import { OrcamentoAssistente } from "@/components/nbr5410/OrcamentoAssistente";

export default function NBR5410() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">NBR 5410 - Assistente Técnico</h1>
        <p className="text-muted-foreground mt-2">
          Ferramenta de apoio para conformidade com a norma brasileira de instalações elétricas
        </p>
      </div>

      {/* Disclaimer */}
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Aviso Importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta é uma ferramenta de apoio técnico. A responsabilidade final é do profissional habilitado.
            A norma completa NBR 5410 deve ser consultada. Adequação ao CREA/CONFEA quando aplicável.
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="orcamento">Assistente de Orçamento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Funcionalidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("checklist")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Checklist de Conformidade
                </CardTitle>
                <CardDescription>
                  Verificação guiada para instalações residenciais e comerciais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Circuitos dedicados (chuveiro, AC, forno)</li>
                  <li>• Proteção diferencial (DR) para áreas molhadas</li>
                  <li>• Seções mínimas de condutores</li>
                  <li>• Distribuição de circuitos de iluminação</li>
                </ul>
                <Button className="mt-4 w-full">
                  Iniciar Checklist
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("orcamento")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Assistente de Orçamento
                </CardTitle>
                <CardDescription>
                  Sugestões automáticas baseadas nas características do ambiente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Quantitativos de pontos e circuitos</li>
                  <li>• Sugestões de materiais com preços</li>
                  <li>• Validação de conformidade</li>
                  <li>• Geração de lista técnica</li>
                </ul>
                <Button className="mt-4 w-full">
                  Gerar Sugestões
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Tabelas de Referência
                </CardTitle>
                <CardDescription>
                  Consulta rápida de dados técnicos operacionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Seções de cabos por corrente</li>
                  <li>• Quedas de tensão admissíveis</li>
                  <li>• Proteção por disjuntor</li>
                  <li>• Tipos de instalação</li>
                </ul>
                <Button className="mt-4 w-full" variant="outline" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Anexo Técnico
                </CardTitle>
                <CardDescription>
                  Geração de relatório PDF para orçamentos e faturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Checklist NBR 5410 preenchido</li>
                  <li>• Premissas técnicas adotadas</li>
                  <li>• Memorial descritivo</li>
                  <li>• Anexo para orçamento/fatura</li>
                </ul>
                <Button className="mt-4 w-full" variant="outline" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Próximos Passos */}
          <Card>
            <CardHeader>
              <CardTitle>Roadmap de Desenvolvimento</CardTitle>
              <CardDescription>Funcionalidades planejadas por fase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Fase 1 - MVP (Ativo)</h4>
                  <p className="text-sm text-muted-foreground">
                    ✓ Checklist básico, assistente de orçamento, validação simples
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Fase 2 - Dimensionamento</h4>
                  <p className="text-sm text-muted-foreground">
                    Cálculo de seção de condutor, verificação de queda de tensão, sugestão de disjuntores
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Fase 3 - Avançado</h4>
                  <p className="text-sm text-muted-foreground">
                    Motor de validação completo, integração CAD, modo auditoria com checklist fotográfico
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistWizard onComplete={() => setActiveTab("orcamento")} />
        </TabsContent>

        <TabsContent value="orcamento">
          <OrcamentoAssistente />
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}

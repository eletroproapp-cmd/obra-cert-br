import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, FileText, Calculator, AlertTriangle, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistWizard } from "@/components/nbr5410/ChecklistWizard";
import { OrcamentoAssistente } from "@/components/nbr5410/OrcamentoAssistente";
import { AnexoTecnicoPDF } from "@/components/nbr5410/AnexoTecnicoPDF";

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
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs md:text-sm">Checklist</TabsTrigger>
          <TabsTrigger value="orcamento" className="text-xs md:text-sm">Orçamento</TabsTrigger>
          <TabsTrigger value="tabelas" className="text-xs md:text-sm">Tabelas</TabsTrigger>
          <TabsTrigger value="anexo" className="text-xs md:text-sm">Anexo</TabsTrigger>
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

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("tabelas")}>
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
                <Button className="mt-4 w-full">
                  Consultar Tabelas
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("anexo")}>
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
                <Button className="mt-4 w-full">
                  Gerar Anexo Técnico
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

        <TabsContent value="tabelas" className="space-y-6">
          {/* Seções de Cabos por Corrente */}
          <Card>
            <CardHeader>
              <CardTitle>Seções Mínimas de Condutores por Corrente (Tabela 36 NBR 5410)</CardTitle>
              <CardDescription>
                Capacidade de condução de corrente para cabos de cobre (isolação PVC, temperatura ambiente 30°C)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Seção (mm²)</th>
                      <th className="text-left p-2 font-semibold">Método B1 (A)</th>
                      <th className="text-left p-2 font-semibold">Método B2 (A)</th>
                      <th className="text-left p-2 font-semibold">Método C (A)</th>
                      <th className="text-left p-2 font-semibold">Método D (A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">1,5</td>
                      <td className="p-2">15,5</td>
                      <td className="p-2">14,5</td>
                      <td className="p-2">17,5</td>
                      <td className="p-2">19,5</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">2,5</td>
                      <td className="p-2">21</td>
                      <td className="p-2">19,5</td>
                      <td className="p-2">24</td>
                      <td className="p-2">26</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">4</td>
                      <td className="p-2">28</td>
                      <td className="p-2">26</td>
                      <td className="p-2">32</td>
                      <td className="p-2">35</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">6</td>
                      <td className="p-2">36</td>
                      <td className="p-2">34</td>
                      <td className="p-2">41</td>
                      <td className="p-2">45</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">10</td>
                      <td className="p-2">50</td>
                      <td className="p-2">46</td>
                      <td className="p-2">57</td>
                      <td className="p-2">63</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">16</td>
                      <td className="p-2">68</td>
                      <td className="p-2">62</td>
                      <td className="p-2">76</td>
                      <td className="p-2">85</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">25</td>
                      <td className="p-2">89</td>
                      <td className="p-2">80</td>
                      <td className="p-2">101</td>
                      <td className="p-2">112</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">35</td>
                      <td className="p-2">110</td>
                      <td className="p-2">99</td>
                      <td className="p-2">125</td>
                      <td className="p-2">138</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">50</td>
                      <td className="p-2">134</td>
                      <td className="p-2">119</td>
                      <td className="p-2">151</td>
                      <td className="p-2">168</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">70</td>
                      <td className="p-2">171</td>
                      <td className="p-2">151</td>
                      <td className="p-2">192</td>
                      <td className="p-2">213</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">95</td>
                      <td className="p-2">207</td>
                      <td className="p-2">182</td>
                      <td className="p-2">232</td>
                      <td className="p-2">258</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * Métodos de instalação conforme Tabela 33 da NBR 5410. Valores para 2 condutores carregados.
              </p>
            </CardContent>
          </Card>

          {/* Quedas de Tensão */}
          <Card>
            <CardHeader>
              <CardTitle>Quedas de Tensão Admissíveis (Seção 6.2.7 NBR 5410)</CardTitle>
              <CardDescription>
                Limites de queda de tensão entre origem da instalação e pontos de utilização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Tipo de Instalação</th>
                      <th className="text-left p-2 font-semibold">Iluminação</th>
                      <th className="text-left p-2 font-semibold">Outros Usos</th>
                      <th className="text-left p-2 font-semibold">Motor (Partida)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Alimentada diretamente pela rede de BT</td>
                      <td className="p-2">4%</td>
                      <td className="p-2">4%</td>
                      <td className="p-2">10%</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Com subestação ou gerador próprio</td>
                      <td className="p-2">7%</td>
                      <td className="p-2">7%</td>
                      <td className="p-2">15%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Notas importantes:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Os valores são calculados a partir do ponto de entrega (origem da instalação)</li>
                  <li>Para circuitos de iluminação de emergência, limite de 5%</li>
                  <li>Para circuitos terminais, recomenda-se não ultrapassar 2%</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Proteção por Disjuntor */}
          <Card>
            <CardHeader>
              <CardTitle>Coordenação Disjuntor x Seção de Cabo (Seção 5.3 NBR 5410)</CardTitle>
              <CardDescription>
                Relação entre corrente nominal do disjuntor e seção mínima do condutor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Disjuntor (A)</th>
                      <th className="text-left p-2 font-semibold">Seção Mínima (mm²)</th>
                      <th className="text-left p-2 font-semibold">Aplicação Típica</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">10</td>
                      <td className="p-2">1,5</td>
                      <td className="p-2">Iluminação</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">16</td>
                      <td className="p-2">2,5</td>
                      <td className="p-2">Tomadas gerais</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">20</td>
                      <td className="p-2">2,5</td>
                      <td className="p-2">Tomadas cozinha</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">25</td>
                      <td className="p-2">4</td>
                      <td className="p-2">Chuveiro até 5500W</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">32</td>
                      <td className="p-2">6</td>
                      <td className="p-2">Chuveiro 220V</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">40</td>
                      <td className="p-2">10</td>
                      <td className="p-2">Ar-condicionado, forno elétrico</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">50</td>
                      <td className="p-2">10</td>
                      <td className="p-2">Alimentação geral pequeno quadro</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">63</td>
                      <td className="p-2">16</td>
                      <td className="p-2">Cargas pesadas, alimentação quadros</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * Valores considerando método de instalação B1. Verificar sempre capacidade de condução conforme método real.
              </p>
            </CardContent>
          </Card>

          {/* Tipos de Instalação */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Instalação (Tabela 33 NBR 5410)</CardTitle>
              <CardDescription>
                Principais métodos de referência para instalação de condutores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Método A - Condutores isolados em eletroduto embutido</h4>
                  <p className="text-sm text-muted-foreground">
                    Eletroduto de seção circular embutido em alvenaria, com isolação térmica. Temperatura de referência: 30°C.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Método B1 - Cabos unipolares ou cabo multipolar em eletroduto aparente</h4>
                  <p className="text-sm text-muted-foreground">
                    Eletroduto aparente em parede ou espaçado dela. É o método mais comum em instalações residenciais e comerciais.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Método B2 - Cabo multipolar em eletroduto aparente</h4>
                  <p className="text-sm text-muted-foreground">
                    Similar ao B1, porém para cabos multipolares (cabo com vários condutores em uma mesma capa).
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Método C - Cabos unipolares ou multipolar em superfície</h4>
                  <p className="text-sm text-muted-foreground">
                    Cabos fixados diretamente em parede ou teto, com espaçamento inferior a 0,3 vezes o diâmetro do cabo.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Método D - Cabos em canaleta fechada</h4>
                  <p className="text-sm text-muted-foreground">
                    Cabos instalados em canaleta fechada embutida ou aparente. Comum em instalações comerciais e industriais.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Método F - Cabos unipolares espaçados</h4>
                  <p className="text-sm text-muted-foreground">
                    Cabos afastados da parede com espaçamento entre si. Melhor dissipação térmica, maior capacidade de corrente.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Método G - Cabos fixos diretamente em teto ou parede</h4>
                  <p className="text-sm text-muted-foreground">
                    Cabos multipolares fixados diretamente com braçadeiras. Usado em áreas técnicas e industriais.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Fatores de Correção
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                  <li>• Temperatura ambiente diferente de 30°C: aplicar fator de correção da Tabela 37</li>
                  <li>• Agrupamento de circuitos: aplicar fator de correção da Tabela 42</li>
                  <li>• Resistividade térmica do solo (cabos enterrados): Tabela 43</li>
                  <li>• Sempre consultar a norma completa para casos específicos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Seções Mínimas por Tipo de Circuito */}
          <Card>
            <CardHeader>
              <CardTitle>Seções Mínimas por Tipo de Circuito (Tabela 47 NBR 5410)</CardTitle>
              <CardDescription>
                Requisitos mínimos independente da corrente calculada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Tipo de Circuito</th>
                      <th className="text-left p-2 font-semibold">Seção Mínima (mm²)</th>
                      <th className="text-left p-2 font-semibold">Material</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Circuitos de iluminação</td>
                      <td className="p-2">1,5</td>
                      <td className="p-2">Cobre</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Circuitos de força (tomadas)</td>
                      <td className="p-2">2,5</td>
                      <td className="p-2">Cobre</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Circuitos de sinalização e controle</td>
                      <td className="p-2">0,5</td>
                      <td className="p-2">Cobre</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Circuitos de equipamentos específicos</td>
                      <td className="p-2">Conforme cálculo</td>
                      <td className="p-2">Cobre ou Alumínio</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Condutor neutro</td>
                      <td className="p-2">Mesma seção da fase</td>
                      <td className="p-2">Cobre</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">Condutor de proteção (PE)</td>
                      <td className="p-2">≥ 2,5 (até 16mm²)</td>
                      <td className="p-2">Cobre</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexo">
          <AnexoTecnicoPDF />
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}

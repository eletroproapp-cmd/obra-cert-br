import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  Menu,
  LogOut,
  Home,
  ClipboardList,
  Package,
  Settings,
  Zap,
  Cable,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-eletropro.png";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="EletroPro" className="h-10" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta! 👋</h1>
          <p className="text-muted-foreground">
            Aqui está um resumo das suas atividades recentes
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/orcamentos" className="w-full">
            <Button variant="hero" size="lg" className="h-auto py-6 flex-col gap-2 w-full">
              <Plus className="h-6 w-6" />
              <span>Novo Orçamento</span>
            </Button>
          </Link>
          <Link to="/faturas" className="w-full">
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2 w-full">
              <FileText className="h-6 w-6" />
              <span>Nova Fatura</span>
            </Button>
          </Link>
          <Link to="/catalogo" className="w-full">
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2 w-full">
              <Cable className="h-6 w-6" />
              <span>Adicionar Material</span>
            </Button>
          </Link>
          <Link to="/instalacoes" className="w-full">
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2 w-full">
              <Zap className="h-6 w-6" />
              <span>Nova Instalação</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Orçamentos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-foreground">12</div>
                <div className="flex items-center gap-1 text-success text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+23%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">+3 este mês</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-foreground">8</div>
                <div className="flex items-center gap-1 text-accent text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span>R$ 45.2k</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total a receber</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Instalações em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-foreground">6</div>
                <div className="flex items-center gap-1 text-primary text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+2</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">4 no prazo</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-foreground">R$ 82k</div>
                <div className="flex items-center gap-1 text-success text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+15%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">vs. mês anterior</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border shadow-medium">
            <CardHeader>
              <CardTitle>Orçamentos Recentes</CardTitle>
              <CardDescription>Últimos orçamentos criados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: "ORC-2024-001", client: "Residencial Jardins", value: "R$ 8.400", status: "Aprovado" },
                  { id: "ORC-2024-002", client: "Comércio Silva", value: "R$ 12.200", status: "Pendente" },
                  { id: "ORC-2024-003", client: "Indústria Premium", value: "R$ 28.100", status: "Em Análise" },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="font-medium">{item.id}</p>
                      <p className="text-sm text-muted-foreground">{item.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver Todos os Orçamentos
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-medium">
            <CardHeader>
              <CardTitle>Faturas a Vencer</CardTitle>
              <CardDescription>Próximos vencimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: "FAT-2024-015", client: "Instalação Residencial XYZ", value: "R$ 7.300", due: "15/01" },
                  { id: "FAT-2024-016", client: "Quadro Comercial Nova", value: "R$ 15.800", due: "18/01" },
                  { id: "FAT-2024-017", client: "Manutenção Industrial", value: "R$ 22.500", due: "22/01" },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="font-medium">{item.id}</p>
                      <p className="text-sm text-muted-foreground">{item.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent">{item.value}</p>
                      <p className="text-xs text-muted-foreground">Vence: {item.due}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver Todas as Faturas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

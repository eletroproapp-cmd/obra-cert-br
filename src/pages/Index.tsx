import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, FileText, Hammer, BarChart3, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";
import iconEstimates from "@/assets/icon-estimates.png";
import iconCatalog from "@/assets/icon-catalog.png";
import iconDashboard from "@/assets/icon-dashboard.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hammer className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ObraGestão
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#recursos" className="text-foreground hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#beneficios" className="text-foreground hover:text-primary transition-colors">
              Benefícios
            </a>
            <Link to="/auth">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Começar Grátis</Button>
            </Link>
          </nav>
          <Link to="/auth" className="md:hidden">
            <Button size="sm" variant="hero">Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Gestão completa para sua{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    empresa de construção
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Crie orçamentos profissionais, emita faturas e controle suas obras em um único lugar. 
                  Simples, rápido e feito para o mercado brasileiro.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="xl" variant="hero" className="w-full sm:w-auto">
                    Começar Agora
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Ver Demonstração
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">Sem mensalidade inicial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">Configure em minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">Suporte em português</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
              <img
                src={heroImage}
                alt="Sistema de gestão para construção civil"
                className="relative rounded-2xl shadow-large w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Tudo que você precisa para gerenciar suas obras
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais desenvolvidas especialmente para empresas de construção civil
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <img src={iconEstimates} alt="Orçamentos" className="w-12 h-12" />
                </div>
                <CardTitle>Orçamentos Profissionais</CardTitle>
                <CardDescription>
                  Crie orçamentos detalhados em minutos. Converta para fatura com 1 clique.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <img src={iconCatalog} alt="Catálogo" className="w-12 h-12" />
                </div>
                <CardTitle>Catálogo de Serviços</CardTitle>
                <CardDescription>
                  Biblioteca completa de itens, materiais e serviços com preços atualizados.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <img src={iconDashboard} alt="Dashboard" className="w-12 h-12" />
                </div>
                <CardTitle>Dashboard Intuitivo</CardTitle>
                <CardDescription>
                  Visualize métricas importantes e acompanhe o desempenho das suas obras.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Gestão de Faturas</CardTitle>
                <CardDescription>
                  Emita faturas, notas fiscais e controle pagamentos de forma simplificada.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-accent" />
                </div>
                <CardTitle>Análise de Rentabilidade</CardTitle>
                <CardDescription>
                  Entenda o lucro real de cada obra com análise de custos e receitas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Acesso Mobile</CardTitle>
                <CardDescription>
                  Trabalhe de qualquer lugar. App otimizado para celular e tablet.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-foreground">
                Por que escolher o ObraGestão?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Economia de Tempo</h3>
                    <p className="text-muted-foreground">
                      Reduza o tempo de criação de orçamentos em até 70% com modelos prontos e catálogo integrado.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">100% Brasileiro</h3>
                    <p className="text-muted-foreground">
                      Sistema desenvolvido para o mercado brasileiro, com suporte a impostos e documentos locais.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Profissionalismo</h3>
                    <p className="text-muted-foreground">
                      Impressione seus clientes com orçamentos e faturas profissionais e personalizadas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Controle Financeiro</h3>
                    <p className="text-muted-foreground">
                      Tenha visibilidade total sobre receitas, custos e rentabilidade de cada projeto.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-border shadow-large bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="text-3xl">Comece gratuitamente hoje</CardTitle>
                <CardDescription className="text-base">
                  Sem cartão de crédito. Sem mensalidade inicial. Configure sua conta em minutos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Orçamentos ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Catálogo completo de serviços</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Dashboard com métricas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Suporte em português</span>
                  </div>
                </div>
                <Link to="/auth" className="block">
                  <Button size="lg" variant="hero" className="w-full mt-4">
                    Criar Conta Grátis
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Hammer className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">ObraGestão</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema completo de gestão para empresas de construção civil.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#recursos" className="hover:text-primary transition-colors">Recursos</a></li>
                <li><a href="#beneficios" className="hover:text-primary transition-colors">Benefícios</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 ObraGestão. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

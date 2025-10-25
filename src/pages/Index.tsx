import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, FileText, Zap, BarChart3, Smartphone, Shield, Cable } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";
import iconEstimates from "@/assets/icon-estimates.png";
import iconCatalog from "@/assets/icon-catalog.png";
import iconDashboard from "@/assets/icon-dashboard.png";
import logo from "@/assets/logo-eletropro.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="EletroPro" className="h-10" />
          </Link>
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
                  Gestão elétrica completa para{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    eletricistas profissionais
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Crie orçamentos com NBR 5410, emita faturas e gerencie seus serviços elétricos em um único lugar. 
                  Simples, rápido e desenvolvido para eletricistas brasileiros.
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
              Tudo que você precisa para gerenciar seus serviços elétricos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais desenvolvidas especialmente para eletricistas e empresas de instalações elétricas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <img src={iconEstimates} alt="Orçamentos" className="w-12 h-12" />
                </div>
                <CardTitle>Orçamentos com NBR 5410</CardTitle>
                <CardDescription>
                  Crie orçamentos elétricos detalhados conforme normas brasileiras. Converta para fatura com 1 clique.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <Cable className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Catálogo Elétrico</CardTitle>
                <CardDescription>
                  Biblioteca completa de materiais elétricos: cabos, disjuntores, DR, eletrodutos e mais.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <CardTitle>Conformidade NBR 5410</CardTitle>
                <CardDescription>
                  Assistente de conformidade com checklist e validações automáticas da norma brasileira.
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
                  Emita faturas, notas fiscais e controle pagamentos de serviços elétricos de forma simplificada.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <img src={iconDashboard} alt="Dashboard" className="w-12 h-12" />
                </div>
                <CardTitle>Dashboard de Projetos</CardTitle>
                <CardDescription>
                  Visualize métricas de instalações, acompanhe serviços e analise rentabilidade em tempo real.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-large transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-subtle flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>App Mobile</CardTitle>
                <CardDescription>
                  Crie orçamentos no local, tire fotos das instalações e envie para clientes direto do celular.
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
                Por que escolher o EletroPro?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Orçamentos Técnicos Rápidos</h3>
                    <p className="text-muted-foreground">
                      Reduza o tempo de criação de orçamentos elétricos em até 70% com assistente NBR 5410 e catálogo de materiais.
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
                    <h3 className="font-semibold text-lg mb-1">Conformidade com Normas</h3>
                    <p className="text-muted-foreground">
                      Sistema desenvolvido seguindo a NBR 5410, com validações automáticas e checklist de conformidade integrado.
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
                    <h3 className="font-semibold text-lg mb-1">Profissionalismo Técnico</h3>
                    <p className="text-muted-foreground">
                      Impressione seus clientes com orçamentos técnicos detalhados, anexos NBR 5410 e documentação profissional.
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
                    <h3 className="font-semibold text-lg mb-1">Gestão Completa</h3>
                    <p className="text-muted-foreground">
                      Controle total sobre serviços elétricos, custos de materiais, prazos e rentabilidade de cada instalação.
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
                    <span>Catálogo elétrico completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Assistente NBR 5410 integrado</span>
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
              <img src={logo} alt="EletroPro" className="h-8 mb-4" />
              <p className="text-sm text-muted-foreground">
                Sistema completo de gestão elétrica para eletricistas profissionais.
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
            © 2025 EletroPro. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

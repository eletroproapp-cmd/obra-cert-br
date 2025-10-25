import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/logo-eletropro.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de login - substituir com autenticação real
    setTimeout(() => {
      toast.success("Login realizado com sucesso!");
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de cadastro - substituir com autenticação real
    setTimeout(() => {
      toast.success("Conta criada com sucesso!");
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="EletroPro" className="h-10" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-large">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bem-vindo ao EletroPro</CardTitle>
            <CardDescription>
              Entre ou crie sua conta para começar a gerenciar seus serviços elétricos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="text-center">
                    <a href="#" className="text-sm text-primary hover:underline">
                      Esqueceu sua senha?
                    </a>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Empresa</Label>
                    <Input
                      id="signup-company"
                      type="text"
                      placeholder="Nome da sua empresa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Ao criar uma conta, você concorda com nossos{" "}
                    <a href="#" className="text-primary hover:underline">
                      Termos de Uso
                    </a>{" "}
                    e{" "}
                    <a href="#" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

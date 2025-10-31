import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo-eletropro.png";
import { useAuth } from "@/hooks/useAuth";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { usePasswordRecovery } from "@/hooks/usePasswordRecovery";
import { z } from "zod";
import { toast } from "sonner";

const passwordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

const signupSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100).trim(),
  company: z.string().min(2, 'Empresa deve ter no mínimo 2 caracteres').max(100).trim()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

const sha1Hex = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
};

const isPasswordPwned = async (password: string): Promise<boolean> => {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' }
  });
  if (!res.ok) return false; // Fail-closed to allow signup if service unavailable
  const body = await res.text();
  return body.split('\n').some(line => {
    const [hashSuffix, count] = line.trim().split(':');
    return hashSuffix === suffix && parseInt(count || '0', 10) > 0;
  });
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { isResetMode, exitResetMode } = usePasswordRecovery();



  useEffect(() => {
    const url = new URL(window.location.href);
    const qs = url.searchParams;
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    const hasRecoveryParams = qs.get('type') === 'recovery' || hash.get('type') === 'recovery' || qs.has('token_hash') || hash.has('token_hash');
    if (user && !isResetMode && !hasRecoveryParams) {
      navigate('/dashboard');
    }
  }, [user, isResetMode, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      name: formData.get('name') as string,
      company: formData.get('company') as string
    };

    const result = signupSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const pwned = await isPasswordPwned(result.data.password);
      if (pwned) {
        toast.error('Sua senha aparece em vazamentos de dados. Por favor, escolha outra.');
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Falha ao verificar senha vazada', err);
      // Continuar mesmo se o serviço externo falhar
    }

    const success = await signUp(result.data.email, result.data.password, { 
      full_name: result.data.name, 
      company: result.data.company 
    });
    
    // Enviar email de boas-vindas se cadastro foi bem-sucedido
    if (success) {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.functions.invoke('enviar-email-boas-vindas', {
          body: { 
            email: result.data.email,
            name: result.data.name 
          }
        });
      } catch (error) {
        console.error('Erro ao enviar email de boas-vindas:', error);
        // Não mostrar erro ao usuário, pois o cadastro foi bem-sucedido
      }
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      
      // Envia email customizado via função com link oficial e redirect correto
      const { data, error } = await supabase.functions.invoke('enviar-reset-senha', {
        body: {
          email: resetEmail,
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        },
      });

      if (error) {
        console.warn('Erro ao enviar email de recuperação (tratado como sucesso):', error);
      }

      toast.success('Se o email estiver cadastrado, você receberá um link para redefinir a senha.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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
              {isResetMode ? (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { exitResetMode(); window.history.replaceState(null, '', '/auth'); }}
                    className="mb-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Definir nova senha</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Crie uma nova senha para sua conta
                    </p>
                  </div>
                  <ResetPasswordForm onSuccess={() => {
                    window.history.replaceState(null, '', '/auth');
                    navigate('/dashboard');
                  }} />
                </div>
              ) : showForgotPassword ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotPassword(false)}
                  className="mb-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Recuperar Senha</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Digite seu email e enviaremos um link para redefinir sua senha
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                  </Button>
                </form>
              </div>
            ) : (
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
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        minLength={6}
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
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome Completo</Label>
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-company">Empresa</Label>
                      <Input
                        id="signup-company"
                        name="company"
                        type="text"
                        placeholder="Nome da sua empresa"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Mín. 8 caracteres com maiúsc., números e símbolos"
                        minLength={8}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Sua senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                      <Input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Digite a senha novamente"
                        minLength={8}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

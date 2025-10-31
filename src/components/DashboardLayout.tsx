import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "./ui/button";
import { Settings, LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompanyOnboarding } from "@/components/onboarding/CompanyOnboarding";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const displayName = (user?.user_metadata?.full_name as string) || (user?.email?.split("@")[0] ?? "");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Busca logo da empresa
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('logo_url')
          .eq('user_id', user.id)
          .single();
        
        if (!error && data?.logo_url) {
          setCompanyLogo(data.logo_url);
        }
      } catch (err) {
        console.error('Erro ao buscar logo da empresa:', err);
      }
    };
    fetchCompanyLogo();
  }, [user?.id]);

  // Envia email de boas-vindas na primeira navegação autenticada (global)
  useEffect(() => {
    const sendWelcomeIfNeeded = async () => {
      if (!user?.id || !user.email) return;
      const key = `welcomeEmailSent:${user.id}`;
      if (localStorage.getItem(key)) return;
      try {
        await supabase.functions.invoke('enviar-email-boas-vindas', {
          body: {
            email: user.email,
            name: displayName || user.email.split('@')[0],
          },
        });
        localStorage.setItem(key, '1');
      } catch (err) {
        console.error('Falha ao enviar email de boas-vindas (layout):', err);
      }
    };
    sendWelcomeIfNeeded();
  }, [user?.id, user?.email, displayName]);

  return (
    <SidebarProvider>
      <CompanyOnboarding />
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Top Header */}
          <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-soft">
            <div className="flex items-center justify-between px-3 md:px-4 py-3">
              <div className="flex items-center gap-2 md:gap-3">
                <SidebarTrigger>
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
              </div>
              
              <div className="flex items-center gap-1 md:gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/configuracoes')}
                  title="Configurações"
                  className="h-9 w-9 md:h-10 md:w-10"
                >
                  <Settings className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 h-9 md:h-10 px-2 md:px-3">
                      <Avatar className="h-7 w-7 md:h-8 md:w-8">
                        {companyLogo ? (
                          <img src={companyLogo} alt="Logo" className="object-cover w-full h-full rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-3 w-3 md:h-4 md:w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="hidden md:inline text-sm truncate max-w-[120px] lg:max-w-[200px]">
                        {user?.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-50 bg-popover">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Minha Conta</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => navigate('/configuracoes')}
                      className="cursor-pointer md:hidden"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

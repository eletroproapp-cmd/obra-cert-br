import {
  LayoutDashboard,
  Calendar,
  Clock,
  FileText,
  Receipt,
  Users,
  FolderOpen,
  ShoppingCart,
  Package,
  Building2,
  CreditCard,
  Settings,
  UserPlus,
  HelpCircle,
  CheckSquare,
  BarChart3,
  UserCog,
  Shield,
  FolderKanban,
  Wallet,
  Crown,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import iconLogo from "@/assets/icon-eletropro.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    section: "",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Projetos", url: "/projetos", icon: FolderKanban, requiresPro: true },
      { title: "Planejamento", url: "/planejamento", icon: Calendar },
      { title: "Funcionários", url: "/funcionarios", icon: UserCog, requiresBasic: true },
      { title: "Folhas de Ponto", url: "/timesheets", icon: Clock, requiresPro: true },
      { title: "Orçamentos", url: "/orcamentos", icon: FileText },
      { title: "Faturas", url: "/faturas", icon: Receipt },
      { title: "Despesas", url: "/despesas", icon: Wallet },
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Catálogo", url: "/catalogo", icon: FolderOpen },
      { title: "NBR 5410", url: "/nbr5410", icon: CheckSquare, requiresPro: true },
      { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
    ],
  },
];

const bottomItems = [
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Plano", url: "/configuracoes?tab=plano", icon: Crown, showProBadge: true },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Indicações", url: "/indicacoes", icon: UserPlus },
  { title: "Ajuda & Suporte", url: "/suporte", icon: HelpCircle },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { pathname } = useLocation();
  const { isAdmin } = useAdminCheck();
  const { plan } = useSubscription();
  
  const isActivePath = (url: string) => pathname === url;
  const isProfessional = plan?.plan_type === 'professional';
  const isBasicOrPro = plan?.plan_type === 'basic' || plan?.plan_type === 'professional';

  const bottomItemsWithAdmin = isAdmin 
    ? [
        { title: "Admin", url: "/admin", icon: Shield },
        ...bottomItems
      ]
    : bottomItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        {/* Logo/Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={iconLogo} alt="EletroPro" className="h-16 w-16 flex-shrink-0" />
            {open && (
              <div className="flex-1">
                <h2 className="font-bold text-lg tracking-tight">
                  <span className="text-[#F97316]">Eletro</span>
                  <span className="text-[#1976D2]">Pro</span>
                </h2>
                <p className="text-xs text-sidebar-foreground/60 font-medium">Gestão elétrica de Ponta a Ponta</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4">
          {/* Main Menu Items */}
          {menuItems.map((section, idx) => (
            <SidebarGroup key={idx} className="px-3 mb-2">
              {section.section && open && (
                <SidebarGroupLabel className="text-[11px] font-bold tracking-wider text-sidebar-foreground/60 px-3 py-2 mb-1 uppercase">
                  {section.section}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {section.items.map((item) => {
                    const isLockedPro = item.requiresPro && !isProfessional;
                    const isLockedBasic = item.requiresBasic && !isBasicOrPro;
                    const isLocked = isLockedPro || isLockedBasic;
                    const badgeText = isLockedPro ? 'Pro' : isLockedBasic ? 'Basic' : null;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild={!isLocked} 
                          isActive={isActivePath(item.url)} 
                          className="h-auto p-0"
                          disabled={isLocked}
                        >
                          {isLocked ? (
                            <div className="flex items-center gap-3 w-full px-3 py-2 rounded-lg opacity-50 cursor-not-allowed">
                              <item.icon className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" strokeWidth={2.5} />
                              {open && (
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-sm text-sidebar-foreground">{item.title}</span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badgeText}</Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <NavLink to={item.url} end>
                              <div className="flex items-center gap-3 w-full px-3 py-2 rounded-lg">
                                <item.icon className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" strokeWidth={2.5} />
                                {open && <span className="text-sm text-sidebar-foreground">{item.title}</span>}
                              </div>
                            </NavLink>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        {/* Bottom Items */}
        <div className="mt-auto border-t border-sidebar-border">
          <SidebarGroup className="px-3 py-2">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {bottomItemsWithAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActivePath(item.url)} className="h-auto p-0">
                      <NavLink to={item.url} end>
                        <div className="flex items-center gap-3 w-full px-3 py-2 rounded-lg">
                          <item.icon className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" strokeWidth={2.5} />
                          {open && (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm text-sidebar-foreground">{item.title}</span>
                              {item.showProBadge && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pro</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Version Info */}
          {open && (
            <div className="px-5 py-3 border-t border-sidebar-border">
              <div className="flex items-center justify-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></div>
                <p className="text-xs text-sidebar-foreground/60 font-medium">Sistema v1.0.0</p>
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

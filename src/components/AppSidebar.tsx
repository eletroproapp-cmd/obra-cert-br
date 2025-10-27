import {
  LayoutDashboard,
  Calendar,
  Clock,
  Zap,
  Wrench,
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
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "@/assets/logo-eletropro.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";

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
      { title: "Planejamento", url: "/planejamento", icon: Calendar },
      { title: "Funcionários", url: "/funcionarios", icon: UserCog },
      { title: "Folhas de Ponto", url: "/timesheets", icon: Clock },
      { title: "Instalações", url: "/instalacoes", icon: Zap },
      { title: "Manutenções", url: "/manutencoes", icon: Wrench },
    ],
  },
  {
    section: "VENDAS",
    items: [
      { title: "Orçamentos", url: "/orcamentos", icon: FileText },
      { title: "Faturas", url: "/faturas", icon: Receipt },
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Catálogo", url: "/catalogo", icon: FolderOpen },
      { title: "NBR 5410", url: "/nbr5410", icon: CheckSquare },
    ],
  },
  {
    section: "COMPRAS",
    items: [
      { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
      { title: "Faturas de Compra", url: "/faturas-compra", icon: Package },
      { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
    ],
  },
  {
    section: "CONTABILIDADE",
    items: [
      { title: "Transações", url: "/transacoes", icon: CreditCard },
    ],
  },
];

const bottomItems = [
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Indicações", url: "/indicacoes", icon: UserPlus },
  { title: "Ajuda", url: "/ajuda", icon: HelpCircle },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { pathname } = useLocation();
  const { isAdmin } = useAdminCheck();
  
  const isActivePath = (url: string) => pathname === url;

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
            <div className="bg-primary/10 p-2 rounded-xl">
              <img src={logo} alt="EletroPro" className="h-6" />
            </div>
            {open && (
              <div className="flex-1">
                <h2 className="font-bold text-lg text-sidebar-foreground tracking-tight">EletroPro</h2>
                <p className="text-xs text-sidebar-foreground/60 font-medium">Gestão Profissional</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4">
          {/* Main Menu Items */}
          {menuItems.map((section, idx) => (
            <SidebarGroup key={idx} className="px-3 mb-4">
              {section.section && open && (
                <SidebarGroupLabel className="text-[11px] font-bold tracking-wider text-sidebar-foreground/60 px-3 py-2 mb-1 uppercase">
                  {section.section}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActivePath(item.url)} className="h-auto p-0">
                        <NavLink to={item.url} end>
                          <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg">
                            <item.icon className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" strokeWidth={2.5} />
                            {open && <span className="text-sm text-sidebar-foreground">{item.title}</span>}
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        {/* Bottom Items */}
        <div className="mt-auto border-t border-sidebar-border">
          <SidebarGroup className="px-3 py-3">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {bottomItemsWithAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActivePath(item.url)} className="h-auto p-0">
                      <NavLink to={item.url} end>
                        <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg">
                          <item.icon className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" strokeWidth={2.5} />
                          {open && <span className="text-sm text-sidebar-foreground">{item.title}</span>}
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

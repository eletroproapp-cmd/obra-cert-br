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
} from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "@/assets/logo-eletropro.png";

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
      { title: "Registro de Horas", url: "/horas", icon: Clock },
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
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Indicações", url: "/indicacoes", icon: UserPlus },
  { title: "Ajuda", url: "/ajuda", icon: HelpCircle },
];

export function AppSidebar() {
  const { open } = useSidebar();

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full ${
      isActive
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    }`;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card">
        {/* Logo/Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EletroPro" className="h-8" />
            {open && (
              <div>
                <h2 className="font-bold text-foreground">EletroPro</h2>
                <p className="text-xs text-muted-foreground">Gestão Elétrica</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Menu Items */}
        {menuItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.section && open && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
                {section.section}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavClass}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Bottom Items */}
        <div className="mt-auto border-t border-border">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {bottomItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Version Info */}
          {open && (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

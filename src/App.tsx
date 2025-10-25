import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Orcamentos from "./pages/Orcamentos";
import Faturas from "./pages/Faturas";
import Catalogo from "./pages/Catalogo";
import Instalacoes from "./pages/Instalacoes";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Planejamento from "./pages/Planejamento";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Dashboard Routes with Sidebar */}
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/planejamento" element={<DashboardLayout><Planejamento /></DashboardLayout>} />
          <Route path="/orcamentos" element={<DashboardLayout><Orcamentos /></DashboardLayout>} />
          <Route path="/faturas" element={<DashboardLayout><Faturas /></DashboardLayout>} />
          <Route path="/clientes" element={<DashboardLayout><Clientes /></DashboardLayout>} />
          <Route path="/catalogo" element={<DashboardLayout><Catalogo /></DashboardLayout>} />
          <Route path="/instalacoes" element={<DashboardLayout><Instalacoes /></DashboardLayout>} />
          <Route path="/fornecedores" element={<DashboardLayout><Fornecedores /></DashboardLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

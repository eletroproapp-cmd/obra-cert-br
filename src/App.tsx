import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import NBR5410 from "./pages/NBR5410";
import Configuracoes from "./pages/Configuracoes";
import Relatorios from "./pages/Relatorios";
import Funcionarios from "./pages/Funcionarios";
import Timesheets from "./pages/Timesheets";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Dashboard Routes with Sidebar - Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/planejamento" element={<ProtectedRoute><DashboardLayout><Planejamento /></DashboardLayout></ProtectedRoute>} />
        <Route path="/orcamentos" element={<ProtectedRoute><DashboardLayout><Orcamentos /></DashboardLayout></ProtectedRoute>} />
        <Route path="/faturas" element={<ProtectedRoute><DashboardLayout><Faturas /></DashboardLayout></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><DashboardLayout><Clientes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/catalogo" element={<ProtectedRoute><DashboardLayout><Catalogo /></DashboardLayout></ProtectedRoute>} />
        <Route path="/instalacoes" element={<ProtectedRoute><DashboardLayout><Instalacoes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/fornecedores" element={<ProtectedRoute><DashboardLayout><Fornecedores /></DashboardLayout></ProtectedRoute>} />
        <Route path="/nbr5410" element={<ProtectedRoute><DashboardLayout><NBR5410 /></DashboardLayout></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><DashboardLayout><Configuracoes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><DashboardLayout><Relatorios /></DashboardLayout></ProtectedRoute>} />
        <Route path="/funcionarios" element={<ProtectedRoute><DashboardLayout><Funcionarios /></DashboardLayout></ProtectedRoute>} />
        <Route path="/timesheets" element={<ProtectedRoute><DashboardLayout><Timesheets /></DashboardLayout></ProtectedRoute>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;

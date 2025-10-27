import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Admin from "./pages/Admin";
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
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/planejamento" element={<ProtectedRoute><Planejamento /></ProtectedRoute>} />
        <Route path="/orcamentos" element={<ProtectedRoute><Orcamentos /></ProtectedRoute>} />
        <Route path="/faturas" element={<ProtectedRoute><Faturas /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/catalogo" element={<ProtectedRoute><Catalogo /></ProtectedRoute>} />
        <Route path="/instalacoes" element={<ProtectedRoute><Instalacoes /></ProtectedRoute>} />
        <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
        <Route path="/nbr5410" element={<ProtectedRoute><NBR5410 /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
        <Route path="/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
        <Route path="/timesheets" element={<ProtectedRoute><Timesheets /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;

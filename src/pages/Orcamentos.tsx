import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-eletropro.png";

const Orcamentos = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="EletroPro" className="h-10" />
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Orçamentos</h1>
            <p className="text-muted-foreground">Gerencie seus orçamentos elétricos</p>
          </div>
          <Button variant="hero" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Novo Orçamento
          </Button>
        </div>

        <div className="grid gap-4">
          {[
            { id: "ORC-2024-001", client: "Residencial Jardins", value: "R$ 8.400", status: "Aprovado" },
            { id: "ORC-2024-002", client: "Comércio Silva", value: "R$ 12.200", status: "Pendente" },
            { id: "ORC-2024-003", client: "Indústria Premium", value: "R$ 28.100", status: "Em Análise" },
          ].map((item) => (
            <Card key={item.id} className="border-border shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{item.id}</span>
                  <span className="text-sm font-normal text-muted-foreground">{item.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{item.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold text-primary">{item.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orcamentos;

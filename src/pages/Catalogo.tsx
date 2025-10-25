import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Cable } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-eletropro.png";

const Catalogo = () => {
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
            <h1 className="text-3xl font-bold mb-2">Catálogo de Materiais</h1>
            <p className="text-muted-foreground">Gerencie materiais elétricos e preços</p>
          </div>
          <Button variant="hero" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Adicionar Material
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Disjuntor 20A", category: "Proteção", price: "R$ 45,00", stock: "125" },
            { name: "Cabo 2.5mm²", category: "Condutores", price: "R$ 3,80/m", stock: "500m" },
            { name: "Tomada 10A", category: "Dispositivos", price: "R$ 12,00", stock: "80" },
            { name: "DR 30mA", category: "Proteção", price: "R$ 180,00", stock: "15" },
            { name: "Eletroduto 3/4\"", category: "Instalação", price: "R$ 8,50", stock: "200" },
            { name: "Interruptor Simples", category: "Dispositivos", price: "R$ 15,00", stock: "60" },
          ].map((item, index) => (
            <Card key={index} className="border-border shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cable className="h-5 w-5 text-primary" />
                  <span className="text-lg">{item.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{item.category}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Preço</p>
                    <p className="text-lg font-bold text-primary">{item.price}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Estoque</p>
                    <p className="font-medium">{item.stock}</p>
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

export default Catalogo;

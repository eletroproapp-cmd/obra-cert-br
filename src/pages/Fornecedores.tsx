import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Phone, Mail, Package } from "lucide-react";

const Fornecedores = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores de materiais</p>
        </div>
        <Button variant="hero" size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Distribuidora Elétrica SP", category: "Materiais Gerais", phone: "(11) 3456-7890", email: "vendas@distribuidora.com", products: "Cabos, Disjuntores, Tomadas" },
          { name: "Fios e Cabos Premium", category: "Condutores", phone: "(11) 3456-7891", email: "comercial@fioscabos.com", products: "Cabos, Fios, Conduítes" },
          { name: "Proteção Elétrica Ltda", category: "Proteção", phone: "(11) 3456-7892", email: "vendas@protecao.com", products: "DR, DPS, Disjuntores" },
          { name: "Iluminação Total", category: "Iluminação", phone: "(11) 3456-7893", email: "contato@iluminacao.com", products: "Luminárias, LED, Reatores" },
          { name: "Automação Industrial", category: "Automação", phone: "(11) 3456-7894", email: "vendas@automacao.com", products: "CLPs, Sensores, Relés" },
          { name: "Quadros e Painéis SA", category: "Quadros", phone: "(11) 3456-7895", email: "comercial@quadros.com", products: "Quadros, Barramentos, DIN" },
        ].map((supplier, index) => (
          <Card key={index} className="border-border shadow-soft hover:shadow-medium transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-lg">{supplier.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded">
                    {supplier.category}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{supplier.products}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Fornecedores;

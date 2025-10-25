import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const Faturas = () => {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Faturas</h1>
            <p className="text-muted-foreground">Gerencie suas faturas e pagamentos</p>
          </div>
          <Button variant="hero" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nova Fatura
          </Button>
        </div>

        <div className="grid gap-4">
          {[
            { id: "FAT-2024-015", client: "Instalação Residencial XYZ", value: "R$ 7.300", due: "15/01", status: "Pendente" },
            { id: "FAT-2024-016", client: "Quadro Comercial Nova", value: "R$ 15.800", due: "18/01", status: "Pendente" },
            { id: "FAT-2024-017", client: "Manutenção Industrial", value: "R$ 22.500", due: "22/01", status: "Pago" },
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
                    <p className="text-xs text-muted-foreground mt-1">Vencimento: {item.due}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold text-accent">{item.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
  );
};

export default Faturas;

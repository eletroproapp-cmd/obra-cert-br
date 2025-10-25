import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Zap } from "lucide-react";

const Instalacoes = () => {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Instalações</h1>
            <p className="text-muted-foreground">Gerencie projetos de instalações elétricas</p>
          </div>
          <Button variant="hero" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nova Instalação
          </Button>
        </div>

        <div className="grid gap-4">
          {[
            { id: "INST-2024-045", client: "Residencial Jardins", type: "Instalação Completa", status: "Em Andamento", progress: 65 },
            { id: "INST-2024-046", client: "Loja Centro", type: "Quadro Comercial", status: "Planejamento", progress: 20 },
            { id: "INST-2024-047", client: "Edifício Premium", type: "Manutenção Preventiva", status: "Em Andamento", progress: 45 },
          ].map((item) => (
            <Card key={item.id} className="border-border shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span>{item.id}</span>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground">{item.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{item.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{item.type}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Progresso</p>
                      <p className="text-sm font-medium">{item.progress}%</p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all" 
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
  );
};

export default Instalacoes;

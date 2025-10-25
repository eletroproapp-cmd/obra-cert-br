import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Phone, Mail, MapPin } from "lucide-react";

const Clientes = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e contatos</p>
        </div>
        <Button variant="hero" size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "João Silva", type: "Residencial", phone: "(11) 98765-4321", email: "joao@email.com", location: "São Paulo, SP" },
          { name: "Maria Oliveira", type: "Comercial", phone: "(11) 97654-3210", email: "maria@empresa.com", location: "São Paulo, SP" },
          { name: "Carlos Santos", type: "Industrial", phone: "(11) 96543-2109", email: "carlos@industria.com", location: "Guarulhos, SP" },
          { name: "Ana Costa", type: "Residencial", phone: "(11) 95432-1098", email: "ana@email.com", location: "Santo André, SP" },
          { name: "Pedro Almeida", type: "Comercial", phone: "(11) 94321-0987", email: "pedro@loja.com", location: "São Bernardo, SP" },
          { name: "Luciana Ferreira", type: "Residencial", phone: "(11) 93210-9876", email: "luciana@email.com", location: "Osasco, SP" },
        ].map((client, index) => (
          <Card key={index} className="border-border shadow-soft hover:shadow-medium transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-lg">{client.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    {client.type}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{client.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Clientes;

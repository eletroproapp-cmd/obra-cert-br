import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail } from "lucide-react";
import { FeedbackDialog } from "@/components/suporte/FeedbackDialog";
import { SuporteDialog } from "@/components/suporte/SuporteDialog";

const Suporte = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [suporteOpen, setSuporteOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Ajuda & Suporte</h1>
        <p className="text-muted-foreground mb-8">Como podemos ajudar você hoje?</p>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
          <Card className="hover:shadow-lg transition-shadow border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Dê seu feedback</CardTitle>
              </div>
              <CardDescription>
                Compartilhe suas ideias para melhorar o EletroPro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sua opinião é muito importante para nós! Conte-nos como podemos tornar o EletroPro ainda melhor para o seu negócio.
              </p>
              <Button 
                className="w-full"
                onClick={() => setFeedbackOpen(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar Feedback
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-accent/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Entre em contato com o suporte</CardTitle>
              </div>
              <CardDescription>
                Nossa equipe está pronta para ajudar você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Precisa de ajuda? Entre em contato conosco e responderemos o mais rápido possível.
              </p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setSuporteOpen(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Contatar Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <SuporteDialog open={suporteOpen} onOpenChange={setSuporteOpen} />
    </DashboardLayout>
  );
};

export default Suporte;
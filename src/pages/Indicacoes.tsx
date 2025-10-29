import { DashboardLayout } from "@/components/DashboardLayout";
import { ReferralSection } from "@/components/configuracoes/ReferralSection";

const Indicacoes = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Programa de Indicações</h1>
          <p className="text-muted-foreground">
            Indique amigos e ganhe recompensas baseadas no plano escolhido
          </p>
        </div>
        
        {/* Card Explicativo */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-secondary rounded-full p-2 mt-1">
                  <span className="text-lg">1️⃣</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Para quem indica</h3>
                  <p className="text-sm text-muted-foreground">
                    Quando seu indicado assinar <strong>qualquer plano pago</strong>, você ganha <strong>30 dias grátis</strong>!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 rounded-full p-2 mt-1">
                  <span className="text-lg">2️⃣</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Para quem é indicado</h3>
                  <p className="text-sm text-muted-foreground">
                    Ao assinar <strong>qualquer plano pago</strong> (Básico ou Professional), você também ganha <strong>30 dias grátis</strong>!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <ReferralSection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Indicacoes;

import { DashboardLayout } from "@/components/DashboardLayout";
import { ReferralSection } from "@/components/configuracoes/ReferralSection";

const Indicacoes = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Programa de Indicações</h1>
          <p className="text-muted-foreground">
            Indique amigos e ganhe recompensas
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <ReferralSection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Indicacoes;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function CompanyOnboarding() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkCompanySetup();
  }, []);

  const checkCompanySetup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has completed onboarding
      const hasSeenOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (hasSeenOnboarding) return;

      // Check if company is registered
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id, nome_fantasia, cnpj')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no company or incomplete data, show onboarding
      if (!empresa || !empresa.nome_fantasia || !empresa.cnpj) {
        setOpen(true);
      } else {
        // Mark onboarding as completed if company exists
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      }
    } catch (error) {
      console.error('Erro ao verificar cadastro da empresa:', error);
    }
  };

  const handleContinue = () => {
    setOpen(false);
    navigate('/configuracoes?tab=empresa');
  };

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Bem-vindo ao EletroPro!
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Para começar a emitir orçamentos e faturas, precisamos que você cadastre as informações da sua empresa.
            <br /><br />
            Isso levará apenas alguns minutos e você poderá personalizar seus documentos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full sm:w-auto"
          >
            Fazer depois
          </Button>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto"
            variant="hero"
          >
            Cadastrar empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

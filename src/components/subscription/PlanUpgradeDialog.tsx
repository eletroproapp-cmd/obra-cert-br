import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: 'free' | 'basic' | 'professional';
  blockedFeature?: string;
}

const planFeatures = {
  free: {
    name: 'Gratuito',
    price: 'R$ 0',
    highlight: false,
    features: [
      '5 clientes',
      '10 orçamentos/mês',
      '5 faturas/mês',
      '2 instalações ativas',
      '50 materiais no catálogo'
    ]
  },
  basic: {
    name: 'Básico',
    price: 'R$ 9,90',
    highlight: true,
    features: [
      '50 clientes',
      '100 orçamentos/mês',
      '50 faturas/mês',
      '10 instalações ativas',
      '500 materiais no catálogo',
      'Suporte prioritário'
    ]
  },
  professional: {
    name: 'Profissional',
    price: 'R$ 29,90',
    highlight: false,
    features: [
      'Clientes ilimitados',
      'Orçamentos ilimitados',
      'Faturas ilimitadas',
      'Instalações ilimitadas',
      'Materiais ilimitados',
      'Funcionários ilimitados',
      'Suporte premium 24/7',
      'API de integração'
    ]
  }
};

export const PlanUpgradeDialog = ({ 
  open, 
  onOpenChange, 
  currentPlan,
  blockedFeature 
}: PlanUpgradeDialogProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/configuracoes?tab=plano');
  };

  const availablePlans = currentPlan === 'free' 
    ? ['basic', 'professional'] 
    : ['professional'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-primary" />
            Faça Upgrade do Seu Plano
          </DialogTitle>
          <DialogDescription>
            {blockedFeature 
              ? `Para criar mais ${blockedFeature}, escolha um plano superior.`
              : 'Desbloqueie mais recursos e aumente seus limites.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {availablePlans.map((planKey) => {
            const planData = planFeatures[planKey as keyof typeof planFeatures];
            
            return (
              <div 
                key={planKey}
                className={`border rounded-lg p-6 space-y-4 ${
                  planData.highlight 
                    ? 'border-primary shadow-lg' 
                    : 'border-border'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{planData.name}</h3>
                    {planData.highlight && (
                      <Badge variant="default">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {planData.price}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {planData.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleUpgrade}
                  variant={planData.highlight ? "default" : "outline"}
                  className="w-full"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Fazer Upgrade
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

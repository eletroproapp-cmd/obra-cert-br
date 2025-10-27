import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UsageLimitAlertProps {
  resourceName: string;
  current: number;
  limit: number;
  showUpgrade?: boolean;
}

export const UsageLimitAlert = ({ 
  resourceName, 
  current, 
  limit,
  showUpgrade = true 
}: UsageLimitAlertProps) => {
  const navigate = useNavigate();
  const percentage = Math.round((current / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  if (!isNearLimit) return null;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? `Limite de ${resourceName} atingido` : `Você está próximo do limite`}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>{current} de {limit} {resourceName}</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        
        {isAtLimit && (
          <p className="text-sm">
            Você atingiu o limite do plano atual. Faça upgrade para continuar.
          </p>
        )}

        {showUpgrade && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate('/configuracoes?tab=plano')}
            className="w-full sm:w-auto"
          >
            <Crown className="mr-2 h-4 w-4" />
            Ver Planos
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

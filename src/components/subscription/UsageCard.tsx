import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Users, 
  FileText, 
  Receipt, 
  Building2, 
  Package,
  UserCog 
} from "lucide-react";

const resourceConfig = {
  clientes: { 
    label: 'Clientes', 
    icon: Users,
    key: 'clientes' 
  },
  orcamentos_mes: { 
    label: 'Orçamentos (mês)', 
    icon: FileText,
    key: 'orcamentos_mes' 
  },
  faturas_mes: { 
    label: 'Faturas (mês)', 
    icon: Receipt,
    key: 'faturas_mes' 
  },
  instalacoes: { 
    label: 'Instalações Ativas', 
    icon: Building2,
    key: 'instalacoes' 
  },
  materiais: { 
    label: 'Materiais no Catálogo', 
    icon: Package,
    key: 'materiais' 
  },
  funcionarios: { 
    label: 'Funcionários', 
    icon: UserCog,
    key: 'funcionarios' 
  }
};

export const UsageCard = () => {
  const { plan, usage, checkLimit, loading } = useSubscription();

  if (loading || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando uso...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso do Plano - {plan.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(resourceConfig).map(([key, config]) => {
          const check = checkLimit(config.key);
          const percentage = check.limit > 0 
            ? Math.round((check.current / check.limit) * 100) 
            : 0;
          
          const Icon = config.icon;
          
          // Só mostrar se o plano tiver limite para esse recurso
          if (check.limit === 0) return null;

          const isUnlimited = check.limit === 999999;

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {isUnlimited ? (
                    <span className="text-primary font-medium">Ilimitado</span>
                  ) : (
                    `${check.current} / ${check.limit}`
                  )}
                </span>
              </div>
              {!isUnlimited && (
                <Progress 
                  value={percentage} 
                  className={`h-2 ${
                    percentage >= 90 ? 'bg-destructive/20' : 
                    percentage >= 75 ? 'bg-warning/20' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

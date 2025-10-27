import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionPlan {
  id: string;
  plan_type: 'free' | 'basic' | 'professional';
  name: string;
  price_monthly: number;
  features: Record<string, any>;
  limits: {
    clientes?: number;
    orcamentos_mes?: number;
    faturas_mes?: number;
    instalacoes?: number;
    materiais?: number;
    funcionarios?: number;
  };
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'basic' | 'professional';
  status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

interface UsageCount {
  resource_type: string;
  count: number;
  period_start: string;
  period_end: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSubscription();
    fetchUsage();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      // Buscar assinatura do usuário
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) throw subError;

      setSubscription(subData as any);

      // Buscar detalhes do plano
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_type', subData.plan_type)
        .single();

      if (planError) throw planError;

      setPlan(planData as any);
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('resource_type, count')
        .eq('user_id', user.id)
        .gte('period_start', periodStart.toISOString());

      if (error) throw error;

      const usageMap: Record<string, number> = {};
      data?.forEach((item: UsageCount) => {
        usageMap[item.resource_type] = item.count;
      });

      setUsage(usageMap);
    } catch (error) {
      console.error('Erro ao buscar uso:', error);
    }
  };

  const checkLimit = (resourceType: string): { allowed: boolean; current: number; limit: number } => {
    if (!plan || !subscription) {
      return { allowed: false, current: 0, limit: 0 };
    }

    const currentUsage = usage[resourceType] || 0;
    const limit = (plan.limits as any)[resourceType] || 0;

    return {
      allowed: currentUsage < limit,
      current: currentUsage,
      limit
    };
  };

  const canCreate = (resourceType: string): boolean => {
    const check = checkLimit(resourceType);
    return check.allowed;
  };

  const getUsagePercentage = (resourceType: string): number => {
    const check = checkLimit(resourceType);
    if (check.limit === 0) return 0;
    return Math.round((check.current / check.limit) * 100);
  };

  return {
    subscription,
    plan,
    usage,
    loading,
    checkLimit,
    canCreate,
    getUsagePercentage,
    refetch: () => {
      fetchSubscription();
      fetchUsage();
    }
  };
};

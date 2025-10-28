import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReferralCode {
  id: string;
  code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: string;
  reward_granted: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface ReferralReward {
  id: string;
  reward_type: string;
  reward_value: number;
  status: string;
  expires_at: string | null;
  applied_at: string | null;
  created_at: string;
}

export const useReferral = () => {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar código de indicação
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setReferralCode(codeData);

      // Carregar indicações feitas
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      setReferrals(referralsData || []);

      // Carregar recompensas
      const { data: rewardsData } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setRewards(rewardsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados de indicação:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar código único
      const { data: code, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      // Inserir código
      const { data, error } = await supabase
        .from('referral_codes')
        .insert([{ user_id: user.id, code }])
        .select()
        .single();

      if (error) throw error;

      setReferralCode(data);
      toast.success('Código de indicação criado!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao criar código: ' + error.message);
      return null;
    }
  };

  const processReferralCode = async (code: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .rpc('process_referral', {
          p_referred_user_id: user.id,
          p_referral_code: code.toUpperCase()
        });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; error?: string };

      if (result.success) {
        toast.success(result.message || 'Indicação processada com sucesso!');
        await loadReferralData();
        return true;
      } else {
        toast.error(result.error || 'Erro ao processar indicação');
        return false;
      }
    } catch (error: any) {
      toast.error('Erro ao processar código: ' + error.message);
      return false;
    }
  };

  const copyReferralLink = () => {
    if (!referralCode) return;
    
    const link = `${window.location.origin}?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const getPendingRewards = () => {
    return rewards.filter(r => r.status === 'pending');
  };

  const getTotalReferrals = () => {
    return referrals.filter(r => r.status === 'completed').length;
  };

  return {
    referralCode,
    referrals,
    rewards,
    loading,
    createReferralCode,
    processReferralCode,
    copyReferralLink,
    getPendingRewards,
    getTotalReferrals,
    refresh: loadReferralData,
  };
};

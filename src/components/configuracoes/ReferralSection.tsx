import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Gift, Share2, Users, CheckCircle } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { Separator } from '@/components/ui/separator';

export const ReferralSection = () => {
  const { 
    referralCode, 
    rewards, 
    referrals,
    loading, 
    createReferralCode, 
    processReferralCode,
    copyReferralLink,
    getPendingRewards,
    getTotalReferrals 
  } = useReferral();

  const [inputCode, setInputCode] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleProcessCode = async () => {
    if (!inputCode.trim()) return;
    setProcessing(true);
    await processReferralCode(inputCode);
    setInputCode('');
    setProcessing(false);
  };

  const pendingRewards = getPendingRewards();
  const totalReferrals = getTotalReferrals();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle>Programa de Indicações</CardTitle>
          </div>
          <CardDescription>
            Indique amigos e ganhe 30 dias grátis para cada indicação bem-sucedida! Seu amigo também ganha 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{totalReferrals}</p>
                    <p className="text-sm text-muted-foreground">Indicações</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Gift className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{pendingRewards.length}</p>
                    <p className="text-sm text-muted-foreground">Recompensas Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">
                      {pendingRewards.reduce((sum, r) => sum + r.reward_value, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Dias Grátis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Seu Código de Indicação */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Seu Código de Indicação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Compartilhe este código com seus amigos
              </p>
            </div>

            {referralCode ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={referralCode.code}
                    readOnly
                    className="text-2xl font-mono font-bold text-center"
                  />
                  <Button onClick={copyReferralLink} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button onClick={copyReferralLink} variant="default">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar Link
                  </Button>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Link de indicação:</p>
                  <code className="text-xs break-all">
                    {window.location.origin}?ref={referralCode.code}
                  </code>
                </div>
              </div>
            ) : (
              <Button onClick={createReferralCode} variant="default" size="lg">
                <Gift className="h-4 w-4 mr-2" />
                Gerar Meu Código de Indicação
              </Button>
            )}
          </div>

          <Separator />

          {/* Usar Código de Indicação */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Foi Indicado?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use o código que você recebeu e ganhe 30 dias grátis
              </p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="referral-input" className="sr-only">Código de Indicação</Label>
                <Input
                  id="referral-input"
                  placeholder="Digite o código (ex: ABC12345)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleProcessCode} 
                disabled={processing || !inputCode.trim()}
              >
                {processing ? 'Processando...' : 'Aplicar Código'}
              </Button>
            </div>
          </div>

          {/* Recompensas Pendentes */}
          {pendingRewards.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Suas Recompensas</h3>
                {pendingRewards.map((reward) => (
                  <Card key={reward.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Gift className="h-5 w-5 text-success" />
                          <div>
                            <p className="font-medium">{reward.reward_value} dias grátis</p>
                            <p className="text-xs text-muted-foreground">
                              Criado em: {new Date(reward.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={reward.status === 'pending' ? 'secondary' : 'default'}>
                          {reward.status === 'pending' ? 'Pendente' : 'Aplicado'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Lista de Indicações */}
          {referrals.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Suas Indicações</h3>
                {referrals.map((referral) => (
                  <Card key={referral.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Indicação via {referral.referral_code}</p>
                            <p className="text-xs text-muted-foreground">
                              {referral.completed_at 
                                ? `Completada em: ${new Date(referral.completed_at).toLocaleDateString('pt-BR')}`
                                : `Criada em: ${new Date(referral.created_at).toLocaleDateString('pt-BR')}`
                              }
                            </p>
                          </div>
                        </div>
                        <Badge variant={referral.reward_granted ? 'default' : 'secondary'}>
                          {referral.reward_granted ? 'Recompensado' : referral.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

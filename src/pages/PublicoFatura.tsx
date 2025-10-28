import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Receipt } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface FaturaPublica {
  numero: string;
  titulo: string;
  descricao: string;
  status: string;
  valor_total: number;
  data_vencimento: string;
  observacoes: string;
  created_at: string;
  cliente: {
    nome: string;
  };
  items: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
  empresa: {
    nome_fantasia: string;
    telefone?: string;
    email?: string;
    website?: string;
    chave_pix?: string;
  };
}

const PublicoFatura = () => {
  const { token } = useParams<{ token: string }>();
  const [fatura, setFatura] = useState<FaturaPublica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadFatura();
    }
  }, [token]);

  const loadFatura = async () => {
    try {
      // Buscar token e incrementar visualizações
      const { data: tokenData, error: tokenError } = await supabase
        .from('fatura_tokens')
        .select('fatura_id, view_count')
        .eq('token', token)
        .single();

      if (tokenError) throw new Error('Link inválido ou expirado');

      // Incrementar contador de visualizações
      await supabase
        .from('fatura_tokens')
        .update({ view_count: (tokenData.view_count || 0) + 1 })
        .eq('token', token);

      // Buscar dados da fatura
      const { data: fatData, error: fatError } = await supabase
        .from('faturas')
        .select(`
          numero,
          titulo,
          descricao,
          status,
          valor_total,
          data_vencimento,
          observacoes,
          created_at,
          clientes:cliente_id (nome),
          user_id
        `)
        .eq('id', tokenData.fatura_id)
        .single();

      if (fatError) throw fatError;

      // Buscar itens
      const { data: items, error: itemsError } = await supabase
        .from('fatura_items')
        .select('*')
        .eq('fatura_id', tokenData.fatura_id)
        .order('ordem');

      if (itemsError) throw itemsError;

      // Buscar dados da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('nome_fantasia, telefone, email, website, chave_pix')
        .eq('user_id', fatData.user_id)
        .single();

      if (empresaError) throw empresaError;

      setFatura({
        ...fatData,
        cliente: fatData.clientes,
        items: items || [],
        empresa: empresa || { nome_fantasia: '' },
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar fatura');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!fatura) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Fatura não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dataEmissao = new Date(fatura.created_at).toLocaleDateString('pt-BR');
  const dataVencimento = new Date(fatura.data_vencimento).toLocaleDateString('pt-BR');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pago: 'default',
      Pendente: 'secondary',
      Vencido: 'destructive',
      Cancelado: 'outline',
    };
    return colors[status] || 'secondary';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Receipt className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">Fatura #{fatura.numero}</CardTitle>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Empresa: <span className="font-medium text-foreground">{fatura.empresa.nome_fantasia}</span>
              </p>
              {fatura.empresa.email && (
                <p className="text-sm text-muted-foreground">
                  Email: <span className="font-medium text-foreground">{fatura.empresa.email}</span>
                </p>
              )}
              {fatura.empresa.telefone && (
                <p className="text-sm text-muted-foreground">
                  Telefone: <span className="font-medium text-foreground">{fatura.empresa.telefone}</span>
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="font-medium">{fatura.cliente.nome}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div>
                  <Badge variant={getStatusColor(fatura.status) as any}>
                    {fatura.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data de Emissão</Label>
                <p className="font-medium">{dataEmissao}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Vencimento</Label>
                <p className="font-medium">{dataVencimento}</p>
              </div>
            </div>

            {fatura.descricao && (
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <p className="text-sm">{fatura.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fatura.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidade} {item.unidade} × R$ {item.valor_unitario.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-lg">R$ {item.valor_total.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total</span>
                <span className="text-3xl font-bold text-primary">
                  R$ {fatura.valor_total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {fatura.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{fatura.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* PIX */}
        {fatura.empresa.chave_pix && fatura.status === 'Pendente' && (
          <Card className="border-2 border-primary">
            <CardHeader className="bg-primary/10">
              <CardTitle>Pagamento via PIX</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Chave PIX</Label>
                <p className="font-mono font-medium bg-secondary p-3 rounded-lg break-all">
                  {fatura.empresa.chave_pix}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Copie a chave PIX acima e realize o pagamento através do aplicativo do seu banco
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicoFatura;

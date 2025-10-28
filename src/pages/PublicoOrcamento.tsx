import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Eye } from 'lucide-react';

interface OrcamentoPublico {
  numero: string;
  titulo: string;
  descricao: string;
  status: string;
  valor_total: number;
  validade_dias: number;
  observacoes: string;
  created_at: string;
  assinatura_url?: string;
  assinado_em?: string;
  assinante_nome?: string;
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
  };
}

const PublicoOrcamento = () => {
  const { token } = useParams<{ token: string }>();
  const [orcamento, setOrcamento] = useState<OrcamentoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState(false);
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [arquivoAssinatura, setArquivoAssinatura] = useState<File | null>(null);

  useEffect(() => {
    if (token) {
      loadOrcamento();
    }
  }, [token]);

  const loadOrcamento = async () => {
    try {
      // Buscar token e incrementar visualizações
      const { data: tokenData, error: tokenError } = await supabase
        .from('orcamento_tokens')
        .select('orcamento_id, view_count')
        .eq('token', token)
        .single();

      if (tokenError) throw new Error('Link inválido ou expirado');

      // Incrementar contador de visualizações
      await supabase
        .from('orcamento_tokens')
        .update({ view_count: (tokenData.view_count || 0) + 1 })
        .eq('token', token);

      // Buscar dados do orçamento
      const { data: orcData, error: orcError } = await supabase
        .from('orcamentos')
        .select(`
          numero,
          titulo,
          descricao,
          status,
          valor_total,
          validade_dias,
          observacoes,
          created_at,
          assinatura_url,
          assinado_em,
          assinante_nome,
          clientes:cliente_id (nome),
          user_id
        `)
        .eq('id', tokenData.orcamento_id)
        .single();

      if (orcError) throw orcError;

      // Buscar itens
      const { data: items, error: itemsError } = await supabase
        .from('orcamento_items')
        .select('*')
        .eq('orcamento_id', tokenData.orcamento_id)
        .order('ordem');

      if (itemsError) throw itemsError;

      // Buscar dados da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('nome_fantasia, telefone, email, website')
        .eq('user_id', orcData.user_id)
        .single();

      if (empresaError) throw empresaError;

      setOrcamento({
        ...orcData,
        cliente: orcData.clientes,
        items: items || [],
        empresa: empresa || { nome_fantasia: '' },
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleAssinar = async () => {
    if (!nomeAssinante.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    if (!arquivoAssinatura) {
      toast.error('Por favor, selecione uma imagem da assinatura');
      return;
    }

    setAssinando(true);

    try {
      // Upload da assinatura
      const fileExt = arquivoAssinatura.name.split('.').pop();
      const fileName = `${token}-${Date.now()}.${fileExt}`;
      const filePath = `assinaturas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, arquivoAssinatura);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      // Buscar orcamento_id
      const { data: tokenData } = await supabase
        .from('orcamento_tokens')
        .select('orcamento_id')
        .eq('token', token)
        .single();

      if (!tokenData) throw new Error('Token inválido');

      // Atualizar orçamento com assinatura
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({
          assinatura_url: publicUrl,
          assinado_em: new Date().toISOString(),
          assinante_nome: nomeAssinante,
          status: 'Aprovado',
        })
        .eq('id', tokenData.orcamento_id);

      if (updateError) throw updateError;

      toast.success('Orçamento assinado com sucesso!');
      await loadOrcamento();
    } catch (error: any) {
      toast.error('Erro ao assinar: ' + error.message);
    } finally {
      setAssinando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Orçamento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dataEmissao = new Date(orcamento.created_at).toLocaleDateString('pt-BR');
  const dataValidade = new Date(
    new Date(orcamento.created_at).getTime() + orcamento.validade_dias * 24 * 60 * 60 * 1000
  ).toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">Orçamento #{orcamento.numero}</CardTitle>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Empresa: <span className="font-medium text-foreground">{orcamento.empresa.nome_fantasia}</span>
              </p>
              {orcamento.empresa.email && (
                <p className="text-sm text-muted-foreground">
                  Email: <span className="font-medium text-foreground">{orcamento.empresa.email}</span>
                </p>
              )}
              {orcamento.empresa.telefone && (
                <p className="text-sm text-muted-foreground">
                  Telefone: <span className="font-medium text-foreground">{orcamento.empresa.telefone}</span>
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="font-medium">{orcamento.cliente.nome}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div>
                  <Badge variant={orcamento.status === 'Aprovado' ? 'default' : 'secondary'}>
                    {orcamento.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data de Emissão</Label>
                <p className="font-medium">{dataEmissao}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Válido até</Label>
                <p className="font-medium">{dataValidade}</p>
              </div>
            </div>

            {orcamento.descricao && (
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <p className="text-sm">{orcamento.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Itens do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orcamento.items.map((item, index) => (
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
                  R$ {orcamento.valor_total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {orcamento.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{orcamento.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Assinatura */}
        {orcamento.assinatura_url ? (
          <Card className="border-2 border-success">
            <CardHeader className="bg-success/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle className="text-success">Orçamento Assinado</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Assinado por</Label>
                <p className="font-medium">{orcamento.assinante_nome}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data da assinatura</Label>
                <p className="font-medium">
                  {new Date(orcamento.assinado_em!).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Assinatura</Label>
                <img
                  src={orcamento.assinatura_url}
                  alt="Assinatura"
                  className="mt-2 max-h-32 border rounded-lg p-2 bg-white"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Aprovar Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Seu Nome Completo *</Label>
                <Input
                  id="nome"
                  value={nomeAssinante}
                  onChange={(e) => setNomeAssinante(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assinatura">Imagem da Assinatura *</Label>
                <Input
                  id="assinatura"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArquivoAssinatura(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Envie uma foto da sua assinatura (PNG, JPG ou similar)
                </p>
              </div>

              <Button
                onClick={handleAssinar}
                disabled={assinando}
                className="w-full"
                size="lg"
              >
                {assinando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Assinar e Aprovar Orçamento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicoOrcamento;

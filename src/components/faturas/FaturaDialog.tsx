import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Loader2, Pencil, Receipt, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface FaturaDialogProps {
  faturaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

interface EmpresaInfo {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  website: string;
  logo_url: string;
  logo_position: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_borda_secoes: string;
  cor_borda_linhas: string;
}

interface Fatura {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  status: string;
  valor_total: number;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  observacoes: string;
  created_at: string;
  nfe_status?: string;
  nfe_numero?: string;
  nfe_serie?: string;
  nfe_chave_acesso?: string;
  nfe_protocolo?: string;
  nfe_data_emissao?: string;
  nfe_xml?: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
  };
  items: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
}

export const FaturaDialog = ({ faturaId, open, onOpenChange, onEdit }: FaturaDialogProps) => {
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emitindoNFe, setEmitindoNFe] = useState(false);

  useEffect(() => {
    if (faturaId && open) {
      loadFatura();
      loadEmpresaInfo();
    }
  }, [faturaId, open]);

  const loadEmpresaInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) setEmpresaInfo(data);
    } catch (error: any) {
      console.error('Erro ao carregar empresa:', error);
    }
  };

  const loadFatura = async () => {
    if (!faturaId) return;

    setLoading(true);
    try {
      const { data: faturaData, error: faturaError } = await supabase
        .from('faturas')
        .select(`
          id,
          numero,
          titulo,
          descricao,
          status,
          valor_total,
          data_vencimento,
          data_pagamento,
          forma_pagamento,
          observacoes,
          created_at,
          nfe_status,
          nfe_numero,
          nfe_serie,
          nfe_chave_acesso,
          nfe_protocolo,
          nfe_data_emissao,
          nfe_xml,
          clientes:cliente_id (
            nome,
            email,
            telefone
          )
        `)
        .eq('id', faturaId)
        .single();

      if (faturaError) throw faturaError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('fatura_items')
        .select('*')
        .eq('fatura_id', faturaId)
        .order('ordem');

      if (itemsError) throw itemsError;

      setFatura({
        ...faturaData,
        cliente: faturaData.clientes,
        items: itemsData || [],
      });
    } catch (error: any) {
      toast.error('Erro ao carregar fatura: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!fatura) return;

    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('enviar-fatura', {
        body: {
          clienteEmail: fatura.cliente.email,
          faturaId: faturaId,
        }
      });

      if (error) throw error;

      toast.success('Fatura enviada por email!');
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEmitirNFe = async () => {
    if (!faturaId) return;

    setEmitindoNFe(true);
    try {
      const { data, error } = await supabase.functions.invoke('emitir-nfe', {
        body: { faturaId },
      });

      if (error) throw error;

      toast.success('NF-e emitida com sucesso!');
      await loadFatura();
    } catch (error: any) {
      console.error('Erro ao emitir NF-e:', error);
      toast.error(error.message || 'Erro ao emitir NF-e');
    } finally {
      setEmitindoNFe(false);
    }
  };

  const getNFeStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'nao_emitida': { label: 'Não Emitida', variant: 'outline' },
      'processando': { label: 'Processando', variant: 'secondary' },
      'emitida': { label: 'Emitida', variant: 'default' },
      'cancelada': { label: 'Cancelada', variant: 'destructive' },
      'erro': { label: 'Erro', variant: 'destructive' },
    };

    const config = statusMap[status] || statusMap['nao_emitida'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pago': 'text-success',
      'Pendente': 'text-accent',
      'Vencido': 'text-destructive',
      'Cancelado': 'text-muted-foreground',
    };
    return colors[status as keyof typeof colors] || 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!fatura) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Layout customizado estilo documento */}
        
        <div className="space-y-6 p-2">
          {/* Cabeçalho estilo documento - Logo e Empresa */}
          <div 
            className={`pb-4 border-b-2 ${
              empresaInfo?.logo_url && empresaInfo?.logo_position === 'left' ? 'flex items-start gap-6' :
              empresaInfo?.logo_url && empresaInfo?.logo_position === 'right' ? 'flex items-start gap-6 flex-row-reverse' :
              ''
            }`}
            style={{ borderColor: empresaInfo?.cor_borda_secoes || empresaInfo?.cor_primaria || '#6366F1' }}
          >
            {/* Logo */}
            {empresaInfo?.logo_url && (
              <div className={`flex-shrink-0 ${empresaInfo.logo_position === 'center' ? 'w-full flex justify-center mb-4' : ''}`}>
                <img 
                  src={empresaInfo.logo_url} 
                  alt="Logo" 
                  className="h-20 object-contain"
                />
              </div>
            )}
            
            {/* Informações da Empresa */}
            <div className="flex-1">
              {empresaInfo && (
                <>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: empresaInfo.cor_primaria || '#6366F1' }}>
                    {empresaInfo.nome_fantasia}
                  </h2>
                  {empresaInfo.razao_social && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {empresaInfo.razao_social}
                    </p>
                  )}
                  {empresaInfo.endereco && (
                    <p className="text-xs text-muted-foreground mt-2">{empresaInfo.endereco}</p>
                  )}
                  {(empresaInfo.cidade || empresaInfo.estado || empresaInfo.cep) && (
                    <p className="text-xs text-muted-foreground">
                      {empresaInfo.cep && `${empresaInfo.cep} `}
                      {empresaInfo.cidade && `${empresaInfo.cidade}`}
                      {empresaInfo.estado && ` - ${empresaInfo.estado}`}
                    </p>
                  )}
                  <div className="mt-2 space-y-0.5">
                    {empresaInfo.telefone && (
                      <p className="text-xs text-muted-foreground">☎ {empresaInfo.telefone}</p>
                    )}
                    {empresaInfo.email && (
                      <p className="text-xs text-muted-foreground">✉ {empresaInfo.email}</p>
                    )}
                    {empresaInfo.website && (
                      <p className="text-xs text-muted-foreground">🌐 {empresaInfo.website}</p>
                    )}
                    {empresaInfo.cnpj && (
                      <p className="text-xs text-muted-foreground">CNPJ: {empresaInfo.cnpj}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Informações da Fatura - Lado Direito (quando logo não está no centro) */}
            {(!empresaInfo?.logo_url || empresaInfo?.logo_position !== 'center') && (
              <div className="text-right flex-shrink-0">
                <h1 className="text-4xl font-bold mb-2" style={{ color: empresaInfo?.cor_primaria || '#6366F1' }}>FATURA</h1>
                <p className="text-lg font-semibold">nº {fatura.numero}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Emitida em:</span>{' '}
                    {new Date(fatura.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Vencimento:</span>{' '}
                    {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                  <p className={`font-medium ${getStatusColor(fatura.status)}`}>
                    Status: {fatura.status}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Informações da Fatura - Abaixo (quando logo está no centro) */}
          {empresaInfo?.logo_url && empresaInfo?.logo_position === 'center' && (
            <div className="text-center pb-4 border-b-2" style={{ borderColor: empresaInfo?.cor_secundaria || '#E5E7EB' }}>
              <h1 className="text-4xl font-bold mb-2" style={{ color: empresaInfo?.cor_primaria || '#6366F1' }}>FATURA</h1>
              <p className="text-lg font-semibold">nº {fatura.numero}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">Emitida em:</span>{' '}
                  {new Date(fatura.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Vencimento:</span>{' '}
                  {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                </p>
                <p className={`font-medium ${getStatusColor(fatura.status)}`}>
                  Status: {fatura.status}
                </p>
              </div>
            </div>
          )}

          {/* Cliente */}
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: empresaInfo?.cor_secundaria || '#E5E7EB',
              borderLeft: `4px solid ${empresaInfo?.cor_borda_secoes || empresaInfo?.cor_primaria || '#6366F1'}`
            }}
          >
            <h3 className="font-semibold mb-2">Cliente</h3>
            <p className="text-lg">{fatura.cliente.nome}</p>
            <p className="text-sm text-muted-foreground">{fatura.cliente.email}</p>
            {fatura.cliente.telefone && (
              <p className="text-sm text-muted-foreground">{fatura.cliente.telefone}</p>
            )}
          </div>

          {/* Detalhes */}
          <div>
            <h3 className="font-semibold mb-2">Detalhes</h3>
            <p className="text-lg font-medium">{fatura.titulo}</p>
            {fatura.descricao && (
              <p className="text-sm text-muted-foreground mt-1">{fatura.descricao}</p>
            )}
            <div className="flex gap-4 mt-2 flex-wrap">
              <span className="text-sm">
                Status: <span className={`font-medium ${getStatusColor(fatura.status)}`}>{fatura.status}</span>
              </span>
              <span className="text-sm">
                Vencimento: <span className="font-medium">
                  {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                </span>
              </span>
              {fatura.forma_pagamento && (
                <span className="text-sm">
                  Forma: <span className="font-medium">{fatura.forma_pagamento}</span>
                </span>
              )}
              {fatura.data_pagamento && (
                <span className="text-sm">
                  Pago em: <span className="font-medium">
                    {new Date(fatura.data_pagamento).toLocaleDateString('pt-BR')}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="font-semibold mb-3">Itens</h3>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: empresaInfo?.cor_borda_linhas || '#E5E7EB' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: empresaInfo?.cor_primaria || '#6366F1' }}>
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-white">Descrição</th>
                    <th className="text-center p-3 text-sm font-medium text-white">Qtd</th>
                    <th className="text-center p-3 text-sm font-medium text-white">Und</th>
                    <th className="text-right p-3 text-sm font-medium text-white">Valor Unit.</th>
                    <th className="text-right p-3 text-sm font-medium text-white">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {fatura.items.map((item, index) => (
                    <tr 
                      key={index}
                      style={{ 
                        backgroundColor: index % 2 === 0 ? 'white' : (empresaInfo?.cor_secundaria || '#E5E7EB'),
                        borderTop: `1px solid ${empresaInfo?.cor_borda_linhas || '#E5E7EB'}`
                      }}
                    >
                      <td className="p-3">{item.descricao}</td>
                      <td className="text-center p-3">{item.quantidade}</td>
                      <td className="text-center p-3">{item.unidade}</td>
                      <td className="text-right p-3">R$ {item.valor_unitario.toFixed(2)}</td>
                      <td className="text-right p-3 font-medium">
                        R$ {item.valor_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: empresaInfo?.cor_primaria || '#6366F1' }}>
                    <td colSpan={4} className="text-right p-3 font-semibold text-white">
                      Valor Total:
                    </td>
                    <td className="text-right p-3 font-bold text-white text-lg">
                      R$ {fatura.valor_total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observações */}
          {fatura.observacoes && (
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: empresaInfo?.cor_secundaria || '#E5E7EB',
                borderLeft: `4px solid ${empresaInfo?.cor_borda_secoes || empresaInfo?.cor_primaria || '#6366F1'}`
              }}
            >
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm whitespace-pre-wrap">{fatura.observacoes}</p>
            </div>
          )}

          {/* Seção NF-e */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Nota Fiscal Eletrônica
                </h3>
                <p className="text-sm text-muted-foreground">
                  Emita a NF-e referente a esta fatura
                </p>
              </div>
              {fatura.nfe_status && getNFeStatusBadge(fatura.nfe_status)}
            </div>

            {fatura.nfe_status === 'emitida' && (
              <div className="bg-muted rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">NF-e Emitida com Sucesso</p>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <p><strong>Número:</strong> {fatura.nfe_numero} / <strong>Série:</strong> {fatura.nfe_serie}</p>
                      <p className="break-all"><strong>Chave de Acesso:</strong> {fatura.nfe_chave_acesso}</p>
                      <p><strong>Protocolo:</strong> {fatura.nfe_protocolo}</p>
                      <p><strong>Data de Emissão:</strong> {fatura.nfe_data_emissao && new Date(fatura.nfe_data_emissao).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fatura.nfe_status === 'erro' && (
              <div className="bg-destructive/10 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Erro ao Emitir NF-e</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifique os dados da fatura e suas configurações fiscais.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {(!fatura.nfe_status || fatura.nfe_status === 'nao_emitida' || fatura.nfe_status === 'erro') && (
                <Button 
                  onClick={handleEmitirNFe} 
                  disabled={emitindoNFe}
                  variant="default"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  {emitindoNFe ? 'Emitindo...' : 'Emitir NF-e'}
                </Button>
              )}
              
              {fatura.nfe_status === 'emitida' && fatura.nfe_xml && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([fatura.nfe_xml!], { type: 'application/xml' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `NFe_${fatura.nfe_chave_acesso}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar XML
                </Button>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={() => {
                onEdit();
                onOpenChange(false);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            <Button variant="outline" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail} variant="hero">
              <Send className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

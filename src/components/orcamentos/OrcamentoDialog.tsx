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
import { FileText, Send, Loader2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrcamentoDialogProps {
  orcamentoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

interface Orcamento {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  status: string;
  valor_total: number;
  validade_dias: number;
  observacoes: string;
  created_at: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  items: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
}

interface EmpresaInfo {
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  website?: string;
}

export const OrcamentoDialog = ({ orcamentoId, open, onOpenChange, onEdit }: OrcamentoDialogProps) => {
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [convertendo, setConvertendo] = useState(false);

  useEffect(() => {
    if (orcamentoId && open) {
      loadOrcamento();
      loadEmpresaInfo();
    }
  }, [orcamentoId, open]);

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
      setEmpresaInfo(data);
    } catch (error: any) {
      console.error('Erro ao carregar informações da empresa:', error);
    }
  };

  const loadOrcamento = async () => {
    if (!orcamentoId) return;

    setLoading(true);
    try {
      const { data: orcamentoData, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          numero,
          titulo,
          descricao,
          status,
          valor_total,
          validade_dias,
          observacoes,
          created_at,
          clientes:cliente_id (
            nome,
            email,
            telefone,
            endereco,
            cidade,
            estado,
            cep
          )
        `)
        .eq('id', orcamentoId)
        .single();

      if (orcamentoError) throw orcamentoError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('orcamento_items')
        .select('*')
        .eq('orcamento_id', orcamentoId)
        .order('ordem');

      if (itemsError) throw itemsError;

      setOrcamento({
        ...orcamentoData,
        cliente: orcamentoData.clientes,
        items: itemsData || [],
      });
    } catch (error: any) {
      toast.error('Erro ao carregar orçamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!orcamento) return;

    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('enviar-orcamento', {
        body: {
          clienteEmail: orcamento.cliente.email,
          orcamentoId: orcamentoId,
        }
      });

      if (error) throw error;

      toast.success('Orçamento enviado por email!');
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleConvertToFatura = async () => {
    if (!orcamento) return;

    setConvertendo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar número da fatura
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_fatura_numero');
      
      if (numeroError) throw numeroError;

      // Criar fatura
      const { data: novaFatura, error: faturaError } = await supabase
        .from('faturas')
        .insert([{
          user_id: user.id,
          cliente_id: orcamento.id,
          numero: numeroData,
          titulo: orcamento.titulo,
          descricao: orcamento.descricao,
          valor_total: orcamento.valor_total,
          status: 'Pendente',
          data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          observacoes: orcamento.observacoes,
        }])
        .select()
        .single();

      if (faturaError) throw faturaError;

      // Copiar itens do orçamento para a fatura
      const faturaItems = orcamento.items.map((item, index) => ({
        fatura_id: novaFatura.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        ordem: index,
      }));

      const { error: itemsError } = await supabase
        .from('fatura_items')
        .insert(faturaItems);

      if (itemsError) throw itemsError;

      // Atualizar status do orçamento
      await supabase
        .from('orcamentos')
        .update({ status: 'Aprovado' })
        .eq('id', orcamento.id);

      toast.success('Fatura criada com sucesso!');
      onOpenChange(false);
      navigate('/faturas');
    } catch (error: any) {
      toast.error('Erro ao converter para fatura: ' + error.message);
    } finally {
      setConvertendo(false);
    }
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

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Remove o DialogHeader padrão e cria um layout customizado tipo documento */}
        
        <div className="space-y-6 p-2">
          {/* Cabeçalho estilo documento - Empresa e Orçamento */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-primary/20">
            {/* Informações da Empresa - Lado Esquerdo */}
            <div className="flex-1">
              {empresaInfo && (
                <>
                  <h2 className="text-2xl font-bold text-primary mb-1">
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

            {/* Informações do Orçamento - Lado Direito */}
            <div className="text-right">
              <h1 className="text-4xl font-bold text-primary mb-2">ORÇAMENTO</h1>
              <p className="text-lg font-semibold">nº {orcamento.numero}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">Em data de:</span>{' '}
                  {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Válido até:</span>{' '}
                  {new Date(new Date(orcamento.created_at).getTime() + orcamento.validade_dias * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Validade:</span> {orcamento.validade_dias} dias
                </p>
              </div>
            </div>
          </div>

          {/* Seção do Cliente */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase">Cliente</h3>
            <p className="text-lg font-bold">{orcamento.cliente.nome}</p>
            {orcamento.cliente.endereco && (
              <p className="text-sm text-muted-foreground mt-1">{orcamento.cliente.endereco}</p>
            )}
            {(orcamento.cliente.cidade || orcamento.cliente.cep) && (
              <p className="text-sm text-muted-foreground">
                {orcamento.cliente.cep && `${orcamento.cliente.cep} `}
                {orcamento.cliente.cidade && `${orcamento.cliente.cidade}`}
                {orcamento.cliente.estado && ` - ${orcamento.cliente.estado}`}
              </p>
            )}
          </div>

          {/* Título/Descrição do Orçamento */}
          {orcamento.titulo && (
            <div className="text-sm">
              <p className="font-semibold">{orcamento.titulo}</p>
              {orcamento.descricao && (
                <p className="text-muted-foreground mt-1">{orcamento.descricao}</p>
              )}
            </div>
          )}

          {/* Tabela de Itens */}
          <div>
            <div className="rounded-lg overflow-hidden border border-border">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left p-3 text-sm font-semibold">Descrição</th>
                    <th className="text-center p-3 text-sm font-semibold w-20">Qtd.</th>
                    <th className="text-center p-3 text-sm font-semibold w-24">Unidade</th>
                    <th className="text-right p-3 text-sm font-semibold w-32">Preço Un.</th>
                    <th className="text-right p-3 text-sm font-semibold w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {orcamento.items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-secondary/20' : ''}>
                      <td className="p-3 text-sm">{item.descricao}</td>
                      <td className="text-center p-3 text-sm">{item.quantidade}</td>
                      <td className="text-center p-3 text-sm">{item.unidade}</td>
                      <td className="text-right p-3 text-sm">
                        R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-right p-3 text-sm font-medium">
                        R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mt-4">
              <div className="bg-primary text-primary-foreground rounded-lg px-6 py-3 min-w-[280px]">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total a Pagar</span>
                  <span className="text-2xl font-bold">
                    R$ {orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {orcamento.observacoes && (
            <div className="border border-border rounded-lg p-4 bg-secondary/20">
              <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                {orcamento.observacoes}
              </p>
            </div>
          )}

          {/* Rodapé com informações da empresa */}
          {empresaInfo && (
            <div className="pt-4 border-t border-border text-xs text-muted-foreground text-center space-y-1">
              <p className="font-medium">{empresaInfo.nome_fantasia}</p>
              {empresaInfo.razao_social && empresaInfo.cnpj && (
                <p>{empresaInfo.razao_social} - CNPJ: {empresaInfo.cnpj}</p>
              )}
              {empresaInfo.endereco && (
                <p>
                  {empresaInfo.endereco}
                  {empresaInfo.cidade && ` - ${empresaInfo.cidade}`}
                  {empresaInfo.estado && ` - ${empresaInfo.estado}`}
                </p>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-3 justify-end pt-4 border-t">
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
            <Button variant="outline" onClick={handleSendEmail} disabled={sendingEmail}>
              <Send className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Enviando...' : 'Enviar Email'}
            </Button>
            <Button 
              onClick={handleConvertToFatura}
              disabled={convertendo || orcamento.status === 'Aprovado'}
              className="bg-gradient-primary"
            >
              <FileText className="h-4 w-4 mr-2" />
              {convertendo ? 'Convertendo...' : 'Converter em Fatura'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

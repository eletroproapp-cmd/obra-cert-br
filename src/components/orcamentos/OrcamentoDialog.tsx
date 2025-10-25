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
  };
  items: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
}

export const OrcamentoDialog = ({ orcamentoId, open, onOpenChange, onEdit }: OrcamentoDialogProps) => {
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [convertendo, setConvertendo] = useState(false);

  useEffect(() => {
    if (orcamentoId && open) {
      loadOrcamento();
    }
  }, [orcamentoId, open]);

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
            telefone
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Orçamento {orcamento.numero}</DialogTitle>
          <DialogDescription>
            Criado em {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente */}
          <div className="p-4 bg-secondary/50 rounded-lg">
            <h3 className="font-semibold mb-2">Cliente</h3>
            <p className="text-lg">{orcamento.cliente.nome}</p>
            <p className="text-sm text-muted-foreground">{orcamento.cliente.email}</p>
            {orcamento.cliente.telefone && (
              <p className="text-sm text-muted-foreground">{orcamento.cliente.telefone}</p>
            )}
          </div>

          {/* Detalhes */}
          <div>
            <h3 className="font-semibold mb-2">Detalhes</h3>
            <p className="text-lg font-medium">{orcamento.titulo}</p>
            {orcamento.descricao && (
              <p className="text-sm text-muted-foreground mt-1">{orcamento.descricao}</p>
            )}
            <div className="flex gap-4 mt-2">
              <span className="text-sm">
                Status: <span className="font-medium">{orcamento.status}</span>
              </span>
              <span className="text-sm">
                Validade: <span className="font-medium">{orcamento.validade_dias} dias</span>
              </span>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="font-semibold mb-3">Itens</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Descrição</th>
                    <th className="text-center p-3 text-sm font-medium">Qtd</th>
                    <th className="text-center p-3 text-sm font-medium">Und</th>
                    <th className="text-right p-3 text-sm font-medium">Valor Unit.</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamento.items.map((item, index) => (
                    <tr key={index} className="border-t">
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
                <tfoot className="bg-secondary/50">
                  <tr>
                    <td colSpan={4} className="text-right p-3 font-semibold">
                      Valor Total:
                    </td>
                    <td className="text-right p-3 font-bold text-primary text-lg">
                      R$ {orcamento.valor_total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observações */}
          {orcamento.observacoes && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm whitespace-pre-wrap">{orcamento.observacoes}</p>
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

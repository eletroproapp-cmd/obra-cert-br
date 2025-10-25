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

interface FaturaDialogProps {
  faturaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
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
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (faturaId && open) {
      loadFatura();
    }
  }, [faturaId, open]);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Fatura {fatura.numero}</DialogTitle>
          <DialogDescription>
            Emitida em {new Date(fatura.created_at).toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente */}
          <div className="p-4 bg-secondary/50 rounded-lg">
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
                  {fatura.items.map((item, index) => (
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
                    <td className="text-right p-3 font-bold text-accent text-lg">
                      R$ {fatura.valor_total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observações */}
          {fatura.observacoes && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm whitespace-pre-wrap">{fatura.observacoes}</p>
            </div>
          )}

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

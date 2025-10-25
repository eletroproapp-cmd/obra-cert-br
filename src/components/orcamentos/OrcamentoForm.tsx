import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const orcamentoSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  validade_dias: z.number().min(1).default(30),
  observacoes: z.string().optional(),
  status: z.enum(['Pendente', 'Aprovado', 'Rejeitado', 'Em Análise']).default('Pendente'),
});

type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
}

interface OrcamentoFormProps {
  onSuccess?: () => void;
  orcamentoId?: string;
}

export const OrcamentoForm = ({ onSuccess, orcamentoId }: OrcamentoFormProps) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [items, setItems] = useState<OrcamentoItem[]>([
    { descricao: '', quantidade: 1, unidade: 'un', valor_unitario: 0, valor_total: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      status: 'Pendente',
      validade_dias: 30,
    }
  });

  const selectedClienteId = watch('cliente_id');

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, email')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar clientes');
      return;
    }

    setClientes(data || []);
  };

  const calcularValorTotal = () => {
    return items.reduce((sum, item) => sum + item.valor_total, 0);
  };

  const addItem = () => {
    setItems([...items, { descricao: '', quantidade: 1, unidade: 'un', valor_unitario: 0, valor_total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrcamentoItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantidade' || field === 'valor_unitario') {
      newItems[index].valor_total = newItems[index].quantidade * newItems[index].valor_unitario;
    }
    
    setItems(newItems);
  };

  const onSubmit = async (data: OrcamentoFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const valorTotal = calcularValorTotal();

      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_orcamento_numero');

      if (numeroError) throw numeroError;

      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .insert({
          user_id: user.id,
          cliente_id: data.cliente_id,
          numero: numeroData,
          titulo: data.titulo,
          descricao: data.descricao,
          status: data.status,
          valor_total: valorTotal,
          validade_dias: data.validade_dias,
          observacoes: data.observacoes,
        })
        .select()
        .single();

      if (orcamentoError) throw orcamentoError;

      const itemsToInsert = items.map((item, index) => ({
        orcamento_id: orcamento.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        ordem: index,
      }));

      const { error: itemsError } = await supabase
        .from('orcamento_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Orçamento criado com sucesso!');
      onSuccess?.();
      return orcamento;
    } catch (error: any) {
      toast.error('Erro ao criar orçamento: ' + error.message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async (data: OrcamentoFormData) => {
    if (!selectedClienteId) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    setIsSendingEmail(true);

    try {
      const created = await onSubmit(data);

      const cliente = clientes.find(c => c.id === selectedClienteId);
      if (!cliente?.email) {
        toast.error('Cliente sem email cadastrado');
        return;
      }
      if (!created?.id) {
        toast.error('Não foi possível criar o orçamento');
        return;
      }

      const { error } = await supabase.functions.invoke('enviar-orcamento', {
        body: {
          clienteEmail: cliente.email,
          orcamentoId: created.id,
        }
      });

      if (error) throw error;

      toast.success('Orçamento enviado por email!');
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cliente">Cliente *</Label>
          <Select onValueChange={(value) => setValue('cliente_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cliente_id && (
            <p className="text-sm text-destructive">{errors.cliente_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            {...register('titulo')}
            placeholder="Ex: Instalação elétrica residencial"
          />
          {errors.titulo && (
            <p className="text-sm text-destructive">{errors.titulo.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva o escopo do orçamento"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Itens do Orçamento</Label>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-card">
            <div className="grid md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <Label className="text-xs">Descrição *</Label>
                <Input
                  value={item.descricao}
                  onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                  placeholder="Ex: Tomada 2P+T 10A"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Quantidade *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantidade}
                  onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs">Und</Label>
                <Input
                  value={item.unidade}
                  onChange={(e) => updateItem(index, 'unidade', e.target.value)}
                  placeholder="un"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Valor Unit. *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.valor_unitario}
                  onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="md:col-span-2 flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Total</Label>
                  <Input
                    value={item.valor_total.toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end items-center gap-4 p-4 bg-secondary/50 rounded-lg">
          <span className="text-lg font-semibold">Valor Total:</span>
          <span className="text-2xl font-bold text-primary">
            R$ {calcularValorTotal().toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validade_dias">Validade (dias)</Label>
          <Input
            id="validade_dias"
            type="number"
            {...register('validade_dias', { valueAsNumber: true })}
            defaultValue={30}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value: any) => setValue('status', value)} defaultValue="Pendente">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Análise">Em Análise</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais sobre o orçamento"
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="submit" disabled={isSubmitting} variant="hero">
          {isSubmitting ? 'Salvando...' : 'Salvar Orçamento'}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit(handleSendEmail)}
          disabled={isSendingEmail || !selectedClienteId}
          variant="outline"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSendingEmail ? 'Enviando...' : 'Salvar e Enviar Email'}
        </Button>
      </div>
    </form>
  );
};

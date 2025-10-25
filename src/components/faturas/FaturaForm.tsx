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
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Plus, Trash2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const faturaSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  status: z.enum(['Pendente', 'Pago', 'Vencido', 'Cancelado']).default('Pendente'),
  forma_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

type FaturaFormData = z.infer<typeof faturaSchema>;

interface FaturaItem {
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

interface FaturaFormProps {
  onSuccess?: () => void;
  faturaId?: string;
}

export const FaturaForm = ({ onSuccess, faturaId }: FaturaFormProps) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [items, setItems] = useState<FaturaItem[]>([
    { descricao: '', quantidade: 1, unidade: 'un', valor_unitario: 0, valor_total: 0 }
  ]);
  const [catalogoOptions, setCatalogoOptions] = useState<ComboboxOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FaturaFormData>({
    resolver: zodResolver(faturaSchema),
    defaultValues: {
      status: 'Pendente',
    }
  });

  const selectedClienteId = watch('cliente_id');

  useEffect(() => {
    loadClientes();
    loadCatalogo();
    if (faturaId) {
      loadFatura();
    }
  }, [faturaId]);

  const loadFatura = async () => {
    try {
      const { data: faturaData, error: faturaError } = await supabase
        .from('faturas')
        .select('*')
        .eq('id', faturaId)
        .single();

      if (faturaError) throw faturaError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('fatura_items')
        .select('*')
        .eq('fatura_id', faturaId)
        .order('ordem');

      if (itemsError) throw itemsError;

      reset({
        cliente_id: faturaData.cliente_id || '',
        titulo: faturaData.titulo,
        descricao: faturaData.descricao || '',
        data_vencimento: faturaData.data_vencimento,
        status: faturaData.status as any,
        forma_pagamento: faturaData.forma_pagamento || '',
        observacoes: faturaData.observacoes || '',
      });

      setItems(itemsData.map(item => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
      })));
    } catch (error: any) {
      toast.error('Erro ao carregar fatura');
    }
  };

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

  const loadCatalogo = async () => {
    try {
      const [materiaisRes, servicosRes] = await Promise.all([
        supabase.from('materiais').select('id, nome, preco_venda, unidade').order('nome'),
        supabase.from('servicos').select('id, nome, preco_hora, unidade').order('nome')
      ]);

      const options: ComboboxOption[] = [];

      if (materiaisRes.data) {
        materiaisRes.data.forEach(m => {
          options.push({
            value: `material-${m.id}`,
            label: `${m.nome} - R$ ${m.preco_venda.toFixed(2)}/${m.unidade}`,
            metadata: { tipo: 'material', preco: m.preco_venda, unidade: m.unidade, nome: m.nome }
          });
        });
      }

      if (servicosRes.data) {
        servicosRes.data.forEach(s => {
          options.push({
            value: `servico-${s.id}`,
            label: `${s.nome} - R$ ${s.preco_hora.toFixed(2)}/${s.unidade}`,
            metadata: { tipo: 'servico', preco: s.preco_hora, unidade: s.unidade, nome: s.nome }
          });
        });
      }

      setCatalogoOptions(options);
    } catch (error: any) {
      toast.error('Erro ao carregar catálogo');
    }
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

  const updateItem = (index: number, field: keyof FaturaItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantidade' || field === 'valor_unitario') {
      newItems[index].valor_total = newItems[index].quantidade * newItems[index].valor_unitario;
    }
    
    setItems(newItems);
  };

  const onSubmit = async (data: FaturaFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const valorTotal = calcularValorTotal();

      if (faturaId) {
        // Atualizar fatura existente
        const { error: faturaError } = await supabase
          .from('faturas')
          .update({
            cliente_id: data.cliente_id,
            titulo: data.titulo,
            descricao: data.descricao,
            status: data.status,
            valor_total: valorTotal,
            data_vencimento: data.data_vencimento,
            forma_pagamento: data.forma_pagamento,
            observacoes: data.observacoes,
          })
          .eq('id', faturaId);

        if (faturaError) throw faturaError;

        // Deletar itens antigos
        await supabase
          .from('fatura_items')
          .delete()
          .eq('fatura_id', faturaId);

        // Inserir novos itens
        const itemsToInsert = items.map((item, index) => ({
          fatura_id: faturaId,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          ordem: index,
        }));

        const { error: itemsError } = await supabase
          .from('fatura_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        toast.success('Fatura atualizada com sucesso!');
        onSuccess?.();
        return { id: faturaId };
      } else {
        // Criar nova fatura
        const { data: numeroData, error: numeroError } = await supabase
          .rpc('generate_fatura_numero');

        if (numeroError) throw numeroError;

        const { data: fatura, error: faturaError } = await supabase
          .from('faturas')
          .insert({
            user_id: user.id,
            cliente_id: data.cliente_id,
            numero: numeroData,
            titulo: data.titulo,
            descricao: data.descricao,
            status: data.status,
            valor_total: valorTotal,
            data_vencimento: data.data_vencimento,
            forma_pagamento: data.forma_pagamento,
            observacoes: data.observacoes,
          })
          .select()
          .single();

        if (faturaError) throw faturaError;

        const itemsToInsert = items.map((item, index) => ({
          fatura_id: fatura.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          ordem: index,
        }));

        const { error: itemsError } = await supabase
          .from('fatura_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        toast.success('Fatura criada com sucesso!');
        onSuccess?.();
        return fatura;
      }
    } catch (error: any) {
      toast.error('Erro ao salvar fatura: ' + error.message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async (data: FaturaFormData) => {
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
        toast.error('Não foi possível criar a fatura');
        return;
      }

      const { error } = await supabase.functions.invoke('enviar-fatura', {
        body: {
          clienteEmail: cliente.email,
          faturaId: created.id,
        }
      });

      if (error) throw error;

      toast.success('Fatura enviada por email!');
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
            placeholder="Ex: Serviço de instalação elétrica"
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
          placeholder="Descreva o serviço prestado"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Itens da Fatura</Label>
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
                <Combobox
                  options={catalogoOptions}
                  value={item.descricao}
                  onSelect={(option) => {
                    updateItem(index, 'descricao', option.metadata.nome);
                    updateItem(index, 'unidade', option.metadata.unidade);
                    updateItem(index, 'valor_unitario', option.metadata.preco);
                  }}
                  placeholder="Buscar no catálogo ou digite..."
                  searchPlaceholder="Buscar material ou serviço..."
                  emptyMessage="Nenhum item encontrado no catálogo"
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
          <span className="text-2xl font-bold text-accent">
            R$ {calcularValorTotal().toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
          <Input
            id="data_vencimento"
            type="date"
            {...register('data_vencimento')}
            required
          />
          {errors.data_vencimento && (
            <p className="text-sm text-destructive">{errors.data_vencimento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value: any) => setValue('status', value)} defaultValue="Pendente">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
          <Select onValueChange={(value) => setValue('forma_pagamento', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="Boleto">Boleto</SelectItem>
              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
              <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
              <SelectItem value="Transferência">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais sobre a fatura"
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="submit" disabled={isSubmitting} variant="hero">
          {isSubmitting ? 'Salvando...' : (faturaId ? 'Atualizar Fatura' : 'Salvar Fatura')}
        </Button>
        {!faturaId && (
          <Button
            type="button"
            onClick={handleSubmit(handleSendEmail)}
            disabled={isSendingEmail || !selectedClienteId}
            variant="outline"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSendingEmail ? 'Enviando...' : 'Salvar e Enviar Email'}
          </Button>
        )}
      </div>
    </form>
  );
};

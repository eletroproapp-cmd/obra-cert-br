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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

const servicoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  codigo: z.string().optional(),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  descricao: z.string().optional(),
  unidade: z.string().default('h'),
  preco_hora: z.number().min(0, 'Preço deve ser maior que zero'),
  tempo_estimado: z.number().min(0).default(1),
  observacoes: z.string().optional(),
});

type ServicoFormData = z.infer<typeof servicoSchema>;

interface ServicoFormProps {
  onSuccess?: () => void;
}

export const ServicoForm = ({ onSuccess }: ServicoFormProps) => {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      unidade: 'h',
      tempo_estimado: 1,
    }
  });

  const onSubmit = async (data: ServicoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const payload = {
        ...data,
        user_id: user.id,
      } as unknown as Database['public']['Tables']['servicos']['Insert'];

      const { error } = await supabase
        .from('servicos')
        .insert([payload]);

      if (error) throw error;

      toast.success('Serviço cadastrado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao cadastrar serviço: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Serviço *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Instalação de Tomada"
          />
          {errors.nome && (
            <p className="text-sm text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="codigo">Código</Label>
          <Input
            id="codigo"
            {...register('codigo')}
            placeholder="Ex: SRV-001"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select onValueChange={(value) => setValue('categoria', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Instalação">Instalação</SelectItem>
              <SelectItem value="Manutenção">Manutenção</SelectItem>
              <SelectItem value="Reparo">Reparo</SelectItem>
              <SelectItem value="Projeto">Projeto</SelectItem>
              <SelectItem value="Consultoria">Consultoria</SelectItem>
              <SelectItem value="Inspeção">Inspeção</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          {errors.categoria && (
            <p className="text-sm text-destructive">{errors.categoria.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Select onValueChange={(value) => setValue('unidade', value)} defaultValue="h">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h">Hora</SelectItem>
              <SelectItem value="dia">Dia</SelectItem>
              <SelectItem value="un">Unidade</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva o serviço"
          rows={2}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preco_hora">Preço por Unidade *</Label>
          <Input
            id="preco_hora"
            type="number"
            step="0.01"
            min="0"
            {...register('preco_hora', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.preco_hora && (
            <p className="text-sm text-destructive">{errors.preco_hora.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tempo_estimado">Tempo Estimado</Label>
          <Input
            id="tempo_estimado"
            type="number"
            step="0.5"
            min="0"
            {...register('tempo_estimado', { valueAsNumber: true })}
            defaultValue={1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais"
          rows={2}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} variant="hero">
          {isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
        </Button>
      </div>
    </form>
  );
};
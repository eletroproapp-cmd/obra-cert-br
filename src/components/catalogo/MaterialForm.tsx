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

const materialSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  codigo: z.string().optional(),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  descricao: z.string().optional(),
  unidade: z.string().default('un'),
  preco_custo: z.number().min(0, 'Preço deve ser maior que zero'),
  preco_venda: z.number().min(0, 'Preço deve ser maior que zero'),
  estoque_atual: z.number().min(0).default(0),
  estoque_minimo: z.number().min(0).default(0),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  onSuccess?: () => void;
}

export const MaterialForm = ({ onSuccess }: MaterialFormProps) => {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      unidade: 'un',
      estoque_atual: 0,
      estoque_minimo: 0,
    }
  });

  const onSubmit = async (data: MaterialFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('materiais')
        .insert({
          ...data,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('Material cadastrado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao cadastrar material: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Material *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Cabo Flexível 2,5mm"
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
            placeholder="Ex: CAB-2.5"
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
              <SelectItem value="Cabos e Fios">Cabos e Fios</SelectItem>
              <SelectItem value="Disjuntores">Disjuntores</SelectItem>
              <SelectItem value="Tomadas e Interruptores">Tomadas e Interruptores</SelectItem>
              <SelectItem value="Quadros Elétricos">Quadros Elétricos</SelectItem>
              <SelectItem value="Eletrodutos">Eletrodutos</SelectItem>
              <SelectItem value="Luminárias">Luminárias</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          {errors.categoria && (
            <p className="text-sm text-destructive">{errors.categoria.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Input
            id="unidade"
            {...register('unidade')}
            placeholder="un, m, kg, caixa"
            defaultValue="un"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva o material"
          rows={2}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preco_custo">Preço de Custo *</Label>
          <Input
            id="preco_custo"
            type="number"
            step="0.01"
            min="0"
            {...register('preco_custo', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.preco_custo && (
            <p className="text-sm text-destructive">{errors.preco_custo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco_venda">Preço de Venda *</Label>
          <Input
            id="preco_venda"
            type="number"
            step="0.01"
            min="0"
            {...register('preco_venda', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.preco_venda && (
            <p className="text-sm text-destructive">{errors.preco_venda.message}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estoque_atual">Estoque Atual</Label>
          <Input
            id="estoque_atual"
            type="number"
            min="0"
            {...register('estoque_atual', { valueAsNumber: true })}
            defaultValue={0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
          <Input
            id="estoque_minimo"
            type="number"
            min="0"
            {...register('estoque_minimo', { valueAsNumber: true })}
            defaultValue={0}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} variant="hero">
          {isSubmitting ? 'Salvando...' : 'Salvar Material'}
        </Button>
      </div>
    </form>
  );
};

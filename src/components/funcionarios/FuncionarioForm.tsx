import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const funcionarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().optional(),
  salario_hora: z.number().min(0).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  data_admissao: z.string().optional(),
  ativo: z.boolean().default(true),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface FuncionarioFormProps {
  onSuccess?: () => void;
  funcionarioId?: string;
}

export const FuncionarioForm = ({ onSuccess, funcionarioId }: FuncionarioFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      ativo: true,
    }
  });

  const ativo = watch('ativo');

  useEffect(() => {
    if (funcionarioId) {
      loadFuncionario();
    }
  }, [funcionarioId]);

  const loadFuncionario = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', funcionarioId)
        .single();

      if (error) throw error;

      reset({
        nome: data.nome,
        cargo: data.cargo || '',
        salario_hora: data.salario_hora || 0,
        email: data.email || '',
        telefone: data.telefone || '',
        data_admissao: data.data_admissao || '',
        ativo: data.ativo,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar funcionário');
    }
  };

  const onSubmit = async (data: FuncionarioFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (funcionarioId) {
        const { error } = await supabase
          .from('funcionarios')
          .update({
            nome: data.nome,
            cargo: data.cargo,
            salario_hora: data.salario_hora,
            email: data.email,
            telefone: data.telefone,
            data_admissao: data.data_admissao || null,
            ativo: data.ativo,
          })
          .eq('id', funcionarioId);

        if (error) throw error;
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('funcionarios')
          .insert({
            user_id: user.id,
            nome: data.nome,
            cargo: data.cargo,
            salario_hora: data.salario_hora,
            email: data.email,
            telefone: data.telefone,
            data_admissao: data.data_admissao || null,
            ativo: data.ativo,
          });

        if (error) throw error;
        toast.success('Funcionário cadastrado com sucesso!');
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao salvar funcionário: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Nome completo"
          />
          {errors.nome && (
            <p className="text-sm text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Input
            id="cargo"
            {...register('cargo')}
            placeholder="Ex: Eletricista"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            {...register('telefone')}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salario_hora">Salário por Hora (R$)</Label>
          <Input
            id="salario_hora"
            type="number"
            step="0.01"
            {...register('salario_hora', { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_admissao">Data de Admissão</Label>
          <Input
            id="data_admissao"
            type="date"
            {...register('data_admissao')}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={ativo}
          onCheckedChange={(checked) => setValue('ativo', checked)}
        />
        <Label htmlFor="ativo">Funcionário ativo</Label>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={isSubmitting} variant="hero">
          {isSubmitting ? 'Salvando...' : funcionarioId ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};

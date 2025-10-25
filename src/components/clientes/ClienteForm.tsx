import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  onSuccess?: () => void;
}

export const ClienteForm = ({ onSuccess }: ClienteFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  });

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('clientes')
        .insert({
          user_id: user.id,
          ...data,
        });

      if (error) throw error;

      toast.success('Cliente cadastrado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao cadastrar cliente: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome / Razão Social *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Nome completo ou empresa"
          />
          {errors.nome && (
            <p className="text-sm text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
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
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            {...register('telefone')}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
          <Input
            id="cpf_cnpj"
            {...register('cpf_cnpj')}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          {...register('endereco')}
          placeholder="Rua, número, complemento"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            {...register('cidade')}
            placeholder="Cidade"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            {...register('estado')}
            placeholder="UF"
            maxLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            {...register('cep')}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} variant="hero">
          {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </form>
  );
};

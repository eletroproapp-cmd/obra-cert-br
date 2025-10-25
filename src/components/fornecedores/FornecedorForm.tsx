import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fornecedorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  contato_nome: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FornecedorFormProps {
  onSuccess?: () => void;
}

export const FornecedorForm = ({ onSuccess }: FornecedorFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
  });

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('fornecedores')
        .insert({
          ...data,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('Fornecedor cadastrado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao cadastrar fornecedor: ' + error.message);
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
            placeholder="Nome do fornecedor"
          />
          {errors.nome && (
            <p className="text-sm text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            {...register('cnpj')}
            placeholder="00.000.000/0000-00"
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
            placeholder="email@fornecedor.com"
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
            placeholder="(00) 0000-0000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contato_nome">Nome do Contato</Label>
        <Input
          id="contato_nome"
          {...register('contato_nome')}
          placeholder="Nome da pessoa de contato"
        />
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
          {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
        </Button>
      </div>
    </form>
  );
};

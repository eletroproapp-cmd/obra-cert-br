import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { validarCPFouCNPJ, formatarCPFouCNPJ } from '@/utils/validators';
import { getUserFriendlyError } from '@/utils/errors';

const clienteSchema = z.object({
  tipo_pessoa: z.enum(['fisica', 'juridica']),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  cpf_cnpj: z.string().optional().refine(
    (val) => !val || validarCPFouCNPJ(val),
    'CPF/CNPJ inválido'
  ),
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
  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>('juridica');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_pessoa: 'juridica'
    }
  });

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const payload = {
        ...data,
        user_id: user.id,
      } as unknown as Database['public']['Tables']['clientes']['Insert'];

      const { error } = await supabase
        .from('clientes')
        .insert([payload]);

      if (error) throw error;

      toast.success('Cliente cadastrado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error(getUserFriendlyError(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tipo_pessoa">Tipo de Pessoa *</Label>
        <Select 
          defaultValue="juridica"
          onValueChange={(value: 'fisica' | 'juridica') => {
            setTipoPessoa(value);
            setValue('tipo_pessoa', value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fisica">Pessoa Física (CPF)</SelectItem>
            <SelectItem value="juridica">Pessoa Jurídica (CNPJ)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">
            {tipoPessoa === 'fisica' ? 'Nome Completo *' : 'Razão Social / Nome Fantasia *'}
          </Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder={tipoPessoa === 'fisica' ? 'Nome completo' : 'Nome da empresa'}
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
          <Label htmlFor="cpf_cnpj">
            {tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}
          </Label>
          <Input
            id="cpf_cnpj"
            {...register('cpf_cnpj')}
            placeholder={tipoPessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
            onChange={(e) => {
              const formatted = formatarCPFouCNPJ(e.target.value);
              e.target.value = formatted;
            }}
          />
          {errors.cpf_cnpj && (
            <p className="text-sm text-destructive">{errors.cpf_cnpj.message}</p>
          )}
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

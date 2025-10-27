import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const timesheetSchema = z.object({
  funcionario_id: z.string().min(1, 'Selecione um funcionário'),
  projeto_id: z.string().optional(),
  data: z.string().min(1, 'Data é obrigatória'),
  hora_inicio: z.string().min(1, 'Hora de início é obrigatória'),
  hora_fim: z.string().min(1, 'Hora de término é obrigatória'),
  tipo_trabalho: z.string().min(1, 'Selecione o tipo de trabalho'),
  descricao: z.string().optional(),
  aprovado: z.boolean().default(false),
});

type TimesheetFormData = z.infer<typeof timesheetSchema>;

interface TimesheetFormProps {
  onSuccess?: () => void;
  registroId?: string;
}

const tiposTrabalho = [
  'Instalação Elétrica',
  'Manutenção',
  'Inspeção',
  'Projeto',
  'Consultoria',
  'Emergência',
  'Outro',
];

export const TimesheetForm = ({ onSuccess, registroId }: TimesheetFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      aprovado: false,
      data: new Date().toISOString().split('T')[0],
    }
  });

  const aprovado = watch('aprovado');

  useEffect(() => {
    loadFuncionarios();
    loadProjetos();
    if (registroId) {
      loadRegistro();
    }
  }, [registroId]);

  const loadFuncionarios = async () => {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      setFuncionarios(data);
    }
  };

  const loadProjetos = async () => {
    const { data, error } = await supabase
      .from('projetos')
      .select('id, nome')
      .order('nome');

    if (!error && data) {
      setProjetos(data);
    }
  };

  const loadRegistro = async () => {
    try {
      const { data, error } = await supabase
        .from('timesheet_registros')
        .select('*')
        .eq('id', registroId)
        .single();

      if (error) throw error;

      reset({
        funcionario_id: data.funcionario_id,
        projeto_id: data.projeto_id || '',
        data: data.data,
        hora_inicio: data.hora_inicio,
        hora_fim: data.hora_fim,
        tipo_trabalho: data.tipo_trabalho,
        descricao: data.descricao || '',
        aprovado: data.aprovado,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar registro');
    }
  };

  const onSubmit = async (data: TimesheetFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const payload = {
        funcionario_id: data.funcionario_id,
        projeto_id: data.projeto_id || null,
        data: data.data,
        hora_inicio: data.hora_inicio,
        hora_fim: data.hora_fim,
        tipo_trabalho: data.tipo_trabalho,
        descricao: data.descricao,
        aprovado: data.aprovado,
      };

      if (registroId) {
        const { error } = await supabase
          .from('timesheet_registros')
          .update(payload)
          .eq('id', registroId);

        if (error) throw error;
        toast.success('Registro atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('timesheet_registros')
          .insert({
            ...payload,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Registro criado com sucesso!');
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao salvar registro: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="funcionario_id">Funcionário *</Label>
          <Select onValueChange={(value) => setValue('funcionario_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o funcionário" />
            </SelectTrigger>
            <SelectContent>
              {funcionarios.map(func => (
                <SelectItem key={func.id} value={func.id}>
                  {func.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.funcionario_id && (
            <p className="text-sm text-destructive">{errors.funcionario_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projeto_id">Projeto</Label>
          <Select onValueChange={(value) => setValue('projeto_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o projeto (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {projetos.map(proj => (
                <SelectItem key={proj.id} value={proj.id}>
                  {proj.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            {...register('data')}
          />
          {errors.data && (
            <p className="text-sm text-destructive">{errors.data.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_inicio">Início *</Label>
          <Input
            id="hora_inicio"
            type="time"
            {...register('hora_inicio')}
          />
          {errors.hora_inicio && (
            <p className="text-sm text-destructive">{errors.hora_inicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_fim">Término *</Label>
          <Input
            id="hora_fim"
            type="time"
            {...register('hora_fim')}
          />
          {errors.hora_fim && (
            <p className="text-sm text-destructive">{errors.hora_fim.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo_trabalho">Tipo de Trabalho *</Label>
        <Select onValueChange={(value) => setValue('tipo_trabalho', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {tiposTrabalho.map(tipo => (
              <SelectItem key={tipo} value={tipo}>
                {tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo_trabalho && (
          <p className="text-sm text-destructive">{errors.tipo_trabalho.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva as atividades realizadas"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="aprovado"
          checked={aprovado}
          onCheckedChange={(checked) => setValue('aprovado', checked)}
        />
        <Label htmlFor="aprovado">Registro aprovado</Label>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={isSubmitting} variant="hero">
          {isSubmitting ? 'Salvando...' : registroId ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

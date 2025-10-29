import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReceitaFormData {
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  numero_documento?: string;
  observacoes?: string;
}

interface ReceitaFormProps {
  receita?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReceitaForm({ receita, onSuccess, onCancel }: ReceitaFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReceitaFormData>({
    defaultValues: receita
      ? {
          ...receita,
          data: format(new Date(receita.data), "yyyy-MM-dd"),
        }
      : {
          data: format(new Date(), "yyyy-MM-dd"),
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: ReceitaFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const receitaData = {
        ...data,
        user_id: user.id,
        valor: Number(data.valor),
      };

      if (receita) {
        const { error } = await supabase
          .from("receitas")
          .update(receitaData)
          .eq("id", receita.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receitas").insert(receitaData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"] });
      toast.success(
        receita ? "Receita atualizada com sucesso!" : "Receita criada com sucesso!"
      );
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao salvar receita");
      console.error(error);
    },
  });

  const onSubmit = (data: ReceitaFormData) => {
    mutation.mutate(data);
  };

  const categorias = [
    "Serviço Prestado",
    "Venda de Material",
    "Consultoria",
    "Manutenção",
    "Outros",
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            value={watch("categoria")}
            onValueChange={(value) => setValue("categoria", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoria && (
            <span className="text-sm text-destructive">Campo obrigatório</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            {...register("data", { required: true })}
          />
          {errors.data && (
            <span className="text-sm text-destructive">Campo obrigatório</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          placeholder="Descreva a receita"
          {...register("descricao", { required: true })}
        />
        {errors.descricao && (
          <span className="text-sm text-destructive">Campo obrigatório</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            placeholder="0,00"
            {...register("valor", { required: true, min: 0 })}
          />
          {errors.valor && (
            <span className="text-sm text-destructive">
              Valor inválido
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_documento">Número do Documento</Label>
          <Input
            id="numero_documento"
            placeholder="Ex: NF-001"
            {...register("numero_documento")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Informações adicionais"
          {...register("observacoes")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

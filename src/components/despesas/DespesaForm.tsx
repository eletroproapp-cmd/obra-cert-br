import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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

interface DespesaFormData {
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  numero_nota_fiscal?: string;
  observacoes?: string;
  projeto_id?: string;
}

interface DespesaFormProps {
  despesa?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const categorias = [
  "Funcionários",
  "Material",
  "Alimentação",
  "Combustível",
  "Outros",
];

export function DespesaForm({ despesa, onSuccess, onCancel }: DespesaFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DespesaFormData>({
    defaultValues: despesa
      ? {
          categoria: despesa.categoria,
          descricao: despesa.descricao,
          valor: despesa.valor,
          data: despesa.data,
          numero_nota_fiscal: despesa.numero_nota_fiscal || "",
          observacoes: despesa.observacoes || "",
          projeto_id: despesa.projeto_id || "",
        }
      : {
          data: new Date().toISOString().split("T")[0],
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: DespesaFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const despesaData = {
        ...data,
        user_id: user.id,
        projeto_id: data.projeto_id || null,
        numero_nota_fiscal: data.numero_nota_fiscal || null,
        observacoes: data.observacoes || null,
      };

      if (despesa) {
        const { error } = await supabase
          .from("despesas")
          .update(despesaData)
          .eq("id", despesa.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("despesas").insert(despesaData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success(
        despesa ? "Despesa atualizada com sucesso!" : "Despesa criada com sucesso!"
      );
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar despesa");
    },
  });

  const onSubmit = (data: DespesaFormData) => {
    mutation.mutate(data);
  };

  const categoria = watch("categoria");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            value={categoria}
            onValueChange={(value) => setValue("categoria", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
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
            <p className="text-sm text-destructive">{errors.categoria.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            {...register("data", { required: "Data é obrigatória" })}
          />
          {errors.data && (
            <p className="text-sm text-destructive">{errors.data.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          {...register("descricao", { required: "Descrição é obrigatória" })}
          placeholder="Ex: Pagamento de horas extras"
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            {...register("valor", {
              required: "Valor é obrigatório",
              min: { value: 0.01, message: "Valor deve ser maior que zero" },
            })}
            placeholder="0,00"
          />
          {errors.valor && (
            <p className="text-sm text-destructive">{errors.valor.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_nota_fiscal">Número da Nota Fiscal</Label>
          <Input
            id="numero_nota_fiscal"
            {...register("numero_nota_fiscal")}
            placeholder="Ex: NF-123456"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register("observacoes")}
          placeholder="Informações adicionais sobre a despesa"
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Salvando..."
            : despesa
            ? "Atualizar"
            : "Criar Despesa"}
        </Button>
      </div>
    </form>
  );
}

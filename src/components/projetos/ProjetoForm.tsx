import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const projetoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cliente_id: z.string().optional(),
  endereco_obra: z.string().optional(),
  data_inicio: z.date().optional(),
  data_termino: z.date().optional(),
  status: z.enum(["novo", "assinado", "em_curso", "perdido"]),
});

type ProjetoFormData = z.infer<typeof projetoSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface ProjetoFormProps {
  onSuccess: () => void;
  projetoId?: string;
}

export function ProjetoForm({ onSuccess, projetoId }: ProjetoFormProps) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      status: "novo",
    },
  });

  const dataInicio = watch("data_inicio");
  const dataTermino = watch("data_termino");
  const clienteId = watch("cliente_id");
  const status = watch("status");

  useEffect(() => {
    loadClientes();
    if (projetoId) {
      loadProjeto();
      loadFotos();
    }
  }, [projetoId]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar clientes: " + error.message);
    }
  };

  const loadProjeto = async () => {
    if (!projetoId) return;

    try {
      const { data, error } = await supabase
        .from("projetos")
        .select("*")
        .eq("id", projetoId)
        .single();

      if (error) throw error;

      reset({
        nome: data.nome,
        cliente_id: data.cliente_id || undefined,
        endereco_obra: data.endereco_obra || undefined,
        data_inicio: data.data_inicio ? new Date(data.data_inicio) : undefined,
        data_termino: data.data_termino ? new Date(data.data_termino) : undefined,
        status: data.status as "novo" | "assinado" | "em_curso" | "perdido",
      });
    } catch (error: any) {
      toast.error("Erro ao carregar projeto: " + error.message);
    }
  };

  const loadFotos = async () => {
    if (!projetoId) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase.storage
        .from("projeto-fotos")
        .list(`${user.user.id}/${projetoId}`);

      if (error) throw error;

      const urls = data.map((file) => {
        const { data: urlData } = supabase.storage
          .from("projeto-fotos")
          .getPublicUrl(`${user.user.id}/${projetoId}/${file.name}`);
        return urlData.publicUrl;
      });

      setFotosExistentes(urls);
    } catch (error: any) {
      console.error("Erro ao carregar fotos:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFotos((prev) => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (projectId: string) => {
    if (fotos.length === 0) return;

    setUploadingPhotos(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      for (const foto of fotos) {
        const fileExt = foto.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.user.id}/${projectId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("projeto-fotos")
          .upload(filePath, foto);

        if (uploadError) throw uploadError;
      }

      toast.success("Fotos enviadas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao fazer upload das fotos: " + error.message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const onSubmit = async (data: ProjetoFormData) => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const projetoData = {
        nome: data.nome,
        cliente_id: data.cliente_id || null,
        endereco_obra: data.endereco_obra || null,
        data_inicio: data.data_inicio?.toISOString().split("T")[0] || null,
        data_termino: data.data_termino?.toISOString().split("T")[0] || null,
        status: data.status,
        user_id: user.user.id,
      };

      if (projetoId) {
        const { error } = await supabase
          .from("projetos")
          .update(projetoData)
          .eq("id", projetoId);

        if (error) throw error;
        await uploadPhotos(projetoId);
        toast.success("Projeto atualizado com sucesso!");
      } else {
        const { data: newProjeto, error } = await supabase
          .from("projetos")
          .insert([projetoData])
          .select()
          .single();

        if (error) throw error;
        await uploadPhotos(newProjeto.id);
        toast.success("Projeto criado com sucesso!");
      }

      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao salvar projeto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do Projeto *</Label>
        <Input
          id="nome"
          {...register("nome")}
          placeholder="Digite o nome do projeto"
        />
        {errors.nome && (
          <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cliente_id">Cliente</Label>
        <Select value={clienteId} onValueChange={(value) => setValue("cliente_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhum</SelectItem>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="endereco_obra">Endereço da Obra</Label>
        <Input
          id="endereco_obra"
          {...register("endereco_obra")}
          placeholder="Digite o endereço da obra"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dataInicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataInicio ? format(dataInicio, "PPP", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={(date) => setValue("data_inicio", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Data de Término</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dataTermino && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataTermino ? format(dataTermino, "PPP", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dataTermino}
                onSelect={(date) => setValue("data_termino", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status *</Label>
        <Select value={status} onValueChange={(value: any) => setValue("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="assinado">Assinado</SelectItem>
            <SelectItem value="em_curso">Em Curso</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="fotos">Fotos do Projeto</Label>
        <div className="mt-2">
          <Input
            id="fotos"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("fotos")?.click()}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Adicionar Fotos
          </Button>
        </div>

        {fotosExistentes.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Fotos existentes:</p>
            <div className="grid grid-cols-3 gap-2">
              {fotosExistentes.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          </div>
        )}

        {fotos.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Novas fotos:</p>
            {fotos.map((foto, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{foto.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading || uploadingPhotos} className="flex-1">
          {(loading || uploadingPhotos) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {projetoId ? "Atualizar" : "Criar"} Projeto
        </Button>
      </div>
    </form>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Calendar, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DespesaForm } from "@/components/despesas/DespesaForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ViewModeToggle } from "@/components/shared/ViewModeToggle";

interface Despesa {
  id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  numero_nota_fiscal?: string;
  observacoes?: string;
  projeto_id?: string;
  projetos?: { nome: string };
}

export default function Despesas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [deletingDespesaId, setDeletingDespesaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const queryClient = useQueryClient();

  const { data: despesas, isLoading } = useQuery({
    queryKey: ["despesas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .order("data", { ascending: false });

      if (error) throw error;
      return data as Despesa[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success("Despesa excluída com sucesso!");
      setDeletingDespesaId(null);
    },
    onError: () => {
      toast.error("Erro ao excluir despesa");
    },
  });

  const handleEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDespesa(null);
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Funcionários: "bg-blue-500",
      Material: "bg-green-500",
      Alimentação: "bg-orange-500",
      Combustível: "bg-red-500",
      Outros: "bg-gray-500",
    };
    return colors[categoria] || "bg-gray-500";
  };

  const totalDespesas = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie gastos com funcionários, materiais, alimentação e mais
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Total de Despesas
            </div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalDespesas)}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Quantidade
            </div>
            <div className="text-2xl font-bold">{despesas?.length || 0}</div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <Card className="col-span-full text-center p-12">
                <p className="text-muted-foreground">Carregando...</p>
              </Card>
            ) : despesas && despesas.length > 0 ? (
              despesas.map((despesa) => (
                <Card key={despesa.id} className="border-border shadow-soft hover:shadow-medium transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <Badge className={getCategoriaColor(despesa.categoria)}>
                        {despesa.categoria}
                      </Badge>
                      <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(despesa.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{despesa.descricao}</p>
                    {despesa.numero_nota_fiscal && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        NF: {despesa.numero_nota_fiscal}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-destructive" />
                        <span className="text-xl font-bold text-destructive">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(despesa.valor))}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(despesa)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingDespesaId(despesa.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full text-center p-12">
                <p className="text-muted-foreground">Nenhuma despesa cadastrada</p>
              </Card>
            )}
          </div>
        ) : (
          <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : despesas && despesas.length > 0 ? (
                despesas.map((despesa) => (
                  <TableRow key={despesa.id}>
                    <TableCell>
                      {format(new Date(despesa.data), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoriaColor(despesa.categoria)}>
                        {despesa.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {despesa.descricao}
                    </TableCell>
                    <TableCell>{despesa.numero_nota_fiscal || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(despesa.valor))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(despesa)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingDespesaId(despesa.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma despesa cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDespesa ? "Editar Despesa" : "Nova Despesa"}
            </DialogTitle>
          </DialogHeader>
          <DespesaForm
            despesa={editingDespesa}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingDespesaId}
        onOpenChange={() => setDeletingDespesaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDespesaId && handleDelete(deletingDespesaId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

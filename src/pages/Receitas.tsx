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
import { ReceitaForm } from "@/components/receitas/ReceitaForm";
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

interface Receita {
  id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  numero_documento?: string;
  observacoes?: string;
}

export default function Receitas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [deletingReceitaId, setDeletingReceitaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const queryClient = useQueryClient();

  const { data: receitas, isLoading } = useQuery({
    queryKey: ["receitas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .order("data", { ascending: false });

      if (error) throw error;
      return data as Receita[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receitas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"] });
      toast.success("Receita excluída com sucesso!");
      setDeletingReceitaId(null);
    },
    onError: () => {
      toast.error("Erro ao excluir receita");
    },
  });

  const handleEdit = (receita: Receita) => {
    setEditingReceita(receita);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReceita(null);
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      "Serviço Prestado": "bg-green-500",
      "Venda de Material": "bg-blue-500",
      "Consultoria": "bg-purple-500",
      "Manutenção": "bg-orange-500",
      "Outros": "bg-gray-500",
    };
    return colors[categoria] || "bg-gray-500";
  };

  const totalReceitas = receitas?.reduce((acc, r) => acc + Number(r.valor), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie receitas diversas como serviços prestados, consultorias e mais
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Receita
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Total de Receitas
            </div>
            <div className="text-2xl font-bold text-success">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalReceitas)}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Quantidade
            </div>
            <div className="text-2xl font-bold">{receitas?.length || 0}</div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <Card className="col-span-full text-center p-12">
                <p className="text-muted-foreground">Carregando...</p>
              </Card>
            ) : receitas && receitas.length > 0 ? (
              receitas.map((receita) => (
                <Card key={receita.id} className="border-border shadow-soft hover:shadow-medium transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <Badge className={getCategoriaColor(receita.categoria)}>
                        {receita.categoria}
                      </Badge>
                      <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(receita.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{receita.descricao}</p>
                    {receita.numero_documento && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        Doc: {receita.numero_documento}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-xl font-bold text-success">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(receita.valor))}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(receita)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingReceitaId(receita.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full text-center p-12">
                <p className="text-muted-foreground">Nenhuma receita cadastrada</p>
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
                <TableHead>Documento</TableHead>
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
              ) : receitas && receitas.length > 0 ? (
                receitas.map((receita) => (
                  <TableRow key={receita.id}>
                    <TableCell>
                      {format(new Date(receita.data), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoriaColor(receita.categoria)}>
                        {receita.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {receita.descricao}
                    </TableCell>
                    <TableCell>{receita.numero_documento || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(receita.valor))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(receita)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingReceitaId(receita.id)}
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
                    Nenhuma receita cadastrada
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
              {editingReceita ? "Editar Receita" : "Nova Receita"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Preencha os dados da receita diversa
            </p>
          </DialogHeader>
          <ReceitaForm
            receita={editingReceita}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingReceitaId}
        onOpenChange={() => setDeletingReceitaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingReceitaId && handleDelete(deletingReceitaId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

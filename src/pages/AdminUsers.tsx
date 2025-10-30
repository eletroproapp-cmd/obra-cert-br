import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Crown, Loader2, User, Calendar } from "lucide-react";

interface UserSubscription {
  user_id: string;
  email: string;
  plan_type: string;
  status: string;
  created_at: string;
  current_period_end: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [newPlan, setNewPlan] = useState<"free" | "basic" | "professional">("basic");
  const [durationDays, setDurationDays] = useState("30");
  const [reason, setReason] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_subscriptions_with_emails');
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user: UserSubscription) => {
    setSelectedUser(user);
    setNewPlan(user.plan_type as "free" | "basic" | "professional");
    setDurationDays("30");
    setReason("");
    setShowDialog(true);
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    
    setUpdating(true);
    try {
      const currentUser = await supabase.auth.getUser();
      const duration = parseInt(durationDays);
      
      // Calcular nova data de término
      const currentPeriodEnd = selectedUser.current_period_end 
        ? new Date(selectedUser.current_period_end)
        : new Date();
      
      const newPeriodEnd = new Date(currentPeriodEnd);
      if (newPeriodEnd < new Date()) {
        newPeriodEnd.setTime(Date.now());
      }
      newPeriodEnd.setDate(newPeriodEnd.getDate() + duration);
      
      // Atualizar assinatura
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: newPlan,
          status: 'active',
          current_period_end: newPeriodEnd.toISOString(),
        })
        .eq('user_id', selectedUser.user_id);
      
      if (updateError) throw updateError;
      
      // Registrar ajuste
      const { error: adjustmentError } = await supabase
        .from('subscription_adjustments')
        .insert({
          user_id: selectedUser.user_id,
          adjusted_by: currentUser.data.user?.id,
          previous_plan: selectedUser.plan_type,
          new_plan: newPlan,
          adjustment_type: 'manual',
          duration_days: duration,
          reason: reason || 'Ajuste manual pelo administrador',
        });
      
      if (adjustmentError) throw adjustmentError;
      
      toast({
        title: "Plano atualizado!",
        description: `Usuário agora tem acesso ao plano ${newPlan} por ${duration} dias.`,
      });
      
      setShowDialog(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      professional: "bg-purple-500",
    };
    return (
      <Badge className={colors[plan] || "bg-gray-500"}>
        {plan === "free" && "Gratuito"}
        {plan === "basic" && "Básico"}
        {plan === "professional" && "Professional"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie assinaturas dos usuários
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{getPlanBadge(user.plan_type)}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'Ativo' : user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {user.current_period_end
                        ? new Date(user.current_period_end).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Alterar Plano
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano do Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Email do Usuário</Label>
              <Input value={selectedUser?.email || ''} disabled />
            </div>

            <div>
              <Label>Plano Atual</Label>
              <Input value={selectedUser?.plan_type || ''} disabled />
            </div>

            <div>
              <Label htmlFor="newPlan">Novo Plano</Label>
              <Select value={newPlan} onValueChange={(value) => setNewPlan(value as "free" | "basic" | "professional")}>
                <SelectTrigger id="newPlan">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duração (dias)</Label>
              <Select value={durationDays} onValueChange={setDurationDays}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias (1 mês)</SelectItem>
                  <SelectItem value="60">60 dias (2 meses)</SelectItem>
                  <SelectItem value="90">90 dias (3 meses)</SelectItem>
                  <SelectItem value="180">180 dias (6 meses)</SelectItem>
                  <SelectItem value="365">365 dias (1 ano)</SelectItem>
                  <SelectItem value="3650">3650 dias (10 anos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Cortesia, Parceria, Teste..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePlan} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aplicar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

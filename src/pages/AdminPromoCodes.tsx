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
import { Switch } from "@/components/ui/switch";
import { Ticket, Plus, Loader2, Copy, Check } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  plan_type: string;
  duration_days: number;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [newCode, setNewCode] = useState("");
  const [planType, setPlanType] = useState("professional");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar códigos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const handleCreate = async () => {
    if (!newCode) {
      toast({
        title: "Erro",
        description: "Digite um código válido",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: newCode.toUpperCase(),
          plan_type: planType,
          duration_days: parseInt(durationDays),
          max_uses: maxUses ? parseInt(maxUses) : null,
          expires_at: expiresAt || null,
          created_by: user.id,
        });
      
      if (error) throw error;
      
      toast({
        title: "Código criado!",
        description: `Código ${newCode} criado com sucesso.`,
      });
      
      setShowDialog(false);
      loadPromoCodes();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao criar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active: !currentActive })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Status atualizado",
        description: `Código ${!currentActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
      
      loadPromoCodes();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Código copiado!",
      description: `${code} copiado para a área de transferência.`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setNewCode("");
    setPlanType("professional");
    setDurationDays("30");
    setMaxUses("");
    setExpiresAt("");
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Códigos Promocionais</h1>
              <p className="text-muted-foreground">
                Gerencie cupons de desconto e acesso gratuito
              </p>
            </div>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Código
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Códigos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-bold">
                      <div className="flex items-center gap-2">
                        {promo.code}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyCode(promo.code)}
                        >
                          {copiedCode === promo.code ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={promo.plan_type === 'professional' ? 'bg-purple-500' : 'bg-blue-500'}>
                        {promo.plan_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{promo.duration_days} dias</TableCell>
                    <TableCell>
                      {promo.current_uses}
                      {promo.max_uses ? ` / ${promo.max_uses}` : ' / ∞'}
                    </TableCell>
                    <TableCell>
                      {promo.expires_at
                        ? new Date(promo.expires_at).toLocaleDateString('pt-BR')
                        : 'Sem validade'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.active ? 'default' : 'secondary'}>
                        {promo.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promo.active}
                          onCheckedChange={() => toggleActive(promo.id, promo.active)}
                        />
                      </div>
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
            <DialogTitle>Criar Código Promocional</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="PROMOCAO2025"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                />
                <Button type="button" variant="outline" onClick={generateRandomCode}>
                  Gerar
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="planType">Plano</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger id="planType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duração</Label>
              <Select value={durationDays} onValueChange={setDurationDays}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
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
              <Label htmlFor="maxUses">Número máximo de usos (opcional)</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="Ilimitado"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="expires">Data de expiração (opcional)</Label>
              <Input
                id="expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

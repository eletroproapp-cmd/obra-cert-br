import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Loader2 } from "lucide-react";

interface PromoCodeInputProps {
  onSuccess?: () => void;
}

export function PromoCodeInput({ onSuccess }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!code.trim()) {
      toast({
        title: "Erro",
        description: "Digite um código promocional",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.rpc('apply_promo_code', {
        p_code: code.toUpperCase().trim(),
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as any;
      
      if (result.success) {
        toast({
          title: "Código aplicado!",
          description: result.message,
        });
        setCode("");
        onSuccess?.();
      } else {
        toast({
          title: "Código inválido",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao aplicar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Código Promocional
        </CardTitle>
        <CardDescription>
          Possui um cupom? Digite abaixo para obter acesso gratuito ou desconto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="promoCode" className="sr-only">
              Código promocional
            </Label>
            <Input
              id="promoCode"
              placeholder="Digite o código"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleApply()}
              disabled={applying}
            />
          </div>
          <Button onClick={handleApply} disabled={applying}>
            {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Aplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

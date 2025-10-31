import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial");

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

const ResetPasswordForm = ({ onSuccess }: ResetPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const parsed = passwordSchema.safeParse(newPassword);
      if (!parsed.success) {
        toast.error(parsed.error.errors[0].message);
        setIsLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("As senhas não conferem");
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(
          "Sessão inválida. Abra o link mais recente do email e tente novamente."
        );
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Senha redefinida com sucesso!");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao redefinir senha: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Mín. 8 caracteres com maiúsc., números e símbolos"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar senha</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Repita a nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
        {isLoading ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;

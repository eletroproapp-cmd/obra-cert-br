import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

/**
 * Centraliza a lógica de detecção do modo de recuperação de senha.
 * - Aplica a sessão caso encontre access_token/refresh_token no hash ou querystring
 * - Limpa a URL para /auth?type=recovery após aplicar a sessão
 */
export const usePasswordRecovery = () => {
  const [isResetMode, setIsResetMode] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const hash = window.location.hash || "";
        const search = window.location.search || "";

        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(search.replace(/^\?/, ""));

        // Supabase generateLink recovery usa token_hash, não access_token
        const token_hash =
          hashParams.get("token_hash") || searchParams.get("token_hash") || "";
        const type = hashParams.get("type") || searchParams.get("type") || "";

        // Se temos token_hash + type=recovery, verificar o OTP
        if (token_hash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: "recovery",
          });
          
          if (error) {
            console.error("Erro ao verificar token de recuperação:", error);
            toast.error(
              "Link de recuperação inválido ou expirado. Solicite um novo email."
            );
            setIsResetMode(false);
            return;
          }
          
          setIsResetMode(true);
          // Limpar URL após verificar o token
          const cleanUrl = `${window.location.pathname}?type=recovery`;
          window.history.replaceState(null, "", cleanUrl);
          return;
        }

        // Fallback: verificar se ?type=recovery está presente
        const explicitRecovery = searchParams.get("type") === "recovery";
        if (explicitRecovery) {
          setIsResetMode(true);
        }
      } catch (e) {
        console.error("Falha ao processar modo de recuperação:", e);
      }
    };

    run();
  }, []);

  const exitResetMode = () => setIsResetMode(false);

  return { isResetMode, exitResetMode };
};

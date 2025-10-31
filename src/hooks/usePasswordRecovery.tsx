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

        const access_token =
          hashParams.get("access_token") || searchParams.get("access_token") || "";
        const refresh_token =
          hashParams.get("refresh_token") || searchParams.get("refresh_token") || "";

        const explicitRecovery =
          searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery";

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            console.error("Erro ao aplicar sessão (recovery):", error);
            toast.error(
              "Link de recuperação inválido ou expirado. Solicite um novo email."
            );
            setIsResetMode(false);
            return;
          }
          setIsResetMode(true);
          const cleanUrl = `${window.location.pathname}?type=recovery`;
          window.history.replaceState(null, "", cleanUrl);
          return;
        }

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

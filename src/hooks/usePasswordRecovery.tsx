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
        await new Promise(resolve => setTimeout(resolve, 100));

        const hash = window.location.hash || "";
        const search = window.location.search || "";

        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(search.replace(/^\?/, ""));

        // Prioridade 1: token_hash
        const token_hash = hashParams.get("token_hash") || searchParams.get("token_hash") || "";
        if (token_hash) {
          const { data, error } = await supabase.auth.verifyOtp({ 
            type: "recovery",
            token_hash 
          });
          if (error) {
            toast.error("Erro ao verificar link de recuperação");
            return;
          }
          if (data?.session) {
            setIsResetMode(true);
            const cleanUrl = `${window.location.pathname}?type=recovery`;
            window.history.replaceState(null, "", cleanUrl);
            return;
          }
        }

        // Prioridade 2: code (PKCE)
        const code = hashParams.get("code") || searchParams.get("code") || "";
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            toast.error("Erro ao processar link de recuperação");
            return;
          }
          if (data?.session) {
            setIsResetMode(true);
            const cleanUrl = `${window.location.pathname}?type=recovery`;
            window.history.replaceState(null, "", cleanUrl);
            return;
          }
        }

        // Prioridade 3: access_token + refresh_token
        const access_token = hashParams.get("access_token") || searchParams.get("access_token") || "";
        const refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token") || "";
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            toast.error("Erro ao estabelecer sessão");
            return;
          }
          if (data?.session) {
            setIsResetMode(true);
            const cleanUrl = `${window.location.pathname}?type=recovery`;
            window.history.replaceState(null, "", cleanUrl);
            return;
          }
        }

        // Verificar sessão existente com type=recovery
        const { data: { session } } = await supabase.auth.getSession();
        const explicitRecovery = searchParams.get("type") === "recovery";
        if (session && explicitRecovery) {
          setIsResetMode(true);
        }
      } catch (e) {
        console.error("Erro ao processar recuperação:", e);
        toast.error("Erro ao processar link de recuperação");
      }
    };

    run();
  }, []);

  const exitResetMode = () => setIsResetMode(false);

  return { isResetMode, exitResetMode };
};

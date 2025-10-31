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
        // Aguardar um pouco para o auth-bridge processar
        await new Promise(resolve => setTimeout(resolve, 100));

        // Logar envs efetivas em runtime para diagnóstico
        // Atenção: isso aparece apenas no console do navegador
        // e mostra apenas o prefixo da chave para segurança
        console.log(
          'SUPABASE ENV:',
          import.meta.env?.VITE_SUPABASE_URL,
          (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || '').slice(0, 10)
        );

        const hash = window.location.hash || "";
        const search = window.location.search || "";

        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(search.replace(/^\?/, ""));

        // Prioridade 1: token_hash (enviado pelo auth-bridge da Lovable)
        const token_hash = hashParams.get("token_hash") || searchParams.get("token_hash") || "";
        if (token_hash) {
          console.log("Detectado token_hash, usando verifyOtp com type='recovery'");
          const { data, error } = await supabase.auth.verifyOtp({ 
            type: "recovery",
            token_hash 
          });
          if (error) {
            console.error("Erro ao verificar token_hash:", error);
          }
          if (data?.session) {
            console.log("Sessão estabelecida via token_hash");
            setIsResetMode(true);
            // Limpar token_hash da URL e manter apenas type=recovery
            const cleanUrl = `${window.location.pathname}?type=recovery`;
            window.history.replaceState(null, "", cleanUrl);
            return;
          }
        }

        // Prioridade 2: code (PKCE flow)
        const code = hashParams.get("code") || searchParams.get("code") || "";
        if (code) {
          console.log("Detectado code, usando exchangeCodeForSession");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Erro ao trocar code por sessão:", error);
          }
          if (data?.session) {
            console.log("Sessão estabelecida via code");
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
          console.log("Detectado access_token, usando setSession");
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            console.error("Erro ao aplicar sessão:", error);
          }
          if (data?.session) {
            console.log("Sessão estabelecida via access_token");
            setIsResetMode(true);
            const cleanUrl = `${window.location.pathname}?type=recovery`;
            window.history.replaceState(null, "", cleanUrl);
            return;
          }
        }

        // Fallback: verificar se já tem sessão ativa e type=recovery
        const { data: { session } } = await supabase.auth.getSession();
        const explicitRecovery = searchParams.get("type") === "recovery";
        if (session && explicitRecovery) {
          console.log("Sessão já existe, entrando em modo recovery");
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

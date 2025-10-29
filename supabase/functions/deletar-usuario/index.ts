import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId é obrigatório");
    }

    console.log(`Deletando usuário: ${userId}`);

    // Criar cliente Supabase com service role key para poder deletar usuários
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se quem está fazendo a requisição é admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Não autorizado");
    }

    // Verificar se usuário tem role de admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    
    if (!isAdmin) {
      throw new Error("Somente administradores podem deletar usuários");
    }

    // Não permitir que admin delete a si mesmo
    if (userId === user.id) {
      throw new Error("Você não pode deletar sua própria conta");
    }

    // Deletar TODOS os dados relacionados primeiro (ordem importa por foreign keys)
    console.log('Deletando dados relacionados...');
    
    const tables = [
      'timesheet_registros',
      'tarefas',
      'movimentacoes_estoque',
      'nbr5410_checklists',
      'agendamentos',
      'orcamentos',
      'faturas',
      'receitas',
      'despesas',
      'instalacoes',
      'projetos',
      'funcionarios',
      'materiais',
      'servicos',
      'clientes',
      'fornecedores',
      'referral_rewards',
      'referral_codes',
      'usage_tracking',
      'email_templates',
      'empresas',
      'edge_function_rate_limits',
      'user_roles',
      'user_subscriptions'
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.warn(`Aviso ao deletar ${table}:`, error.message);
        // Continua mesmo com erro (tabela pode não existir ou estar vazia)
      }
    }

    // Deletar referrals onde o usuário é referrer ou referred
    await supabaseAdmin.from('referrals').delete().eq('referrer_user_id', userId);
    await supabaseAdmin.from('referrals').delete().eq('referred_user_id', userId);

    // Agora deletar usuário do Auth
    console.log('Deletando usuário do Auth...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Erro ao deletar do Auth:', deleteError);
      throw new Error(`Database error deleting user: ${deleteError.message}`);
    }

    console.log(`Usuário ${userId} deletado com sucesso`);

    return new Response(
      JSON.stringify({ success: true, message: "Usuário deletado com sucesso" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

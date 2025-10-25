export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          localizacao: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fatura_items: {
        Row: {
          created_at: string
          descricao: string
          fatura_id: string
          id: string
          ordem: number | null
          quantidade: number
          unidade: string | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          fatura_id: string
          id?: string
          ordem?: number | null
          quantidade?: number
          unidade?: string | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string
          descricao?: string
          fatura_id?: string
          id?: string
          ordem?: number | null
          quantidade?: number
          unidade?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "fatura_items_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          numero: string
          observacoes: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_total?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_nome: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instalacoes: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_conclusao_prevista: string | null
          data_conclusao_real: string | null
          data_inicio: string | null
          descricao: string | null
          endereco: string | null
          id: string
          observacoes: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_conclusao_prevista?: string | null
          data_conclusao_real?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_conclusao_prevista?: string | null
          data_conclusao_real?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instalacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          categoria: string
          codigo: string | null
          created_at: string
          descricao: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          id: string
          nome: string
          preco_custo: number
          preco_venda: number
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          preco_custo?: number
          preco_venda?: number
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nbr5410_checklists: {
        Row: {
          alertas: Json | null
          area_total: number | null
          checklist_data: Json | null
          created_at: string
          fatura_id: string | null
          id: string
          num_comodos: number | null
          observacoes: string | null
          orcamento_id: string | null
          premissas_tecnicas: string | null
          status: string | null
          tem_aquecedor: boolean | null
          tem_ar_condicionado: boolean | null
          tem_chuveiro: boolean | null
          tem_forno_eletrico: boolean | null
          tem_piscina: boolean | null
          tipo_imovel: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alertas?: Json | null
          area_total?: number | null
          checklist_data?: Json | null
          created_at?: string
          fatura_id?: string | null
          id?: string
          num_comodos?: number | null
          observacoes?: string | null
          orcamento_id?: string | null
          premissas_tecnicas?: string | null
          status?: string | null
          tem_aquecedor?: boolean | null
          tem_ar_condicionado?: boolean | null
          tem_chuveiro?: boolean | null
          tem_forno_eletrico?: boolean | null
          tem_piscina?: boolean | null
          tipo_imovel: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alertas?: Json | null
          area_total?: number | null
          checklist_data?: Json | null
          created_at?: string
          fatura_id?: string | null
          id?: string
          num_comodos?: number | null
          observacoes?: string | null
          orcamento_id?: string | null
          premissas_tecnicas?: string | null
          status?: string | null
          tem_aquecedor?: boolean | null
          tem_ar_condicionado?: boolean | null
          tem_chuveiro?: boolean | null
          tem_forno_eletrico?: boolean | null
          tem_piscina?: boolean | null
          tipo_imovel?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbr5410_checklists_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nbr5410_checklists_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      nbr5410_sugestoes: {
        Row: {
          adicionado_orcamento: boolean | null
          checklist_id: string
          created_at: string
          descricao: string
          id: string
          justificativa: string | null
          material_id: string | null
          norma_referencia: string | null
          quantidade: number
          tipo: string
          unidade: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          adicionado_orcamento?: boolean | null
          checklist_id: string
          created_at?: string
          descricao: string
          id?: string
          justificativa?: string | null
          material_id?: string | null
          norma_referencia?: string | null
          quantidade?: number
          tipo: string
          unidade?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          adicionado_orcamento?: boolean | null
          checklist_id?: string
          created_at?: string
          descricao?: string
          id?: string
          justificativa?: string | null
          material_id?: string | null
          norma_referencia?: string | null
          quantidade?: number
          tipo?: string
          unidade?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nbr5410_sugestoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "nbr5410_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nbr5410_sugestoes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_items: {
        Row: {
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          ordem: number | null
          quantidade: number
          unidade: string | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          orcamento_id: string
          ordem?: number | null
          quantidade?: number
          unidade?: string | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number | null
          quantidade?: number
          unidade?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_items_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          created_at: string
          descricao: string | null
          id: string
          numero: string
          observacoes: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
          validade_dias: number | null
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          validade_dias?: number | null
          valor_total?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          validade_dias?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          categoria: string
          codigo: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          observacoes: string | null
          preco_hora: number
          tempo_estimado: number | null
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          preco_hora?: number
          tempo_estimado?: number | null
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          preco_hora?: number
          tempo_estimado?: number | null
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          created_at: string
          data_vencimento: string | null
          descricao: string | null
          id: string
          instalacao_id: string | null
          prioridade: string | null
          responsavel: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          instalacao_id?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          instalacao_id?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_instalacao_id_fkey"
            columns: ["instalacao_id"]
            isOneToOne: false
            referencedRelation: "instalacoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_fatura_numero: { Args: never; Returns: string }
      generate_orcamento_numero: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

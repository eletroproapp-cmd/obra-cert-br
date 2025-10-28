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
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome: string
          regime_tributario: string | null
          telefone: string | null
          tipo_pessoa: string | null
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
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome: string
          regime_tributario?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
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
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome?: string
          regime_tributario?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      edge_function_rate_limits: {
        Row: {
          function_name: string
          id: string
          request_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          function_name: string
          id?: string
          request_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          function_name?: string
          id?: string
          request_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          assunto: string
          ativo: boolean | null
          corpo_html: string
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
          variaveis_disponiveis: string[] | null
        }
        Insert: {
          assunto: string
          ativo?: boolean | null
          corpo_html: string
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
          variaveis_disponiveis?: string[] | null
        }
        Update: {
          assunto?: string
          ativo?: boolean | null
          corpo_html?: string
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          variaveis_disponiveis?: string[] | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          ambiente_nfe: string | null
          cep: string | null
          certificado_digital_arquivo: string | null
          certificado_digital_tipo: string | null
          certificado_digital_validade: string | null
          chave_pix: string | null
          cidade: string | null
          cnpj: string | null
          cor_borda_linhas: string | null
          cor_borda_secoes: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          csc_id: string | null
          csc_token: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          estilo_borda: string | null
          fonte_documento: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logo_position: string | null
          logo_url: string | null
          mostrar_cnpj: boolean | null
          mostrar_email: boolean | null
          mostrar_endereco: boolean | null
          mostrar_inscricao_estadual: boolean | null
          mostrar_inscricao_municipal: boolean | null
          mostrar_logo: boolean | null
          mostrar_nome_fantasia: boolean | null
          mostrar_razao_social: boolean | null
          mostrar_regime_tributario: boolean | null
          mostrar_telefone: boolean | null
          mostrar_website: boolean | null
          nome_fantasia: string
          observacoes_padrao: string | null
          proximo_numero_fatura: number | null
          proximo_numero_nfe: number | null
          proximo_numero_orcamento: number | null
          razao_social: string | null
          regime_tributario: string | null
          serie_nfe: string | null
          slogan: string | null
          tamanho_fonte: number | null
          telefone: string | null
          template_fatura: string | null
          template_orcamento: string | null
          termos_condicoes: string | null
          tipo_pessoa: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          ambiente_nfe?: string | null
          cep?: string | null
          certificado_digital_arquivo?: string | null
          certificado_digital_tipo?: string | null
          certificado_digital_validade?: string | null
          chave_pix?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor_borda_linhas?: string | null
          cor_borda_secoes?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          csc_id?: string | null
          csc_token?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estilo_borda?: string | null
          fonte_documento?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_position?: string | null
          logo_url?: string | null
          mostrar_cnpj?: boolean | null
          mostrar_email?: boolean | null
          mostrar_endereco?: boolean | null
          mostrar_inscricao_estadual?: boolean | null
          mostrar_inscricao_municipal?: boolean | null
          mostrar_logo?: boolean | null
          mostrar_nome_fantasia?: boolean | null
          mostrar_razao_social?: boolean | null
          mostrar_regime_tributario?: boolean | null
          mostrar_telefone?: boolean | null
          mostrar_website?: boolean | null
          nome_fantasia: string
          observacoes_padrao?: string | null
          proximo_numero_fatura?: number | null
          proximo_numero_nfe?: number | null
          proximo_numero_orcamento?: number | null
          razao_social?: string | null
          regime_tributario?: string | null
          serie_nfe?: string | null
          slogan?: string | null
          tamanho_fonte?: number | null
          telefone?: string | null
          template_fatura?: string | null
          template_orcamento?: string | null
          termos_condicoes?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          ambiente_nfe?: string | null
          cep?: string | null
          certificado_digital_arquivo?: string | null
          certificado_digital_tipo?: string | null
          certificado_digital_validade?: string | null
          chave_pix?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor_borda_linhas?: string | null
          cor_borda_secoes?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          csc_id?: string | null
          csc_token?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estilo_borda?: string | null
          fonte_documento?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_position?: string | null
          logo_url?: string | null
          mostrar_cnpj?: boolean | null
          mostrar_email?: boolean | null
          mostrar_endereco?: boolean | null
          mostrar_inscricao_estadual?: boolean | null
          mostrar_inscricao_municipal?: boolean | null
          mostrar_logo?: boolean | null
          mostrar_nome_fantasia?: boolean | null
          mostrar_razao_social?: boolean | null
          mostrar_regime_tributario?: boolean | null
          mostrar_telefone?: boolean | null
          mostrar_website?: boolean | null
          nome_fantasia?: string
          observacoes_padrao?: string | null
          proximo_numero_fatura?: number | null
          proximo_numero_nfe?: number | null
          proximo_numero_orcamento?: number | null
          razao_social?: string | null
          regime_tributario?: string | null
          serie_nfe?: string | null
          slogan?: string | null
          tamanho_fonte?: number | null
          telefone?: string | null
          template_fatura?: string | null
          template_orcamento?: string | null
          termos_condicoes?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
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
      fatura_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          fatura_id: string
          id: string
          token: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          fatura_id: string
          id?: string
          token: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          fatura_id?: string
          id?: string
          token?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fatura_tokens_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          assinado_em: string | null
          assinante_nome: string | null
          assinatura_url: string | null
          cliente_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          nfe_chave_acesso: string | null
          nfe_data_emissao: string | null
          nfe_numero: string | null
          nfe_protocolo: string | null
          nfe_serie: string | null
          nfe_status: string | null
          nfe_xml: string | null
          numero: string
          observacoes: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          assinado_em?: string | null
          assinante_nome?: string | null
          assinatura_url?: string | null
          cliente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          nfe_chave_acesso?: string | null
          nfe_data_emissao?: string | null
          nfe_numero?: string | null
          nfe_protocolo?: string | null
          nfe_serie?: string | null
          nfe_status?: string | null
          nfe_xml?: string | null
          numero: string
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_total?: number
        }
        Update: {
          assinado_em?: string | null
          assinante_nome?: string | null
          assinatura_url?: string | null
          cliente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          nfe_chave_acesso?: string | null
          nfe_data_emissao?: string | null
          nfe_numero?: string | null
          nfe_protocolo?: string | null
          nfe_serie?: string | null
          nfe_status?: string | null
          nfe_xml?: string | null
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
      funcionarios: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          data_admissao: string | null
          email: string | null
          id: string
          nome: string
          salario_hora: number | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          id?: string
          nome: string
          salario_hora?: number | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          id?: string
          nome?: string
          salario_hora?: number | null
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
      movimentacoes_estoque: {
        Row: {
          created_at: string
          id: string
          material_id: string
          motivo: string | null
          quantidade: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          motivo?: string | null
          quantidade: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          motivo?: string | null
          quantidade?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
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
      orcamento_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          orcamento_id: string
          token: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          orcamento_id: string
          token: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          orcamento_id?: string
          token?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_tokens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          assinado_em: string | null
          assinante_nome: string | null
          assinatura_url: string | null
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
          assinado_em?: string | null
          assinante_nome?: string | null
          assinatura_url?: string | null
          cliente_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          validade_dias?: number | null
          valor_total?: number
        }
        Update: {
          assinado_em?: string | null
          assinante_nome?: string | null
          assinatura_url?: string | null
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
      projetos: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_inicio: string | null
          data_termino: string | null
          endereco_obra: string | null
          id: string
          nome: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          endereco_obra?: string | null
          id?: string
          nome: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          endereco_obra?: string | null
          id?: string
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          applied_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          referral_id: string
          reward_type: string
          reward_value: number
          status: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_id: string
          reward_type?: string
          reward_value?: number
          status?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_id?: string
          reward_type?: string
          reward_value?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          reward_granted: boolean | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          reward_granted?: boolean | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
          reward_granted?: boolean | null
          status?: string
        }
        Relationships: []
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
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          limits: Json
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          limits?: Json
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          limits?: Json
          name?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
          stripe_price_id?: string | null
          updated_at?: string
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
      timesheet_registros: {
        Row: {
          aprovado: boolean | null
          created_at: string
          data: string
          descricao: string | null
          funcionario_id: string
          hora_fim: string
          hora_inicio: string
          horas_totais: number | null
          id: string
          instalacao_id: string | null
          projeto_id: string | null
          tipo_trabalho: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado?: boolean | null
          created_at?: string
          data: string
          descricao?: string | null
          funcionario_id: string
          hora_fim: string
          hora_inicio: string
          horas_totais?: number | null
          id?: string
          instalacao_id?: string | null
          projeto_id?: string | null
          tipo_trabalho: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado?: boolean | null
          created_at?: string
          data?: string
          descricao?: string | null
          funcionario_id?: string
          hora_fim?: string
          hora_inicio?: string
          horas_totais?: number | null
          id?: string
          instalacao_id?: string | null
          projeto_id?: string | null
          tipo_trabalho?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_registros_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_registros_instalacao_id_fkey"
            columns: ["instalacao_id"]
            isOneToOne: false
            referencedRelation: "instalacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_registros_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          count: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          resource_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          resource_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          resource_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _function_name: string
          _max_requests: number
          _user_id: string
          _window_minutes: number
        }
        Returns: boolean
      }
      check_user_limit: {
        Args: { _limit: number; _resource_type: string; _user_id: string }
        Returns: boolean
      }
      generate_fatura_numero: { Args: never; Returns: string }
      generate_material_codigo: { Args: never; Returns: string }
      generate_orcamento_numero: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_servico_codigo: { Args: never; Returns: string }
      generate_unique_token: { Args: { length?: number }; Returns: string }
      get_my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { _resource_type: string; _user_id: string }
        Returns: undefined
      }
      process_referral: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "accountant" | "super_admin"
      subscription_plan: "free" | "basic" | "professional"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
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
    Enums: {
      app_role: ["admin", "manager", "user", "accountant", "super_admin"],
      subscription_plan: ["free", "basic", "professional"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const

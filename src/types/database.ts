/**
 * Tipos do banco. Escrito a mao a partir de `supabase/migrations/0001_init.sql`
 * porque ainda nao existe um projeto Supabase real (ver CLAUDE.md, secao 6).
 *
 * Assim que o projeto existir, substitua este arquivo pelo gerado de verdade:
 *   npm run types
 * (edite o script em package.json com o project-id antes de rodar).
 *
 * Cobre Tables, Enums, a function de estorno e as views de relatorio usadas
 * pela Fase 6 (0003_views.sql). v_consumo_anomalo e v_epi_alerta ficam de
 * fora: schema pronto, mas sem tela ainda (EPI e Fase 2 do CLAUDE.md).
 *
 * `Relationships` fica vazio em toda tabela: o postgrest-js exige o campo
 * (GenericTable), mas nao modelamos FK aqui — nao muda o tipo de retorno de
 * select/insert/update, so afeta o hint de join aninhado que nao usamos.
 * `saldos` e `movimentacoes` tem Insert/Update escritos mas nunca devem ser
 * usados pela aplicacao (saldo e derivado, movimentacao e imutavel); a
 * protecao real e o revoke e as triggers no banco, nao o tipo.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cnpj?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cnpj?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      usuarios: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          email: string;
          perfil: Database["public"]["Enums"]["perfil_usuario"];
          pin: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id: string;
          empresa_id: string;
          nome: string;
          email: string;
          perfil?: Database["public"]["Enums"]["perfil_usuario"];
          pin?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          email?: string;
          perfil?: Database["public"]["Enums"]["perfil_usuario"];
          pin?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      depositos: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          descricao: string | null;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          descricao?: string | null;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          descricao?: string | null;
          ativo?: boolean;
        };
        Relationships: [];
      };
      categorias: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      fornecedores: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cnpj: string | null;
          telefone: string | null;
          email: string | null;
          endereco: string | null;
          prazo_entrega_dias: number;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          cnpj?: string | null;
          telefone?: string | null;
          email?: string | null;
          endereco?: string | null;
          prazo_entrega_dias?: number;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          cnpj?: string | null;
          telefone?: string | null;
          email?: string | null;
          endereco?: string | null;
          prazo_entrega_dias?: number;
          ativo?: boolean;
        };
        Relationships: [];
      };
      centros_custo: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          codigo: string | null;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          codigo?: string | null;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          codigo?: string | null;
          ativo?: boolean;
        };
        Relationships: [];
      };
      veiculos: {
        Row: {
          id: string;
          empresa_id: string;
          placa: string;
          modelo: string | null;
          ano: number | null;
          km_atual: number;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          placa: string;
          modelo?: string | null;
          ano?: number | null;
          km_atual?: number;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          placa?: string;
          modelo?: string | null;
          ano?: number | null;
          km_atual?: number;
          ativo?: boolean;
        };
        Relationships: [];
      };
      funcionarios: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          matricula: string | null;
          funcao: string | null;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          matricula?: string | null;
          funcao?: string | null;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          matricula?: string | null;
          funcao?: string | null;
          ativo?: boolean;
        };
        Relationships: [];
      };
      itens: {
        Row: {
          id: string;
          empresa_id: string;
          sku: string;
          nome: string;
          descricao: string | null;
          tipo: Database["public"]["Enums"]["tipo_item"];
          categoria_id: string | null;
          fornecedor_id: string | null;
          unidade: string;
          fator_conversao: number;
          estoque_minimo: number;
          ponto_pedido: number;
          custo_medio: number;
          codigo_barras: string | null;
          controla_serie: boolean;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          sku: string;
          nome: string;
          descricao?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_item"];
          categoria_id?: string | null;
          fornecedor_id?: string | null;
          unidade?: string;
          fator_conversao?: number;
          estoque_minimo?: number;
          ponto_pedido?: number;
          custo_medio?: number;
          codigo_barras?: string | null;
          controla_serie?: boolean;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          sku?: string;
          nome?: string;
          descricao?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_item"];
          categoria_id?: string | null;
          fornecedor_id?: string | null;
          unidade?: string;
          fator_conversao?: number;
          estoque_minimo?: number;
          ponto_pedido?: number;
          custo_medio?: number;
          codigo_barras?: string | null;
          controla_serie?: boolean;
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      saldos: {
        Row: {
          id: string;
          empresa_id: string;
          item_id: string;
          deposito_id: string;
          quantidade: number;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          item_id: string;
          deposito_id: string;
          quantidade?: number;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          item_id?: string;
          deposito_id?: string;
          quantidade?: number;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      documentos: {
        Row: {
          id: string;
          empresa_id: string;
          tipo: Database["public"]["Enums"]["tipo_mov"];
          numero_nf: string | null;
          fornecedor_id: string | null;
          data: string;
          valor_total: number | null;
          anexo_url: string | null;
          observacao: string | null;
          usuario_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo: Database["public"]["Enums"]["tipo_mov"];
          numero_nf?: string | null;
          fornecedor_id?: string | null;
          data?: string;
          valor_total?: number | null;
          anexo_url?: string | null;
          observacao?: string | null;
          usuario_id?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          tipo?: Database["public"]["Enums"]["tipo_mov"];
          numero_nf?: string | null;
          fornecedor_id?: string | null;
          data?: string;
          valor_total?: number | null;
          anexo_url?: string | null;
          observacao?: string | null;
          usuario_id?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      movimentacoes: {
        Row: {
          id: string;
          empresa_id: string;
          item_id: string;
          deposito_id: string;
          tipo: Database["public"]["Enums"]["tipo_mov"];
          quantidade: number;
          custo_unitario: number;
          documento_id: string | null;
          centro_custo_id: string | null;
          veiculo_id: string | null;
          funcionario_id: string | null;
          km_veiculo: number | null;
          deposito_destino_id: string | null;
          motivo: string | null;
          numero_os: string | null;
          estorno_de: string | null;
          usuario_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          item_id: string;
          deposito_id: string;
          tipo: Database["public"]["Enums"]["tipo_mov"];
          quantidade: number;
          custo_unitario?: number;
          documento_id?: string | null;
          centro_custo_id?: string | null;
          veiculo_id?: string | null;
          funcionario_id?: string | null;
          km_veiculo?: number | null;
          deposito_destino_id?: string | null;
          motivo?: string | null;
          numero_os?: string | null;
          estorno_de?: string | null;
          usuario_id?: string | null;
          criado_em?: string;
        };
        // Bloqueado por trigger (trg_mov_bloqueia_update). Correcao e por
        // estorno (fn_estornar_movimentacao), nunca por UPDATE — mas o tipo
        // aqui espelha o shape real da tabela; quem barra de verdade e o banco.
        Update: {
          id?: string;
          empresa_id?: string;
          item_id?: string;
          deposito_id?: string;
          tipo?: Database["public"]["Enums"]["tipo_mov"];
          quantidade?: number;
          custo_unitario?: number;
          documento_id?: string | null;
          centro_custo_id?: string | null;
          veiculo_id?: string | null;
          funcionario_id?: string | null;
          km_veiculo?: number | null;
          deposito_destino_id?: string | null;
          motivo?: string | null;
          numero_os?: string | null;
          estorno_de?: string | null;
          usuario_id?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      epi_entregas: {
        Row: {
          id: string;
          empresa_id: string;
          funcionario_id: string;
          item_id: string;
          movimentacao_id: string | null;
          numero_ca: string | null;
          validade_ca: string | null;
          quantidade: number;
          data_entrega: string;
          data_devolucao: string | null;
          assinatura_url: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          funcionario_id: string;
          item_id: string;
          movimentacao_id?: string | null;
          numero_ca?: string | null;
          validade_ca?: string | null;
          quantidade?: number;
          data_entrega?: string;
          data_devolucao?: string | null;
          assinatura_url?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          funcionario_id?: string;
          item_id?: string;
          movimentacao_id?: string | null;
          numero_ca?: string | null;
          validade_ca?: string | null;
          quantidade?: number;
          data_entrega?: string;
          data_devolucao?: string | null;
          assinatura_url?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      inventarios: {
        Row: {
          id: string;
          empresa_id: string;
          deposito_id: string;
          status: string;
          iniciado_em: string;
          fechado_em: string | null;
          usuario_id: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          deposito_id: string;
          status?: string;
          iniciado_em?: string;
          fechado_em?: string | null;
          usuario_id?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          deposito_id?: string;
          status?: string;
          iniciado_em?: string;
          fechado_em?: string | null;
          usuario_id?: string | null;
        };
        Relationships: [];
      };
      inventario_itens: {
        Row: {
          id: string;
          empresa_id: string;
          inventario_id: string;
          item_id: string;
          qtd_sistema: number;
          qtd_contada: number | null;
          divergencia: number | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          inventario_id: string;
          item_id: string;
          qtd_sistema: number;
          qtd_contada?: number | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          inventario_id?: string;
          item_id?: string;
          qtd_sistema?: number;
          qtd_contada?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      v_itens_a_comprar: {
        Row: {
          id: string;
          empresa_id: string;
          sku: string;
          nome: string;
          unidade: string;
          saldo: number;
          ponto_pedido: number;
          estoque_minimo: number;
          custo_medio: number;
          fornecedor: string | null;
          prazo_entrega_dias: number | null;
          sugestao_compra: number;
          situacao: "ESGOTADO" | "CRITICO" | "REPOR";
        };
        Relationships: [];
      };
      v_consumo_por_veiculo: {
        Row: {
          empresa_id: string;
          veiculo_id: string;
          placa: string;
          modelo: string | null;
          mes: string;
          custo_total: number;
          movimentos: number;
        };
        Relationships: [];
      };
      v_consumo_por_centro: {
        Row: {
          empresa_id: string;
          centro_custo: string;
          mes: string;
          custo_total: number;
        };
        Relationships: [];
      };
      v_kardex: {
        Row: {
          id: string;
          empresa_id: string;
          item_id: string;
          sku: string;
          item: string;
          criado_em: string;
          tipo: Database["public"]["Enums"]["tipo_mov"];
          quantidade: number;
          custo_unitario: number;
          valor: number;
          motivo: string | null;
          usuario: string | null;
          destino: string | null;
          estorno_de: string | null;
        };
        Relationships: [];
      };
      v_estoque_geral: {
        Row: {
          item_id: string;
          empresa_id: string;
          sku: string;
          nome: string;
          unidade: string;
          entradas: number;
          saidas: number;
          saldo: number;
          custo_medio: number;
          valor_estoque: number;
          status: "Sem estoque" | "Crítico" | "Repor" | "Estoque bom";
        };
        Relationships: [];
      };
      v_movimentacoes_detalhe: {
        Row: {
          id: string;
          empresa_id: string;
          criado_em: string;
          tipo: Database["public"]["Enums"]["tipo_mov"];
          item_id: string;
          sku: string;
          item: string;
          unidade: string;
          quantidade: number;
          custo_unitario: number;
          valor: number;
          veiculo_id: string | null;
          placa: string | null;
          funcionario_id: string | null;
          mecanico: string | null;
          centro_custo: string | null;
          fornecedor: string | null;
          numero_nf: string | null;
          km_veiculo: number | null;
          usuario: string | null;
          motivo: string | null;
          estorno_de: string | null;
          estornada: boolean;
          numero_os: string | null;
        };
        Relationships: [];
      };
      v_valor_estoque: {
        Row: {
          empresa_id: string;
          categoria: string;
          itens: number;
          unidades: number;
          valor: number;
        };
        Relationships: [];
      };
      v_itens_parados: {
        Row: {
          id: string;
          empresa_id: string;
          sku: string;
          nome: string;
          saldo: number;
          valor_parado: number;
          ultima_saida: string | null;
          dias_sem_saida: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      fn_estornar_movimentacao: {
        Args: {
          p_movimentacao_id: string;
          p_usuario_id: string;
          p_motivo?: string;
        };
        Returns: string;
      };
      fn_obter_ou_criar_veiculo: {
        Args: {
          p_placa: string;
        };
        Returns: string;
      };
      fn_obter_ou_criar_funcionario: {
        Args: {
          p_nome: string;
        };
        Returns: string;
      };
    };
    Enums: {
      tipo_item: "peca" | "consumivel" | "epi" | "ferramenta" | "pneu" | "lubrificante" | "outro";
      tipo_mov: "entrada" | "saida" | "transferencia" | "ajuste" | "devolucao" | "emprestimo";
      perfil_usuario: "admin" | "gestor" | "almoxarife" | "consulta";
    };
  };
}

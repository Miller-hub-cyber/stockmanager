import type { Database } from "@/types/database";
import { dataBelem, type AbaXlsx, type ColunaXlsx } from "@/lib/xlsx";
import { rotuloTipo, type LinhaMovimentacao, type ModoRelatorio } from "@/lib/relatorio-movimentacoes";

type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"];
type EstoqueGeral = Database["public"]["Views"]["v_estoque_geral"]["Row"];

// Colunas na ordem do modelo (Codigo, Item, Data, Valor, Quantidade) + o que este sistema controla a mais.
const SKU: ColunaXlsx = { chave: "sku", rotulo: "Código do Produto", largura: 18 };
const ITEM: ColunaXlsx = { chave: "item", rotulo: "Item", largura: 34 };
const DATA: ColunaXlsx = { chave: "data", rotulo: "Data", largura: 17, tipo: "dataHora" };
const VALOR_UNIT: ColunaXlsx = { chave: "custo_unitario", rotulo: "Valor unitário", largura: 15, tipo: "moeda" };
const TOTAL: ColunaXlsx = { chave: "valor", rotulo: "Total", largura: 15, tipo: "moeda" };
const FORNECEDOR: ColunaXlsx = { chave: "fornecedor", rotulo: "Fornecedor", largura: 26 };
const NF: ColunaXlsx = { chave: "numero_nf", rotulo: "NF", largura: 14 };
const OS: ColunaXlsx = { chave: "numero_os", rotulo: "OS", largura: 12 };
const FROTA: ColunaXlsx = { chave: "placa", rotulo: "Frota / placa", largura: 15 };
const COLABORADOR: ColunaXlsx = { chave: "mecanico", rotulo: "Colaborador", largura: 26 };
const CENTRO: ColunaXlsx = { chave: "centro_custo", rotulo: "Centro de custo", largura: 22 };
const USUARIO: ColunaXlsx = { chave: "usuario", rotulo: "Registrado por", largura: 20 };
const qtd = (rotulo: string): ColunaXlsx => ({ chave: "quantidade", rotulo, largura: 12, tipo: "numero" });

const COLUNAS_MOVIMENTACAO: Record<ModoRelatorio, ColunaXlsx[]> = {
  entrada: [SKU, ITEM, DATA, VALOR_UNIT, qtd("Entrada"), TOTAL, FORNECEDOR, NF, OS, FROTA, COLABORADOR, USUARIO],
  saida: [
    SKU,
    ITEM,
    DATA,
    VALOR_UNIT,
    qtd("Saída"),
    TOTAL,
    OS,
    FROTA,
    COLABORADOR,
    CENTRO,
    USUARIO,
  ],
  geral: [
    DATA,
    { chave: "tipo", rotulo: "Tipo", largura: 18 },
    SKU,
    ITEM,
    qtd("Quantidade"),
    VALOR_UNIT,
    TOTAL,
    FORNECEDOR,
    NF,
    OS,
    FROTA,
    COLABORADOR,
    CENTRO,
    USUARIO,
    { chave: "motivo", rotulo: "Motivo", largura: 28 },
  ],
};

const TITULO_MOVIMENTACAO: Record<ModoRelatorio, { nome: string; titulo: string }> = {
  entrada: { nome: "Entradas", titulo: "Entrada de Estoque (Compras/Reposição)" },
  saida: { nome: "Saídas", titulo: "Saídas de Estoque" },
  geral: { nome: "Movimentações", titulo: "Movimentações de Estoque (Entradas e Saídas)" },
};

export function abaMovimentacoes(modo: ModoRelatorio, linhas: LinhaMovimentacao[]): AbaXlsx {
  return {
    ...TITULO_MOVIMENTACAO[modo],
    colunas: COLUNAS_MOVIMENTACAO[modo],
    linhas: linhas.map((l) => ({
      data: dataBelem(l.criado_em),
      tipo: rotuloTipo(l),
      sku: l.sku,
      item: l.item,
      quantidade: l.quantidade,
      custo_unitario: l.custo_unitario,
      valor: l.valor,
      fornecedor: l.fornecedor,
      numero_nf: l.numero_nf,
      numero_os: l.numero_os,
      placa: l.placa,
      mecanico: l.mecanico,
      centro_custo: l.centro_custo,
      usuario: l.usuario,
      motivo: l.motivo,
    })),
  };
}

export function abaEstoqueGeral(estoque: EstoqueGeral[]): AbaXlsx {
  return {
    nome: "Estoque Geral",
    titulo: "Estoque Geral",
    colunas: [
      SKU,
      ITEM,
      { chave: "unidade", rotulo: "Unidade", largura: 10 },
      { chave: "entradas", rotulo: "Entradas", largura: 12, tipo: "numero" },
      { chave: "saidas", rotulo: "Saídas", largura: 12, tipo: "numero" },
      { chave: "saldo", rotulo: "Total do Estoque", largura: 17, tipo: "numero" },
      { chave: "custo_medio", rotulo: "Custo médio", largura: 15, tipo: "moeda" },
      { chave: "valor_estoque", rotulo: "Valor em estoque", largura: 17, tipo: "moeda" },
      { chave: "status", rotulo: "Status", largura: 16, status: true },
    ],
    linhas: estoque.map((e) => ({
      sku: e.sku,
      item: e.nome,
      unidade: e.unidade,
      entradas: e.entradas,
      saidas: e.saidas,
      saldo: e.saldo,
      custo_medio: e.custo_medio,
      valor_estoque: e.valor_estoque,
      status: e.status,
    })),
  };
}

/** Uma linha por fornecedor x item fornecido; fornecedor sem item aparece com o item em branco. */
export function abaFornecedores(fornecedores: Fornecedor[], itens: { fornecedor_id: string | null; nome: string }[]): AbaXlsx {
  const itensPorFornecedor = new Map<string, string[]>();
  itens.forEach((i) => {
    if (!i.fornecedor_id) return;
    itensPorFornecedor.set(i.fornecedor_id, [...(itensPorFornecedor.get(i.fornecedor_id) ?? []), i.nome]);
  });

  const linhas = fornecedores.flatMap((f) =>
    (itensPorFornecedor.get(f.id) ?? [null]).map((nomeItem) => ({
      empresa: f.nome,
      item: nomeItem,
      cnpj: f.cnpj,
      endereco: f.endereco,
      telefone: f.telefone,
      email: f.email,
      prazo: f.prazo_entrega_dias,
    }))
  );

  return {
    nome: "Fornecedores",
    titulo: "Fornecedores",
    colunas: [
      { chave: "empresa", rotulo: "Empresa", largura: 28 },
      { chave: "item", rotulo: "Item Fornecido", largura: 34 },
      { chave: "cnpj", rotulo: "CNPJ", largura: 20 },
      { chave: "endereco", rotulo: "Endereço", largura: 32 },
      { chave: "telefone", rotulo: "Telefone", largura: 18 },
      { chave: "email", rotulo: "E-mail", largura: 30 },
      { chave: "prazo", rotulo: "Prazo de entrega (dias)", largura: 16, tipo: "numero" },
    ],
    linhas,
  };
}

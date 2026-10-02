import type { Database } from "@/types/database";
import { dataBelem, type AbaXlsx, type ColunaXlsx } from "@/lib/xlsx";
import { mesAno } from "@/lib/formato";
import { rotuloTipo, type LinhaMovimentacao, type ModoRelatorio } from "@/lib/relatorio-movimentacoes";

type Views = Database["public"]["Views"];
type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"];
type EstoqueGeral = Views["v_estoque_geral"]["Row"];
type ConsumoVeiculo = Pick<Views["v_consumo_por_veiculo"]["Row"], "placa" | "modelo" | "mes" | "custo_total" | "movimentos">;
type ConsumoCentro = Pick<Views["v_consumo_por_centro"]["Row"], "centro_custo" | "mes" | "custo_total">;
type ItemParado = Pick<
  Views["v_itens_parados"]["Row"],
  "sku" | "nome" | "saldo" | "valor_parado" | "ultima_saida" | "dias_sem_saida"
>;
type ValorEstoque = Pick<Views["v_valor_estoque"]["Row"], "categoria" | "itens" | "unidades" | "valor">;
type LinhaKardex = Pick<
  Views["v_kardex"]["Row"],
  "criado_em" | "tipo" | "destino" | "quantidade" | "custo_unitario" | "valor" | "usuario" | "motivo"
>;

// Colunas na ordem do modelo (Codigo, Item, Data, Valor, Quantidade) + o que este sistema controla a mais.
const SKU: ColunaXlsx = { chave: "sku", rotulo: "Código do Produto", largura: 18 };
const ITEM: ColunaXlsx = { chave: "item", rotulo: "Item", largura: 34 };
const DATA: ColunaXlsx = { chave: "data", rotulo: "Data", largura: 17, tipo: "dataHora" };
const VALOR_UNIT: ColunaXlsx = { chave: "custo_unitario", rotulo: "Valor unitário", largura: 15, tipo: "moeda" };
const TOTAL: ColunaXlsx = { chave: "valor", rotulo: "Total", largura: 15, tipo: "moeda" };
const FORNECEDOR: ColunaXlsx = { chave: "fornecedor", rotulo: "Fornecedor", largura: 26 };
const FROTA: ColunaXlsx = { chave: "placa", rotulo: "Frota / placa", largura: 15 };
const CENTRO: ColunaXlsx = { chave: "centro_custo", rotulo: "Centro de custo", largura: 22 };
const USUARIO: ColunaXlsx = { chave: "usuario", rotulo: "Registrado por", largura: 20 };
const qtd = (rotulo: string): ColunaXlsx => ({ chave: "quantidade", rotulo, largura: 12, tipo: "numero" });

const COLUNAS_MOVIMENTACAO: Record<ModoRelatorio, ColunaXlsx[]> = {
  entrada: [SKU, ITEM, DATA, VALOR_UNIT, qtd("Entrada"), TOTAL, FORNECEDOR, FROTA, USUARIO],
  saida: [SKU, ITEM, DATA, VALOR_UNIT, qtd("Saída"), TOTAL, FROTA, CENTRO, USUARIO],
  geral: [
    DATA,
    { chave: "tipo", rotulo: "Tipo", largura: 18 },
    SKU,
    ITEM,
    qtd("Quantidade"),
    VALOR_UNIT,
    TOTAL,
    FORNECEDOR,
    FROTA,
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
      placa: l.placa,
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

// As abas abaixo espelham, coluna por coluna, o CSV da rota /exportar de cada relatório.
const MES: ColunaXlsx = { chave: "mes", rotulo: "Mês", largura: 14 };
const CUSTO_TOTAL: ColunaXlsx = { chave: "custo_total", rotulo: "Custo total", largura: 16, tipo: "moeda" };

export function abaConsumoVeiculo(linhas: ConsumoVeiculo[]): AbaXlsx {
  return {
    nome: "Consumo por veículo",
    titulo: "Consumo de Material por Veículo",
    colunas: [
      { chave: "placa", rotulo: "Placa", largura: 14 },
      { chave: "modelo", rotulo: "Modelo", largura: 24 },
      MES,
      { chave: "movimentos", rotulo: "Saídas", largura: 10, tipo: "numero" },
      CUSTO_TOTAL,
    ],
    linhas: linhas.map((l) => ({
      placa: l.placa,
      modelo: l.modelo,
      mes: mesAno(l.mes),
      movimentos: l.movimentos,
      custo_total: l.custo_total,
    })),
  };
}

export function abaConsumoCentro(linhas: ConsumoCentro[]): AbaXlsx {
  return {
    nome: "Consumo por centro de custo",
    titulo: "Consumo de Material por Centro de Custo",
    colunas: [{ chave: "centro_custo", rotulo: "Centro de custo", largura: 28 }, MES, CUSTO_TOTAL],
    linhas: linhas.map((l) => ({ centro_custo: l.centro_custo, mes: mesAno(l.mes), custo_total: l.custo_total })),
  };
}

export function abaItensParados(linhas: ItemParado[]): AbaXlsx {
  return {
    nome: "Itens parados",
    titulo: "Itens Parados (sem saída há mais de 90 dias)",
    colunas: [
      SKU,
      ITEM,
      { chave: "saldo", rotulo: "Saldo", largura: 12, tipo: "numero" },
      { chave: "valor_parado", rotulo: "Valor parado", largura: 16, tipo: "moeda" },
      { chave: "ultima_saida", rotulo: "Última saída", largura: 14, tipo: "data" },
      { chave: "dias_sem_saida", rotulo: "Dias parado", largura: 12, tipo: "numero" },
    ],
    linhas: linhas.map((l) => ({
      sku: l.sku,
      item: l.nome,
      saldo: l.saldo,
      valor_parado: l.valor_parado,
      ultima_saida: l.ultima_saida ? dataBelem(l.ultima_saida) : "Nunca",
      dias_sem_saida: l.dias_sem_saida,
    })),
  };
}

export function abaValorEstoque(linhas: ValorEstoque[]): AbaXlsx {
  return {
    nome: "Valor imobilizado",
    titulo: "Valor Imobilizado por Categoria",
    colunas: [
      { chave: "categoria", rotulo: "Categoria", largura: 28 },
      { chave: "itens", rotulo: "Itens", largura: 10, tipo: "numero" },
      { chave: "unidades", rotulo: "Unidades", largura: 14, tipo: "numero" },
      { chave: "valor", rotulo: "Valor", largura: 16, tipo: "moeda" },
    ],
    linhas: linhas.map((l) => ({ categoria: l.categoria, itens: l.itens, unidades: l.unidades, valor: l.valor })),
  };
}

/** `item` dá nome à faixa de título ("Kardex — SKU · Nome"). */
export function abaKardex(linhas: LinhaKardex[], item?: { sku: string; nome: string }): AbaXlsx {
  return {
    nome: "Kardex",
    titulo: item ? `Kardex — ${item.sku} · ${item.nome}` : "Kardex",
    colunas: [
      DATA,
      { chave: "tipo", rotulo: "Tipo", largura: 14 },
      { chave: "destino", rotulo: "Destino", largura: 22 },
      qtd("Quantidade"),
      VALOR_UNIT,
      TOTAL,
      USUARIO,
      { chave: "motivo", rotulo: "Motivo", largura: 28 },
    ],
    linhas: linhas.map((l) => ({
      data: dataBelem(l.criado_em),
      tipo: l.tipo,
      destino: l.destino,
      quantidade: l.quantidade,
      custo_unitario: l.custo_unitario,
      valor: l.valor,
      usuario: l.usuario,
      motivo: l.motivo,
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

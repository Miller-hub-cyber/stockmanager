/**
 * Catálogo dos relatórios. A chave é o segmento da URL em /gestao/relatorios
 * e o valor gravado em exportacoes.relatorio (lista fechada por CHECK em 0016).
 * `periodo` diz como o relatório usa de/ate: por dia, por mês ou não usa.
 */
export const RELATORIOS = {
  entradas: { nome: "Entradas", periodo: "dia" },
  saidas: { nome: "Saídas", periodo: "dia" },
  geral: { nome: "Geral", periodo: "dia" },
  kardex: { nome: "Kardex por item", periodo: null },
  "consumo-veiculo": { nome: "Consumo por veículo", periodo: "mes" },
  "consumo-centro": { nome: "Consumo por centro de custo", periodo: "mes" },
  "itens-parados": { nome: "Itens parados", periodo: null },
  "valor-estoque": { nome: "Valor imobilizado", periodo: null },
} as const satisfies Record<string, { nome: string; periodo: "dia" | "mes" | null }>;

export type ChaveRelatorio = keyof typeof RELATORIOS;

export function ehChaveRelatorio(valor: string): valor is ChaveRelatorio {
  return Object.prototype.hasOwnProperty.call(RELATORIOS, valor);
}

export interface FiltrosExportacao {
  de?: string | null;
  ate?: string | null;
  veiculoId?: string | null;
  itemId?: string | null;
  formato?: "csv" | "xlsx";
}

function comQuery(caminho: string, { de, ate, veiculoId, itemId, formato }: FiltrosExportacao): string {
  const parametros = new URLSearchParams();
  if (de) parametros.set("de", de);
  if (ate) parametros.set("ate", ate);
  if (veiculoId) parametros.set("veiculoId", veiculoId);
  if (itemId) parametros.set("itemId", itemId);
  if (formato === "xlsx") parametros.set("formato", "xlsx");
  const query = parametros.toString();
  return query ? `${caminho}?${query}` : caminho;
}

export const rotaRelatorio = (chave: ChaveRelatorio, filtros: FiltrosExportacao = {}) =>
  comQuery(`/gestao/relatorios/${chave}`, filtros);

export const rotaExportacao = (chave: ChaveRelatorio, filtros: FiltrosExportacao = {}) =>
  comQuery(`/gestao/relatorios/${chave}/exportar`, filtros);

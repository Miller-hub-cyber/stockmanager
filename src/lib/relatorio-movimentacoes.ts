import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { dataHora } from "@/lib/formato";

/**
 * Tres visoes da mesma view (v_movimentacoes_detalhe):
 * - entrada: so compras/entradas originais
 * - saida:   so saidas originais
 * - geral:   tudo, inclusive estornos, para conferencia
 * Nas visoes entrada e saida, movimentacao estornada e o seu estorno ficam de fora
 * (o efeito liquido e zero); no geral aparecem as duas, marcadas.
 */
export type ModoRelatorio = "entrada" | "saida" | "geral";

export interface FiltrosRelatorio {
  de?: string;
  ate?: string;
  veiculoId?: string;
  funcionarioId?: string;
  /** Busca parcial, sem diferenciar maiusculas: "12212" acha "OS 12212". */
  numeroOs?: string;
}

export type LinhaMovimentacao = Omit<
  Database["public"]["Views"]["v_movimentacoes_detalhe"]["Row"],
  "empresa_id" | "item_id" | "veiculo_id" | "funcionario_id" | "km_veiculo"
>;

const COLUNAS =
  "id, criado_em, tipo, sku, item, unidade, quantidade, custo_unitario, valor, placa, mecanico, centro_custo, fornecedor, numero_nf, numero_os, usuario, motivo, estorno_de, estornada";

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const uuid = z.string().uuid();

/** Valida cada filtro individualmente: valor invalido na URL e ignorado, nao quebra a pagina. */
export function lerFiltros(bruto: { [chave: string]: string | string[] | undefined }): FiltrosRelatorio {
  const texto = (chave: string) => (typeof bruto[chave] === "string" ? (bruto[chave] as string) : undefined);
  return {
    de: dataIso.safeParse(texto("de")).data,
    ate: dataIso.safeParse(texto("ate")).data,
    veiculoId: uuid.safeParse(texto("veiculoId")).data,
    funcionarioId: uuid.safeParse(texto("funcionarioId")).data,
    numeroOs: texto("numeroOs")?.trim().slice(0, 40) || undefined,
  };
}

/** Escapa os curingas do LIKE para que o que o usuario digitou seja buscado literalmente. */
export function padraoContem(termo: string): string {
  return `%${termo.replace(/[\\%_]/g, "\\$&")}%`;
}

/** Querystring para repassar os filtros da tela ao endpoint de exportacao. */
export function filtrosParaQuery(filtros: FiltrosRelatorio): string {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor) params.set(chave, valor);
  });
  return params.toString();
}

/** Busca em pagina unica (tela). Devolve ate `limite` linhas, da mais recente para a mais antiga. */
export async function buscarMovimentacoes(
  supabase: SupabaseClient<Database>,
  modo: ModoRelatorio,
  filtros: FiltrosRelatorio,
  inicio: number,
  limite: number
): Promise<LinhaMovimentacao[]> {
  let consulta = supabase.from("v_movimentacoes_detalhe").select(COLUNAS);

  if (modo === "entrada") consulta = consulta.eq("tipo", "entrada").is("estorno_de", null).eq("estornada", false);
  if (modo === "saida") consulta = consulta.eq("tipo", "saida").is("estorno_de", null).eq("estornada", false);

  // Datas de calendario em America/Belem (UTC-3, sem horario de verao).
  if (filtros.de) consulta = consulta.gte("criado_em", `${filtros.de}T00:00:00-03:00`);
  if (filtros.ate) consulta = consulta.lte("criado_em", `${filtros.ate}T23:59:59.999-03:00`);
  if (filtros.veiculoId) consulta = consulta.eq("veiculo_id", filtros.veiculoId);
  if (filtros.funcionarioId) consulta = consulta.eq("funcionario_id", filtros.funcionarioId);
  if (filtros.numeroOs) consulta = consulta.ilike("numero_os", padraoContem(filtros.numeroOs));

  const { data, error } = await consulta
    .order("criado_em", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, inicio + limite - 1);

  // Falha de consulta nao pode virar "nenhum registro": quem chama decide como mostrar o erro.
  if (error) throw new Error(`Relatório de ${modo}: ${error.message}`);
  return data ?? [];
}

/** Busca tudo em paginas de 1000 (limite do PostgREST), para a exportacao CSV. */
export async function buscarTodasMovimentacoes(
  supabase: SupabaseClient<Database>,
  modo: ModoRelatorio,
  filtros: FiltrosRelatorio,
  maximo = 20000
): Promise<LinhaMovimentacao[]> {
  const TAMANHO_PAGINA = 1000;
  const todas: LinhaMovimentacao[] = [];
  for (let inicio = 0; inicio < maximo; inicio += TAMANHO_PAGINA) {
    const pagina = await buscarMovimentacoes(supabase, modo, filtros, inicio, TAMANHO_PAGINA);
    todas.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) break;
  }
  return todas;
}

export function rotuloTipo(l: Pick<LinhaMovimentacao, "tipo" | "estorno_de" | "estornada">): string {
  if (l.estorno_de) return "Estorno";
  const base = l.tipo === "entrada" ? "Entrada" : l.tipo === "saida" ? "Saída" : l.tipo;
  return l.estornada ? `${base} (estornada)` : base;
}

const decimal = (n: number, casas: number) => Number(n).toFixed(casas).replace(".", ",");

export const COLUNAS_CSV: Record<ModoRelatorio, { chave: string; rotulo: string }[]> = {
  entrada: [
    { chave: "data", rotulo: "Data" },
    { chave: "sku", rotulo: "SKU" },
    { chave: "item", rotulo: "Item" },
    { chave: "quantidade", rotulo: "Quantidade" },
    { chave: "unidade", rotulo: "Unidade" },
    { chave: "custo_unitario", rotulo: "Custo unitário" },
    { chave: "valor", rotulo: "Valor" },
    { chave: "fornecedor", rotulo: "Fornecedor" },
    { chave: "numero_nf", rotulo: "NF" },
    { chave: "numero_os", rotulo: "OS" },
    { chave: "placa", rotulo: "Frota / placa" },
    { chave: "mecanico", rotulo: "Colaborador" },
    { chave: "usuario", rotulo: "Usuário" },
  ],
  saida: [
    { chave: "data", rotulo: "Data" },
    { chave: "sku", rotulo: "SKU" },
    { chave: "item", rotulo: "Item" },
    { chave: "quantidade", rotulo: "Quantidade" },
    { chave: "unidade", rotulo: "Unidade" },
    { chave: "custo_unitario", rotulo: "Custo unitário" },
    { chave: "valor", rotulo: "Valor" },
    { chave: "numero_os", rotulo: "OS" },
    { chave: "placa", rotulo: "Frota / placa" },
    { chave: "mecanico", rotulo: "Colaborador" },
    { chave: "centro_custo", rotulo: "Centro de custo" },
    { chave: "usuario", rotulo: "Usuário" },
  ],
  geral: [
    { chave: "data", rotulo: "Data" },
    { chave: "tipo", rotulo: "Tipo" },
    { chave: "sku", rotulo: "SKU" },
    { chave: "item", rotulo: "Item" },
    { chave: "quantidade", rotulo: "Quantidade" },
    { chave: "unidade", rotulo: "Unidade" },
    { chave: "custo_unitario", rotulo: "Custo unitário" },
    { chave: "valor", rotulo: "Valor" },
    { chave: "fornecedor", rotulo: "Fornecedor" },
    { chave: "numero_nf", rotulo: "NF" },
    { chave: "numero_os", rotulo: "OS" },
    { chave: "placa", rotulo: "Frota / placa" },
    { chave: "mecanico", rotulo: "Colaborador" },
    { chave: "centro_custo", rotulo: "Centro de custo" },
    { chave: "usuario", rotulo: "Usuário" },
    { chave: "motivo", rotulo: "Motivo" },
  ],
};

export function linhaParaCsv(l: LinhaMovimentacao): Record<string, string | number | null> {
  return {
    data: dataHora(l.criado_em),
    tipo: rotuloTipo(l),
    sku: l.sku,
    item: l.item,
    quantidade: decimal(l.quantidade, 3),
    unidade: l.unidade,
    custo_unitario: decimal(l.custo_unitario, 4),
    valor: decimal(l.valor, 2),
    fornecedor: l.fornecedor,
    numero_nf: l.numero_nf,
    numero_os: l.numero_os,
    placa: l.placa,
    mecanico: l.mecanico,
    centro_custo: l.centro_custo,
    usuario: l.usuario,
    motivo: l.motivo,
  };
}

export const ARQUIVO_CSV: Record<ModoRelatorio, string> = {
  entrada: "relatorio-entradas.csv",
  saida: "relatorio-saidas.csv",
  geral: "relatorio-geral.csv",
};

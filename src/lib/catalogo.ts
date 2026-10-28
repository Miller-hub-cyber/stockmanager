import type { Database } from "@/types/database";

export type EntradaCatalogo = Pick<
  Database["public"]["Tables"]["catalogo_itens"]["Row"],
  "nome" | "grupo" | "tipo" | "unidade" | "ncm"
>;

/** Minusculo e sem acento: "Óleo" e "oleo" precisam casar na busca. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Cada palavra digitada precisa aparecer no nome, em qualquer ordem:
 * "filtro oleo" e "oleo filtro" acham "Filtro de óleo do motor". Nomes que
 * comecam pelo que foi digitado vem primeiro.
 */
export function filtrarCatalogo(
  catalogo: EntradaCatalogo[],
  consulta: string,
  limite = 8
): EntradaCatalogo[] {
  const palavras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palavras.length === 0 || normalizar(consulta).length < 2) return [];

  const inicio = palavras.join(" ");
  return catalogo
    .map((entrada) => ({ entrada, nome: normalizar(entrada.nome) }))
    .filter(({ nome }) => palavras.every((p) => nome.includes(p)))
    .sort((a, b) => Number(b.nome.startsWith(inicio)) - Number(a.nome.startsWith(inicio)))
    .slice(0, limite)
    .map(({ entrada }) => entrada);
}

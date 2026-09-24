import { type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";
import type { Database } from "@/types/database";
import {
  ARQUIVO_CSV,
  COLUNAS_CSV,
  buscarTodasMovimentacoes,
  lerFiltros,
  linhaParaCsv,
  type ModoRelatorio,
} from "@/lib/relatorio-movimentacoes";
import { abaEstoqueGeral, abaFornecedores, abaMovimentacoes } from "@/lib/relatorio-xlsx";
import { montarXlsx, respostaXlsx, type AbaXlsx } from "@/lib/xlsx";

const TAMANHO_PAGINA = 1000; // limite do PostgREST por requisicao

/** Le uma consulta inteira em paginas de 1000. */
async function lerTudo<T>(
  buscar: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data, error } = await buscar(de, de + TAMANHO_PAGINA - 1);
    if (error) throw new Error(error.message);
    const pagina = data ?? [];
    todas.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) return todas;
  }
}

/**
 * Relatorio geral em Excel: as movimentacoes (com os filtros da tela) mais a
 * posicao atual do estoque e os fornecedores, que nao dependem do periodo.
 */
async function abasDoGeral(supabase: SupabaseClient<Database>, movimentacoes: AbaXlsx): Promise<AbaXlsx[]> {
  const [estoque, fornecedores, itens] = await Promise.all([
    lerTudo((de, ate) => supabase.from("v_estoque_geral").select("*").order("nome").range(de, ate)),
    lerTudo((de, ate) =>
      supabase.from("fornecedores").select("*").eq("ativo", true).order("nome").range(de, ate)
    ),
    lerTudo((de, ate) =>
      supabase
        .from("itens")
        .select("fornecedor_id, nome")
        .eq("ativo", true)
        .not("fornecedor_id", "is", null)
        .order("nome")
        .range(de, ate)
    ),
  ]);

  return [movimentacoes, abaEstoqueGeral(estoque), abaFornecedores(fornecedores, itens)];
}

/** Corpo comum das rotas /exportar dos relatorios de entrada, saida e geral. */
export async function exportarMovimentacoes(modo: ModoRelatorio, request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const parametros = request.nextUrl.searchParams;
  const filtros = lerFiltros(Object.fromEntries(parametros));
  const supabase = createClient();

  try {
    const linhas = await buscarTodasMovimentacoes(supabase, modo, filtros);

    if (parametros.get("formato") === "xlsx") {
      const movimentacoes = abaMovimentacoes(modo, linhas);
      const abas = modo === "geral" ? await abasDoGeral(supabase, movimentacoes) : [movimentacoes];
      // Data no fuso de Belem (UTC-3) para o nome do arquivo.
      const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return respostaXlsx(await montarXlsx(abas), ARQUIVO_CSV[modo].replace(".csv", `-${hoje}.xlsx`));
    }

    return respostaCsv(paraCsv(linhas.map(linhaParaCsv), COLUNAS_CSV[modo]), ARQUIVO_CSV[modo]);
  } catch (erro) {
    console.error("Falha ao exportar relatorio", erro);
    return new Response("Não foi possível gerar o relatório. Tente novamente.", { status: 500 });
  }
}

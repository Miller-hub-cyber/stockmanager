import { type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { lerTudo } from "@/lib/supabase/lerTudo";
import { obterUsuarioAtual, type UsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";
import { diaBelem } from "@/lib/formato";
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
import { registrarExportacao } from "@/lib/exportacoes";
import type { ChaveRelatorio, FiltrosExportacao } from "@/lib/relatorios";

const RELATORIO_DO_MODO: Record<ModoRelatorio, ChaveRelatorio> = {
  entrada: "entradas",
  saida: "saidas",
  geral: "geral",
};

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

interface OpcoesExportacao {
  /** Nome do arquivo sem extensao; o Excel leva a data de hoje no fim. */
  arquivo: string;
  csv: () => string;
  xlsx: () => AbaXlsx[] | Promise<AbaXlsx[]>;
  /** Filtros que geraram o arquivo, para o historico de exportacoes. */
  filtros?: FiltrosExportacao;
}

/**
 * Resposta comum das rotas /exportar: CSV por padrao, Excel com ?formato=xlsx.
 * So monta o formato pedido e registra a exportacao no historico.
 */
export async function responderExportacao(
  request: NextRequest,
  usuario: UsuarioAtual,
  relatorio: ChaveRelatorio,
  { arquivo, csv, xlsx, filtros }: OpcoesExportacao
): Promise<Response> {
  const formato = request.nextUrl.searchParams.get("formato") === "xlsx" ? "xlsx" : "csv";
  const resposta =
    formato === "xlsx"
      ? respostaXlsx(await montarXlsx(await xlsx()), `${arquivo}-${diaBelem(new Date())}.xlsx`)
      : respostaCsv(csv(), `${arquivo}.csv`);
  await registrarExportacao(request, usuario, relatorio, { ...filtros, formato });
  return resposta;
}

/** Corpo comum das rotas /exportar dos relatorios de entrada, saida e geral. */
export async function exportarMovimentacoes(modo: ModoRelatorio, request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const filtros = lerFiltros(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createClient();

  try {
    const linhas = await buscarTodasMovimentacoes(supabase, modo, filtros);

    return await responderExportacao(request, usuario, RELATORIO_DO_MODO[modo], {
      arquivo: ARQUIVO_CSV[modo].replace(".csv", ""),
      csv: () => paraCsv(linhas.map(linhaParaCsv), COLUNAS_CSV[modo]),
      xlsx: async () => {
        const movimentacoes = abaMovimentacoes(modo, linhas);
        return modo === "geral" ? abasDoGeral(supabase, movimentacoes) : [movimentacoes];
      },
      filtros,
    });
  } catch (erro) {
    console.error("Falha ao exportar relatorio", erro);
    return new Response("Não foi possível gerar o relatório. Tente novamente.", { status: 500 });
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { UsuarioAtual } from "@/lib/sessao";
import type { Database } from "@/types/database";
import { dataHora } from "@/lib/formato";
import { descreverMeses, descreverPeriodo } from "@/lib/periodo";
import {
  RELATORIOS,
  ehChaveRelatorio,
  rotaExportacao,
  type ChaveRelatorio,
  type FiltrosExportacao,
} from "@/lib/relatorios";

/**
 * Grava a exportação no histórico. Nunca derruba o download: se o registro
 * falhar (ex.: migration 0016 ainda não aplicada), fica só no log do servidor.
 *
 * Um <Link> do Next para a rota de exportação chama a rota mais de uma vez:
 * no prefetch e no clique, que primeiro pede a URL com o cabeçalho RSC e só
 * depois cai na navegação comum que baixa o arquivo. Só esta última conta.
 */
export async function registrarExportacao(
  request: Request,
  usuario: UsuarioAtual,
  relatorio: ChaveRelatorio,
  filtros: FiltrosExportacao = {}
): Promise<void> {
  if (request.headers.has("rsc") || request.headers.has("next-router-prefetch")) return;

  try {
    const { error } = await createClient()
      .from("exportacoes")
      .insert({
        empresa_id: usuario.empresaId,
        usuario_id: usuario.id,
        relatorio,
        formato: filtros.formato ?? "csv",
        periodo_de: filtros.de ?? null,
        periodo_ate: filtros.ate ?? null,
        item_id: filtros.itemId ?? null,
        veiculo_id: filtros.veiculoId ?? null,
      });
    if (error) console.error("Falha ao registrar exportacao", error.message);
  } catch (erro) {
    console.error("Falha ao registrar exportacao", erro);
  }
}

export interface ExportacaoListada {
  id: string;
  nome: string;
  formato: string;
  quando: string;
  /** Período, item ou placa usados na exportação, já em texto. */
  alcance: string;
  /** Rota de exportação com os mesmos filtros (dados de agora). */
  url: string;
  usuario?: string;
}

interface OpcoesListagem {
  /** Só as exportações deste usuário; sem ele, as da empresa toda. */
  usuarioId?: string;
  limite: number;
  comUsuario?: boolean;
}

const nenhum = Promise.resolve({ data: [] as { id: string; nome: string }[] });

/** Últimas exportações, mais recentes primeiro. `null` quando a consulta falha. */
export async function listarExportacoes(
  supabase: SupabaseClient<Database>,
  { usuarioId, limite, comUsuario = false }: OpcoesListagem
): Promise<ExportacaoListada[] | null> {
  let consulta = supabase
    .from("exportacoes")
    .select("id, usuario_id, relatorio, formato, periodo_de, periodo_ate, item_id, veiculo_id, criado_em");
  if (usuarioId) consulta = consulta.eq("usuario_id", usuarioId);

  const { data, error } = await consulta.order("criado_em", { ascending: false }).limit(limite);
  if (error) {
    console.error("Falha ao carregar exportacoes", error.message);
    return null;
  }

  const linhas = (data ?? []).flatMap((linha) =>
    ehChaveRelatorio(linha.relatorio) ? [{ ...linha, relatorio: linha.relatorio }] : []
  );
  const distintos = (valores: (string | null)[]) =>
    Array.from(new Set(valores.filter((v): v is string => Boolean(v))));
  const itemIds = distintos(linhas.map((l) => l.item_id));
  const veiculoIds = distintos(linhas.map((l) => l.veiculo_id));
  const usuarioIds = comUsuario ? distintos(linhas.map((l) => l.usuario_id)) : [];

  const [{ data: itens }, { data: veiculos }, { data: usuarios }] = await Promise.all([
    itemIds.length ? supabase.from("itens").select("id, nome").in("id", itemIds) : nenhum,
    veiculoIds.length
      ? supabase
          .from("veiculos")
          .select("id, placa")
          .in("id", veiculoIds)
          .then(({ data }) => ({ data: (data ?? []).map((v) => ({ id: v.id, nome: v.placa })) }))
      : nenhum,
    usuarioIds.length ? supabase.from("usuarios").select("id, nome").in("id", usuarioIds) : nenhum,
  ]);
  const nomes = (lista: { id: string; nome: string }[] | null) => new Map((lista ?? []).map((l) => [l.id, l.nome]));
  const nomeItem = nomes(itens);
  const placa = nomes(veiculos);
  const nomeUsuario = nomes(usuarios);

  return linhas.map((linha) => {
    const relatorio = RELATORIOS[linha.relatorio];
    const alcance: string[] = [];
    if (relatorio.periodo === "dia") alcance.push(descreverPeriodo(linha.periodo_de, linha.periodo_ate));
    if (relatorio.periodo === "mes") alcance.push(descreverMeses(linha.periodo_de, linha.periodo_ate));
    if (linha.item_id) alcance.push(nomeItem.get(linha.item_id) ?? "item");
    if (linha.veiculo_id) alcance.push(placa.get(linha.veiculo_id) ?? "veículo");
    if (alcance.length === 0) alcance.push("posição do estoque");

    const filtros: FiltrosExportacao = {
      de: linha.periodo_de,
      ate: linha.periodo_ate,
      itemId: linha.item_id,
      veiculoId: linha.veiculo_id,
      formato: linha.formato === "xlsx" ? "xlsx" : "csv",
    };

    return {
      id: linha.id,
      nome: relatorio.nome,
      formato: linha.formato,
      quando: dataHora(linha.criado_em),
      alcance: alcance.join(" · "),
      url: rotaExportacao(linha.relatorio, filtros),
      usuario: comUsuario ? nomeUsuario.get(linha.usuario_id) ?? "—" : undefined,
    };
  });
}

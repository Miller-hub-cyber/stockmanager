import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftRight, CalendarDays, Clock, Database, List, TrendingDown, TrendingUp, Truck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { Botao, Campo, FormularioFiltro } from "@/components/ui";
import { brl, diaBelem } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { contarMovimentacoes } from "@/lib/relatorio-movimentacoes";
import { descreverMeses, descreverPeriodo, inicioDoMes, resolverPeriodo, type OpcaoPeriodo } from "@/lib/periodo";
import { rotaExportacao, rotaRelatorio, type ChaveRelatorio, type FiltrosExportacao } from "@/lib/relatorios";
import { listarExportacoes } from "@/lib/exportacoes";
import { BuscaRelatorios, CampoBuscaRelatorio, ListaRelatorios, type SecaoRelatorios } from "./CatalogoRelatorios";

const CHIPS_PERIODO: { opcao: OpcaoPeriodo; rotulo: string }[] = [
  { opcao: "7d", rotulo: "Últimos 7 dias" },
  { opcao: "30d", rotulo: "Últimos 30 dias" },
  { opcao: "ano", rotulo: "Este ano" },
  { opcao: "personalizado", rotulo: "Personalizado" },
];

interface Props {
  searchParams: { [chave: string]: string | string[] | undefined };
}

type Resultado<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;

/** Soma de uma coluna; `null` se a consulta falhar (falha não pode virar zero no cartão). */
async function somar<L>(consulta: Resultado<L[]>, valor: (linha: L) => number): Promise<number | null> {
  const { data, error } = await consulta;
  if (error) {
    console.error("Resumo de relatórios", error.message);
    return null;
  }
  return (data ?? []).reduce((soma, linha) => soma + valor(linha), 0);
}

async function contar(promessa: Promise<number>): Promise<number | null> {
  try {
    return await promessa;
  } catch (erro) {
    console.error("Resumo de relatórios", erro);
    return null;
  }
}

const numero = (n: number | null) => (n === null ? "—" : n.toLocaleString("pt-BR"));
const dinheiro = (n: number | null) => (n === null ? "R$ —" : brl(n));
const plural = (n: number | null, um: string, varios: string) => (n === 1 ? um : varios);

/** Os dois botões de download do cartão: CSV e planilha do Excel, com os mesmos filtros. */
const exportar = (chave: ChaveRelatorio, filtros: FiltrosExportacao = {}) => ({
  csv: rotaExportacao(chave, filtros),
  xlsx: rotaExportacao(chave, { ...filtros, formato: "xlsx" }),
});

export default async function PaginaRelatorios({ searchParams }: Props) {
  const usuario = await obterUsuarioAtual();
  const supabase = createClient();
  const periodo = resolverPeriodo(searchParams, diaBelem(new Date()));
  const { de, ate } = periodo;

  // Consumo é mensal: o período entra como os meses que ele toca, igual à página do relatório.
  let consumoVeiculo = supabase.from("v_consumo_por_veiculo").select("custo_total");
  let consumoCentro = supabase.from("v_consumo_por_centro").select("custo_total");
  if (de) {
    consumoVeiculo = consumoVeiculo.gte("mes", inicioDoMes(de));
    consumoCentro = consumoCentro.gte("mes", inicioDoMes(de));
  }
  if (ate) {
    consumoVeiculo = consumoVeiculo.lte("mes", ate);
    consumoCentro = consumoCentro.lte("mes", ate);
  }

  const [entradas, saidas, gastoVeiculo, gastoCentro, parados, valorEstoque, recentes] = await Promise.all([
    contar(contarMovimentacoes(supabase, "entrada", { de, ate })),
    contar(contarMovimentacoes(supabase, "saida", { de, ate })),
    somar(consumoVeiculo, (l) => l.custo_total),
    somar(consumoCentro, (l) => l.custo_total),
    supabase
      .from("v_itens_parados")
      .select("id", { count: "exact", head: true })
      .then(({ count, error }) => (error ? null : count ?? 0)),
    somar(supabase.from("v_valor_estoque").select("valor"), (l) => l.valor),
    usuario ? listarExportacoes(supabase, { usuarioId: usuario.id, limite: 3 }) : null,
  ]);

  const doPeriodo = { de, ate };
  const secoes: SecaoRelatorios[] = [
    {
      titulo: "Movimentação",
      cartoes: [
        {
          chave: "entradas",
          titulo: "Entradas",
          descricao: "O que entrou, de qual fornecedor, para qual frota e quem pediu.",
          resumo: {
            valor: numero(entradas),
            texto: plural(entradas, "lançamento no período", "lançamentos no período"),
          },
          href: rotaRelatorio("entradas", doPeriodo),
          ...exportar("entradas", doPeriodo),
          icone: <TrendingUp size={20} />,
          tom: "musgo",
        },
        {
          chave: "saidas",
          titulo: "Saídas",
          descricao: "O que saiu, para qual frota ou setor.",
          resumo: {
            valor: numero(saidas),
            texto: plural(saidas, "lançamento no período", "lançamentos no período"),
          },
          href: rotaRelatorio("saidas", doPeriodo),
          ...exportar("saidas", doPeriodo),
          icone: <TrendingDown size={20} />,
          tom: "laranja",
        },
        {
          chave: "geral",
          titulo: "Geral",
          descricao: "Entradas e saídas juntas, com estornos.",
          href: rotaRelatorio("geral", doPeriodo),
          ...exportar("geral", doPeriodo),
          icone: <ArrowLeftRight size={20} />,
          tom: "laranja",
        },
        {
          chave: "kardex",
          titulo: "Kardex por item",
          descricao: "Histórico completo de entradas e saídas de um item.",
          dica: "Escolha o item na página do relatório para ver e exportar.",
          href: rotaRelatorio("kardex"),
          icone: <List size={20} />,
          tom: "laranja",
        },
      ],
    },
    {
      titulo: "Consumo",
      cartoes: [
        {
          chave: "consumo-veiculo",
          titulo: "Por veículo",
          descricao: "Custo de material por placa e por mês.",
          resumo: { valor: dinheiro(gastoVeiculo), texto: descreverMeses(de, ate) },
          href: rotaRelatorio("consumo-veiculo", doPeriodo),
          ...exportar("consumo-veiculo", doPeriodo),
          icone: <Truck size={20} />,
          tom: "cobalto",
        },
        {
          chave: "consumo-centro",
          titulo: "Por centro de custo",
          descricao: "Distribuição do gasto entre setores.",
          resumo: { valor: dinheiro(gastoCentro), texto: descreverMeses(de, ate) },
          href: rotaRelatorio("consumo-centro", doPeriodo),
          ...exportar("consumo-centro", doPeriodo),
          icone: <Users size={20} />,
          tom: "cobalto",
        },
      ],
    },
    {
      titulo: "Estoque",
      cartoes: [
        {
          chave: "itens-parados",
          titulo: "Itens parados",
          descricao: "Sem saída há mais de 90 dias.",
          resumo: { valor: numero(parados), texto: plural(parados, "item", "itens") },
          href: rotaRelatorio("itens-parados"),
          ...exportar("itens-parados"),
          icone: <Clock size={20} />,
          tom: "grafite",
        },
        {
          chave: "valor-estoque",
          titulo: "Valor imobilizado",
          descricao: "Saldo multiplicado pelo custo médio.",
          resumo: { valor: dinheiro(valorEstoque), texto: "em estoque" },
          href: rotaRelatorio("valor-estoque"),
          ...exportar("valor-estoque"),
          icone: <Database size={20} />,
          tom: "grafite",
        },
      ],
    },
  ];

  return (
    <main className="p-6 sm:p-8">
      <BuscaRelatorios>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="titulo-tela">Relatórios</h1>
            <p className="mt-1 font-corpo text-sm text-bruma-texto">
              Escolha um relatório para visualizar ou exportar em <span className="font-semibold text-tinta">CSV</span>{" "}
              ou <span className="font-semibold text-tinta">Excel</span>.
            </p>
          </div>
          <CampoBuscaRelatorio />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-corpo text-sm text-bruma-texto">Período</span>
          {CHIPS_PERIODO.map(({ opcao, rotulo }) => (
            <ChipPeriodo
              key={opcao}
              ativo={periodo.opcao === opcao}
              href={
                opcao === "personalizado"
                  ? `/gestao/relatorios?${new URLSearchParams({ periodo: opcao, de: de ?? "", ate: ate ?? "" })}`
                  : `/gestao/relatorios?periodo=${opcao}`
              }
            >
              {opcao === "personalizado" && <CalendarDays size={15} aria-hidden="true" />}
              {rotulo}
            </ChipPeriodo>
          ))}
          <span className="ml-1 font-dado text-xs text-bruma-texto">{descreverPeriodo(de, ate)}</span>
        </div>

        {periodo.opcao === "personalizado" && (
          <FormularioFiltro className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="periodo" value="personalizado" />
            <div className="w-40">
              <Campo id="de" name="de" type="date" rotulo="De" defaultValue={de ?? ""} />
            </div>
            <div className="w-40">
              <Campo id="ate" name="ate" type="date" rotulo="Até" defaultValue={ate ?? ""} />
            </div>
            <div className="w-28">
              <Botao type="submit" variante="secundario">
                Aplicar
              </Botao>
            </div>
          </FormularioFiltro>
        )}

        <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <ListaRelatorios secoes={secoes} />

          <aside className="h-fit rounded border border-giz bg-white p-5 xl:sticky xl:top-8">
            <h2 className="font-display text-base font-semibold text-tinta">Exportações recentes</h2>
            {recentes === null && (
              <p className="mt-3 font-corpo text-sm text-bruma-texto">Histórico indisponível no momento.</p>
            )}
            {recentes?.length === 0 && (
              <p className="mt-3 font-corpo text-sm text-bruma-texto">
                Nenhuma exportação ainda. As que você baixar aparecem aqui.
              </p>
            )}
            {recentes && recentes.length > 0 && (
              <ul className="mt-2">
                {recentes.map((exportacao) => (
                  <li key={exportacao.id}>
                    <a
                      href={exportacao.url}
                      title="Baixar de novo com os mesmos filtros"
                      className="group -mx-2 flex items-center gap-3 rounded px-2 py-2.5 transition-colors duration-150 hover:bg-nevoa"
                    >
                      {/* Mesma cor do botão de origem: Excel em laranja, CSV neutro. */}
                      <span
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded font-dado text-[10px] font-medium uppercase transition-colors duration-150",
                          exportacao.formato === "xlsx"
                            ? "bg-laranja-fundo text-laranja-texto"
                            : "bg-nevoa text-bruma-texto group-hover:bg-white"
                        )}
                      >
                        {exportacao.formato}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-semibold text-tinta">
                          {exportacao.nome}
                        </span>
                        <span className="block truncate font-dado text-xs text-bruma-texto">
                          {exportacao.quando} · {exportacao.alcance}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/gestao/relatorios/exportacoes"
              className="mt-3 inline-block font-corpo text-sm font-medium text-cobalto hover:underline"
            >
              Ver histórico completo
            </Link>
          </aside>
        </div>
      </BuscaRelatorios>
    </main>
  );
}

function ChipPeriodo({ href, ativo, children }: { href: string; ativo: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={ativo ? "true" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 font-corpo text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 ease-mola active:scale-95",
        ativo ? "border-cobalto bg-cobalto text-white" : "border-giz bg-white text-tinta hover:border-bruma"
      )}
    >
      {children}
    </Link>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { Botao } from "@/components/ui";
import { brl, diaBelem, quantidade } from "@/lib/formato";
import { cn } from "@/lib/cn";

const FUSO = "America/Belem";

/** Quantos blocos empilhados formam uma barra cheia (cada bloco = 10%). */
const BLOCOS_POR_BARRA = 10;

function saudacao(): string {
  const hora = Number(new Date().toLocaleString("en-US", { timeZone: FUSO, hour: "numeric", hourCycle: "h23" }));
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** Hora para hoje, "Ontem" para ontem, data curta para o resto. */
function quando(criadoEm: string): string {
  const d = new Date(criadoEm);
  const hoje = diaBelem(new Date());
  const ontem = diaBelem(new Date(Date.now() - 86_400_000));
  const dia = diaBelem(d);
  if (dia === hoje) return d.toLocaleTimeString("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" });
  if (dia === ontem) return "Ontem";
  return d.toLocaleDateString("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit" });
}

function primeiroDiaDoMes(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function PaginaGestao() {
  const usuario = await obterUsuarioAtual();
  const supabase = createClient();

  const inicioHoje = `${diaBelem(new Date())}T00:00:00-03:00`;
  const inicioMes = primeiroDiaDoMes();
  const mesAtualData = inicioMes.toISOString().slice(0, 10);

  const [
    { data: estoque },
    { data: itens },
    { data: categorias },
    { data: itensAComprar },
    { count: movimentacoesHoje },
    { data: ultimas },
    { data: consumoVeiculo },
  ] = await Promise.all([
    supabase.from("v_estoque_geral").select("item_id, saldo, valor_estoque, status"),
    supabase.from("itens").select("id, categoria_id").eq("ativo", true),
    supabase.from("categorias").select("id, nome").order("nome"),
    supabase.from("v_itens_a_comprar").select("id"),
    supabase
      .from("movimentacoes")
      .select("id", { count: "exact", head: true })
      .gte("criado_em", inicioHoje),
    supabase
      .from("v_movimentacoes_detalhe")
      .select("id, criado_em, tipo, item, unidade, quantidade, placa, centro_custo, fornecedor, estorno_de")
      .order("criado_em", { ascending: false })
      .limit(5),
    supabase.from("v_consumo_por_veiculo").select("placa, custo_total, mes").order("custo_total", { ascending: false }),
  ]);

  const linhasEstoque = estoque ?? [];
  const itensComSaldo = linhasEstoque.filter((i) => i.saldo > 0).length;
  const valorTotal = linhasEstoque.reduce((s, i) => s + i.valor_estoque, 0);
  const abaixoDoMinimo = linhasEstoque.filter((i) => i.status === "Crítico" || i.status === "Sem estoque").length;
  const reposicao = (itensAComprar ?? []).length;

  // Saúde por categoria: fatia dos itens ativos da categoria acima do ponto de pedido.
  const statusPorItem = new Map(linhasEstoque.map((i) => [i.item_id, i.status]));
  const contagem = new Map<string, { total: number; bons: number }>();
  (itens ?? []).forEach((item) => {
    const chave = item.categoria_id ?? "";
    const atual = contagem.get(chave) ?? { total: 0, bons: 0 };
    atual.total += 1;
    if (statusPorItem.get(item.id) === "Estoque bom") atual.bons += 1;
    contagem.set(chave, atual);
  });
  const nomesCategoria = new Map((categorias ?? []).map((c) => [c.id, c.nome]));
  const saudeCategorias = Array.from(contagem.entries())
    .map(([id, { total, bons }]) => ({
      nome: nomesCategoria.get(id) ?? "Sem categoria",
      percentual: Math.round((bons / total) * 100),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, 8);

  const consumoVeiculoMesAtual = (consumoVeiculo ?? []).filter((c) => c.mes === mesAtualData).slice(0, 5);
  const maiorCustoVeiculo = consumoVeiculoMesAtual[0]?.custo_total ?? 1;

  const primeiroNome = usuario?.nome.split(" ")[0] ?? "";

  return (
    <main className="p-6 sm:p-8">
      <h1 className="titulo-tela">
        {saudacao()}
        {primeiroNome && `, ${primeiroNome}`}
      </h1>
      <p className="mt-1 font-corpo text-sm text-bruma-texto">
        {abaixoDoMinimo === 0
          ? "Nenhum produto abaixo do estoque mínimo."
          : `Você tem ${abaixoDoMinimo} ${abaixoDoMinimo === 1 ? "produto" : "produtos"} abaixo do estoque mínimo.`}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form action="/gestao/itens" className="relative flex-1 sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bruma" />
          <input
            type="search"
            name="q"
            aria-label="Buscar produto ou código"
            placeholder="Buscar produto ou código"
            className="h-10 w-full rounded border border-giz bg-white pl-9 pr-3 font-corpo text-sm text-tinta placeholder:text-bruma focus:border-cobalto-claro focus:outline-none"
          />
        </form>
        <div className="flex gap-3">
          <Botao href="/operacao/saida" variante="secundario" className="sm:w-auto" icone={<ArrowUpFromLine size={16} />}>
            Registrar saída
          </Botao>
          <Botao href="/operacao/entrada" className="sm:w-auto" icone={<ArrowDownToLine size={16} />}>
            Registrar entrada
          </Botao>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 divide-giz rounded border border-giz bg-white sm:grid-cols-4 sm:divide-x">
        <Numero valor={quantidade(itensComSaldo)} rotulo="itens em estoque" />
        <Numero valor={brl(valorTotal)} rotulo="valor total armazenado" />
        <Numero valor={quantidade(movimentacoesHoje ?? 0)} rotulo="movimentações hoje" />
        <Link href="/gestao/compras" className="transition-colors hover:bg-nevoa/60">
          <Numero
            valor={reposicao}
            rotulo={reposicao === 1 ? "precisa de reposição" : "precisam de reposição"}
            destaque={reposicao > 0}
          />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded border border-giz bg-white p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-tinta">Saúde por categoria</h2>
              <p className="mt-0.5 font-corpo text-xs text-bruma-texto">
                Quanto de cada categoria está acima do ponto de pedido.
              </p>
            </div>
            <Link
              href="/gestao/relatorios/geral"
              className="whitespace-nowrap font-corpo text-xs font-medium text-cobalto hover:underline"
            >
              Ver relatório
            </Link>
          </div>
          <GraficoCategorias categorias={saudeCategorias} />
        </section>

        <section className="rounded border border-giz bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-base font-semibold text-tinta">Últimas movimentações</h2>
            <Link
              href="/gestao/relatorios/saidas"
              className="whitespace-nowrap font-corpo text-xs font-medium text-cobalto hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="mt-2">
            {(ultimas ?? []).length === 0 && (
              <p className="py-3 font-corpo text-sm text-bruma-texto">Nenhuma movimentação registrada.</p>
            )}
            {(ultimas ?? []).map((m) => {
              const estorno = m.estorno_de !== null;
              const entrada = m.tipo === "entrada";
              const sinal = entrada ? "+" : "−";
              const destino = entrada ? m.fornecedor && `Fornecedor ${m.fornecedor}` : m.placa ?? m.centro_custo;
              return (
                <div key={m.id} className="flex items-center gap-3 border-b border-giz py-3 last:border-b-0">
                  <span
                    className={cn(
                      "w-[60px] flex-shrink-0 rounded-sm py-1 text-center font-corpo text-[11px] font-medium",
                      estorno
                        ? "bg-ambar-fundo text-ambar-texto"
                        : entrada
                          ? "bg-musgo-fundo text-musgo-texto"
                          : "bg-nevoa text-bruma-texto"
                    )}
                  >
                    {estorno ? "Estorno" : entrada ? "Entrada" : "Saída"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-corpo text-sm font-medium text-tinta">{m.item}</div>
                    <div className="truncate font-dado text-xs text-bruma-texto">
                      {sinal}
                      {quantidade(Math.abs(m.quantidade))} {m.unidade}
                      {destino && ` · ${destino}`}
                    </div>
                  </div>
                  <span className="flex-shrink-0 font-dado text-xs text-bruma-texto">{quando(m.criado_em)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded border border-giz bg-white p-5">
        <h2 className="font-display text-base font-semibold text-tinta">Custo por veículo no mês</h2>
        <div className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {consumoVeiculoMesAtual.length === 0 && (
            <p className="py-2 font-corpo text-sm text-bruma-texto">Nenhuma saída vinculada a veículo este mês.</p>
          )}
          {consumoVeiculoMesAtual.map((c) => (
            <div key={c.placa} className="py-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-dado text-sm text-tinta">{c.placa}</span>
                <span className="font-dado text-sm text-tinta">{brl(c.custo_total)}</span>
              </div>
              <div className="h-1.5 rounded bg-nevoa">
                <div
                  className="h-1.5 rounded bg-cobalto"
                  style={{ width: `${(c.custo_total / maiorCustoVeiculo) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Numero({ valor, rotulo, destaque = false }: { valor: ReactNode; rotulo: string; destaque?: boolean }) {
  return (
    <div className="px-5 py-4">
      <div
        className={cn(
          "font-display text-[26px] font-bold leading-none",
          destaque ? "text-carmim-texto" : "text-tinta"
        )}
      >
        {valor}
      </div>
      <div className="mt-1.5 font-corpo text-xs text-bruma-texto">{rotulo}</div>
    </div>
  );
}

/** Barras de blocos empilhados: cada bloco vale 10%. Cor segue o estado do estoque. */
function GraficoCategorias({ categorias }: { categorias: { nome: string; percentual: number }[] }) {
  if (categorias.length === 0) {
    return <p className="mt-6 font-corpo text-sm text-bruma-texto">Nenhum item ativo cadastrado.</p>;
  }

  return (
    <div className="mt-5">
      <div className="flex h-48 items-end gap-3 border-b-2 border-l-2 border-r-2 border-tinta px-3 sm:gap-5">
        {categorias.map(({ nome, percentual }) => {
          const blocos = Math.max(percentual > 0 ? 1 : 0, Math.round(percentual / BLOCOS_POR_BARRA));
          const cor = percentual < 25 ? "bg-carmim" : percentual < 50 ? "bg-ambar" : "bg-cobalto";
          return (
            <div
              key={nome}
              className="flex h-full flex-1 flex-col-reverse gap-[2px] pb-[2px]"
              title={`${nome}: ${percentual}%`}
            >
              {Array.from({ length: blocos }, (_, i) => (
                <div key={i} className={cn("h-[calc(10%-2px)] rounded-[1px]", cor)} />
              ))}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 px-3 pt-2 sm:gap-5">
        {categorias.map(({ nome, percentual }) => (
          <div key={nome} className="min-w-0 flex-1 text-center">
            <div className="truncate font-corpo text-xs text-bruma-texto" title={nome}>
              {nome}
            </div>
            <div
              className={cn(
                "font-dado text-xs",
                percentual < 25 ? "text-carmim-texto" : percentual < 50 ? "text-ambar-texto" : "text-bruma-texto"
              )}
            >
              {percentual}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

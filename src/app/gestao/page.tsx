import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { Indicador, PontoEstado } from "@/components/ui";
import { brl, quantidade } from "@/lib/formato";
import { cores } from "@/lib/tokens";

function primeiroDiaDoMes(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function PaginaGestao() {
  const usuario = await obterUsuarioAtual();
  const supabase = createClient();

  const inicioMes = primeiroDiaDoMes();
  const inicioMesIso = inicioMes.toISOString();
  const mesAtualData = inicioMes.toISOString().slice(0, 10);

  const [{ data: valorEstoque }, { data: itensAComprar }, { data: movimentacoesMes }, { data: consumoVeiculo }] =
    await Promise.all([
      supabase.from("v_valor_estoque").select("categoria, itens, unidades, valor"),
      supabase
        .from("v_itens_a_comprar")
        .select("id, sku, nome, unidade, saldo, ponto_pedido, situacao")
        .order("situacao"),
      supabase.from("movimentacoes").select("tipo, quantidade, custo_unitario, item_id").gte("criado_em", inicioMesIso),
      supabase.from("v_consumo_por_veiculo").select("placa, custo_total, mes").order("custo_total", { ascending: false }),
    ]);

  const linhasValor = valorEstoque ?? [];
  const valorTotalEstoque = linhasValor.reduce((s, c) => s + c.valor, 0);
  const totalItensAtivos = linhasValor.reduce((s, c) => s + c.itens, 0);

  const alertas = itensAComprar ?? [];
  const esgotados = alertas.filter((i) => i.situacao === "ESGOTADO").length;

  const movsMes = movimentacoesMes ?? [];
  const entradasMes = movsMes.filter((m) => m.tipo === "entrada").length;
  const saidasMes = movsMes.filter((m) => m.tipo === "saida").length;

  const consumoVeiculoMesAtual = (consumoVeiculo ?? []).filter((c) => c.mes === mesAtualData).slice(0, 5);
  const maiorCustoVeiculo = consumoVeiculoMesAtual[0]?.custo_total ?? 1;

  const consumoPorItem = new Map<string, number>();
  movsMes
    .filter((m) => m.tipo === "saida")
    .forEach((m) => {
      consumoPorItem.set(m.item_id, (consumoPorItem.get(m.item_id) ?? 0) + m.quantidade * m.custo_unitario);
    });
  const topItensIds = Array.from(consumoPorItem.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const { data: itensNomes } =
    topItensIds.length > 0
      ? await supabase
          .from("itens")
          .select("id, nome, sku")
          .in(
            "id",
            topItensIds.map(([id]) => id)
          )
      : { data: [] as { id: string; nome: string; sku: string }[] };
  const mapaItensNomes = new Map((itensNomes ?? []).map((i) => [i.id, i]));

  return (
    <main className="p-6 sm:p-8">
      <h1 className="font-display text-tela text-tinta">Painel</h1>
      <p className="mt-1 font-corpo text-sm text-bruma">
        {usuario ? `Bom dia, ${usuario.nome.split(" ")[0]}.` : ""} Situação do estoque agora.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador rotulo="Valor em estoque" valor={brl(valorTotalEstoque)} sub={`${totalItensAtivos} itens ativos`} />
        <Indicador
          rotulo="Itens críticos"
          valor={alertas.length}
          sub="No mínimo ou abaixo"
          tom={alertas.length ? "alerta" : "normal"}
        />
        <Indicador rotulo="Esgotados" valor={esgotados} sub="Saldo zero" tom={esgotados ? "erro" : "normal"} />
        <Indicador
          rotulo="Movimentações no mês"
          valor={entradasMes + saidasMes}
          sub={`${entradasMes} entradas · ${saidasMes} saídas`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded border border-giz bg-white p-[18px] lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-display text-rotulo uppercase text-bruma">Precisa de reposição</span>
            <Link href="/gestao/compras" className="font-corpo text-xs text-petroleo hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-3">
            {alertas.length === 0 && (
              <p className="py-2 font-corpo text-sm text-bruma">Nenhum item no ponto de reposição.</p>
            )}
            {alertas.slice(0, 6).map((item) => {
              const cor =
                item.situacao === "ESGOTADO" ? cores.carmim : item.situacao === "CRITICO" ? cores.carmim : cores.ambar;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-giz py-2.5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PontoEstado cor={cor} />
                    <div className="min-w-0">
                      <div className="truncate font-corpo text-sm text-tinta">{item.nome}</div>
                      <div className="font-dado text-xs text-bruma">{item.sku}</div>
                    </div>
                  </div>
                  <div className="whitespace-nowrap font-dado text-sm text-tinta">
                    {quantidade(item.saldo)} / {quantidade(item.ponto_pedido)} {item.unidade}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded border border-giz bg-white p-[18px]">
          <span className="font-display text-rotulo uppercase text-bruma">Custo por veículo (mês)</span>
          <div className="mt-3">
            {consumoVeiculoMesAtual.length === 0 && (
              <p className="py-2 font-corpo text-sm text-bruma">Nenhuma saída vinculada a veículo este mês.</p>
            )}
            {consumoVeiculoMesAtual.map((c) => (
              <div key={c.placa} className="py-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-dado text-sm text-tinta">{c.placa}</span>
                  <span className="font-dado text-sm text-tinta">{brl(c.custo_total)}</span>
                </div>
                <div className="h-1.5 rounded bg-nevoa">
                  <div
                    className="h-1.5 rounded bg-petroleo"
                    style={{ width: `${(c.custo_total / maiorCustoVeiculo) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded border border-giz bg-white p-[18px]">
        <span className="font-display text-rotulo uppercase text-bruma">Produtos mais movimentados (mês)</span>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {topItensIds.length === 0 && (
            <p className="py-2 font-corpo text-sm text-bruma">Nenhuma saída registrada este mês.</p>
          )}
          {topItensIds.map(([id, valor]) => {
            const item = mapaItensNomes.get(id);
            return (
              <div key={id} className="rounded border border-giz p-3">
                <div className="truncate font-corpo text-sm text-tinta">{item?.nome ?? "Item"}</div>
                <div className="font-dado text-xs text-bruma">{item?.sku}</div>
                <div className="mt-1.5 font-dado text-sm text-petroleo">{brl(valor)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioVeiculo } from "../FormularioVeiculo";
import { Indicador } from "@/components/ui";
import { brl, quantidade, dataHora } from "@/lib/formato";

export default async function PaginaEditarVeiculo({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: veiculo }, { data: consumo }, { data: movimentacoesRecentes }] = await Promise.all([
    supabase.from("veiculos").select("id, placa, modelo, ano, km_atual").eq("id", params.id).single(),
    supabase.from("v_consumo_por_veiculo").select("custo_total, movimentos").eq("veiculo_id", params.id),
    supabase
      .from("movimentacoes")
      .select("id, item_id, quantidade, custo_unitario, criado_em")
      .eq("veiculo_id", params.id)
      .eq("tipo", "saida")
      .order("criado_em", { ascending: false })
      .limit(10),
  ]);

  if (!veiculo) notFound();

  const custoTotalHistorico = (consumo ?? []).reduce((s, c) => s + c.custo_total, 0);
  const totalMovimentos = (consumo ?? []).reduce((s, c) => s + c.movimentos, 0);

  const recentes = movimentacoesRecentes ?? [];
  const idsItens = Array.from(new Set(recentes.map((m) => m.item_id)));
  const { data: itensNomes } =
    idsItens.length > 0
      ? await supabase.from("itens").select("id, nome, unidade").in("id", idsItens)
      : { data: [] as { id: string; nome: string; unidade: string }[] };
  const mapaItens = new Map((itensNomes ?? []).map((i) => [i.id, i]));

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-tela text-tinta">
          Veículo <span className="font-dado">{veiculo.placa}</span>
        </h1>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Indicador rotulo="Km atual" valor={quantidade(veiculo.km_atual)} />
          <Indicador rotulo="Custo de materiais" valor={brl(custoTotalHistorico)} sub="Histórico total" />
          <Indicador rotulo="Movimentações" valor={totalMovimentos} sub="Saídas registradas" />
        </div>

        <div className="mt-6">
          <span className="font-display text-rotulo uppercase text-bruma">Últimas movimentações</span>
          <div className="mt-2 flex flex-col gap-2">
            {recentes.length === 0 && (
              <p className="rounded border border-giz bg-white p-4 font-corpo text-sm text-bruma">
                Nenhuma saída registrada para este veículo ainda.
              </p>
            )}
            {recentes.map((m) => {
              const item = mapaItens.get(m.item_id);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded border border-giz bg-white px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-corpo text-sm text-tinta">{item?.nome ?? "Item"}</div>
                    <div className="font-dado text-xs text-bruma">
                      {quantidade(m.quantidade)} {item?.unidade} · {dataHora(m.criado_em)}
                    </div>
                  </div>
                  <div className="whitespace-nowrap font-dado text-sm text-tinta">
                    {brl(m.quantidade * m.custo_unitario)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <h2 className="mt-8 font-display text-lg font-semibold text-tinta">Editar cadastro</h2>
        <div className="mt-4 max-w-lg">
          <FormularioVeiculo veiculo={veiculo} />
        </div>
      </div>
    </main>
  );
}

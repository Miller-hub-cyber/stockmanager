import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioItem } from "../FormularioItem";
import { Indicador, PontoEstado } from "@/components/ui";
import { estadoItem } from "@/lib/tokens";
import { brl, quantidade, dataHora } from "@/lib/formato";

export default async function PaginaEditarItem({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: item }, { data: categorias }, { data: fornecedores }, { data: saldos }, { data: kardex }] =
    await Promise.all([
      supabase
        .from("itens")
        .select(
          "id, sku, nome, descricao, unidade, tipo, estoque_minimo, ponto_pedido, custo_medio, categoria_id, fornecedor_id, codigo_barras"
        )
        .eq("id", params.id)
        .single(),
      supabase.from("categorias").select("id, nome").order("nome"),
      supabase.from("fornecedores").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("saldos").select("quantidade").eq("item_id", params.id),
      supabase
        .from("v_kardex")
        .select("id, criado_em, tipo, quantidade, valor, destino, usuario")
        .eq("item_id", params.id)
        .order("criado_em", { ascending: false })
        .limit(15),
    ]);

  if (!item) notFound();

  const saldoTotal = (saldos ?? []).reduce((s, l) => s + l.quantidade, 0);
  const estado = estadoItem(saldoTotal, item.estoque_minimo, item.ponto_pedido);
  const linhasKardex = kardex ?? [];

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-tela text-tinta">{item.nome}</h1>
          <PontoEstado cor={estado.cor} texto={estado.texto} />
        </div>
        <p className="mt-1 font-dado text-sm text-bruma">{item.sku}</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Indicador rotulo="Estoque atual" valor={`${quantidade(saldoTotal)} ${item.unidade}`} />
          <Indicador rotulo="Estoque mínimo" valor={`${quantidade(item.estoque_minimo)} ${item.unidade}`} />
          <Indicador rotulo="Custo médio" valor={brl(item.custo_medio)} />
        </div>

        <div className="mt-6">
          <span className="font-display text-rotulo uppercase text-bruma">Movimentações recentes</span>
          <div className="mt-2 flex flex-col gap-2">
            {linhasKardex.length === 0 && (
              <p className="rounded border border-giz bg-white p-4 font-corpo text-sm text-bruma">
                Nenhuma movimentação registrada para este item ainda.
              </p>
            )}
            {linhasKardex.map((l) => {
              const saida = l.tipo === "saida";
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded border border-giz bg-white px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="font-corpo text-sm capitalize text-tinta">{l.tipo}</div>
                    <div className="font-dado text-xs text-bruma">
                      {l.destino ? `${l.destino} · ` : ""}
                      {l.usuario ?? "—"} · {dataHora(l.criado_em)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-dado text-sm ${saida ? "text-carmim" : "text-musgo"}`}>
                      {saida ? "−" : "+"}
                      {quantidade(l.quantidade)} {item.unidade}
                    </div>
                    <div className="font-dado text-xs text-bruma">{brl(l.valor)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <h2 className="mt-8 font-display text-lg font-semibold text-tinta">Editar cadastro</h2>
        <div className="mt-4">
          <FormularioItem item={item} categorias={categorias ?? []} fornecedores={fornecedores ?? []} />
        </div>
      </div>
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Botao, PontoEstado } from "@/components/ui";
import { brl, quantidade } from "@/lib/formato";
import { cores } from "@/lib/tokens";

export default async function PaginaCompras() {
  const supabase = createClient();
  const { data: itens } = await supabase
    .from("v_itens_a_comprar")
    .select("id, sku, nome, unidade, saldo, ponto_pedido, custo_medio, fornecedor, sugestao_compra, situacao")
    .order("fornecedor", { ascending: true, nullsFirst: false });

  const lista = itens ?? [];
  const porFornecedor = new Map<string, typeof lista>();
  lista.forEach((item) => {
    const chave = item.fornecedor ?? "Sem fornecedor definido";
    porFornecedor.set(chave, [...(porFornecedor.get(chave) ?? []), item]);
  });

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Compras</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">
            Itens no ponto de reposição, agrupados por fornecedor.
          </p>
        </div>
        <div className="w-36">
          <Botao href="/gestao/compras/exportar" variante="secundario">
            Exportar CSV
          </Botao>
        </div>
      </div>

      <div className="mt-6">
        {lista.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
            Nenhum item no ponto de reposição no momento.
          </div>
        ) : (
          Array.from(porFornecedor.entries()).map(([fornecedor, itensFornecedor]) => {
            const totalFornecedor = itensFornecedor.reduce(
              (s, i) => s + i.sugestao_compra * i.custo_medio,
              0
            );
            return (
              <div key={fornecedor} className="mb-3 rounded border border-giz bg-white">
                <div className="flex items-center justify-between border-b border-giz px-[18px] py-3.5">
                  <span className="font-display text-sm font-semibold text-tinta">{fornecedor}</span>
                  <span className="font-dado text-sm text-tinta">{brl(totalFornecedor)}</span>
                </div>
                {itensFornecedor.map((item) => {
                  const repor = item.situacao === "REPOR";
                  const cor = repor ? cores.ambar : cores.carmim;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 border-b border-giz px-[18px] py-2.5 last:border-b-0"
                    >
                      <PontoEstado cor={cor} estado={repor ? "alerta" : "critico"} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-corpo text-sm text-tinta">{item.nome}</div>
                        <div className="font-dado text-xs text-bruma-texto">
                          {item.sku} · saldo {quantidade(item.saldo)} {item.unidade}
                        </div>
                      </div>
                      <div className="whitespace-nowrap font-dado text-sm text-tinta">
                        comprar {quantidade(item.sugestao_compra)} {item.unidade}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

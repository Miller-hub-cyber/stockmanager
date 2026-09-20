import { createClient } from "@/lib/supabase/server";
import { Botao, Seletor, Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { brl, quantidade, dataHora } from "@/lib/formato";

interface Props {
  searchParams: { itemId?: string };
}

export default async function PaginaKardex({ searchParams }: Props) {
  const supabase = createClient();
  const { data: itens } = await supabase.from("itens").select("id, sku, nome").order("nome");

  const itemId = searchParams.itemId;
  const { data: linhas } = itemId
    ? await supabase
        .from("v_kardex")
        .select("id, criado_em, tipo, quantidade, custo_unitario, valor, motivo, usuario, destino, estorno_de")
        .eq("item_id", itemId)
        .order("criado_em", { ascending: false })
    : { data: [] };

  const lista = linhas ?? [];

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Kardex por item</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Histórico completo de entradas e saídas.</p>
        </div>
        {itemId && (
          <div className="w-36">
            <Botao href={`/gestao/relatorios/kardex/exportar?itemId=${itemId}`} variante="secundario">
              Exportar CSV
            </Botao>
          </div>
        )}
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Seletor id="itemId" name="itemId" rotulo="Item" defaultValue={itemId ?? ""}>
            <option value="" disabled>
              Selecionar item
            </option>
            {(itens ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.sku} · {i.nome}
              </option>
            ))}
          </Seletor>
        </div>
        <div className="w-28">
          <Botao type="submit" variante="secundario">
            Ver
          </Botao>
        </div>
      </form>

      {itemId && (
        <div className="mt-6">
          {lista.length === 0 ? (
            <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
              Nenhuma movimentação registrada para este item.
            </div>
          ) : (
            <Tabela>
              <TabelaCabecalho>
                <TabelaCelula cabecalho className="max-w-[140px] flex-none">
                  Data
                </TabelaCelula>
                <TabelaCelula cabecalho className="max-w-[90px] flex-none">
                  Tipo
                </TabelaCelula>
                <TabelaCelula cabecalho>Destino</TabelaCelula>
                <TabelaCelula cabecalho align="direita" className="max-w-[100px] flex-none">
                  Quantidade
                </TabelaCelula>
                <TabelaCelula cabecalho align="direita" className="max-w-[110px] flex-none">
                  Valor
                </TabelaCelula>
                <TabelaCelula cabecalho className="max-w-[120px] flex-none">
                  Usuário
                </TabelaCelula>
              </TabelaCabecalho>
              {lista.map((l) => (
                <TabelaLinha key={l.id}>
                  <TabelaCelula mono className="max-w-[140px] flex-none text-bruma-texto">
                    {dataHora(l.criado_em)}
                  </TabelaCelula>
                  <TabelaCelula className="max-w-[90px] flex-none capitalize">{l.tipo}</TabelaCelula>
                  <TabelaCelula className="text-bruma-texto">{l.destino ?? "—"}</TabelaCelula>
                  <TabelaCelula align="direita" mono className="max-w-[100px] flex-none">
                    {quantidade(l.quantidade)}
                  </TabelaCelula>
                  <TabelaCelula align="direita" mono className="max-w-[110px] flex-none">
                    {brl(l.valor)}
                  </TabelaCelula>
                  <TabelaCelula className="max-w-[120px] flex-none text-bruma-texto">{l.usuario ?? "—"}</TabelaCelula>
                </TabelaLinha>
              ))}
            </Tabela>
          )}
        </div>
      )}
    </main>
  );
}

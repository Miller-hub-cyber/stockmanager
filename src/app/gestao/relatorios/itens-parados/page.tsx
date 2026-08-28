import { createClient } from "@/lib/supabase/server";
import { Botao, Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { brl, quantidade, data as formatarData } from "@/lib/formato";

export default async function PaginaItensParados() {
  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_itens_parados")
    .select("id, sku, nome, saldo, valor_parado, ultima_saida, dias_sem_saida")
    .order("valor_parado", { ascending: false });

  const lista = linhas ?? [];

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Itens parados</h1>
          <p className="mt-1 font-corpo text-sm text-bruma">Estoque com saldo, sem saída há mais de 90 dias.</p>
        </div>
        <div className="w-36">
          <Botao href="/gestao/relatorios/itens-parados/exportar" variante="secundario">
            Exportar CSV
          </Botao>
        </div>
      </div>

      <div className="mt-6">
        {lista.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma">
            Nenhum item parado. Todo o estoque teve saída nos últimos 90 dias.
          </div>
        ) : (
          <Tabela>
            <TabelaCabecalho>
              <TabelaCelula cabecalho mono className="max-w-[100px] flex-none">
                SKU
              </TabelaCelula>
              <TabelaCelula cabecalho>Item</TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[100px] flex-none">
                Saldo
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[130px] flex-none">
                Valor parado
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[120px] flex-none">
                Última saída
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[100px] flex-none">
                Dias parado
              </TabelaCelula>
            </TabelaCabecalho>
            {lista.map((item) => (
              <TabelaLinha key={item.id}>
                <TabelaCelula mono className="max-w-[100px] flex-none text-bruma">
                  {item.sku}
                </TabelaCelula>
                <TabelaCelula>{item.nome}</TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[100px] flex-none">
                  {quantidade(item.saldo)}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[130px] flex-none">
                  {brl(item.valor_parado)}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[120px] flex-none">
                  {item.ultima_saida ? formatarData(item.ultima_saida) : "Nunca"}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[100px] flex-none">
                  {item.dias_sem_saida ?? "—"}
                </TabelaCelula>
              </TabelaLinha>
            ))}
          </Tabela>
        )}
      </div>
    </main>
  );
}

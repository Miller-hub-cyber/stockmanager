import { createClient } from "@/lib/supabase/server";
import { Botao, Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { brl, mesAno } from "@/lib/formato";

export default async function PaginaConsumoCentro() {
  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_consumo_por_centro")
    .select("centro_custo, mes, custo_total")
    .order("mes", { ascending: false })
    .order("custo_total", { ascending: false });

  const lista = linhas ?? [];

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Consumo por centro de custo</h1>
          <p className="mt-1 font-corpo text-sm text-bruma">Distribuição do gasto entre setores, por mês.</p>
        </div>
        <div className="w-36">
          <Botao href="/gestao/relatorios/consumo-centro/exportar" variante="secundario">
            Exportar CSV
          </Botao>
        </div>
      </div>

      <div className="mt-6">
        {lista.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma">
            Nenhuma saída vinculada a centro de custo ainda.
          </div>
        ) : (
          <Tabela>
            <TabelaCabecalho>
              <TabelaCelula cabecalho>Centro de custo</TabelaCelula>
              <TabelaCelula cabecalho className="max-w-[100px] flex-none">
                Mês
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[140px] flex-none">
                Custo total
              </TabelaCelula>
            </TabelaCabecalho>
            {lista.map((linha, i) => (
              <TabelaLinha key={`${linha.centro_custo}-${linha.mes}-${i}`}>
                <TabelaCelula>{linha.centro_custo}</TabelaCelula>
                <TabelaCelula mono className="max-w-[100px] flex-none">
                  {mesAno(linha.mes)}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[140px] flex-none">
                  {brl(linha.custo_total)}
                </TabelaCelula>
              </TabelaLinha>
            ))}
          </Tabela>
        )}
      </div>
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Botao, Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { brl, mesAno } from "@/lib/formato";

export default async function PaginaConsumoVeiculo() {
  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_consumo_por_veiculo")
    .select("veiculo_id, placa, modelo, mes, custo_total, movimentos")
    .order("mes", { ascending: false })
    .order("custo_total", { ascending: false });

  const lista = linhas ?? [];

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Consumo por veículo</h1>
          <p className="mt-1 font-corpo text-sm text-bruma">Custo de material por placa e por mês.</p>
        </div>
        <div className="w-36">
          <Botao href="/gestao/relatorios/consumo-veiculo/exportar" variante="secundario">
            Exportar CSV
          </Botao>
        </div>
      </div>

      <div className="mt-6">
        {lista.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma">
            Nenhuma saída vinculada a veículo ainda.
          </div>
        ) : (
          <Tabela>
            <TabelaCabecalho>
              <TabelaCelula cabecalho mono className="max-w-[110px] flex-none">
                Placa
              </TabelaCelula>
              <TabelaCelula cabecalho>Modelo</TabelaCelula>
              <TabelaCelula cabecalho className="max-w-[100px] flex-none">
                Mês
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[90px] flex-none">
                Saídas
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[130px] flex-none">
                Custo total
              </TabelaCelula>
            </TabelaCabecalho>
            {lista.map((linha) => (
              <TabelaLinha key={`${linha.veiculo_id}-${linha.mes}`}>
                <TabelaCelula mono className="max-w-[110px] flex-none">
                  {linha.placa}
                </TabelaCelula>
                <TabelaCelula className="text-bruma">{linha.modelo ?? "—"}</TabelaCelula>
                <TabelaCelula mono className="max-w-[100px] flex-none">
                  {mesAno(linha.mes)}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[90px] flex-none">
                  {linha.movimentos}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[130px] flex-none">
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Botao, Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { brl, mesAno } from "@/lib/formato";
import { descreverMeses, inicioDoMes } from "@/lib/periodo";
import { lerFiltros } from "@/lib/relatorio-movimentacoes";
import { rotaExportacao, rotaRelatorio } from "@/lib/relatorios";

interface Props {
  searchParams: { [chave: string]: string | string[] | undefined };
}

export default async function PaginaConsumoVeiculo({ searchParams }: Props) {
  // O relatório é mensal: o período entra como os meses que ele toca.
  const { de, ate } = lerFiltros(searchParams);
  const filtrado = Boolean(de || ate);

  const supabase = createClient();
  let consulta = supabase.from("v_consumo_por_veiculo").select("veiculo_id, placa, modelo, mes, custo_total, movimentos");
  if (de) consulta = consulta.gte("mes", inicioDoMes(de));
  if (ate) consulta = consulta.lte("mes", ate);
  const { data: linhas } = await consulta.order("mes", { ascending: false }).order("custo_total", { ascending: false });

  const lista = linhas ?? [];

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="titulo-tela">Consumo por veículo</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">
            Custo de material por placa e por mês{filtrado ? `, ${descreverMeses(de, ate)}` : ""}.
            {filtrado && (
              <Link href={rotaRelatorio("consumo-veiculo")} className="ml-2 text-cobalto hover:underline">
                Ver todos os meses
              </Link>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Botao href={rotaExportacao("consumo-veiculo", { de, ate, formato: "xlsx" })} variante="secundario">
              Exportar Excel
            </Botao>
          </div>
          <div className="w-36">
            <Botao href={rotaExportacao("consumo-veiculo", { de, ate })} variante="secundario">
              Exportar CSV
            </Botao>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {lista.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
            {filtrado ? "Nenhuma saída vinculada a veículo neste período." : "Nenhuma saída vinculada a veículo ainda."}
          </div>
        ) : (
          <Tabela>
            <TabelaCabecalho>
              <TabelaCelula cabecalho mono className="w-[110px] flex-none">
                Placa
              </TabelaCelula>
              <TabelaCelula cabecalho>Modelo</TabelaCelula>
              <TabelaCelula cabecalho className="w-[100px] flex-none">
                Mês
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="w-[90px] flex-none">
                Saídas
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="w-[130px] flex-none">
                Custo total
              </TabelaCelula>
            </TabelaCabecalho>
            {lista.map((linha) => (
              <TabelaLinha key={`${linha.veiculo_id}-${linha.mes}`}>
                <TabelaCelula mono className="w-[110px] flex-none">
                  {linha.placa}
                </TabelaCelula>
                <TabelaCelula className="text-bruma-texto">{linha.modelo ?? "—"}</TabelaCelula>
                <TabelaCelula mono className="w-[100px] flex-none">
                  {mesAno(linha.mes)}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="w-[90px] flex-none">
                  {linha.movimentos}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="w-[130px] flex-none">
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

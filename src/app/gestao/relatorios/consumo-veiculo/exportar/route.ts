import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv } from "@/lib/csv";
import { mesAno } from "@/lib/formato";
import { inicioDoMes } from "@/lib/periodo";
import { lerFiltros } from "@/lib/relatorio-movimentacoes";
import { abaConsumoVeiculo } from "@/lib/relatorio-xlsx";
import { responderExportacao } from "../../_componentes/exportar";

export async function GET(request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  // O relatório é mensal: o período entra como os meses que ele toca.
  const { de, ate } = lerFiltros(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createClient();
  let consulta = supabase.from("v_consumo_por_veiculo").select("placa, modelo, mes, custo_total, movimentos");
  if (de) consulta = consulta.gte("mes", inicioDoMes(de));
  if (ate) consulta = consulta.lte("mes", ate);
  const { data } = await consulta.order("mes", { ascending: false }).order("custo_total", { ascending: false });
  const linhas = data ?? [];

  return responderExportacao(request, usuario, "consumo-veiculo", {
    arquivo: "consumo-por-veiculo",
    csv: () =>
      paraCsv(
        linhas.map((l) => ({
          placa: l.placa,
          modelo: l.modelo ?? "",
          mes: mesAno(l.mes),
          movimentos: l.movimentos,
          custo_total: l.custo_total.toFixed(2).replace(".", ","),
        })),
        [
          { chave: "placa", rotulo: "Placa" },
          { chave: "modelo", rotulo: "Modelo" },
          { chave: "mes", rotulo: "Mês" },
          { chave: "movimentos", rotulo: "Saídas" },
          { chave: "custo_total", rotulo: "Custo total" },
        ]
      ),
    xlsx: () => [abaConsumoVeiculo(linhas)],
    filtros: { de, ate },
  });
}

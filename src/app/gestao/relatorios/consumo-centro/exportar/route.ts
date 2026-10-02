import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv } from "@/lib/csv";
import { mesAno } from "@/lib/formato";
import { inicioDoMes } from "@/lib/periodo";
import { lerFiltros } from "@/lib/relatorio-movimentacoes";
import { abaConsumoCentro } from "@/lib/relatorio-xlsx";
import { responderExportacao } from "../../_componentes/exportar";

export async function GET(request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  // O relatório é mensal: o período entra como os meses que ele toca.
  const { de, ate } = lerFiltros(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createClient();
  let consulta = supabase.from("v_consumo_por_centro").select("centro_custo, mes, custo_total");
  if (de) consulta = consulta.gte("mes", inicioDoMes(de));
  if (ate) consulta = consulta.lte("mes", ate);
  const { data } = await consulta.order("mes", { ascending: false }).order("custo_total", { ascending: false });
  const linhas = data ?? [];

  return responderExportacao(request, usuario, "consumo-centro", {
    arquivo: "consumo-por-centro-de-custo",
    csv: () =>
      paraCsv(
        linhas.map((l) => ({
          centro_custo: l.centro_custo,
          mes: mesAno(l.mes),
          custo_total: l.custo_total.toFixed(2).replace(".", ","),
        })),
        [
          { chave: "centro_custo", rotulo: "Centro de custo" },
          { chave: "mes", rotulo: "Mês" },
          { chave: "custo_total", rotulo: "Custo total" },
        ]
      ),
    xlsx: () => [abaConsumoCentro(linhas)],
    filtros: { de, ate },
  });
}

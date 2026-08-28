import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";
import { mesAno } from "@/lib/formato";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_consumo_por_centro")
    .select("centro_custo, mes, custo_total")
    .order("mes", { ascending: false })
    .order("custo_total", { ascending: false });

  const csv = paraCsv(
    (linhas ?? []).map((l) => ({
      centro_custo: l.centro_custo,
      mes: mesAno(l.mes),
      custo_total: l.custo_total.toFixed(2).replace(".", ","),
    })),
    [
      { chave: "centro_custo", rotulo: "Centro de custo" },
      { chave: "mes", rotulo: "Mês" },
      { chave: "custo_total", rotulo: "Custo total" },
    ]
  );

  return respostaCsv(csv, "consumo-por-centro-de-custo.csv");
}

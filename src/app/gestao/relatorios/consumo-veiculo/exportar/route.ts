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
    .from("v_consumo_por_veiculo")
    .select("placa, modelo, mes, custo_total, movimentos")
    .order("mes", { ascending: false })
    .order("custo_total", { ascending: false });

  const csv = paraCsv(
    (linhas ?? []).map((l) => ({
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
  );

  return respostaCsv(csv, "consumo-por-veiculo.csv");
}

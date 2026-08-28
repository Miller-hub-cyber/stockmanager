import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";
import { dataHora } from "@/lib/formato";

export async function GET(request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const itemId = request.nextUrl.searchParams.get("itemId");
  if (!itemId) {
    return new Response("Informe o item (itemId) para exportar.", { status: 400 });
  }

  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_kardex")
    .select("criado_em, tipo, quantidade, custo_unitario, valor, motivo, usuario, destino")
    .eq("item_id", itemId)
    .order("criado_em", { ascending: false });

  const csv = paraCsv(
    (linhas ?? []).map((l) => ({
      data: dataHora(l.criado_em),
      tipo: l.tipo,
      destino: l.destino ?? "",
      quantidade: l.quantidade,
      custo_unitario: l.custo_unitario.toFixed(4).replace(".", ","),
      valor: l.valor.toFixed(2).replace(".", ","),
      usuario: l.usuario ?? "",
      motivo: l.motivo ?? "",
    })),
    [
      { chave: "data", rotulo: "Data" },
      { chave: "tipo", rotulo: "Tipo" },
      { chave: "destino", rotulo: "Destino" },
      { chave: "quantidade", rotulo: "Quantidade" },
      { chave: "custo_unitario", rotulo: "Custo unitário" },
      { chave: "valor", rotulo: "Valor" },
      { chave: "usuario", rotulo: "Usuário" },
      { chave: "motivo", rotulo: "Motivo" },
    ]
  );

  return respostaCsv(csv, "kardex.csv");
}

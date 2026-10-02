import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv } from "@/lib/csv";
import { dataHora } from "@/lib/formato";
import { abaKardex } from "@/lib/relatorio-xlsx";
import { responderExportacao } from "../../_componentes/exportar";

const uuid = z.string().uuid();

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
  const { data } = await supabase
    .from("v_kardex")
    .select("sku, item, criado_em, tipo, quantidade, custo_unitario, valor, motivo, usuario, destino")
    .eq("item_id", itemId)
    .order("criado_em", { ascending: false });
  const linhas = data ?? [];

  return responderExportacao(request, usuario, "kardex", {
    arquivo: "kardex",
    csv: () =>
      paraCsv(
        linhas.map((l) => ({
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
      ),
    xlsx: () => [abaKardex(linhas, linhas[0] && { sku: linhas[0].sku, nome: linhas[0].item })],
    filtros: { itemId: uuid.safeParse(itemId).data },
  });
}

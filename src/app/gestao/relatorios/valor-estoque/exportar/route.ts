import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv } from "@/lib/csv";
import { abaValorEstoque } from "@/lib/relatorio-xlsx";
import { responderExportacao } from "../../_componentes/exportar";

export async function GET(request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("v_valor_estoque")
    .select("categoria, itens, unidades, valor")
    .order("valor", { ascending: false });
  const linhas = data ?? [];

  return responderExportacao(request, usuario, "valor-estoque", {
    arquivo: "valor-imobilizado",
    csv: () =>
      paraCsv(
        linhas.map((l) => ({
          categoria: l.categoria,
          itens: l.itens,
          unidades: l.unidades,
          valor: l.valor.toFixed(2).replace(".", ","),
        })),
        [
          { chave: "categoria", rotulo: "Categoria" },
          { chave: "itens", rotulo: "Itens" },
          { chave: "unidades", rotulo: "Unidades" },
          { chave: "valor", rotulo: "Valor" },
        ]
      ),
    xlsx: () => [abaValorEstoque(linhas)],
  });
}

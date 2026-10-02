import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv } from "@/lib/csv";
import { data as formatarData } from "@/lib/formato";
import { abaItensParados } from "@/lib/relatorio-xlsx";
import { responderExportacao } from "../../_componentes/exportar";

export async function GET(request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("v_itens_parados")
    .select("sku, nome, saldo, valor_parado, ultima_saida, dias_sem_saida")
    .order("valor_parado", { ascending: false });
  const linhas = data ?? [];

  return responderExportacao(request, usuario, "itens-parados", {
    arquivo: "itens-parados",
    csv: () =>
      paraCsv(
        linhas.map((l) => ({
          sku: l.sku,
          nome: l.nome,
          saldo: l.saldo,
          valor_parado: l.valor_parado.toFixed(2).replace(".", ","),
          ultima_saida: l.ultima_saida ? formatarData(l.ultima_saida) : "Nunca",
          dias_sem_saida: l.dias_sem_saida ?? "",
        })),
        [
          { chave: "sku", rotulo: "SKU" },
          { chave: "nome", rotulo: "Item" },
          { chave: "saldo", rotulo: "Saldo" },
          { chave: "valor_parado", rotulo: "Valor parado" },
          { chave: "ultima_saida", rotulo: "Última saída" },
          { chave: "dias_sem_saida", rotulo: "Dias parado" },
        ]
      ),
    xlsx: () => [abaItensParados(linhas)],
  });
}

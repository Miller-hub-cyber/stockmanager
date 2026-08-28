import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";
import { data as formatarData } from "@/lib/formato";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_itens_parados")
    .select("sku, nome, saldo, valor_parado, ultima_saida, dias_sem_saida")
    .order("valor_parado", { ascending: false });

  const csv = paraCsv(
    (linhas ?? []).map((l) => ({
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
  );

  return respostaCsv(csv, "itens-parados.csv");
}

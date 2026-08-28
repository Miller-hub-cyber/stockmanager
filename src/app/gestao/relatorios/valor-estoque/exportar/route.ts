import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_valor_estoque")
    .select("categoria, itens, unidades, valor")
    .order("valor", { ascending: false });

  const csv = paraCsv(
    (linhas ?? []).map((l) => ({
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
  );

  return respostaCsv(csv, "valor-imobilizado.csv");
}

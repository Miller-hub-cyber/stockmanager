import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createClient();
  const { data: itens } = await supabase
    .from("v_itens_a_comprar")
    .select("sku, nome, unidade, saldo, ponto_pedido, custo_medio, fornecedor, sugestao_compra, situacao")
    .order("fornecedor", { ascending: true, nullsFirst: false });

  const csv = paraCsv(
    (itens ?? []).map((i) => ({
      sku: i.sku,
      nome: i.nome,
      unidade: i.unidade,
      saldo: i.saldo,
      ponto_pedido: i.ponto_pedido,
      sugestao_compra: i.sugestao_compra,
      custo_medio: i.custo_medio.toFixed(2).replace(".", ","),
      fornecedor: i.fornecedor ?? "",
      situacao: i.situacao,
    })),
    [
      { chave: "sku", rotulo: "SKU" },
      { chave: "nome", rotulo: "Item" },
      { chave: "unidade", rotulo: "Unidade" },
      { chave: "saldo", rotulo: "Saldo" },
      { chave: "ponto_pedido", rotulo: "Ponto de pedido" },
      { chave: "sugestao_compra", rotulo: "Sugestão de compra" },
      { chave: "custo_medio", rotulo: "Custo médio" },
      { chave: "fornecedor", rotulo: "Fornecedor" },
      { chave: "situacao", rotulo: "Situação" },
    ]
  );

  return respostaCsv(csv, "compras.csv");
}

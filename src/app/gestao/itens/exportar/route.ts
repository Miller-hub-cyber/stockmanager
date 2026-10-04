import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";

const esquemaIds = z.array(z.string().uuid()).min(1).max(500);

const decimal = (n: number, casas: number) => n.toFixed(casas).replace(".", ",");

/** CSV dos itens marcados na lista: /gestao/itens/exportar?ids=a,b,c */
export async function GET(request: NextRequest) {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const ids = esquemaIds.safeParse((request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean));
  if (!ids.success) return new Response("Selecione ao menos um item para exportar.", { status: 400 });

  const supabase = createClient();
  const [itens, saldos, categorias] = await Promise.all([
    supabase
      .from("itens")
      .select("id, sku, nome, unidade, tipo, estoque_minimo, ponto_pedido, custo_medio, ativo, categoria_id")
      .in("id", ids.data)
      .order("nome"),
    supabase.from("saldos").select("item_id, quantidade").in("item_id", ids.data),
    supabase.from("categorias").select("id, nome"),
  ]);
  if (itens.error || saldos.error || categorias.error) {
    console.error("Falha ao exportar itens", itens.error ?? saldos.error ?? categorias.error);
    return new Response("Não foi possível gerar o arquivo. Tente novamente.", { status: 500 });
  }

  const saldoPorItem = new Map<string, number>();
  saldos.data.forEach((s) => saldoPorItem.set(s.item_id, (saldoPorItem.get(s.item_id) ?? 0) + s.quantidade));
  const nomeCategoria = new Map(categorias.data.map((c) => [c.id, c.nome]));

  const csv = paraCsv(
    itens.data.map((item) => ({
      sku: item.sku,
      nome: item.nome,
      categoria: item.categoria_id ? (nomeCategoria.get(item.categoria_id) ?? "") : "",
      tipo: item.tipo,
      unidade: item.unidade,
      saldo: decimal(saldoPorItem.get(item.id) ?? 0, 3),
      custo_medio: decimal(item.custo_medio, 4),
      estoque_minimo: decimal(item.estoque_minimo, 3),
      ponto_pedido: decimal(item.ponto_pedido, 3),
      situacao: item.ativo ? "Ativo" : "Inativo",
    })),
    [
      { chave: "sku", rotulo: "SKU" },
      { chave: "nome", rotulo: "Item" },
      { chave: "categoria", rotulo: "Categoria" },
      { chave: "tipo", rotulo: "Tipo" },
      { chave: "unidade", rotulo: "Unidade" },
      { chave: "saldo", rotulo: "Saldo" },
      { chave: "custo_medio", rotulo: "Custo médio" },
      { chave: "estoque_minimo", rotulo: "Estoque mínimo" },
      { chave: "ponto_pedido", rotulo: "Ponto de pedido" },
      { chave: "situacao", rotulo: "Situação" },
    ]
  );

  return respostaCsv(csv, "itens.csv");
}

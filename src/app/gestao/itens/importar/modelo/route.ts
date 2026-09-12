import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Nao autorizado", { status: 403 });
  }

  const csv = paraCsv(
    [
      {
        sku: "FLT-0042",
        nome: "Filtro de oleo Mann W950",
        unidade: "UN",
        tipo: "peca",
        categoria: "Filtros",
        fornecedor: "Distribuidora Norte",
        estoque_minimo: 8,
        ponto_pedido: 15,
        codigo_barras: "",
        saldo_inicial: 12,
        custo_inicial: "48,90",
      },
    ],
    [
      { chave: "sku", rotulo: "SKU" },
      { chave: "nome", rotulo: "Item" },
      { chave: "unidade", rotulo: "Unidade" },
      { chave: "tipo", rotulo: "Tipo" },
      { chave: "categoria", rotulo: "Categoria" },
      { chave: "fornecedor", rotulo: "Fornecedor" },
      { chave: "estoque_minimo", rotulo: "Estoque minimo" },
      { chave: "ponto_pedido", rotulo: "Ponto de pedido" },
      { chave: "codigo_barras", rotulo: "Codigo de barras" },
      { chave: "saldo_inicial", rotulo: "Saldo inicial" },
      { chave: "custo_inicial", rotulo: "Custo inicial" },
    ]
  );

  return respostaCsv(csv, "modelo-importacao-itens.csv");
}

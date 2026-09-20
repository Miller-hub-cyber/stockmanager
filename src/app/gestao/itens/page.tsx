import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { desativarItem } from "@/actions/desativarItem";
import { brl, quantidade } from "@/lib/formato";
import { estadoItem, cores } from "@/lib/tokens";
import {
  Tabela,
  TabelaCabecalho,
  TabelaLinha,
  TabelaCelula,
  Botao,
  BotaoConfirmar,
  PontoEstado,
  Campo,
  Seletor,
} from "@/components/ui";
import type { Database } from "@/types/database";

const TIPOS = [
  { valor: "peca", rotulo: "Peça" },
  { valor: "consumivel", rotulo: "Consumível" },
  { valor: "epi", rotulo: "EPI" },
  { valor: "ferramenta", rotulo: "Ferramenta" },
  { valor: "pneu", rotulo: "Pneu" },
  { valor: "lubrificante", rotulo: "Lubrificante" },
  { valor: "outro", rotulo: "Outro" },
] as const;

interface Props {
  searchParams: { q?: string; categoria?: string; tipo?: string };
}

export default async function PaginaItens({ searchParams }: Props) {
  const supabase = createClient();
  const { q, categoria, tipo } = searchParams;

  const { data: categorias } = await supabase.from("categorias").select("id, nome").order("nome");

  let consulta = supabase
    .from("itens")
    .select("id, sku, nome, unidade, tipo, estoque_minimo, ponto_pedido, custo_medio, ativo, categoria_id")
    .order("nome");

  if (categoria) consulta = consulta.eq("categoria_id", categoria);
  if (tipo) consulta = consulta.eq("tipo", tipo as Database["public"]["Enums"]["tipo_item"]);
  if (q) consulta = consulta.or(`nome.ilike.%${q}%,sku.ilike.%${q}%`);

  const { data: itens } = await consulta;
  const lista = itens ?? [];

  const { data: saldosBrutos } = await supabase.from("saldos").select("item_id, quantidade");
  const saldoPorItem = new Map<string, number>();
  (saldosBrutos ?? []).forEach((s) => {
    saldoPorItem.set(s.item_id, (saldoPorItem.get(s.item_id) ?? 0) + s.quantidade);
  });

  const mapaCategorias = new Map((categorias ?? []).map((c) => [c.id, c.nome]));

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Itens</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Catálogo de peças, insumos e EPIs.</p>
        </div>
        <div className="flex gap-3">
          <div className="w-40">
            <Botao variante="secundario" href="/gestao/itens/importar">
              Importar CSV
            </Botao>
          </div>
          <div className="w-40">
            <Botao href="/gestao/itens/novo">Novo item</Botao>
          </div>
        </div>
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Campo id="q" name="q" rotulo="Buscar" placeholder="Nome ou SKU" defaultValue={q} />
        </div>
        <div className="w-48">
          <Seletor id="categoria" name="categoria" rotulo="Categoria" defaultValue={categoria ?? ""}>
            <option value="">Todas</option>
            {(categorias ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Seletor>
        </div>
        <div className="w-44">
          <Seletor id="tipo" name="tipo" rotulo="Tipo" defaultValue={tipo ?? ""}>
            <option value="">Todos</option>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </Seletor>
        </div>
        <div className="w-28">
          <Botao type="submit" variante="secundario">
            Filtrar
          </Botao>
        </div>
      </form>

      {lista.length === 0 ? (
        <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
          Nenhum item encontrado. Tente alterar os filtros ou{" "}
          <Link href="/gestao/itens/novo" className="text-petroleo hover:underline">
            cadastre um novo item
          </Link>
          .
        </div>
      ) : (
        <Tabela>
          <TabelaCabecalho>
            <TabelaCelula cabecalho mono className="max-w-[100px] flex-none">
              SKU
            </TabelaCelula>
            <TabelaCelula cabecalho>Item</TabelaCelula>
            <TabelaCelula cabecalho className="max-w-[130px] flex-none">
              Categoria
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[110px] flex-none">
              Saldo
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[110px] flex-none">
              Custo médio
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[110px] flex-none">
              Estado
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[160px] flex-none">
              Ações
            </TabelaCelula>
          </TabelaCabecalho>
          {lista.map((item) => {
            const saldo = saldoPorItem.get(item.id) ?? 0;
            const estado = estadoItem(saldo, item.estoque_minimo, item.ponto_pedido);
            return (
              <TabelaLinha key={item.id}>
                <TabelaCelula mono className="max-w-[100px] flex-none text-bruma-texto">
                  {item.sku}
                </TabelaCelula>
                <TabelaCelula>{item.nome}</TabelaCelula>
                <TabelaCelula className="max-w-[130px] flex-none text-bruma-texto">
                  {item.categoria_id ? (mapaCategorias.get(item.categoria_id) ?? "—") : "—"}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[110px] flex-none">
                  {quantidade(saldo)} {item.unidade}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[110px] flex-none">
                  {brl(item.custo_medio)}
                </TabelaCelula>
                <TabelaCelula align="direita" className="max-w-[110px] flex-none">
                  <PontoEstado
                    cor={item.ativo ? estado.cor : cores.bruma}
                    texto={item.ativo ? estado.texto : "Inativo"}
                    estado={item.ativo ? estado.estado : "inativo"}
                  />
                </TabelaCelula>
                <TabelaCelula align="direita" className="max-w-[160px] flex-none">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/gestao/itens/${item.id}`}
                      className="font-corpo text-sm text-petroleo hover:underline"
                    >
                      Editar
                    </Link>
                    {item.ativo && (
                      <form action={desativarItem.bind(null, item.id)} className="w-24">
                        <BotaoConfirmar mensagem={`Desativar o item "${item.nome}"?`}>
                          Desativar
                        </BotaoConfirmar>
                      </form>
                    )}
                  </div>
                </TabelaCelula>
              </TabelaLinha>
            );
          })}
        </Tabela>
      )}
    </main>
  );
}

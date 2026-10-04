import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { lerTudo } from "@/lib/supabase/lerTudo";
import { brl, quantidade } from "@/lib/formato";
import { estadoItem } from "@/lib/tokens";
import { cn } from "@/lib/cn";
import { Aviso, Botao } from "@/components/ui";
import { FiltrosItens } from "./FiltrosItens";
import { TabelaItens, type LinhaItem, type OrdemItens } from "./TabelaItens";

const POR_PAGINA = 25;
const ORDENS: OrdemItens[] = ["nome", "saldo", "custo"];

interface Props {
  searchParams: {
    q?: string;
    categoria?: string;
    tipo?: string;
    estoque?: string;
    inativos?: string;
    ordem?: string;
    dir?: string;
    pagina?: string;
  };
}

/** Sem acento e em minúsculas: "oleo" encontra "Óleo 15W40". */
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Páginas mostradas no rodapé: primeira, última e vizinhas da atual; `null` é a reticência. */
function paginasVisiveis(atual: number, total: number): (number | null)[] {
  const visiveis: (number | null)[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - atual) <= 1) visiveis.push(p);
    else if (visiveis[visiveis.length - 1] !== null) visiveis.push(null);
  }
  return visiveis;
}

async function carregar() {
  const supabase = createClient();
  try {
    const [categorias, itens, saldos] = await Promise.all([
      lerTudo((de, ate) => supabase.from("categorias").select("id, nome").order("nome").range(de, ate)),
      lerTudo((de, ate) =>
        supabase
          .from("itens")
          .select("id, sku, nome, unidade, tipo, estoque_minimo, ponto_pedido, custo_medio, ativo, categoria_id")
          .order("nome")
          .order("id")
          .range(de, ate)
      ),
      lerTudo((de, ate) => supabase.from("saldos").select("item_id, quantidade").order("id").range(de, ate)),
    ]);
    return { categorias, itens, saldos };
  } catch (erro) {
    console.error("Falha ao carregar itens", erro);
    return null;
  }
}

export default async function PaginaItens({ searchParams }: Props) {
  const { q, categoria, tipo } = searchParams;
  const estoque = searchParams.estoque === "abaixo" || searchParams.estoque === "zerado" ? searchParams.estoque : undefined;
  const inativos = searchParams.inativos === "1";
  const ordem = ORDENS.find((o) => o === searchParams.ordem) ?? "nome";
  const crescente = searchParams.dir !== "desc";

  const dados = await carregar();

  const saldoPorItem = new Map<string, number>();
  (dados?.saldos ?? []).forEach((s) => {
    saldoPorItem.set(s.item_id, (saldoPorItem.get(s.item_id) ?? 0) + s.quantidade);
  });
  const categorias = dados?.categorias ?? [];
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));

  const todos = (dados?.itens ?? []).map((item) => {
    const saldo = saldoPorItem.get(item.id) ?? 0;
    return { ...item, saldo, situacao: estadoItem(saldo, item.estoque_minimo, item.ponto_pedido).texto };
  });

  // Os indicadores olham o catálogo ativo inteiro, não o resultado do filtro.
  const ativos = todos.filter((item) => item.ativo);
  const abaixoDoMinimo = ativos.filter((item) => item.situacao === "Abaixo do minimo").length;
  const zerados = ativos.filter((item) => item.situacao === "Esgotado").length;
  const valorEmEstoque = ativos.reduce((soma, item) => soma + item.saldo * item.custo_medio, 0);

  const busca = q ? normalizar(q) : "";
  const filtrados = todos.filter((item) => {
    if (!inativos && !item.ativo) return false;
    // "sem" vem do aviso "itens sem categoria" em Cadastros.
    if (categoria === "sem" ? item.categoria_id !== null : categoria && item.categoria_id !== categoria) return false;
    if (tipo && item.tipo !== tipo) return false;
    if (estoque === "abaixo" && item.situacao !== "Abaixo do minimo") return false;
    if (estoque === "zerado" && item.situacao !== "Esgotado") return false;
    return !busca || normalizar(`${item.nome} ${item.sku}`).includes(busca);
  });

  const porNome = (a: (typeof todos)[number], b: (typeof todos)[number]) => a.nome.localeCompare(b.nome, "pt-BR");
  filtrados.sort((a, b) => {
    const diferenca =
      ordem === "saldo" ? a.saldo - b.saldo : ordem === "custo" ? a.custo_medio - b.custo_medio : porNome(a, b);
    return (crescente ? diferenca : -diferenca) || porNome(a, b);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Math.trunc(Number(searchParams.pagina)) || 1), totalPaginas);
  const inicio = (pagina - 1) * POR_PAGINA;

  const linhas: LinhaItem[] = filtrados.slice(inicio, inicio + POR_PAGINA).map((item) => ({
    id: item.id,
    sku: item.sku,
    nome: item.nome,
    unidade: item.unidade,
    categoria: item.categoria_id ? (nomeCategoria.get(item.categoria_id) ?? null) : null,
    saldo: quantidade(item.saldo),
    custoMedio: item.custo_medio > 0 ? brl(item.custo_medio) : null,
    ativo: item.ativo,
    estado: !item.ativo
      ? { tom: "inativo", texto: "Inativo" }
      : item.situacao === "Esgotado"
        ? { tom: "critico", texto: "Zerado" }
        : item.situacao === "Abaixo do minimo"
          ? { tom: "alerta", texto: "Estoque baixo" }
          : item.situacao === "Repor"
            ? { tom: "alerta", texto: "Repor" }
            : null,
  }));

  const atuais = {
    q,
    categoria,
    tipo,
    estoque,
    inativos: inativos ? "1" : undefined,
    ordem: ordem === "nome" ? undefined : ordem,
    dir: crescente ? undefined : "desc",
    pagina: pagina > 1 ? String(pagina) : undefined,
  };
  function rota(mudancas: Partial<typeof atuais>) {
    const parametros = new URLSearchParams();
    Object.entries({ ...atuais, ...mudancas }).forEach(([chave, valor]) => {
      if (valor) parametros.set(chave, valor);
    });
    const consulta = parametros.toString();
    return consulta ? `/gestao/itens?${consulta}` : "/gestao/itens";
  }
  // Clicar na coluna já ordenada inverte o sentido; em outra coluna começa crescente.
  const rotaOrdem = (coluna: OrdemItens) =>
    rota({
      ordem: coluna === "nome" ? undefined : coluna,
      dir: coluna === ordem && crescente ? "desc" : undefined,
      pagina: undefined,
    });
  const rotaEstoque = (valor: "abaixo" | "zerado") =>
    rota({ estoque: estoque === valor ? undefined : valor, pagina: undefined });

  const botaoPagina =
    "inline-flex h-9 min-w-[36px] items-center justify-center rounded border px-3 font-corpo text-sm transition-colors duration-150";

  return (
    <main className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-tela">Itens</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Catálogo de peças, insumos e EPIs</p>
        </div>
        <div className="flex gap-3">
          <div className="w-36">
            <Botao variante="secundario" href="/gestao/itens/importar" className="bg-white">
              Importar CSV
            </Botao>
          </div>
          <div className="w-36">
            <Botao href="/gestao/itens/novo" icone={<Plus size={16} aria-hidden="true" />}>
              Novo item
            </Botao>
          </div>
        </div>
      </div>

      {!dados ? (
        <div className="mt-6">
          <Aviso tipo="erro" titulo="Não foi possível carregar os itens.">
            Verifique sua conexão e atualize a página.
          </Aviso>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Resumo rotulo="Itens ativos" valor={ativos.length} />
            <Resumo
              rotulo="Abaixo do mínimo"
              valor={abaixoDoMinimo}
              tom="alerta"
              href={rotaEstoque("abaixo")}
              ativo={estoque === "abaixo"}
            />
            <Resumo
              rotulo="Zerados"
              valor={zerados}
              tom="critico"
              href={rotaEstoque("zerado")}
              ativo={estoque === "zerado"}
            />
            <Resumo rotulo="Valor em estoque" valor={brl(valorEmEstoque)} />
          </div>

          <section className="mt-5 rounded border border-giz bg-white">
            <FiltrosItens
              categorias={categorias}
              q={q}
              categoria={categoria}
              tipo={tipo}
              abaixoDoMinimo={estoque === "abaixo"}
              inativos={inativos}
            />

            {linhas.length === 0 ? (
              <div className="p-8 text-center font-corpo text-sm text-bruma-texto">
                Nenhum item encontrado. Tente alterar os filtros ou{" "}
                <Link href="/gestao/itens/novo" className="text-cobalto hover:underline">
                  cadastre um novo item
                </Link>
                .
              </div>
            ) : (
              <TabelaItens
                key={rota({})}
                itens={linhas}
                categorias={categorias}
                ordem={ordem}
                crescente={crescente}
                rotasOrdem={{ nome: rotaOrdem("nome"), saldo: rotaOrdem("saldo"), custo: rotaOrdem("custo") }}
              />
            )}

            {filtrados.length > 0 && (
              <nav
                aria-label="Paginação"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-giz px-5 py-3"
              >
                <span className="font-corpo text-sm text-bruma-texto">
                  Mostrando {inicio + 1}–{inicio + linhas.length} de {filtrados.length}{" "}
                  {filtrados.length === 1 ? "item" : "itens"}
                </span>
                {totalPaginas > 1 && (
                  <div className="flex items-center gap-1.5">
                    <LinkPagina
                      href={pagina > 1 ? rota({ pagina: pagina > 2 ? String(pagina - 1) : undefined }) : null}
                      className={botaoPagina}
                    >
                      Anterior
                    </LinkPagina>
                    {paginasVisiveis(pagina, totalPaginas).map((p, indice) =>
                      p === null ? (
                        <span key={`r${indice}`} className="px-1 font-corpo text-sm text-bruma-texto">
                          …
                        </span>
                      ) : (
                        <Link
                          key={p}
                          href={rota({ pagina: p > 1 ? String(p) : undefined })}
                          aria-current={p === pagina ? "page" : undefined}
                          className={cn(
                            botaoPagina,
                            "font-dado",
                            p === pagina
                              ? "border-cobalto bg-cobalto font-semibold text-white"
                              : "border-giz bg-white text-tinta hover:bg-nevoa"
                          )}
                        >
                          {p}
                        </Link>
                      )
                    )}
                    <LinkPagina
                      href={pagina < totalPaginas ? rota({ pagina: String(pagina + 1) }) : null}
                      className={botaoPagina}
                    >
                      Próxima
                    </LinkPagina>
                  </div>
                )}
              </nav>
            )}
          </section>
        </>
      )}
    </main>
  );
}

interface ResumoProps {
  rotulo: string;
  valor: number | string;
  tom?: "normal" | "alerta" | "critico";
  /** Quando presente, o cartão liga e desliga o filtro correspondente. */
  href?: string;
  ativo?: boolean;
}

const TONS_RESUMO = {
  normal: { caixa: "border-giz bg-white", texto: "text-bruma-texto", valor: "text-tinta", ativo: "" },
  alerta: {
    caixa: "border-ambar/50 bg-ambar-fundo/50",
    texto: "text-ambar-texto",
    valor: "text-ambar-texto",
    ativo: "border-ambar-texto",
  },
  critico: {
    caixa: "border-carmim/40 bg-carmim-fundo/50",
    texto: "text-carmim-texto",
    valor: "text-carmim-texto",
    ativo: "border-carmim-texto",
  },
} as const;

function Resumo({ rotulo, valor, tom = "normal", href, ativo = false }: ResumoProps) {
  const cores = TONS_RESUMO[tom];
  const conteudo = (
    <>
      <div className={cn("font-corpo text-xs font-medium", cores.texto)}>{rotulo}</div>
      <div className={cn("mt-1.5 truncate font-display text-2xl font-bold leading-none", cores.valor)}>{valor}</div>
    </>
  );
  const classes = cn("block rounded border px-4 py-3.5", cores.caixa, ativo && cores.ativo);

  if (!href) return <div className={classes}>{conteudo}</div>;
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={ativo ? "true" : undefined}
      aria-label={`${rotulo}: ${valor}. ${ativo ? "Remover filtro" : "Filtrar a lista"}`}
      className={cn(classes, "transition-[border-color,transform] duration-150 ease-mola active:scale-[0.99]", !ativo && "hover:border-bruma")}
    >
      {conteudo}
    </Link>
  );
}

function LinkPagina({ href, className, children }: { href: string | null; className: string; children: string }) {
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(className, "cursor-not-allowed border-giz bg-white text-bruma-texto opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(className, "border-giz bg-white text-tinta hover:bg-nevoa")}>
      {children}
    </Link>
  );
}

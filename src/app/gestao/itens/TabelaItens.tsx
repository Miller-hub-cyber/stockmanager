"use client";

import { useEffect, useRef, useState, type MouseEvent as EventoMouse } from "react";
import Link from "next/link";
import { Archive, ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, OctagonX, type LucideIcon } from "lucide-react";
import { alterarCategoriaItens } from "@/actions/alterarCategoriaItens";
import { desativarItens } from "@/actions/desativarItens";
import { Aviso, TabelaCabecalho, TabelaCelula } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";
import { cn } from "@/lib/cn";

type TomEstado = "alerta" | "critico" | "inativo";
export type OrdemItens = "nome" | "saldo" | "custo";

export interface LinhaItem {
  id: string;
  sku: string;
  nome: string;
  unidade: string;
  categoria: string | null;
  /** Saldo e custo chegam formatados do servidor, para o texto não divergir na hidratação. */
  saldo: string;
  custoMedio: string | null;
  ativo: boolean;
  /** `null` quando o estoque está normal: a coluna fica vazia. */
  estado: { tom: TomEstado; texto: string } | null;
}

interface TabelaItensProps {
  itens: LinhaItem[];
  categorias: { id: string; nome: string }[];
  ordem: OrdemItens;
  crescente: boolean;
  /** Link de cada coluna ordenável, já com a direção que o clique aplica. */
  rotasOrdem: Record<OrdemItens, string>;
}

const ESTADOS: Record<TomEstado, { icone: LucideIcon; classes: string }> = {
  alerta: { icone: ArrowDown, classes: "bg-ambar-fundo text-ambar-texto" },
  critico: { icone: OctagonX, classes: "bg-carmim-fundo text-carmim-texto" },
  inativo: { icone: Archive, classes: "bg-nevoa text-bruma-texto" },
};

const ROTULO_ORDEM: Record<OrdemItens, string> = { nome: "Item", saldo: "Saldo", custo: "Custo médio" };

const botaoBarra =
  "inline-flex h-8 items-center rounded border border-giz bg-white px-3 font-corpo text-sm text-tinta transition-[background-color,transform] duration-150 ease-mola hover:bg-nevoa active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";
const itemMenu =
  "block w-full px-3 py-2 text-left font-corpo text-sm transition-colors duration-150 hover:bg-nevoa focus-visible:bg-nevoa focus-visible:outline-none";

const FALHA = "Não foi possível concluir. Tente novamente.";

const plural = (n: number) => `${n} ${n === 1 ? "item selecionado" : "itens selecionados"}`;

export function TabelaItens({ itens, categorias, ordem, crescente, rotasOrdem }: TabelaItensProps) {
  const [selecionados, definirSelecionados] = useState<Set<string>>(new Set());
  const [trocandoCategoria, definirTrocandoCategoria] = useState(false);
  const [novaCategoria, definirNovaCategoria] = useState("");
  const [erro, definirErro] = useState<string | null>(null);
  const [menu, definirMenu] = useState<{ id: string; direita: number; topo?: number; base?: number } | null>(null);
  const [pendente, definirPendente] = useState(false);
  const marcarTodos = useRef<HTMLInputElement>(null);
  const caixaMenu = useRef<HTMLDivElement>(null);

  // Só conta o que está na página atual: a lista muda após desativar ou filtrar.
  const ids = itens.filter((item) => selecionados.has(item.id)).map((item) => item.id);
  const todos = itens.length > 0 && ids.length === itens.length;

  useEffect(() => {
    if (marcarTodos.current) marcarTodos.current.indeterminate = ids.length > 0 && !todos;
  }, [ids.length, todos]);

  useEffect(() => {
    if (!menu) return;
    const fechar = () => definirMenu(null);
    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Element;
      if (caixaMenu.current?.contains(alvo) || alvo.closest("[data-gatilho-menu]")) return;
      fechar();
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") fechar();
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [menu]);

  function alternar(id: string) {
    definirSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  // O menu é `fixed` para não ser cortado pela rolagem horizontal da tabela.
  function alternarMenu(evento: EventoMouse<HTMLButtonElement>, id: string) {
    if (menu?.id === id) return definirMenu(null);
    const caixa = evento.currentTarget.getBoundingClientRect();
    const direita = window.innerWidth - caixa.right;
    const semEspacoAbaixo = caixa.bottom + 110 > window.innerHeight;
    definirMenu(
      semEspacoAbaixo
        ? { id, direita, base: window.innerHeight - caixa.top + 4 }
        : { id, direita, topo: caixa.bottom + 4 }
    );
  }

  async function executar(acao: () => Promise<ResultadoAcao>) {
    definirErro(null);
    definirPendente(true);
    try {
      const resultado = await acao();
      if (!resultado.sucesso) return definirErro(resultado.erro ?? FALHA);
      definirSelecionados(new Set());
      definirTrocandoCategoria(false);
    } catch {
      definirErro(FALHA);
    } finally {
      definirPendente(false);
    }
  }

  function desativarSelecionados() {
    if (!window.confirm(`Desativar ${ids.length} ${ids.length === 1 ? "item" : "itens"}?`)) return;
    executar(() => desativarItens(ids));
  }

  function desativarUm(item: LinhaItem) {
    definirMenu(null);
    if (!window.confirm(`Desativar o item "${item.nome}"?`)) return;
    executar(() => desativarItens([item.id]));
  }

  const itemDoMenu = menu ? itens.find((item) => item.id === menu.id) : undefined;

  return (
    <div aria-busy={pendente}>
      {ids.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-giz bg-cobalto/5 px-5 py-2.5">
          <span className="font-corpo text-sm font-semibold text-cobalto">{plural(ids.length)}</span>

          {trocandoCategoria ? (
            <>
              <select
                value={novaCategoria}
                onChange={(evento) => definirNovaCategoria(evento.target.value)}
                aria-label="Nova categoria"
                className="h-8 max-w-[14rem] rounded border border-giz bg-white px-2 font-corpo text-sm text-tinta outline-none focus:border-cobalto-claro"
              >
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pendente}
                onClick={() => executar(() => alterarCategoriaItens(ids, novaCategoria || null))}
                className={cn(botaoBarra, "border-cobalto bg-cobalto font-semibold text-white hover:bg-cobalto-claro")}
              >
                {pendente ? "Aplicando..." : "Aplicar"}
              </button>
              <button type="button" onClick={() => definirTrocandoCategoria(false)} className={botaoBarra}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => definirTrocandoCategoria(true)} className={botaoBarra}>
                Alterar categoria
              </button>
              {/* <a> comum: é download de arquivo, não navegação do roteador. */}
              <a href={`/gestao/itens/exportar?ids=${ids.join(",")}`} className={botaoBarra}>
                Exportar
              </a>
              <button
                type="button"
                disabled={pendente}
                onClick={desativarSelecionados}
                className={cn(botaoBarra, "border-carmim/40 text-carmim-texto")}
              >
                Desativar
              </button>
            </>
          )}
        </div>
      )}

      {erro && (
        <div className="border-b border-giz px-5 py-3">
          <Aviso tipo="erro" titulo={erro} />
        </div>
      )}

      <div role="table" aria-label="Itens" className="overflow-x-auto">
        <div className="min-w-[760px]">
          <TabelaCabecalho>
            <div role="columnheader" className="flex w-10 flex-none items-center px-1">
              <input
                ref={marcarTodos}
                type="checkbox"
                checked={todos}
                onChange={() => definirSelecionados(todos ? new Set() : new Set(itens.map((item) => item.id)))}
                aria-label="Selecionar todos os itens da página"
                className="h-4 w-4 cursor-pointer accent-cobalto"
              />
            </div>
            <TabelaCelula cabecalho className="w-[110px] flex-none">
              SKU
            </TabelaCelula>
            <TabelaCelula cabecalho>
              <LinkOrdem coluna="nome" ordem={ordem} crescente={crescente} href={rotasOrdem.nome} />
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="w-[110px] flex-none">
              <LinkOrdem coluna="saldo" ordem={ordem} crescente={crescente} href={rotasOrdem.saldo} />
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="w-[130px] flex-none">
              <LinkOrdem coluna="custo" ordem={ordem} crescente={crescente} href={rotasOrdem.custo} />
            </TabelaCelula>
            <TabelaCelula cabecalho className="ml-4 w-[150px] flex-none">
              Estado
            </TabelaCelula>
            <div role="columnheader" className="w-10 flex-none">
              <span className="sr-only">Ações</span>
            </div>
          </TabelaCabecalho>

          {itens.map((item) => {
            const marcado = selecionados.has(item.id);
            const estado = item.estado && ESTADOS[item.estado.tom];
            return (
              <div
                key={item.id}
                role="row"
                aria-selected={marcado}
                className={cn(
                  "flex h-[52px] items-center border-b border-giz px-3.5 last:border-b-0",
                  marcado && "bg-cobalto/5"
                )}
              >
                <div role="cell" className="flex w-10 flex-none items-center px-1">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternar(item.id)}
                    aria-label={`Selecionar ${item.nome}`}
                    className="h-4 w-4 cursor-pointer accent-cobalto"
                  />
                </div>
                <TabelaCelula mono className="w-[110px] flex-none text-bruma-texto">
                  {item.sku}
                </TabelaCelula>
                <TabelaCelula>
                  <Link
                    href={`/gestao/itens/${item.id}`}
                    className={cn("block truncate font-semibold hover:underline", !item.ativo && "text-bruma-texto")}
                  >
                    {item.nome}
                  </Link>
                  <span className="mt-0.5 inline-block max-w-full truncate rounded-sm bg-nevoa px-1.5 align-top text-[11px] leading-[18px] text-bruma-texto">
                    {item.categoria ?? "Sem categoria"}
                  </span>
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="w-[110px] flex-none">
                  <span className="font-semibold">{item.saldo}</span>{" "}
                  <span className="text-[11px] text-bruma-texto">{item.unidade}</span>
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="w-[130px] flex-none">
                  {item.custoMedio ?? <span className="text-bruma-texto">—</span>}
                </TabelaCelula>
                <TabelaCelula className="ml-4 w-[150px] flex-none">
                  {item.estado && estado && (
                    <span
                      className={cn(
                        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
                        estado.classes
                      )}
                    >
                      <estado.icone size={12} aria-hidden="true" />
                      {item.estado.texto}
                    </span>
                  )}
                </TabelaCelula>
                <div role="cell" className="flex w-10 flex-none justify-end">
                  <button
                    type="button"
                    data-gatilho-menu
                    onClick={(evento) => alternarMenu(evento, item.id)}
                    aria-haspopup="menu"
                    aria-expanded={menu?.id === item.id}
                    aria-label={`Ações de ${item.nome}`}
                    className="flex h-8 w-8 items-center justify-center rounded text-bruma-texto transition-colors duration-150 hover:bg-nevoa hover:text-tinta"
                  >
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {menu && itemDoMenu && (
        <div
          ref={caixaMenu}
          role="menu"
          style={{ right: menu.direita, top: menu.topo, bottom: menu.base }}
          className="fixed z-30 w-40 overflow-hidden rounded border border-giz bg-white py-1 shadow-lg"
        >
          <Link href={`/gestao/itens/${itemDoMenu.id}`} role="menuitem" className={cn(itemMenu, "text-tinta")}>
            Editar
          </Link>
          {itemDoMenu.ativo && (
            <button
              type="button"
              role="menuitem"
              onClick={() => desativarUm(itemDoMenu)}
              className={cn(itemMenu, "text-carmim-texto")}
            >
              Desativar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface LinkOrdemProps {
  coluna: OrdemItens;
  ordem: OrdemItens;
  crescente: boolean;
  href: string;
}

function LinkOrdem({ coluna, ordem, crescente, href }: LinkOrdemProps) {
  const ativa = coluna === ordem;
  const Icone = !ativa ? ArrowUpDown : crescente ? ArrowUp : ArrowDown;
  const sentido = ativa ? (crescente ? ", crescente" : ", decrescente") : "";

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={`Ordenar por ${ROTULO_ORDEM[coluna].toLowerCase()}${sentido}`}
      className={cn("inline-flex items-center gap-1 hover:text-tinta", ativa && "text-tinta")}
    >
      {ROTULO_ORDEM[coluna]}
      <Icone size={12} aria-hidden="true" />
    </Link>
  );
}

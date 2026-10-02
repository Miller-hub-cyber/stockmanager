"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type TomIcone = "musgo" | "laranja" | "cobalto" | "grafite";

export interface CartaoRelatorio {
  chave: string;
  titulo: string;
  descricao: string;
  /** Número do cartão no período; `valor` vem "—" quando a consulta falhou. */
  resumo?: { valor: string; texto: string };
  /** Texto de apoio no lugar do resumo. */
  dica?: string;
  href: string;
  /** Rotas de exportação. Ausentes quando a exportação exige uma escolha na página (Kardex). */
  csv?: string;
  xlsx?: string;
  icone: ReactNode;
  tom: TomIcone;
}

export interface SecaoRelatorios {
  titulo: string;
  cartoes: CartaoRelatorio[];
}

// Ambar e carmim são estado de estoque e não decoram cartão (ver tailwind.config.ts).
const TONS: Record<TomIcone, string> = {
  musgo: "bg-musgo-fundo text-musgo-texto",
  laranja: "bg-laranja-fundo text-laranja-texto",
  cobalto: "bg-nevoa text-cobalto",
  grafite: "bg-nevoa text-grafite",
};

interface Busca {
  termo: string;
  definirTermo: (termo: string) => void;
}

const ContextoBusca = createContext<Busca>({ termo: "", definirTermo: () => {} });

/** Busca local: só filtra os cartões que já estão na tela, sem ir ao servidor. */
export function BuscaRelatorios({ children }: { children: ReactNode }) {
  const [termo, definirTermo] = useState("");
  const valor = useMemo(() => ({ termo, definirTermo }), [termo]);
  return <ContextoBusca.Provider value={valor}>{children}</ContextoBusca.Provider>;
}

export function CampoBuscaRelatorio() {
  const { termo, definirTermo } = useContext(ContextoBusca);
  return (
    <div className="relative w-full sm:w-72">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bruma"
      />
      <input
        type="search"
        value={termo}
        onChange={(evento) => definirTermo(evento.target.value)}
        placeholder="Buscar relatório…"
        aria-label="Buscar relatório"
        className="h-10 w-full rounded border border-giz bg-white pl-9 pr-3 font-corpo text-sm text-tinta outline-none transition-colors duration-150 placeholder:text-bruma-texto focus:border-cobalto-claro"
      />
    </div>
  );
}

/** Sem acento e em minúsculas: "saida" encontra "Saídas". */
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function ListaRelatorios({ secoes }: { secoes: SecaoRelatorios[] }) {
  const { termo } = useContext(ContextoBusca);
  const busca = normalizar(termo);

  const visiveis = secoes
    .map((secao) => ({
      ...secao,
      cartoes: secao.cartoes.filter((cartao) =>
        normalizar(`${secao.titulo} ${cartao.titulo} ${cartao.descricao}`).includes(busca)
      ),
    }))
    .filter((secao) => secao.cartoes.length > 0);

  if (visiveis.length === 0) {
    return (
      <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
        Nenhum relatório encontrado para “{termo.trim()}”.
      </div>
    );
  }

  const ordem = new Map(secoes.flatMap((secao) => secao.cartoes).map((cartao, indice) => [cartao.chave, indice]));

  return (
    <div className="flex flex-col gap-7">
      {visiveis.map((secao) => (
        <section key={secao.titulo}>
          <h2 className="flex items-center gap-2 font-display text-rotulo uppercase text-laranja-texto">
            <span aria-hidden="true" className="h-3 w-[3px] rounded-sm bg-laranja" />
            {secao.titulo}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {secao.cartoes.map((cartao) => (
              <Cartao key={cartao.chave} cartao={cartao} indice={ordem.get(cartao.chave) ?? 0} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Cartao({ cartao, indice }: { cartao: CartaoRelatorio; indice: number }) {
  const { titulo, descricao, resumo, dica, href, csv, xlsx, icone, tom } = cartao;

  return (
    <article
      style={{ animationDelay: `${indice * 30}ms` }}
      className="relative flex animate-entrada items-start gap-4 rounded border border-giz bg-white p-5 transition-[border-color,transform] duration-150 ease-mola focus-within:border-cobalto-claro hover:border-cobalto-claro active:scale-[0.99]"
    >
      <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded", TONS[tom])}>{icone}</div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-semibold leading-tight text-tinta">
          {/* O link cobre o cartão inteiro; o botão de CSV fica por cima dele (z-10). */}
          <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded">
            {titulo}
          </Link>
        </h3>
        <p className="mt-1 font-corpo text-sm text-bruma-texto">{descricao}</p>
        {resumo && (
          <p className="mt-3 font-corpo text-sm text-tinta">
            <span className="font-dado font-medium">{resumo.valor}</span> {resumo.texto}
          </p>
        )}
        {dica && <p className="mt-3 font-corpo text-xs text-bruma-texto">{dica}</p>}
      </div>

      {(csv || xlsx) && (
        // <a> e não <Link>: o roteador do Next faria prefetch da rota e baixaria o arquivo à toa.
        <div className="relative z-10 flex flex-shrink-0 flex-col gap-1.5">
          {csv && (
            <a
              href={csv}
              aria-label={`Exportar ${titulo} em CSV`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded bg-cobalto px-3 font-display text-xs font-semibold text-white transition-[background-color,transform] duration-150 ease-mola hover:bg-cobalto-claro active:scale-95"
            >
              <Download size={14} aria-hidden="true" />
              CSV
            </a>
          )}
          {xlsx && (
            // Excel em laranja é exceção consciente à regra do laranja só na moldura
            // (docs/design-system.md). Texto em aço: branco sobre laranja não tem contraste.
            <a
              href={xlsx}
              aria-label={`Exportar ${titulo} em planilha do Excel`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded bg-laranja px-3 font-display text-xs font-semibold text-aco transition-[filter,transform] duration-150 ease-mola hover:brightness-95 active:scale-95"
            >
              <FileSpreadsheet size={14} aria-hidden="true" />
              Excel
            </a>
          )}
        </div>
      )}
    </article>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

const TIPOS = [
  { valor: "peca", rotulo: "Peça" },
  { valor: "consumivel", rotulo: "Consumível" },
  { valor: "epi", rotulo: "EPI" },
  { valor: "ferramenta", rotulo: "Ferramenta" },
  { valor: "pneu", rotulo: "Pneu" },
  { valor: "lubrificante", rotulo: "Lubrificante" },
  { valor: "outro", rotulo: "Outro" },
] as const;

const ESPERA_BUSCA = 300;

interface FiltrosItensProps {
  categorias: { id: string; nome: string }[];
  q?: string;
  categoria?: string;
  tipo?: string;
  abaixoDoMinimo: boolean;
  inativos: boolean;
}

/**
 * Filtros da lista de itens. Cada mudança vai direto para a querystring (sem
 * botão "Filtrar"); a busca espera a digitação parar. Enquanto a nova página
 * não chega, `data-pendente` esmaece a tabela logo abaixo (regra em globals.css).
 */
export function FiltrosItens({ categorias, q, categoria, tipo, abaixoDoMinimo, inativos }: FiltrosItensProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendente, iniciarTransicao] = useTransition();
  const [busca, definirBusca] = useState(q ?? "");
  const espera = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(espera.current), []);

  function aplicar(chave: string, valor: string) {
    const parametros = new URLSearchParams(window.location.search);
    if (valor) parametros.set(chave, valor);
    else parametros.delete(chave);
    parametros.delete("pagina");
    const consulta = parametros.toString();
    iniciarTransicao(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
  }

  function aoDigitar(valor: string) {
    definirBusca(valor);
    clearTimeout(espera.current);
    espera.current = setTimeout(() => aplicar("q", valor.trim()), ESPERA_BUSCA);
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    clearTimeout(espera.current);
    aplicar("q", busca.trim());
  }

  const caixaSeletor =
    "flex h-10 items-center gap-2 rounded border border-giz bg-white pl-3 pr-1.5 font-corpo text-sm text-bruma-texto transition-colors duration-150 focus-within:border-cobalto-claro";
  const seletor = "h-8 max-w-[11rem] cursor-pointer rounded-sm bg-transparent font-semibold text-tinta outline-none";

  return (
    <form
      onSubmit={aoEnviar}
      aria-busy={pendente}
      data-pendente={pendente || undefined}
      className="flex flex-wrap items-center gap-3 border-b border-giz px-5 py-4"
    >
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bruma"
        />
        <input
          type="search"
          name="q"
          value={busca}
          onChange={(evento) => aoDigitar(evento.target.value)}
          placeholder="Buscar por nome ou SKU"
          aria-label="Buscar por nome ou SKU"
          className="h-10 w-full rounded border border-giz bg-white pl-9 pr-3 font-corpo text-sm text-tinta outline-none transition-colors duration-150 placeholder:text-bruma-texto focus:border-cobalto-claro"
        />
      </div>

      <label className={caixaSeletor}>
        Categoria
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          onChange={(evento) => aplicar("categoria", evento.target.value)}
          className={seletor}
        >
          <option value="">Todas</option>
          <option value="sem">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>

      <label className={caixaSeletor}>
        Tipo
        <select
          name="tipo"
          defaultValue={tipo ?? ""}
          onChange={(evento) => aplicar("tipo", evento.target.value)}
          className={seletor}
        >
          <option value="">Todos</option>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        aria-pressed={abaixoDoMinimo}
        onClick={() => aplicar("estoque", abaixoDoMinimo ? "" : "abaixo")}
        className={cn(
          "h-10 rounded-full border px-4 font-corpo text-sm font-semibold text-ambar-texto transition-[background-color,border-color,transform] duration-150 ease-mola active:scale-95",
          abaixoDoMinimo
            ? "border-ambar-texto bg-ambar-fundo"
            : "border-dashed border-ambar-texto/60 bg-white hover:bg-ambar-fundo/50"
        )}
      >
        Abaixo do mínimo
      </button>

      <label className="flex h-10 cursor-pointer items-center gap-2 font-corpo text-sm text-tinta">
        <input
          type="checkbox"
          name="inativos"
          defaultChecked={inativos}
          onChange={(evento) => aplicar("inativos", evento.target.checked ? "1" : "")}
          className="h-4 w-4 cursor-pointer accent-cobalto"
        />
        Mostrar inativos
      </label>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export interface RegistroBusca {
  id: string;
  tipo: string;
  nome: string;
  detalhe?: string;
  href: string;
  inativo?: boolean;
}

const MAXIMO = 8;

/** Sem acento e em minúsculas: "deposito" encontra "Depósito Central". */
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Busca local em todos os cadastros já carregados na página. Ctrl+K (ou ⌘K) foca o campo. */
export function BuscaCadastros({ registros }: { registros: RegistroBusca[] }) {
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);
  const [termo, definirTermo] = useState("");

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        campo.current?.focus();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const busca = normalizar(termo);
  const resultados = busca
    ? registros.filter((r) => normalizar(`${r.nome} ${r.detalhe ?? ""} ${r.tipo}`).includes(busca)).slice(0, MAXIMO)
    : [];

  return (
    <div className="relative w-full sm:w-80">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bruma"
      />
      <input
        ref={campo}
        type="search"
        value={termo}
        onChange={(evento) => definirTermo(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") definirTermo("");
          if (evento.key === "Enter" && resultados[0]) router.push(resultados[0].href);
        }}
        placeholder="Buscar em todos os cadastros…"
        aria-label="Buscar em todos os cadastros"
        className="h-10 w-full rounded border border-giz bg-white pl-9 pr-16 font-corpo text-sm text-tinta outline-none transition-colors duration-150 placeholder:text-bruma-texto focus:border-cobalto-claro"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm border border-giz bg-nevoa px-1.5 py-0.5 font-dado text-[11px] text-bruma-texto">
        Ctrl K
      </kbd>

      {busca && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded border border-giz bg-white shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-3 py-3 font-corpo text-sm text-bruma-texto">Nada encontrado para “{termo.trim()}”.</p>
          ) : (
            <ul>
              {resultados.map((r) => (
                <li key={`${r.tipo}-${r.id}`}>
                  <Link
                    href={r.href}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-nevoa focus-visible:bg-nevoa focus-visible:outline-none"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-corpo text-sm text-tinta">
                        {r.nome}
                        {r.inativo && <span className="ml-1.5 text-xs text-bruma-texto">(inativo)</span>}
                      </span>
                      {r.detalhe && <span className="block truncate font-dado text-xs text-bruma-texto">{r.detalhe}</span>}
                    </span>
                    <span className="flex-shrink-0 font-display text-rotulo uppercase text-bruma-texto">{r.tipo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

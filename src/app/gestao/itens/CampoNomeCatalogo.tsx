"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Campo } from "@/components/ui";
import { cn } from "@/lib/cn";
import { filtrarCatalogo, type EntradaCatalogo } from "@/lib/catalogo";

interface CampoNomeCatalogoProps {
  catalogo: EntradaCatalogo[];
  aoEscolher: (entrada: EntradaCatalogo) => void;
}

/**
 * Campo "Nome do item" com sugestoes da biblioteca (catalogo_itens). O nome
 * continua livre: o catalogo sugere, nao obriga. Escolher uma sugestao
 * preenche tipo, unidade, NCM e categoria via `aoEscolher`.
 */
export function CampoNomeCatalogo({ catalogo, aoEscolher }: CampoNomeCatalogoProps) {
  const idLista = useId();
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);

  const sugestoes = useMemo(() => filtrarCatalogo(catalogo, texto), [catalogo, texto]);
  const mostrar = aberto && sugestoes.length > 0;

  function escolher(entrada: EntradaCatalogo) {
    setTexto(entrada.nome);
    setAberto(false);
    aoEscolher(entrada);
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (!mostrar) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => (d + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => (d - 1 + sugestoes.length) % sugestoes.length);
    } else if (e.key === "Enter") {
      // Enter escolhe a sugestao em vez de enviar o formulario.
      e.preventDefault();
      escolher(sugestoes[destaque]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className="relative">
      <Campo
        id="nome"
        name="nome"
        rotulo="Nome do item"
        dica="Digite para buscar na biblioteca de peças e materiais."
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={idLista}
        aria-autocomplete="list"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setDestaque(0);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={aoTeclar}
        required
      />
      {mostrar && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute left-0 right-0 top-[72px] z-20 max-h-80 overflow-auto rounded border border-giz bg-white py-1 shadow-lg"
        >
          {sugestoes.map((s, i) => (
            <li
              key={s.nome}
              role="option"
              aria-selected={i === destaque}
              // mousedown (e nao click) roda antes do blur que fecharia a lista
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(s);
              }}
              onMouseEnter={() => setDestaque(i)}
              className={cn(
                "flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2",
                i === destaque && "bg-nevoa"
              )}
            >
              <span className="font-corpo text-sm text-tinta">{s.nome}</span>
              <span className="shrink-0 font-corpo text-xs text-bruma-texto">
                {s.grupo} · {s.unidade}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface PontoEstadoProps {
  /** Hex vindo de `estadoItem()` em `src/lib/tokens.ts`. */
  cor: string;
  texto?: string;
}

/** Nunca depende só da cor: o texto ao lado é a alternativa acessível. */
export function PontoEstado({ cor, texto }: PontoEstadoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-[9px] w-[9px] flex-shrink-0 rounded-full"
        style={{ background: cor }}
        aria-hidden="true"
      />
      {texto && <span className="font-corpo text-xs text-bruma">{texto}</span>}
    </span>
  );
}

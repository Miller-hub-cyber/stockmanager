import { CircleCheck, TriangleAlert, OctagonX, Archive, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { cores } from "@/lib/tokens";

type EstadoPonto = "normal" | "alerta" | "critico" | "inativo";

interface PontoEstadoProps {
  /** Hex vindo de `estadoItem()` em `src/lib/tokens.ts`. Usado no ponto quando `estado` não é informado. */
  cor: string;
  texto?: string;
  /** Quando informado, troca o ponto por um ícone de forma distinta para esse estado. */
  estado?: EstadoPonto;
  /** Contexto escuro (área de operação). */
  escuro?: boolean;
}

const ICONES: Record<EstadoPonto, LucideIcon> = {
  normal: CircleCheck,
  alerta: TriangleAlert,
  critico: OctagonX,
  inativo: Archive,
};

/** Cor do ícone por estado: ambar sozinho reprova contraste em fundo claro, os demais valem nos dois contextos. */
const CORES_ICONE: Record<EstadoPonto, { claro: string; escuro: string }> = {
  normal: { claro: cores.musgo, escuro: cores.musgo },
  alerta: { claro: cores.ambarTexto, escuro: cores.ambar },
  critico: { claro: cores.carmim, escuro: cores.carmim },
  inativo: { claro: cores.bruma, escuro: cores.bruma },
};

/** Nunca depende só da cor: o texto ao lado é a alternativa acessível. */
export function PontoEstado({ cor, texto, estado, escuro = false }: PontoEstadoProps) {
  const Icone = estado ? ICONES[estado] : null;

  return (
    <span className="inline-flex items-center gap-2">
      {Icone ? (
        <Icone
          size={13}
          className="flex-shrink-0"
          style={{ color: CORES_ICONE[estado!][escuro ? "escuro" : "claro"] }}
          aria-hidden="true"
        />
      ) : (
        <span
          className="h-[9px] w-[9px] flex-shrink-0 rounded-full"
          style={{ background: cor }}
          aria-hidden="true"
        />
      )}
      {texto && (
        <span className={cn("font-corpo text-xs", escuro ? "text-bruma-luz" : "text-bruma-texto")}>{texto}</span>
      )}
    </span>
  );
}

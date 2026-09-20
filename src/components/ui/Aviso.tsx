import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type TipoAviso = "info" | "alerta" | "erro" | "sucesso";

interface AvisoProps {
  tipo?: TipoAviso;
  titulo: string;
  children?: ReactNode;
  /** Contexto escuro (area de operacao, ex.: tela de login). */
  escuro?: boolean;
}

const estilosBorda: Record<TipoAviso, string> = {
  info: "border-petroleo/30",
  alerta: "border-ambar/40",
  erro: "border-carmim/40",
  sucesso: "border-musgo/40",
};

const fundos: Record<TipoAviso, { claro: string; escuro: string }> = {
  info: { claro: "bg-petroleo/5", escuro: "bg-petroleo/15" },
  alerta: { claro: "bg-ambar/10", escuro: "bg-ambar/15" },
  erro: { claro: "bg-carmim/5", escuro: "bg-carmim/15" },
  sucesso: { claro: "bg-musgo/5", escuro: "bg-musgo/15" },
};

/**
 * petroleo e ambar (DEFAULT) reprovam 3:1 no contexto oposto ao que foram
 * calibrados (petroleo é escuro demais para ícone em fundo escuro, ambar é
 * claro demais para ícone em fundo claro); erro e sucesso passam nos dois.
 */
const coresIcone: Record<TipoAviso, { claro: string; escuro: string }> = {
  info: { claro: "text-petroleo", escuro: "text-petroleo-luz" },
  alerta: { claro: "text-ambar-texto", escuro: "text-ambar" },
  erro: { claro: "text-carmim", escuro: "text-carmim" },
  sucesso: { claro: "text-musgo", escuro: "text-musgo" },
};

const icones: Record<TipoAviso, LucideIcon> = {
  info: Info,
  alerta: AlertTriangle,
  erro: XCircle,
  sucesso: CheckCircle2,
};

export function Aviso({ tipo = "info", titulo, children, escuro = false }: AvisoProps) {
  const Icone = icones[tipo];
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded border p-4",
        estilosBorda[tipo],
        escuro ? fundos[tipo].escuro : fundos[tipo].claro
      )}
    >
      <Icone
        size={18}
        className={cn("mt-0.5 flex-shrink-0", escuro ? coresIcone[tipo].escuro : coresIcone[tipo].claro)}
        aria-hidden="true"
      />
      <div>
        <div className={cn("font-display text-sm font-semibold", escuro ? "text-white" : "text-tinta")}>
          {titulo}
        </div>
        {children && (
          <div className={cn("mt-1 font-corpo text-sm", escuro ? "text-bruma-luz" : "text-bruma-texto")}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

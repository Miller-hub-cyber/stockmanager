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

const coresIcone: Record<TipoAviso, string> = {
  info: "text-petroleo",
  alerta: "text-ambar",
  erro: "text-carmim",
  sucesso: "text-musgo",
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
      <Icone size={18} className={cn("mt-0.5 flex-shrink-0", coresIcone[tipo])} aria-hidden="true" />
      <div>
        <div className={cn("font-display text-sm font-semibold", escuro ? "text-white" : "text-tinta")}>
          {titulo}
        </div>
        {children && <div className="mt-1 font-corpo text-sm text-bruma">{children}</div>}
      </div>
    </div>
  );
}

import { KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { estadoItem } from "@/lib/tokens";
import { quantidade } from "@/lib/formato";
import { PontoEstado } from "./PontoEstado";

interface EtiquetaProps {
  nome: string;
  sku: string;
  saldo: number;
  unidade: string;
  minimo: number;
  pontoPedido: number;
  /** Contexto escuro (área de operação). */
  escuro?: boolean;
  ativo?: boolean;
  onClick?: () => void;
}

/** O elemento de assinatura do StockManager: mesmo formato em qualquer tela. */
export function Etiqueta({
  nome,
  sku,
  saldo,
  unidade,
  minimo,
  pontoPedido,
  escuro = false,
  ativo = false,
  onClick,
}: EtiquetaProps) {
  const estado = estadoItem(saldo, minimo, pontoPedido);

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      onClick();
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? aoTeclar : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "rounded border p-3.5 transition-colors duration-150",
        escuro ? "bg-aco" : "bg-white",
        ativo ? "border-petroleo-claro" : escuro ? "border-grafite" : "border-giz",
        onClick && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "font-display text-base font-semibold leading-tight",
          escuro ? "text-white" : "text-tinta"
        )}
      >
        {nome}
      </div>
      <div className="mt-0.5 font-dado text-denso text-bruma">{sku}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-display text-[34px] font-bold leading-none",
              escuro ? "text-white" : "text-tinta"
            )}
          >
            {quantidade(saldo)}
          </span>
          <span className="font-dado text-denso text-bruma">{unidade}</span>
        </div>
        <PontoEstado cor={estado.cor} texto={estado.texto} />
      </div>
    </div>
  );
}

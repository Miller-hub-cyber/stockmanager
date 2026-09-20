import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ativo?: boolean;
  /** Contexto escuro (área de operação). */
  escuro?: boolean;
  children: ReactNode;
}

export function Chip({ ativo = false, escuro = false, children, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cn(
        "h-12 flex-shrink-0 whitespace-nowrap rounded-full border px-4 font-corpo text-[15px] font-semibold transition-colors duration-150",
        ativo
          ? "border-petroleo bg-petroleo text-white"
          : escuro
            ? "border-bruma bg-aco text-white"
            : "border-bruma bg-white text-tinta",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

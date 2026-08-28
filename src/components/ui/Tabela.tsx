import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div role="table" className="overflow-auto rounded border border-giz bg-white">
      <div className="min-w-fit">{children}</div>
    </div>
  );
}

export function TabelaCabecalho({ children }: { children: ReactNode }) {
  return (
    <div role="row" className="sticky top-0 z-10 flex h-10 items-center border-b border-giz bg-nevoa px-3.5">
      {children}
    </div>
  );
}

export function TabelaLinha({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="row" className={cn("flex h-11 items-center border-b border-giz px-3.5 last:border-b-0", className)}>
      {children}
    </div>
  );
}

interface TabelaCelulaProps {
  children: ReactNode;
  align?: "esquerda" | "direita";
  mono?: boolean;
  cabecalho?: boolean;
  className?: string;
}

export function TabelaCelula({
  children,
  align = "esquerda",
  mono = false,
  cabecalho = false,
  className,
}: TabelaCelulaProps) {
  return (
    <div
      role={cabecalho ? "columnheader" : "cell"}
      className={cn(
        "flex-1 truncate px-1",
        align === "direita" && "text-right",
        mono ? "font-dado" : "font-corpo",
        cabecalho
          ? "font-display text-[11px] font-semibold uppercase tracking-[0.06em] text-bruma"
          : "text-sm text-tinta",
        className
      )}
    >
      {children}
    </div>
  );
}

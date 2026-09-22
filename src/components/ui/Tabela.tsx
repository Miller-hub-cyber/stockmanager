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
  // Colunas de largura fixa vêm com "w-[Npx] flex-none" no className do chamador.
  // Só aplicamos flex-1 (coluna flexível) quando a coluna não define sua própria largura,
  // senão as duas regras de "flex" disputam a mesma propriedade e o alinhamento quebra.
  const larguraFixa = className?.includes("flex-none") ?? false;
  return (
    <div
      role={cabecalho ? "columnheader" : "cell"}
      className={cn(
        "truncate px-1",
        !larguraFixa && "min-w-0 flex-1",
        align === "direita" && "text-right",
        mono ? "font-dado" : "font-corpo",
        cabecalho
          ? "font-display text-[11px] font-semibold uppercase tracking-[0.06em] text-bruma-texto"
          : "text-sm text-tinta",
        className
      )}
    >
      {children}
    </div>
  );
}

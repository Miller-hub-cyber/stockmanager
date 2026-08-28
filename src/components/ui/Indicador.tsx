import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TomIndicador = "normal" | "alerta" | "erro" | "sucesso";

interface IndicadorProps {
  rotulo: string;
  valor: ReactNode;
  sub?: string;
  tom?: TomIndicador;
}

const coresValor: Record<TomIndicador, string> = {
  normal: "text-tinta",
  alerta: "text-ambar",
  erro: "text-carmim",
  sucesso: "text-musgo",
};

/** Card de número do painel de gestão. */
export function Indicador({ rotulo, valor, sub, tom = "normal" }: IndicadorProps) {
  return (
    <div className="rounded border border-giz bg-white p-[18px]">
      <div className="font-display text-rotulo uppercase text-bruma">{rotulo}</div>
      <div className={cn("mt-2 font-display text-[30px] font-bold leading-none", coresValor[tom])}>
        {valor}
      </div>
      {sub && <div className="mt-1.5 font-corpo text-xs text-bruma">{sub}</div>}
    </div>
  );
}

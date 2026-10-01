"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCaminhoOtimista } from "@/lib/useCaminhoOtimista";

const ABAS = [
  { href: "/operacao/saida", rotulo: "Saída", Icone: TrendingDown },
  { href: "/operacao/entrada", rotulo: "Entrada", Icone: TrendingUp },
  { href: "/operacao/consulta", rotulo: "Consulta", Icone: Search },
];

export function AbasOperacao() {
  const [caminho, marcarDestino] = useCaminhoOtimista();
  const ativo = ABAS.findIndex(({ href }) => caminho.startsWith(href));

  return (
    <div className="relative flex flex-shrink-0 border-b border-grafite bg-aco">
      {/* Um só indicador para as abas: desliza até a aba tocada. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 bg-white/5 transition-[transform,opacity] duration-300 ease-mola",
          ativo < 0 && "opacity-0"
        )}
        style={{ width: `${100 / ABAS.length}%`, transform: `translateX(${Math.max(ativo, 0) * 100}%)` }}
      >
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-laranja" />
      </span>

      {ABAS.map(({ href, rotulo, Icone }, indice) => {
        const selecionado = indice === ativo;
        return (
          <Link
            key={href}
            href={href}
            onClick={(evento) => marcarDestino(evento, href)}
            aria-current={selecionado ? "page" : undefined}
            className={cn(
              "group relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 font-display text-rotulo uppercase transition-colors duration-150",
              selecionado ? "text-white" : "text-bruma-luz"
            )}
          >
            <Icone
              size={19}
              strokeWidth={2.3}
              className={cn(
                "transition-[color,transform] duration-200 ease-mola group-active:scale-90",
                selecionado && "-translate-y-px text-laranja"
              )}
            />
            {rotulo}
          </Link>
        );
      })}
    </div>
  );
}

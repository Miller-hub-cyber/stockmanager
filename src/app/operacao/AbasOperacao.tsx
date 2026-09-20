"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingDown, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/cn";

const ABAS = [
  { href: "/operacao/saida", rotulo: "Saída", Icone: TrendingDown },
  { href: "/operacao/entrada", rotulo: "Entrada", Icone: TrendingUp },
  { href: "/operacao/consulta", rotulo: "Consulta", Icone: Search },
];

export function AbasOperacao() {
  const pathname = usePathname();

  return (
    <div className="flex flex-shrink-0 border-b border-grafite bg-aco">
      {ABAS.map(({ href, rotulo, Icone }) => {
        const ativo = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 border-b-2 py-2.5 font-display text-rotulo uppercase transition-colors duration-150",
              ativo ? "border-petroleo-claro bg-petroleo/15 text-white" : "border-transparent text-bruma-luz"
            )}
          >
            <Icone size={19} strokeWidth={2.3} />
            {rotulo}
          </Link>
        );
      })}
    </div>
  );
}

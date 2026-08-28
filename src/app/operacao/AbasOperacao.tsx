"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ABAS = [
  { href: "/operacao/saida", rotulo: "Saída" },
  { href: "/operacao/entrada", rotulo: "Entrada" },
  { href: "/operacao/consulta", rotulo: "Consulta" },
];

export function AbasOperacao() {
  const pathname = usePathname();

  return (
    <div className="flex flex-shrink-0 border-b border-grafite">
      {ABAS.map((aba) => {
        const ativo = pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={cn(
              "flex-1 border-b-2 py-3 text-center font-display text-sm font-semibold transition-colors duration-150",
              ativo ? "border-petroleo-claro text-white" : "border-transparent text-bruma"
            )}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, FileBarChart, FolderCog } from "lucide-react";
import { cn } from "@/lib/cn";

const ITENS_MENU = [
  { href: "/gestao", rotulo: "Painel", Icone: LayoutDashboard },
  { href: "/gestao/itens", rotulo: "Itens", Icone: Package },
  { href: "/gestao/compras", rotulo: "Compras", Icone: ShoppingCart },
  { href: "/gestao/relatorios", rotulo: "Relatórios", Icone: FileBarChart },
  { href: "/gestao/cadastros", rotulo: "Cadastros", Icone: FolderCog },
];

export function MenuLateral() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2.5">
      {ITENS_MENU.map(({ href, rotulo, Icone }) => {
        const ativo = href === "/gestao" ? pathname === "/gestao" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-10 items-center gap-3 rounded px-3 font-corpo text-sm transition-colors duration-150",
              ativo ? "bg-petroleo text-white" : "text-bruma-texto hover:bg-white/5"
            )}
          >
            <Icone size={17} />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

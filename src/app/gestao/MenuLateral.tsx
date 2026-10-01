"use client";

import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, FileBarChart, FolderCog } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCaminhoOtimista } from "@/lib/useCaminhoOtimista";

const ITENS_MENU = [
  { href: "/gestao", rotulo: "Painel", Icone: LayoutDashboard },
  { href: "/gestao/itens", rotulo: "Itens", Icone: Package },
  { href: "/gestao/compras", rotulo: "Compras", Icone: ShoppingCart },
  { href: "/gestao/relatorios", rotulo: "Relatórios", Icone: FileBarChart },
  { href: "/gestao/cadastros", rotulo: "Cadastros", Icone: FolderCog },
];

/** Altura do item (h-10) + gap-1: distância que o destaque percorre por item. */
const PASSO_ITEM_PX = 44;

export function MenuLateral() {
  const [caminho, marcarDestino] = useCaminhoOtimista();
  const ativo = ITENS_MENU.findIndex(({ href }) =>
    href === "/gestao" ? caminho === "/gestao" : caminho.startsWith(href)
  );

  return (
    <nav className="relative flex flex-col gap-1 p-2.5">
      {/* Um só destaque para o menu inteiro: desliza até o item escolhido. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-2.5 top-2.5 h-10 rounded bg-white/[0.07] transition-[transform,opacity] duration-300 ease-mola",
          ativo < 0 && "opacity-0"
        )}
        style={{ transform: `translateY(${Math.max(ativo, 0) * PASSO_ITEM_PX}px)` }}
      >
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-sm bg-laranja" />
      </span>

      {ITENS_MENU.map(({ href, rotulo, Icone }, indice) => {
        const selecionado = indice === ativo;
        return (
          <Link
            key={href}
            href={href}
            onClick={(evento) => marcarDestino(evento, href)}
            aria-current={selecionado ? "page" : undefined}
            className={cn(
              "group relative flex h-10 items-center gap-3 rounded px-3 font-corpo text-sm transition-colors duration-150",
              selecionado ? "text-white" : "text-bruma-luz hover:bg-white/5 hover:text-white"
            )}
          >
            <Icone
              size={17}
              className={cn(
                "transition-[color,transform] duration-200 ease-mola group-active:scale-90",
                selecionado && "text-laranja"
              )}
            />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

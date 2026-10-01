import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface CartaoAtalhoProps {
  href: string;
  titulo: string;
  descricao: string;
  Icone: LucideIcon;
  /** Posição na grade: escalona a entrada dos cartões em 30ms cada. */
  indice?: number;
}

/** Cartão de página de menu (Cadastros, Relatórios). */
export function CartaoAtalho({ href, titulo, descricao, Icone, indice = 0 }: CartaoAtalhoProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${indice * 30}ms` }}
      className="group flex animate-entrada items-start gap-3 rounded border border-bruma bg-white p-4 transition-[border-color,transform] duration-150 ease-mola hover:border-cobalto-claro active:scale-[0.99]"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-laranja-fundo transition-colors duration-200 group-hover:bg-laranja group-focus-visible:bg-laranja">
        <Icone
          size={18}
          className="text-laranja-texto transition-colors duration-200 group-hover:text-aco group-focus-visible:text-aco"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm font-semibold text-tinta">{titulo}</div>
        <div className="mt-0.5 font-corpo text-xs text-bruma-texto">{descricao}</div>
      </div>
      <ChevronRight
        size={18}
        aria-hidden="true"
        className="-translate-x-1 self-center text-cobalto opacity-0 transition-[opacity,transform] duration-200 ease-mola group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      />
    </Link>
  );
}

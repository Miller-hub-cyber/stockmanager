import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type VarianteBotao = "primario" | "secundario" | "perigo";
type TamanhoBotao = "padrao" | "grande";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  /** Contexto escuro (área de operação) para a variante secundário. */
  escuro?: boolean;
  carregando?: boolean;
  icone?: ReactNode;
  children: ReactNode;
  /** Quando presente, renderiza como link (Next Link) em vez de button — nunca aninhe Botao dentro de Link. */
  href?: string;
}

const estilosVariante: Record<VarianteBotao, (escuro: boolean) => string> = {
  primario: () => "bg-petroleo text-white hover:bg-petroleo-claro",
  secundario: (escuro) =>
    escuro
      ? "border border-bruma bg-transparent text-white hover:bg-white/5"
      : "border border-bruma bg-transparent text-tinta hover:bg-nevoa",
  perigo: () => "bg-carmim text-white hover:opacity-90",
};

export function Botao({
  variante = "primario",
  tamanho = "padrao",
  escuro = false,
  carregando = false,
  icone,
  children,
  className,
  type = "button",
  disabled,
  href,
  ...props
}: BotaoProps) {
  const classes = cn(
    "flex w-full items-center justify-center gap-2.5 rounded font-display transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
    tamanho === "grande" ? "h-rodape px-5 text-[19px] font-bold tracking-tight" : "h-10 px-4 text-sm font-semibold",
    carregando && "animate-pulse",
    estilosVariante[variante](escuro),
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {icone}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled || carregando} className={classes} {...props}>
      {icone}
      {children}
    </button>
  );
}

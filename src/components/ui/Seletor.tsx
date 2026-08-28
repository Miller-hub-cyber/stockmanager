import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type DensidadeCampo = "operacao" | "gestao";

interface SeletorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo?: string;
  erro?: string;
  densidade?: DensidadeCampo;
}

export const Seletor = forwardRef<HTMLSelectElement, SeletorProps>(function Seletor(
  { rotulo, erro, densidade = "gestao", id, className, children, ...props },
  ref
) {
  const escuro = densidade === "operacao";

  return (
    <div className="flex flex-col gap-2">
      {rotulo && (
        <label htmlFor={id} className="font-display text-rotulo uppercase text-bruma">
          {rotulo}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={Boolean(erro)}
          className={cn(
            "w-full appearance-none rounded border font-corpo outline-none transition-colors duration-150",
            escuro
              ? "h-acao border-grafite bg-aco pl-3.5 pr-10 text-[15px] text-white"
              : "h-[42px] border-giz bg-white pl-3 pr-9 text-sm text-tinta",
            erro && "border-carmim",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-bruma"
          aria-hidden="true"
        />
      </div>
      {erro && <span className="text-xs text-carmim">{erro}</span>}
    </div>
  );
});

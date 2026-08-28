import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type DensidadeCampo = "operacao" | "gestao";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string;
  erro?: string;
  dica?: string;
  densidade?: DensidadeCampo;
}

export const Campo = forwardRef<HTMLInputElement, CampoProps>(function Campo(
  { rotulo, erro, dica, densidade = "gestao", id, className, ...props },
  ref
) {
  const escuro = densidade === "operacao";
  const idErro = id && erro ? `${id}-erro` : undefined;
  const idDica = id && dica ? `${id}-dica` : undefined;

  return (
    <div className="flex flex-col gap-2">
      {rotulo && (
        <label htmlFor={id} className="font-display text-rotulo uppercase text-bruma">
          {rotulo}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(erro)}
        aria-describedby={idErro ?? idDica}
        className={cn(
          "rounded border font-corpo outline-none transition-colors duration-150",
          escuro
            ? "h-acao border-grafite bg-aco px-3.5 text-[15px] text-white placeholder:text-bruma"
            : "h-[42px] border-giz bg-white px-3 text-sm text-tinta placeholder:text-bruma",
          erro && "border-carmim",
          className
        )}
        {...props}
      />
      {erro && (
        <span id={idErro} className="text-xs text-carmim">
          {erro}
        </span>
      )}
      {!erro && dica && (
        <span id={idDica} className="text-xs text-bruma">
          {dica}
        </span>
      )}
    </div>
  );
});

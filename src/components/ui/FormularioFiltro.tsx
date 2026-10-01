"use client";

import { useTransition, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

interface FormularioFiltroProps {
  children: ReactNode;
  className?: string;
}

/**
 * Filtro por querystring que navega pelo roteador do Next em vez de recarregar
 * a página inteira. Sem JavaScript continua sendo um GET comum.
 * Enquanto a nova página não chega, `data-pendente` esmaece o resultado logo
 * abaixo do formulário (regra em globals.css).
 */
export function FormularioFiltro({ children, className }: FormularioFiltroProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendente, iniciarTransicao] = useTransition();

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const parametros = new URLSearchParams();
    new FormData(evento.currentTarget).forEach((valor, chave) => {
      if (typeof valor === "string" && valor !== "") parametros.append(chave, valor);
    });
    const busca = parametros.toString();
    iniciarTransicao(() => router.push(busca ? `${pathname}?${busca}` : pathname, { scroll: false }));
  }

  return (
    <form
      method="get"
      onSubmit={aoEnviar}
      aria-busy={pendente}
      data-pendente={pendente || undefined}
      className={className}
    >
      {children}
    </form>
  );
}

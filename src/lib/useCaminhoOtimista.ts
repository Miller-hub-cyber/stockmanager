"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";

/**
 * Caminho atual, adiantado para o destino do último clique em link.
 * A navegação marca a aba/menu como ativo no toque, sem esperar a resposta do
 * servidor; quando a rota de fato muda, volta a valer o pathname real.
 */
export function useCaminhoOtimista() {
  const pathname = usePathname();
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    setDestino(null);
  }, [pathname]);

  function marcarDestino(evento: MouseEvent<HTMLAnchorElement>, href: string) {
    // Ctrl/Cmd/Shift + clique abre em outra aba: a tela atual não muda.
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey || evento.button !== 0) return;
    setDestino(href);
  }

  return [destino ?? pathname, marcarDestino] as const;
}

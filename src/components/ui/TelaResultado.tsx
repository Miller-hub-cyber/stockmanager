"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Botao } from "./Botao";

export interface ResultadoOperacao {
  ok: boolean;
  titulo: string;
  detalhe: string;
}

interface TelaResultadoProps {
  resultado: ResultadoOperacao | null;
  aoFechar: () => void;
}

/**
 * Confirmação em tela cheia. Sucesso fecha sozinho em 1,4s; erro exige
 * confirmação manual porque o almoxarife precisa registrar o que houve.
 */
export function TelaResultado({ resultado, aoFechar }: TelaResultadoProps) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!resultado) {
      setVisivel(false);
      return;
    }
    const quadro = requestAnimationFrame(() => setVisivel(true));
    if (!resultado.ok) return () => cancelAnimationFrame(quadro);

    const fechar = setTimeout(aoFechar, 1400);
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(fechar);
    };
  }, [resultado, aoFechar]);

  if (!resultado) return null;

  return (
    <div
      role={resultado.ok ? "status" : "alert"}
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center transition-all duration-200 ease-out",
        resultado.ok ? "bg-musgo" : "bg-carmim",
        visivel ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
      )}
    >
      {resultado.ok ? (
        <Check size={64} color="#fff" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <AlertTriangle size={64} color="#fff" strokeWidth={2.5} aria-hidden="true" />
      )}
      <div className="mt-5 font-display text-[28px] font-bold leading-tight text-white">
        {resultado.titulo}
      </div>
      <div className="mt-2.5 max-w-[380px] font-corpo text-base text-white/90">{resultado.detalhe}</div>
      {!resultado.ok && (
        <div className="mt-7 w-[200px]">
          <Botao variante="secundario" escuro onClick={aoFechar}>
            Entendi
          </Botao>
        </div>
      )}
    </div>
  );
}

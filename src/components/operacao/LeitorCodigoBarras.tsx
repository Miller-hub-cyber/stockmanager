"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X } from "lucide-react";

interface LeitorCodigoBarrasProps {
  onDetectado: (codigo: string) => void;
  onFechar: () => void;
}

/**
 * Camera continua ate detectar um codigo ou o usuario fechar. Nao ha como
 * testar leitura real de camera neste ambiente — a integracao segue a API
 * documentada do @zxing/browser, mas precisa de verificacao manual em um
 * navegador de verdade antes de confiar no fluxo em producao.
 */
export function LeitorCodigoBarras({ onDetectado, onFechar }: LeitorCodigoBarrasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const leitor = new BrowserMultiFormatReader();
    let cancelado = false;
    let controlesAtivos: { stop: () => void } | null = null;

    leitor
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (resultado, _erro, controles) => {
        if (resultado) {
          controles.stop();
          onDetectado(resultado.getText());
        }
      })
      .then((controles) => {
        if (cancelado) {
          controles.stop();
          return;
        }
        controlesAtivos = controles;
      })
      .catch(() => {
        if (!cancelado) setErro("Nao foi possivel acessar a camera. Verifique a permissao do navegador.");
      });

    return () => {
      cancelado = true;
      controlesAtivos?.stop();
    };
  }, [onDetectado]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-white">
          Escanear código
        </span>
        <button onClick={onFechar} aria-label="Fechar leitor" className="text-white">
          <X size={22} />
        </button>
      </div>
      <div className="mt-4 w-full max-w-md overflow-hidden rounded border border-grafite">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} className="w-full" muted playsInline />
      </div>
      {erro ? (
        <p className="mt-4 max-w-md text-center font-corpo text-sm text-carmim">{erro}</p>
      ) : (
        <p className="mt-4 max-w-md text-center font-corpo text-sm text-bruma-luz">
          Aponte a câmera para o código de barras do item.
        </p>
      )}
    </div>
  );
}

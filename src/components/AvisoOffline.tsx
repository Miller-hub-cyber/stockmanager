"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Sem sincronizacao offline: so avisa. Registrar entrada/saida exige rede
 * (Server Action), entao a alternativa seria fingir que funciona e perder o
 * dado — pior do que so avisar que a operacao vai aguardar conexao.
 */
export function AvisoOffline() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const aoFicarOffline = () => setOffline(true);
    const aoFicarOnline = () => setOffline(false);
    window.addEventListener("offline", aoFicarOffline);
    window.addEventListener("online", aoFicarOnline);
    return () => {
      window.removeEventListener("offline", aoFicarOffline);
      window.removeEventListener("online", aoFicarOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-carmim px-4 py-2 text-center font-corpo text-xs text-white">
      <WifiOff size={14} aria-hidden="true" />
      Sem conexão. Consultas podem estar desatualizadas; operações de estoque aguardam conexão para serem enviadas.
    </div>
  );
}

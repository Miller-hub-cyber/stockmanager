"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { estornarMovimentacao } from "@/actions/estornarMovimentacao";

export function BotaoEstornar({ movimentacaoId }: { movimentacaoId: string }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function aoClicar() {
    if (!window.confirm("Estornar esta movimentação? Isso cria um lançamento inverso.")) return;
    setEnviando(true);
    setErro(null);
    const resultado = await estornarMovimentacao(movimentacaoId);
    setEnviando(false);
    if (!resultado.sucesso) {
      setErro(resultado.erro ?? "Não foi possível estornar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={aoClicar}
        disabled={enviando}
        className="font-corpo text-xs text-carmim hover:underline disabled:opacity-50"
      >
        {enviando ? "Estornando..." : "Estornar"}
      </button>
      {erro && <span className="max-w-[160px] text-right font-corpo text-[11px] text-carmim">{erro}</span>}
    </div>
  );
}

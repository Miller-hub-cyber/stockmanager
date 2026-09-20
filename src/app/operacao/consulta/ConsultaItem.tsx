"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Etiqueta } from "@/components/ui";
import { BuscaItem, type ItemComSaldo } from "@/components/operacao/BuscaItem";

export function ConsultaItem({ depositoId }: { depositoId: string }) {
  const [selecionado, setSelecionado] = useState<ItemComSaldo | null>(null);

  if (selecionado) {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setSelecionado(null)}
          className="flex items-center gap-1.5 self-start font-corpo text-sm text-bruma-luz"
        >
          <ArrowLeft size={16} /> Buscar outro item
        </button>
        <Etiqueta
          nome={selecionado.nome}
          sku={selecionado.sku}
          saldo={selecionado.saldo}
          unidade={selecionado.unidade}
          minimo={selecionado.estoqueMinimo}
          pontoPedido={selecionado.pontoPedido}
          escuro
          ativo
        />
      </div>
    );
  }

  return <BuscaItem depositoId={depositoId} onSelecionar={setSelecionado} />;
}

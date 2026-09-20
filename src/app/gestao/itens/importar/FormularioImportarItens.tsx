"use client";

import { useFormState, useFormStatus } from "react-dom";
import { importarItens, type ResultadoImportacao } from "@/actions/importarItens";
import { Botao, Seletor, Aviso } from "@/components/ui";

const ESTADO_INICIAL: ResultadoImportacao = { sucesso: false };

interface Deposito {
  id: string;
  nome: string;
}

function BotaoImportar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Importando..." : "Importar"}
    </Botao>
  );
}

export function FormularioImportarItens({ depositos }: { depositos: Deposito[] }) {
  const [estado, acao] = useFormState(importarItens, ESTADO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Seletor id="depositoId" name="depositoId" rotulo="Depósito de destino do saldo inicial" required>
        <option value="">Selecione...</option>
        {depositos.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nome}
          </option>
        ))}
      </Seletor>

      <div className="flex flex-col gap-2">
        <label htmlFor="arquivo" className="font-display text-rotulo uppercase text-bruma-texto">
          Arquivo CSV
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept=".csv,text/csv"
          required
          className="block w-full font-corpo text-sm text-tinta file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-petroleo file:px-4 file:py-2 file:font-display file:text-sm file:font-semibold file:text-white hover:file:bg-petroleo-claro"
        />
      </div>

      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}

      {estado.total !== undefined && (
        <Aviso
          tipo={estado.comErro && estado.comErro.length > 0 ? "alerta" : "sucesso"}
          titulo={`${estado.criados} de ${estado.total} itens importados`}
        >
          {estado.comErro && estado.comErro.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {estado.comErro.map((e, idx) => (
                <li key={idx}>
                  Linha {e.linha} ({e.identificador || "sem SKU"}): {e.motivo}
                </li>
              ))}
            </ul>
          )}
        </Aviso>
      )}

      <div className="w-40">
        <BotaoImportar />
      </div>
    </form>
  );
}

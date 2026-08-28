"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarCentroCusto } from "@/actions/criarCentroCusto";
import { atualizarCentroCusto } from "@/actions/atualizarCentroCusto";
import { Campo, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface CentroCusto {
  id: string;
  nome: string;
  codigo: string | null;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioCentroCusto({ centro }: { centro?: CentroCusto }) {
  const acao = centro ? atualizarCentroCusto.bind(null, centro.id) : criarCentroCusto;
  const [estado, formAction] = useFormState(acao, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Campo id="nome" name="nome" rotulo="Nome" defaultValue={centro?.nome} required />
      <Campo id="codigo" name="codigo" rotulo="Código (opcional)" defaultValue={centro?.codigo ?? ""} />
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      <div className="w-40">
        <BotaoSalvar />
      </div>
    </form>
  );
}

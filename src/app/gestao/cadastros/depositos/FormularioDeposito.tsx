"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarDeposito } from "@/actions/criarDeposito";
import { atualizarDeposito } from "@/actions/atualizarDeposito";
import { Campo, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface Deposito {
  id: string;
  nome: string;
  descricao: string | null;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioDeposito({ deposito }: { deposito?: Deposito }) {
  const acao = deposito ? atualizarDeposito.bind(null, deposito.id) : criarDeposito;
  const [estado, formAction] = useFormState(acao, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Campo id="nome" name="nome" rotulo="Nome" defaultValue={deposito?.nome} required />
      <Campo
        id="descricao"
        name="descricao"
        rotulo="Descrição (opcional)"
        defaultValue={deposito?.descricao ?? ""}
      />
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      <div className="w-40">
        <BotaoSalvar />
      </div>
    </form>
  );
}

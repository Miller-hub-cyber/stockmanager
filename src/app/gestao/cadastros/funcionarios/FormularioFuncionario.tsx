"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarFuncionario } from "@/actions/criarFuncionario";
import { atualizarFuncionario } from "@/actions/atualizarFuncionario";
import { Campo, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface Funcionario {
  id: string;
  nome: string;
  matricula: string | null;
  funcao: string | null;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioFuncionario({ funcionario }: { funcionario?: Funcionario }) {
  const acao = funcionario ? atualizarFuncionario.bind(null, funcionario.id) : criarFuncionario;
  const [estado, formAction] = useFormState(acao, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Campo id="nome" name="nome" rotulo="Nome" defaultValue={funcionario?.nome} required />
      <Campo
        id="matricula"
        name="matricula"
        rotulo="Matrícula (opcional)"
        defaultValue={funcionario?.matricula ?? ""}
      />
      <Campo id="funcao" name="funcao" rotulo="Função (opcional)" defaultValue={funcionario?.funcao ?? ""} />
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      <div className="w-40">
        <BotaoSalvar />
      </div>
    </form>
  );
}

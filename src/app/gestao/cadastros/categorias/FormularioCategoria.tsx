"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarCategoria } from "@/actions/criarCategoria";
import { atualizarCategoria } from "@/actions/atualizarCategoria";
import { Campo, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface Categoria {
  id: string;
  nome: string;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioCategoria({ categoria }: { categoria?: Categoria }) {
  const acao = categoria ? atualizarCategoria.bind(null, categoria.id) : criarCategoria;
  const [estado, formAction] = useFormState(acao, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Campo id="nome" name="nome" rotulo="Nome da categoria" defaultValue={categoria?.nome} required />
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      <div className="w-40">
        <BotaoSalvar />
      </div>
    </form>
  );
}

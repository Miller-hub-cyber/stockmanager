"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarFornecedor } from "@/actions/criarFornecedor";
import { atualizarFornecedor } from "@/actions/atualizarFornecedor";
import { Campo, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  prazo_entrega_dias: number;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioFornecedor({ fornecedor }: { fornecedor?: Fornecedor }) {
  const acao = fornecedor ? atualizarFornecedor.bind(null, fornecedor.id) : criarFornecedor;
  const [estado, formAction] = useFormState(acao, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Campo id="nome" name="nome" rotulo="Nome" defaultValue={fornecedor?.nome} required />
      <div className="grid grid-cols-2 gap-4">
        <Campo id="cnpj" name="cnpj" rotulo="CNPJ (opcional)" defaultValue={fornecedor?.cnpj ?? ""} />
        <Campo
          id="telefone"
          name="telefone"
          rotulo="Telefone (opcional)"
          defaultValue={fornecedor?.telefone ?? ""}
        />
      </div>
      <Campo id="email" name="email" type="email" rotulo="E-mail (opcional)" defaultValue={fornecedor?.email ?? ""} />
      <Campo
        id="prazoEntregaDias"
        name="prazoEntregaDias"
        type="number"
        rotulo="Prazo médio de entrega (dias)"
        defaultValue={fornecedor?.prazo_entrega_dias ?? 7}
        min={0}
      />
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      <div className="w-40">
        <BotaoSalvar />
      </div>
    </form>
  );
}

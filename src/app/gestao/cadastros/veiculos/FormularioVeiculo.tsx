"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarVeiculo } from "@/actions/criarVeiculo";
import { atualizarVeiculo } from "@/actions/atualizarVeiculo";
import { Campo, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface Veiculo {
  id: string;
  placa: string;
  modelo: string | null;
  ano: number | null;
  km_atual: number;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioVeiculo({ veiculo }: { veiculo?: Veiculo }) {
  const acao = veiculo ? atualizarVeiculo.bind(null, veiculo.id) : criarVeiculo;
  const [estado, formAction] = useFormState(acao, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Campo id="placa" name="placa" rotulo="Placa" defaultValue={veiculo?.placa} required />
      <Campo id="modelo" name="modelo" rotulo="Modelo (opcional)" defaultValue={veiculo?.modelo ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <Campo id="ano" name="ano" type="number" rotulo="Ano (opcional)" defaultValue={veiculo?.ano ?? ""} />
        <Campo
          id="kmAtual"
          name="kmAtual"
          type="number"
          rotulo="Quilometragem atual"
          defaultValue={veiculo?.km_atual ?? 0}
          min={0}
        />
      </div>
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      <div className="w-40">
        <BotaoSalvar />
      </div>
    </form>
  );
}

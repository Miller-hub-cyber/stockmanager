"use client";

import { useFormState, useFormStatus } from "react-dom";
import { vincularUsuario } from "@/actions/vincularUsuario";
import { Campo, Botao, Aviso, Seletor } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";
import { PERFIS } from "@/lib/perfil";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

function BotaoLiberar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Liberando..." : "Liberar acesso"}
    </Botao>
  );
}

export function FormularioUsuario() {
  const [estado, formAction] = useFormState(vincularUsuario, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Campo id="nome" name="nome" rotulo="Nome" required />
        <Campo id="email" name="email" type="email" rotulo="E-mail do login" required />
        <Seletor id="perfil" name="perfil" rotulo="Perfil" defaultValue="almoxarife">
          {PERFIS.map(({ valor, rotulo }) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </Seletor>
      </div>
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      {estado.sucesso && <Aviso tipo="sucesso" titulo="Acesso liberado." />}
      <div className="w-44">
        <BotaoLiberar />
      </div>
    </form>
  );
}

"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type EstadoLogin } from "@/actions/login";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";

const ESTADO_INICIAL: EstadoLogin = { erro: null };

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" tamanho="grande" carregando={pending} escuro>
      {pending ? "Entrando..." : "Entrar"}
    </Botao>
  );
}

export function FormularioLogin() {
  const [estado, acao] = useFormState(login, ESTADO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo
        id="email"
        name="email"
        type="email"
        rotulo="E-mail"
        placeholder="voce@empresa.com.br"
        densidade="operacao"
        autoComplete="username"
        required
      />
      <Campo
        id="senha"
        name="senha"
        type="password"
        rotulo="Senha"
        densidade="operacao"
        autoComplete="current-password"
        required
      />
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} escuro />}
      <BotaoEntrar />
    </form>
  );
}

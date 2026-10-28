"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { primeiroAcesso, type EstadoPrimeiroAcesso } from "@/actions/primeiroAcesso";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";

const ESTADO_INICIAL: EstadoPrimeiroAcesso = { erro: null };

function BotaoCriar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" tamanho="grande" carregando={pending} escuro>
      {pending ? "Criando acesso..." : "Criar meu acesso"}
    </Botao>
  );
}

export function FormularioPrimeiroAcesso() {
  const [estado, acao] = useFormState(primeiroAcesso, ESTADO_INICIAL);

  if (estado.confirmarEmail) {
    return (
      <div className="flex flex-col gap-4">
        <Aviso tipo="sucesso" titulo="Acesso criado" escuro>
          Enviamos um e-mail de confirmação. Abra o link do e-mail e depois entre com sua senha.
        </Aviso>
        <Botao href="/login" tamanho="grande" escuro>
          Ir para o login
        </Botao>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo
        id="email"
        name="email"
        type="email"
        rotulo="E-mail"
        placeholder="O mesmo e-mail do convite"
        densidade="operacao"
        autoComplete="username"
        required
      />
      <Campo
        id="codigo"
        name="codigo"
        rotulo="Código do convite"
        placeholder="0000-0000"
        densidade="operacao"
        autoComplete="off"
        autoCapitalize="characters"
        className="font-dado uppercase tracking-widest"
        required
      />
      <Campo
        id="senha"
        name="senha"
        type="password"
        rotulo="Crie uma senha"
        dica="Mínimo de 8 caracteres."
        densidade="operacao"
        autoComplete="new-password"
        required
      />
      <Campo
        id="confirmacao"
        name="confirmacao"
        type="password"
        rotulo="Repita a senha"
        densidade="operacao"
        autoComplete="new-password"
        required
      />
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} escuro />}
      <BotaoCriar />
      <Link href="/login" className="text-center font-corpo text-sm text-bruma-luz hover:text-white">
        Já tenho acesso
      </Link>
    </form>
  );
}

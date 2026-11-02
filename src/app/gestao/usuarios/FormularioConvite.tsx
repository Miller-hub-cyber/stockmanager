"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Copy, Check } from "lucide-react";
import { convidarUsuario, type ResultadoConvite } from "@/actions/convidarUsuario";
import { Campo, Seletor, Botao, Aviso } from "@/components/ui";
import { PERFIS } from "./perfis";

const ESTADO_INICIAL: ResultadoConvite = { sucesso: false };

/** "7F3A9C21" vira "7F3A-9C21": mais facil de ditar e digitar. */
const formatarCodigo = (codigo: string) => `${codigo.slice(0, 4)}-${codigo.slice(4)}`;

function BotaoGerar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Gerando..." : "Gerar convite"}
    </Botao>
  );
}

export function FormularioConvite({ enderecoApp }: { enderecoApp: string }) {
  const [estado, formAction] = useActionState(convidarUsuario, ESTADO_INICIAL);
  const [copiado, setCopiado] = useState(false);

  const convite = estado.sucesso ? estado.convite : undefined;
  const mensagem = convite
    ? `Olá, ${convite.nome.split(" ")[0]}! Seu acesso ao StockManager foi liberado.\n` +
      `1. Abra ${enderecoApp}/primeiro-acesso\n` +
      `2. Use o e-mail ${convite.email} e o código ${formatarCodigo(convite.codigo)}\n` +
      `3. Crie sua senha. O código vale por 7 dias.`
    : "";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissao de area de transferencia: o texto continua visivel para copiar a mao.
    }
  }

  // Codigo acima do formulario: o formulario e limpo apos o envio, e com o
  // codigo embaixo do botao parecia que nada tinha acontecido.
  return (
    <div className="flex flex-col gap-4">
      {convite && (
        <div className="rounded border border-giz bg-nevoa p-4">
          <p className="font-display text-rotulo uppercase text-bruma-texto">Código de {convite.nome}</p>
          <p className="mt-1 font-dado text-2xl font-bold tracking-widest text-tinta">
            {formatarCodigo(convite.codigo)}
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-corpo text-xs text-tinta">{mensagem}</pre>
          <div className="mt-3">
            <Botao type="button" variante="secundario" onClick={copiar} icone={copiado ? <Check size={16} /> : <Copy size={16} />}>
              {copiado ? "Copiado" : "Copiar mensagem"}
            </Botao>
          </div>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <Campo id="nome" name="nome" rotulo="Nome" required />
        <Campo id="email" name="email" type="email" rotulo="E-mail" required />
        <Seletor id="perfil" name="perfil" rotulo="Perfil" defaultValue="almoxarife">
          {PERFIS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo} — {p.descricao}
            </option>
          ))}
        </Seletor>
        {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
        <BotaoGerar />
      </form>
    </div>
  );
}

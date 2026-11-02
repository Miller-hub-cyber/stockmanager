"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { alterarUsuario } from "@/actions/alterarUsuario";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";
import type { PerfilUsuario } from "@/lib/perfil";
import { cn } from "@/lib/cn";
import { PERFIS, rotuloPerfil } from "./perfis";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface LinhaUsuarioProps {
  usuario: { id: string; nome: string; email: string; perfil: PerfilUsuario; ativo: boolean };
  /** O admin logado nao altera a si mesmo (fn_alterar_usuario recusa). */
  ehVoce: boolean;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-corpo text-sm font-semibold text-cobalto hover:underline disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

const estiloSeletor = "h-9 rounded border border-bruma bg-white px-2 font-corpo text-sm text-tinta";

export function LinhaUsuario({ usuario, ehVoce }: LinhaUsuarioProps) {
  const [estado, formAction] = useActionState(alterarUsuario.bind(null, usuario.id), ESTADO_INICIAL);

  return (
    <form
      action={formAction}
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-giz px-5 py-3 last:border-b-0",
        !usuario.ativo && "bg-nevoa"
      )}
    >
      <div className="min-w-[200px] flex-1">
        <div className={cn("font-corpo text-sm font-semibold", usuario.ativo ? "text-tinta" : "text-bruma-texto")}>
          {usuario.nome}
          {ehVoce && <span className="ml-2 font-normal text-bruma-texto">(você)</span>}
        </div>
        <div className="font-corpo text-xs text-bruma-texto">{usuario.email}</div>
      </div>

      {ehVoce ? (
        <span className="font-corpo text-sm text-tinta">{rotuloPerfil(usuario.perfil)}</span>
      ) : (
        <>
          <select name="perfil" defaultValue={usuario.perfil} aria-label="Perfil" className={estiloSeletor}>
            {PERFIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
          <select name="ativo" defaultValue={usuario.ativo ? "sim" : "nao"} aria-label="Situação" className={estiloSeletor}>
            <option value="sim">Ativo</option>
            <option value="nao">Desativado</option>
          </select>
          <BotaoSalvar />
        </>
      )}

      {estado.erro && <p className="w-full font-corpo text-xs text-carmim-texto">{estado.erro}</p>}
      {estado.sucesso && <p className="w-full font-corpo text-xs text-musgo-texto">Alteração salva.</p>}
    </form>
  );
}

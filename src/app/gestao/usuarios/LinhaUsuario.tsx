"use client";

import { useFormState } from "react-dom";
import { atualizarUsuario } from "@/actions/atualizarUsuario";
import { Botao, BotaoConfirmar, PontoEstado, Seletor, TabelaCelula, TabelaLinha } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";
import { PERFIS, rotuloPerfil, type PerfilUsuario } from "@/lib/perfil";
import { cores } from "@/lib/tokens";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export function LinhaUsuario({ usuario, proprio }: { usuario: Usuario; proprio: boolean }) {
  const [estado, formAction] = useFormState(atualizarUsuario.bind(null, usuario.id), ESTADO_INICIAL);

  return (
    <TabelaLinha>
      <TabelaCelula>
        {usuario.nome}
        {estado.erro && <span className="mt-1 block text-xs text-carmim">{estado.erro}</span>}
      </TabelaCelula>
      <TabelaCelula className="text-bruma-texto">{usuario.email}</TabelaCelula>
      <TabelaCelula className="w-[300px] flex-none">
        {proprio ? (
          <span className="text-bruma-texto">{rotuloPerfil(usuario.perfil)} (você)</span>
        ) : (
          <form action={formAction} className="flex items-center gap-3">
            <input type="hidden" name="ativo" value={String(usuario.ativo)} />
            <div className="w-40">
              <Seletor name="perfil" aria-label={`Perfil de ${usuario.nome}`} defaultValue={usuario.perfil}>
                {PERFIS.map(({ valor, rotulo }) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </Seletor>
            </div>
            <Botao type="submit" variante="secundario" tamanho="texto">
              Salvar
            </Botao>
          </form>
        )}
      </TabelaCelula>
      <TabelaCelula align="direita" className="w-[100px] flex-none">
        <PontoEstado
          cor={usuario.ativo ? cores.musgo : cores.bruma}
          texto={usuario.ativo ? "Ativo" : "Inativo"}
          estado={usuario.ativo ? "normal" : "inativo"}
        />
      </TabelaCelula>
      <TabelaCelula align="direita" className="w-[120px] flex-none">
        {!proprio && (
          <form action={formAction}>
            <input type="hidden" name="perfil" value={usuario.perfil} />
            <input type="hidden" name="ativo" value={String(!usuario.ativo)} />
            {usuario.ativo ? (
              <BotaoConfirmar mensagem={`Desativar o acesso de ${usuario.nome}?`}>Desativar</BotaoConfirmar>
            ) : (
              <Botao type="submit" variante="secundario" tamanho="texto">
                Reativar
              </Botao>
            )}
          </form>
        )}
      </TabelaCelula>
    </TabelaLinha>
  );
}

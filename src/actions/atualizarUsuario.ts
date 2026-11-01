"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esquemaAtualizarUsuario } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

export async function atualizarUsuario(
  id: string,
  _estado: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (usuario.perfil !== "admin") {
    return { sucesso: false, erro: "Voce nao tem permissao para esta acao." };
  }

  const validado = esquemaAtualizarUsuario.safeParse({
    perfil: formData.get("perfil"),
    ativo: formData.get("ativo"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_atualizar_usuario", {
    p_usuario_id: id,
    p_perfil: validado.data.perfil,
    p_ativo: validado.data.ativo === "true",
  });
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };

  revalidatePath("/gestao/usuarios");
  return { sucesso: true };
}

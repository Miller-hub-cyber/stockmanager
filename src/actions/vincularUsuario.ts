"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esquemaVincularUsuario } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";

export async function vincularUsuario(_estado: ResultadoAcao, formData: FormData): Promise<ResultadoAcao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (usuario.perfil !== "admin") {
    return { sucesso: false, erro: "Voce nao tem permissao para esta acao." };
  }

  const validado = esquemaVincularUsuario.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    perfil: formData.get("perfil"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_vincular_usuario", {
    p_email: validado.data.email,
    p_nome: validado.data.nome,
    p_perfil: validado.data.perfil,
  });
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };

  revalidatePath("/gestao/usuarios");
  return { sucesso: true };
}

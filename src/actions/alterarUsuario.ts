"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esquemaAlterarUsuario } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { exigirAdmin, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function alterarUsuario(
  id: string,
  _estado: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const acesso = await exigirAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaAlterarUsuario.safeParse({
    perfil: formData.get("perfil"),
    ativo: formData.get("ativo") === "sim",
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("fn_alterar_usuario", {
    p_usuario_id: id,
    p_perfil: validado.data.perfil,
    p_ativo: validado.data.ativo,
  });
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };

  revalidatePath("/gestao/usuarios");
  return { sucesso: true };
}

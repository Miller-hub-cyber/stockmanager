"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esquemaConvite } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { exigirAdmin } from "@/lib/acoes-cadastro";

export interface ResultadoConvite {
  sucesso: boolean;
  erro?: string;
  convite?: { nome: string; email: string; codigo: string };
}

export async function convidarUsuario(_estado: ResultadoConvite, formData: FormData): Promise<ResultadoConvite> {
  const acesso = await exigirAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaConvite.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    perfil: formData.get("perfil"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();
  const { data: codigo, error } = await supabase.rpc("fn_convidar_usuario", {
    p_nome: validado.data.nome,
    p_email: validado.data.email,
    p_perfil: validado.data.perfil,
  });
  if (error || !codigo) return { sucesso: false, erro: traduzirErro(error?.message ?? "") };

  revalidatePath("/gestao/usuarios");
  return { sucesso: true, convite: { nome: validado.data.nome, email: validado.data.email, codigo } };
}

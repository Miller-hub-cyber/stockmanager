"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esquemaLogin } from "@/lib/validacao";
import { traduzirErroAuth } from "@/lib/formato";
import { destinoPorPerfil } from "@/lib/perfil";

export interface EstadoLogin {
  erro: string | null;
}

export async function login(_estado: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const validado = esquemaLogin.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();

  const { data: sessao, error: erroLogin } = await supabase.auth.signInWithPassword({
    email: validado.data.email,
    password: validado.data.senha,
  });

  if (erroLogin || !sessao.user) {
    return { erro: traduzirErroAuth(erroLogin?.message ?? "") };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil, ativo")
    .eq("id", sessao.user.id)
    .single();

  if (!usuario) {
    await supabase.auth.signOut();
    return { erro: "Usuario nao configurado no sistema. Fale com o administrador." };
  }

  if (!usuario.ativo) {
    await supabase.auth.signOut();
    return { erro: "Acesso desativado. Fale com o administrador." };
  }

  revalidatePath("/", "layout");
  redirect(destinoPorPerfil(usuario.perfil));
}

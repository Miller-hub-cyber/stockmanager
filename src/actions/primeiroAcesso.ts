"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esquemaPrimeiroAcesso } from "@/lib/validacao";

export interface EstadoPrimeiroAcesso {
  erro: string | null;
  /** Conta criada, mas o Supabase exige confirmar o e-mail antes de entrar. */
  confirmarEmail?: boolean;
}

/** Erros do Supabase Auth no signUp. A regra do convite vive em fn_aceitar_convite (0020). */
function traduzirErroCadastro(mensagem: string): string {
  // Exception da trigger em auth.users chega so como erro generico de banco.
  if (mensagem.includes("Database error saving new user"))
    return "Codigo invalido, vencido ou de outro e-mail. Peca um novo convite ao administrador.";
  if (mensagem.includes("already registered"))
    return "Este e-mail ja tem acesso. Entre pela tela de login.";
  if (mensagem.includes("Password"))
    return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e numeros.";
  if (mensagem.includes("rate limit") || mensagem.includes("Too many"))
    return "Muitas tentativas seguidas. Aguarde alguns minutos.";
  return "Nao foi possivel concluir o cadastro. Tente novamente.";
}

export async function primeiroAcesso(
  _estado: EstadoPrimeiroAcesso,
  formData: FormData
): Promise<EstadoPrimeiroAcesso> {
  const validado = esquemaPrimeiroAcesso.safeParse({
    email: formData.get("email"),
    codigo: formData.get("codigo"),
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!validado.success) {
    return { erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validado.data.email,
    password: validado.data.senha,
    options: { data: { codigo_convite: validado.data.codigo } },
  });
  if (error) return { erro: traduzirErroCadastro(error.message) };

  // Com "Confirm email" ligado no Supabase nao vem sessao: a pessoa confirma e depois entra.
  if (!data.session) return { erro: null, confirmarEmail: true };

  revalidatePath("/", "layout");
  redirect("/");
}

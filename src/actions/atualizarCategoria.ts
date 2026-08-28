"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaCategoria } from "@/lib/validacao";
import { exigirGestorOuAdmin, atualizarRegistro, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function atualizarCategoria(
  id: string,
  _estado: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaCategoria.safeParse({ nome: formData.get("nome") });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const resultado = await atualizarRegistro("categorias", id, { nome: validado.data.nome });
  if (!resultado.sucesso) return resultado;
  revalidatePath("/gestao/cadastros/categorias");
  redirect("/gestao/cadastros/categorias");
}

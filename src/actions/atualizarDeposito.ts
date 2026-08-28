"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaDeposito } from "@/lib/validacao";
import { exigirGestorOuAdmin, atualizarRegistro, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function atualizarDeposito(
  id: string,
  _estado: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaDeposito.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const resultado = await atualizarRegistro("depositos", id, {
    nome: validado.data.nome,
    descricao: validado.data.descricao ?? null,
  });
  if (!resultado.sucesso) return resultado;
  revalidatePath("/gestao/cadastros/depositos");
  redirect("/gestao/cadastros/depositos");
}

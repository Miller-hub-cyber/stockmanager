"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaFuncionario } from "@/lib/validacao";
import { exigirGestorOuAdmin, inserirRegistro, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function criarFuncionario(_estado: ResultadoAcao, formData: FormData): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaFuncionario.safeParse({
    nome: formData.get("nome"),
    matricula: formData.get("matricula"),
    funcao: formData.get("funcao"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const resultado = await inserirRegistro("funcionarios", {
    empresa_id: acesso.empresaId,
    nome: validado.data.nome,
    matricula: validado.data.matricula ?? null,
    funcao: validado.data.funcao ?? null,
  });
  if (!resultado.sucesso) return resultado;
  revalidatePath("/gestao/cadastros/funcionarios");
  redirect("/gestao/cadastros/funcionarios");
}

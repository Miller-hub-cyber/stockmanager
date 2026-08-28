"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaCentroCusto } from "@/lib/validacao";
import { exigirGestorOuAdmin, atualizarRegistro, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function atualizarCentroCusto(
  id: string,
  _estado: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaCentroCusto.safeParse({
    nome: formData.get("nome"),
    codigo: formData.get("codigo"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const resultado = await atualizarRegistro("centros_custo", id, {
    nome: validado.data.nome,
    codigo: validado.data.codigo ?? null,
  });
  if (!resultado.sucesso) return resultado;
  revalidatePath("/gestao/cadastros/centros-custo");
  redirect("/gestao/cadastros/centros-custo");
}

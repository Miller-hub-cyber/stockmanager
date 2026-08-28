"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaFornecedor } from "@/lib/validacao";
import { exigirGestorOuAdmin, inserirRegistro, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function criarFornecedor(_estado: ResultadoAcao, formData: FormData): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaFornecedor.safeParse({
    nome: formData.get("nome"),
    cnpj: formData.get("cnpj"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    prazoEntregaDias: formData.get("prazoEntregaDias"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const resultado = await inserirRegistro("fornecedores", {
    empresa_id: acesso.empresaId,
    nome: validado.data.nome,
    cnpj: validado.data.cnpj ?? null,
    telefone: validado.data.telefone ?? null,
    email: validado.data.email ?? null,
    prazo_entrega_dias: validado.data.prazoEntregaDias,
  });
  if (!resultado.sucesso) return resultado;
  revalidatePath("/gestao/cadastros/fornecedores");
  redirect("/gestao/cadastros/fornecedores");
}

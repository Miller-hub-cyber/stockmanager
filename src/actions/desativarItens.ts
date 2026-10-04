"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/formato";
import { esquemaDesativarItens } from "@/lib/validacao";
import { exigirGestorOuAdmin, type ResultadoAcao } from "@/lib/acoes-cadastro";

/** Desativa um ou varios itens de uma vez (selecao da lista de itens). */
export async function desativarItens(ids: string[]): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaDesativarItens.safeParse({ ids });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const { error } = await createClient().from("itens").update({ ativo: false }).in("id", validado.data.ids);
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };

  revalidatePath("/gestao/itens");
  return { sucesso: true };
}

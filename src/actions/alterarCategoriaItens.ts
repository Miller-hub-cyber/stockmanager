"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/formato";
import { esquemaAlterarCategoriaItens } from "@/lib/validacao";
import { exigirGestorOuAdmin, conferirAlterados, type ResultadoAcao } from "@/lib/acoes-cadastro";

/** Troca a categoria de varios itens de uma vez; `null` deixa os itens sem categoria. */
export async function alterarCategoriaItens(ids: string[], categoriaId: string | null): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaAlterarCategoriaItens.safeParse({ ids, categoriaId });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  // O RLS pode filtrar linhas sem devolver erro; so conta o que voltou alterado.
  const { data, error } = await createClient()
    .from("itens")
    .update({ categoria_id: validado.data.categoriaId })
    .in("id", validado.data.ids)
    .select("id");
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };

  revalidatePath("/gestao/itens");
  return conferirAlterados(data.length, validado.data.ids.length);
}

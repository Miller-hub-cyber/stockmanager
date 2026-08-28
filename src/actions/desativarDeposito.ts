"use server";

import { revalidatePath } from "next/cache";
import { exigirGestorOuAdmin, desativarRegistro } from "@/lib/acoes-cadastro";

export async function desativarDeposito(id: string, _formData: FormData): Promise<void> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return;

  await desativarRegistro("depositos", id);
  revalidatePath("/gestao/cadastros/depositos");
}

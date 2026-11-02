"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/acoes-cadastro";

export async function cancelarConvite(id: string, _formData: FormData): Promise<void> {
  const acesso = await exigirAdmin();
  if ("erro" in acesso) return;

  const supabase = await createClient();
  await supabase.rpc("fn_cancelar_convite", { p_convite_id: id });
  revalidatePath("/gestao/usuarios");
}

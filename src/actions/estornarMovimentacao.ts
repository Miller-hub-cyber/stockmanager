"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";

export interface ResultadoMovimentacao {
  sucesso: boolean;
  erro?: string;
}

export async function estornarMovimentacao(movimentacaoId: string): Promise<ResultadoMovimentacao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (!["admin", "gestor", "almoxarife"].includes(usuario.perfil)) {
    return { sucesso: false, erro: "Voce nao tem permissao para estornar movimentacoes." };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("fn_estornar_movimentacao", {
    p_movimentacao_id: movimentacaoId,
    p_usuario_id: usuario.id,
    p_motivo: "Estorno solicitado pelo usuario",
  });

  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  revalidatePath("/operacao/consulta");
  return { sucesso: true };
}

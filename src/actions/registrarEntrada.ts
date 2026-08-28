"use server";

import { createClient } from "@/lib/supabase/server";
import { esquemaEntrada } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";

export interface ResultadoMovimentacao {
  sucesso: boolean;
  erro?: string;
}

export async function registrarEntrada(dados: unknown): Promise<ResultadoMovimentacao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (!["admin", "gestor", "almoxarife"].includes(usuario.perfil)) {
    return { sucesso: false, erro: "Voce nao tem permissao para registrar entrada." };
  }

  const validado = esquemaEntrada.safeParse(dados);
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();

  // Nota fiscal informada -> cria o documento antes e vincula a movimentacao a ele.
  let documentoId: string | null = null;
  if (validado.data.numeroNf) {
    const { data: documento, error: erroDocumento } = await supabase
      .from("documentos")
      .insert({
        empresa_id: usuario.empresaId,
        tipo: "entrada",
        numero_nf: validado.data.numeroNf,
        fornecedor_id: validado.data.fornecedorId ?? null,
        usuario_id: usuario.id,
      })
      .select("id")
      .single();
    if (erroDocumento || !documento) {
      return { sucesso: false, erro: traduzirErro(erroDocumento?.message ?? "") };
    }
    documentoId = documento.id;
  }

  const { error } = await supabase.from("movimentacoes").insert({
    empresa_id: usuario.empresaId,
    item_id: validado.data.itemId,
    deposito_id: validado.data.depositoId,
    tipo: "entrada",
    quantidade: validado.data.quantidade,
    custo_unitario: validado.data.custoUnitario,
    documento_id: documentoId,
    usuario_id: usuario.id,
  });

  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}

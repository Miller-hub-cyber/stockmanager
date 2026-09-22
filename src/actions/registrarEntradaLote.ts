"use server";

import { createClient } from "@/lib/supabase/server";
import { esquemaEntradaLote } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";

export interface ResultadoMovimentacao {
  sucesso: boolean;
  erro?: string;
}

/** Registra varios itens na mesma entrada: um documento (NF) e uma movimentacao por item, no mesmo lote. */
export async function registrarEntradaLote(dados: unknown): Promise<ResultadoMovimentacao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (!["admin", "gestor", "almoxarife"].includes(usuario.perfil)) {
    return { sucesso: false, erro: "Voce nao tem permissao para registrar entrada." };
  }

  const validado = esquemaEntradaLote.safeParse(dados);
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();

  // Nota fiscal informada -> cria um unico documento para o lote e vincula todas as linhas a ele.
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

  const linhas = validado.data.itens.map((item) => ({
    empresa_id: usuario.empresaId,
    item_id: item.itemId,
    deposito_id: validado.data.depositoId,
    tipo: "entrada" as const,
    quantidade: item.quantidade,
    custo_unitario: item.custoUnitario,
    documento_id: documentoId,
    veiculo_id: validado.data.veiculoId ?? null,
    usuario_id: usuario.id,
  }));

  const { error } = await supabase.from("movimentacoes").insert(linhas);

  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}

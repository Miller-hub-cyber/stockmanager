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

  // Frota digitada na hora (ainda sem cadastro): mesma resolucao da saida (0009).
  let veiculoId = validado.data.veiculoId ?? null;
  if (!veiculoId && validado.data.veiculoPlaca) {
    const { data: veiculoResolvido, error: erroVeiculo } = await supabase.rpc("fn_obter_ou_criar_veiculo", {
      p_placa: validado.data.veiculoPlaca,
    });
    if (erroVeiculo || !veiculoResolvido) {
      return { sucesso: false, erro: traduzirErro(erroVeiculo?.message ?? "") };
    }
    veiculoId = veiculoResolvido;
  }

  // Mecanico que pediu as pecas: mesma resolucao da saida (0010).
  let funcionarioId: string | null = null;
  if (validado.data.funcionarioNome) {
    const { data: funcionarioResolvido, error: erroFuncionario } = await supabase.rpc(
      "fn_obter_ou_criar_funcionario",
      { p_nome: validado.data.funcionarioNome }
    );
    if (erroFuncionario || !funcionarioResolvido) {
      return { sucesso: false, erro: traduzirErro(erroFuncionario?.message ?? "") };
    }
    funcionarioId = funcionarioResolvido;
  }

  // NF ou fornecedor informado -> cria um unico documento para o lote e vincula todas as linhas a ele.
  let documentoId: string | null = null;
  if (validado.data.numeroNf || validado.data.fornecedorId) {
    const { data: documento, error: erroDocumento } = await supabase
      .from("documentos")
      .insert({
        empresa_id: usuario.empresaId,
        tipo: "entrada",
        numero_nf: validado.data.numeroNf ?? null,
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
    numero_os: validado.data.numeroOs ?? null,
    veiculo_id: veiculoId,
    funcionario_id: funcionarioId,
    usuario_id: usuario.id,
  }));

  const { error } = await supabase.from("movimentacoes").insert(linhas);

  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}

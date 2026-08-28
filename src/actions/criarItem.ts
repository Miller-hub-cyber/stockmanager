"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaItem } from "@/lib/validacao";
import { exigirGestorOuAdmin, inserirRegistro, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function criarItem(_estado: ResultadoAcao, formData: FormData): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaItem.safeParse({
    sku: formData.get("sku"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    unidade: formData.get("unidade"),
    tipo: formData.get("tipo"),
    estoqueMinimo: formData.get("estoqueMinimo"),
    pontoPedido: formData.get("pontoPedido"),
    categoriaId: formData.get("categoriaId") || undefined,
    fornecedorId: formData.get("fornecedorId") || undefined,
    codigoBarras: formData.get("codigoBarras"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const resultado = await inserirRegistro("itens", {
    empresa_id: acesso.empresaId,
    sku: validado.data.sku.toUpperCase(),
    nome: validado.data.nome,
    descricao: validado.data.descricao ?? null,
    unidade: validado.data.unidade.toUpperCase(),
    tipo: validado.data.tipo,
    estoque_minimo: validado.data.estoqueMinimo,
    ponto_pedido: validado.data.pontoPedido,
    categoria_id: validado.data.categoriaId ?? null,
    fornecedor_id: validado.data.fornecedorId ?? null,
    codigo_barras: validado.data.codigoBarras ?? null,
  });
  if (!resultado.sucesso) return resultado;
  revalidatePath("/gestao/itens");
  redirect("/gestao/itens");
}

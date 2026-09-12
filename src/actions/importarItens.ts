"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import { esquemaLinhaImportacaoItem } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";

const COLUNAS_ESPERADAS = 11;

export interface LinhaComErro {
  linha: number;
  identificador: string;
  motivo: string;
}

export interface ResultadoImportacao {
  sucesso: boolean;
  erro?: string;
  total?: number;
  criados?: number;
  comErro?: LinhaComErro[];
}

export async function importarItens(
  _estado: ResultadoImportacao,
  formData: FormData
): Promise<ResultadoImportacao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (usuario.perfil !== "admin" && usuario.perfil !== "gestor") {
    return { sucesso: false, erro: "Voce nao tem permissao para esta acao." };
  }

  const depositoId = formData.get("depositoId");
  if (typeof depositoId !== "string" || !depositoId) {
    return { sucesso: false, erro: "Selecione o deposito de destino do saldo inicial." };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { sucesso: false, erro: "Selecione o arquivo CSV para importar." };
  }

  const texto = await arquivo.text();
  const linhas = parseCsv(texto).slice(1);
  if (linhas.length === 0) {
    return { sucesso: false, erro: "O arquivo nao tem linhas de dados." };
  }

  const supabase = createClient();

  const { data: categoriasExistentes } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("empresa_id", usuario.empresaId);
  const mapaCategorias = new Map((categoriasExistentes ?? []).map((c) => [c.nome.toLowerCase(), c.id]));

  const { data: fornecedoresExistentes } = await supabase
    .from("fornecedores")
    .select("id, nome")
    .eq("empresa_id", usuario.empresaId);
  const mapaFornecedores = new Map((fornecedoresExistentes ?? []).map((f) => [f.nome.toLowerCase(), f.id]));

  const comErro: LinhaComErro[] = [];
  let criados = 0;

  for (let i = 0; i < linhas.length; i++) {
    const numeroLinha = i + 2;
    const colunas = [...linhas[i]];
    while (colunas.length < COLUNAS_ESPERADAS) colunas.push("");

    const [
      sku,
      nome,
      unidade,
      tipo,
      categoria,
      fornecedor,
      estoqueMinimo,
      pontoPedido,
      codigoBarras,
      saldoInicial,
      custoInicial,
    ] = colunas;

    const validado = esquemaLinhaImportacaoItem.safeParse({
      sku,
      nome,
      unidade,
      tipo,
      categoria,
      fornecedor,
      estoqueMinimo,
      pontoPedido,
      codigoBarras,
      saldoInicial,
      custoInicial,
    });
    if (!validado.success) {
      comErro.push({
        linha: numeroLinha,
        identificador: sku || nome || "",
        motivo: validado.error.issues[0]?.message ?? "Dados invalidos.",
      });
      continue;
    }
    const dados = validado.data;

    let categoriaId: string | null = null;
    if (dados.categoria) {
      const chave = dados.categoria.toLowerCase();
      categoriaId = mapaCategorias.get(chave) ?? null;
      if (!categoriaId) {
        const { data: novaCategoria, error: erroCategoria } = await supabase
          .from("categorias")
          .insert({ empresa_id: usuario.empresaId, nome: dados.categoria })
          .select("id")
          .single();
        if (erroCategoria || !novaCategoria) {
          comErro.push({
            linha: numeroLinha,
            identificador: dados.sku,
            motivo: traduzirErro(erroCategoria?.message ?? ""),
          });
          continue;
        }
        categoriaId = novaCategoria.id;
        mapaCategorias.set(chave, categoriaId);
      }
    }

    let fornecedorId: string | null = null;
    if (dados.fornecedor) {
      const chave = dados.fornecedor.toLowerCase();
      fornecedorId = mapaFornecedores.get(chave) ?? null;
      if (!fornecedorId) {
        const { data: novoFornecedor, error: erroFornecedor } = await supabase
          .from("fornecedores")
          .insert({ empresa_id: usuario.empresaId, nome: dados.fornecedor })
          .select("id")
          .single();
        if (erroFornecedor || !novoFornecedor) {
          comErro.push({
            linha: numeroLinha,
            identificador: dados.sku,
            motivo: traduzirErro(erroFornecedor?.message ?? ""),
          });
          continue;
        }
        fornecedorId = novoFornecedor.id;
        mapaFornecedores.set(chave, fornecedorId);
      }
    }

    const { data: novoItem, error: erroItem } = await supabase
      .from("itens")
      .insert({
        empresa_id: usuario.empresaId,
        sku: dados.sku.toUpperCase(),
        nome: dados.nome,
        unidade: dados.unidade.toUpperCase(),
        tipo: dados.tipo,
        categoria_id: categoriaId,
        fornecedor_id: fornecedorId,
        estoque_minimo: dados.estoqueMinimo,
        ponto_pedido: dados.pontoPedido,
        codigo_barras: dados.codigoBarras ?? null,
      })
      .select("id")
      .single();

    if (erroItem || !novoItem) {
      comErro.push({
        linha: numeroLinha,
        identificador: dados.sku,
        motivo: traduzirErro(erroItem?.message ?? ""),
      });
      continue;
    }

    if (dados.saldoInicial > 0) {
      const { error: erroMovimentacao } = await supabase.from("movimentacoes").insert({
        empresa_id: usuario.empresaId,
        item_id: novoItem.id,
        deposito_id: depositoId,
        tipo: "entrada",
        quantidade: dados.saldoInicial,
        custo_unitario: dados.custoInicial,
        motivo: "Importacao inicial",
        usuario_id: usuario.id,
      });
      if (erroMovimentacao) {
        comErro.push({
          linha: numeroLinha,
          identificador: dados.sku,
          motivo: `Item criado, mas saldo inicial falhou: ${traduzirErro(erroMovimentacao.message)}`,
        });
        continue;
      }
    }

    criados++;
  }

  revalidatePath("/gestao/itens");
  return { sucesso: comErro.length === 0, total: linhas.length, criados, comErro };
}

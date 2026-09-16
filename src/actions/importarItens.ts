"use server";

import { z } from "zod";
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

type LinhaImportacao = z.infer<typeof esquemaLinhaImportacaoItem>;
type LinhaValida = { linha: number; dados: LinhaImportacao };

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
  const linhasCsv = parseCsv(texto).slice(1);
  if (linhasCsv.length === 0) {
    return { sucesso: false, erro: "O arquivo nao tem linhas de dados." };
  }

  const supabase = createClient();

  // Passo 1: valida todas as linhas antes de gravar qualquer coisa (sem chamada ao banco).
  const validas: LinhaValida[] = [];
  const comErro: LinhaComErro[] = [];

  for (let i = 0; i < linhasCsv.length; i++) {
    const numeroLinha = i + 2;
    const colunas = [...linhasCsv[i]];
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
    validas.push({ linha: numeroLinha, dados: validado.data });
  }

  // Passo 2: resolve categoria/fornecedor em lote — uma unica ida ao banco pra
  // cada, em vez de uma consulta por linha do arquivo.
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

  const novasCategorias = new Map<string, string>();
  validas.forEach(({ dados }) => {
    if (dados.categoria && !mapaCategorias.has(dados.categoria.toLowerCase())) {
      novasCategorias.set(dados.categoria.toLowerCase(), dados.categoria);
    }
  });
  if (novasCategorias.size > 0) {
    const { data: criadas, error } = await supabase
      .from("categorias")
      .insert(
        Array.from(novasCategorias.values()).map((nome) => ({ empresa_id: usuario.empresaId, nome }))
      )
      .select("id, nome");
    (criadas ?? []).forEach((c) => mapaCategorias.set(c.nome.toLowerCase(), c.id));
    if (error) {
      // Sem a categoria resolvida a linha nao pode ser gravada com o vinculo pedido no CSV.
      validas
        .filter((v) => v.dados.categoria && !mapaCategorias.has(v.dados.categoria.toLowerCase()))
        .forEach((v) =>
          comErro.push({ linha: v.linha, identificador: v.dados.sku, motivo: traduzirErro(error.message) })
        );
    }
  }

  const novosFornecedores = new Map<string, string>();
  validas.forEach(({ dados }) => {
    if (dados.fornecedor && !mapaFornecedores.has(dados.fornecedor.toLowerCase())) {
      novosFornecedores.set(dados.fornecedor.toLowerCase(), dados.fornecedor);
    }
  });
  if (novosFornecedores.size > 0) {
    const { data: criados, error } = await supabase
      .from("fornecedores")
      .insert(
        Array.from(novosFornecedores.values()).map((nome) => ({ empresa_id: usuario.empresaId, nome }))
      )
      .select("id, nome");
    (criados ?? []).forEach((f) => mapaFornecedores.set(f.nome.toLowerCase(), f.id));
    if (error) {
      validas
        .filter((v) => v.dados.fornecedor && !mapaFornecedores.has(v.dados.fornecedor.toLowerCase()))
        .forEach((v) =>
          comErro.push({ linha: v.linha, identificador: v.dados.sku, motivo: traduzirErro(error.message) })
        );
    }
  }

  const linhasErradas = new Set(comErro.map((e) => e.linha));
  const prontas = validas.filter((v) => !linhasErradas.has(v.linha));

  let criados = 0;

  /** Caminho lento: usado so quando o insert em lote falha (ex.: SKU duplicado no arquivo). */
  async function inserirUmaALinha(linhas: LinhaValida[]) {
    for (const { linha, dados } of linhas) {
      const categoriaId = dados.categoria ? (mapaCategorias.get(dados.categoria.toLowerCase()) ?? null) : null;
      const fornecedorId = dados.fornecedor
        ? (mapaFornecedores.get(dados.fornecedor.toLowerCase()) ?? null)
        : null;

      const { data: novoItem, error: erroItem } = await supabase
        .from("itens")
        .insert({
          empresa_id: usuario!.empresaId,
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
        comErro.push({ linha, identificador: dados.sku, motivo: traduzirErro(erroItem?.message ?? "") });
        continue;
      }

      if (dados.saldoInicial > 0) {
        const { error: erroMovimentacao } = await supabase.from("movimentacoes").insert({
          empresa_id: usuario!.empresaId,
          item_id: novoItem.id,
          deposito_id: depositoId as string,
          tipo: "entrada",
          quantidade: dados.saldoInicial,
          custo_unitario: dados.custoInicial,
          motivo: "Importacao inicial",
          usuario_id: usuario!.id,
        });
        if (erroMovimentacao) {
          comErro.push({
            linha,
            identificador: dados.sku,
            motivo: `Item criado, mas saldo inicial falhou: ${traduzirErro(erroMovimentacao.message)}`,
          });
          continue;
        }
      }

      criados++;
    }
  }

  // Passo 3: grava os itens validos em um unico insert. So cai pro caminho
  // linha a linha se o lote inteiro falhar (ex.: SKU repetido dentro do proprio
  // arquivo), pra isolar qual linha especificamente deu erro.
  if (prontas.length > 0) {
    const { data: itensCriados, error: erroLote } = await supabase
      .from("itens")
      .insert(
        prontas.map(({ dados }) => ({
          empresa_id: usuario.empresaId,
          sku: dados.sku.toUpperCase(),
          nome: dados.nome,
          unidade: dados.unidade.toUpperCase(),
          tipo: dados.tipo,
          categoria_id: dados.categoria ? (mapaCategorias.get(dados.categoria.toLowerCase()) ?? null) : null,
          fornecedor_id: dados.fornecedor
            ? (mapaFornecedores.get(dados.fornecedor.toLowerCase()) ?? null)
            : null,
          estoque_minimo: dados.estoqueMinimo,
          ponto_pedido: dados.pontoPedido,
          codigo_barras: dados.codigoBarras ?? null,
        }))
      )
      .select("id, sku");

    if (erroLote || !itensCriados) {
      await inserirUmaALinha(prontas);
    } else {
      const idPorSku = new Map(itensCriados.map((i) => [i.sku, i.id]));
      const comSaldoInicial = prontas.filter((v) => v.dados.saldoInicial > 0);

      if (comSaldoInicial.length > 0) {
        const { error: erroMovimentacoes } = await supabase.from("movimentacoes").insert(
          comSaldoInicial.map(({ dados }) => ({
            empresa_id: usuario.empresaId,
            item_id: idPorSku.get(dados.sku.toUpperCase())!,
            deposito_id: depositoId as string,
            tipo: "entrada" as const,
            quantidade: dados.saldoInicial,
            custo_unitario: dados.custoInicial,
            motivo: "Importacao inicial",
            usuario_id: usuario.id,
          }))
        );

        if (erroMovimentacoes) {
          // Os itens ja foram criados; so o saldo inicial em lote falhou.
          comSaldoInicial.forEach(({ linha, dados }) =>
            comErro.push({
              linha,
              identificador: dados.sku,
              motivo: `Item criado, mas saldo inicial falhou: ${traduzirErro(erroMovimentacoes.message)}`,
            })
          );
          criados += prontas.length - comSaldoInicial.length;
        } else {
          criados += prontas.length;
        }
      } else {
        criados += prontas.length;
      }
    }
  }

  revalidatePath("/gestao/itens");
  return { sucesso: comErro.length === 0, total: linhasCsv.length, criados, comErro };
}

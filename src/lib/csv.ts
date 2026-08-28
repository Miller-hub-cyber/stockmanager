interface ColunaCsv {
  chave: string;
  rotulo: string;
}

function escaparCampoCsv(valor: string): string {
  if (/[;"\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

/**
 * Separador ";" (nao ",") porque o Excel em pt-BR usa virgula como separador
 * decimal — CSV separado por virgula quebra a leitura de numero. BOM UTF-8
 * no inicio evita acento corrompido ao abrir no Excel.
 */
export function paraCsv(linhas: Record<string, string | number | null>[], colunas: ColunaCsv[]): string {
  const cabecalho = colunas.map((c) => escaparCampoCsv(c.rotulo)).join(";");
  const corpo = linhas
    .map((linha) => colunas.map((c) => escaparCampoCsv(String(linha[c.chave] ?? ""))).join(";"))
    .join("\n");
  return `﻿${cabecalho}\n${corpo}`;
}

export function respostaCsv(conteudo: string, nomeArquivo: string): Response {
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

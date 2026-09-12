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

/**
 * Le CSV separado por ";" (mesmo formato de paraCsv). Suporta campo entre
 * aspas com ";" ou quebra de linha dentro, e "" como aspas escapadas.
 */
export function parseCsv(conteudo: string): string[][] {
  const texto = conteudo.charCodeAt(0) === 0xfeff ? conteudo.slice(1) : conteudo;
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      dentroDeAspas = true;
    } else if (c === ";") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      campo = "";
      linha = [];
    } else {
      campo += c;
    }
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas
    .map((l) => l.map((v) => v.trim()))
    .filter((l) => !(l.length === 1 && l[0] === ""));
}

export function respostaCsv(conteudo: string, nomeArquivo: string): Response {
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

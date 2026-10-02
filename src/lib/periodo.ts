import { z } from "zod";

/**
 * Período dos relatórios. Datas sempre como dia de calendário em
 * America/Belem (AAAA-MM-DD); a conversão para timestamp fica com quem consulta.
 */
export const OPCOES_PERIODO = ["7d", "30d", "ano", "personalizado"] as const;
export type OpcaoPeriodo = (typeof OPCOES_PERIODO)[number];

export interface Periodo {
  opcao: OpcaoPeriodo;
  de?: string;
  ate?: string;
}

const PADRAO: OpcaoPeriodo = "30d";
const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const opcao = z.enum(OPCOES_PERIODO);

/** Soma (ou subtrai) dias de uma data AAAA-MM-DD, sem passar por fuso. */
export function somarDias(dia: string, dias: number): string {
  const [ano, mes, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, d + dias)).toISOString().slice(0, 10);
}

export const inicioDoMes = (dia: string) => `${dia.slice(0, 7)}-01`;

/**
 * Lê `periodo`, `de` e `ate` da URL. Valor inválido cai no padrão (últimos
 * 30 dias); no personalizado, data inválida é ignorada.
 */
export function resolverPeriodo(
  bruto: { [chave: string]: string | string[] | undefined },
  hoje: string
): Periodo {
  const texto = (chave: string) => (typeof bruto[chave] === "string" ? (bruto[chave] as string) : undefined);
  const escolhida = opcao.safeParse(texto("periodo")).data ?? PADRAO;

  switch (escolhida) {
    case "7d":
      return { opcao: escolhida, de: somarDias(hoje, -6), ate: hoje };
    case "30d":
      return { opcao: escolhida, de: somarDias(hoje, -29), ate: hoje };
    case "ano":
      return { opcao: escolhida, de: `${hoje.slice(0, 4)}-01-01`, ate: hoje };
    case "personalizado":
      return {
        opcao: escolhida,
        de: dataIso.safeParse(texto("de")).data,
        ate: dataIso.safeParse(texto("ate")).data,
      };
  }
}

const diaMes = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const diaMesAno = (dia: string) => `${diaMes(dia)}/${dia.slice(0, 4)}`;

/** "03/09 a 02/10/2026", "desde 03/09/2026", "até 02/10/2026" ou "todo o período". */
export function descreverPeriodo(de?: string | null, ate?: string | null): string {
  if (de && ate) {
    if (de === ate) return diaMesAno(de);
    return `${de.slice(0, 4) === ate.slice(0, 4) ? diaMes(de) : diaMesAno(de)} a ${diaMesAno(ate)}`;
  }
  if (de) return `desde ${diaMesAno(de)}`;
  if (ate) return `até ${diaMesAno(ate)}`;
  return "todo o período";
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-09-17" vira "set/2026". Sem Intl: o formato não depende do ICU do servidor. */
const mesCurto = (dia: string) => `${MESES[Number(dia.slice(5, 7)) - 1]}/${dia.slice(0, 4)}`;

/**
 * Para relatórios agrupados por mês (consumo): o período vira os meses que ele
 * toca. "em out/2026", "de set/2026 a out/2026", "desde …", "até …".
 */
export function descreverMeses(de?: string | null, ate?: string | null): string {
  const inicio = de ? mesCurto(de) : undefined;
  const fim = ate ? mesCurto(ate) : undefined;
  if (inicio && fim) return inicio === fim ? `em ${inicio}` : `de ${inicio} a ${fim}`;
  if (inicio) return `desde ${inicio}`;
  if (fim) return `até ${fim}`;
  return "em todos os meses";
}

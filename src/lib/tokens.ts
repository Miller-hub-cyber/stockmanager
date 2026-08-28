/** Fonte unica de verdade das cores. Espelha o tailwind.config.ts. */
export const cores = {
  carbono: "#14181D",
  aco: "#212933",
  grafite: "#3A4450",
  petroleo: "#0F5563",
  petroleoClaro: "#177A8F",
  ambar: "#F5A524",
  carmim: "#D64545",
  musgo: "#3F8F6F",
  nevoa: "#F1F4F6",
  giz: "#DDE3E8",
  tinta: "#1B2026",
  bruma: "#6C7885",
} as const;

/** Estado visual do item. Usado em toda tela que mostra saldo. */
export function estadoItem(saldo: number, minimo: number, pontoPedido: number) {
  if (saldo <= 0) return { cor: cores.carmim, texto: "Esgotado" as const };
  if (saldo <= minimo) return { cor: cores.ambar, texto: "Abaixo do minimo" as const };
  if (saldo <= pontoPedido) return { cor: cores.ambar, texto: "Repor" as const };
  return { cor: cores.musgo, texto: "Normal" as const };
}

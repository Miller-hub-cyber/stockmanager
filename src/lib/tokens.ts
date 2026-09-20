/** Fonte unica de verdade das cores. Espelha o tailwind.config.ts. */
export const cores = {
  carbono: "#14181D",
  aco: "#212933",
  grafite: "#3A4450",
  petroleo: "#0F5563",
  petroleoClaro: "#177A8F",
  petroleoLuz: "#4FB3C8",
  ambar: "#F5A524",
  ambarTexto: "#8A5A00",
  ambarFundo: "#FBEBCB",
  carmim: "#D64545",
  carmimTexto: "#B03030",
  carmimFundo: "#F6DADA",
  carmimLuz: "#E57373",
  musgo: "#3F8F6F",
  musgoTexto: "#2F6F55",
  musgoFundo: "#D8EBE3",
  musgoLuz: "#5DB38F",
  nevoa: "#F1F4F6",
  giz: "#DDE3E8",
  tinta: "#1B2026",
  bruma: "#6C7885",
  brumaTexto: "#5A6573",
  brumaLuz: "#8A96A3",
} as const;

/** Estados do ponto/ícone em `PontoEstado`, um por família de ícone lucide-react. */
export type EstadoPonto = "normal" | "alerta" | "critico" | "inativo";

/** Estado visual do item. Usado em toda tela que mostra saldo. */
export function estadoItem(saldo: number, minimo: number, pontoPedido: number) {
  if (saldo <= 0) return { cor: cores.carmim, texto: "Esgotado" as const, estado: "critico" as const };
  if (saldo <= minimo) return { cor: cores.ambar, texto: "Abaixo do minimo" as const, estado: "alerta" as const };
  if (saldo <= pontoPedido) return { cor: cores.ambar, texto: "Repor" as const, estado: "alerta" as const };
  return { cor: cores.musgo, texto: "Normal" as const, estado: "normal" as const };
}

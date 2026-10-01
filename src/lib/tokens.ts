/** Fonte unica de verdade das cores. Espelha o tailwind.config.ts. */
export const cores = {
  carbono: "#0C1A2E",
  aco: "#13233F",
  grafite: "#2E4366",
  cobalto: "#1F4E94",
  cobaltoClaro: "#2F6ED3",
  cobaltoLuz: "#598BDC",
  laranja: "#F2A33A",
  laranjaTexto: "#A05C0D",
  laranjaFundo: "#FCEDD9",
  ambar: "#F2A33A",
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
  nevoa: "#EEF2F7",
  giz: "#D8E0EB",
  tinta: "#13233F",
  bruma: "#687792",
  brumaTexto: "#53627C",
  brumaLuz: "#A9B7CF",
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

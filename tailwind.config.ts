import type { Config } from "tailwindcss";

/**
 * Tokens do StockManager.
 * Nao adicione familia de cor fora desta lista. Ambar e carmim sao exclusivos
 * de estado do estoque e nunca decoram elemento neutro.
 * Subchaves: DEFAULT = icone, borda, barra | texto = texto em fundo claro |
 * luz = texto em fundo escuro | fundo = badge em contexto claro.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbono: "#14181D",
        aco: "#212933",
        grafite: "#3A4450",
        petroleo: { DEFAULT: "#0F5563", claro: "#177A8F", luz: "#4FB3C8" },
        ambar: { DEFAULT: "#F5A524", texto: "#8A5A00", fundo: "#FBEBCB" },
        carmim: { DEFAULT: "#D64545", texto: "#B03030", fundo: "#F6DADA", luz: "#E57373" },
        musgo: { DEFAULT: "#3F8F6F", texto: "#2F6F55", fundo: "#D8EBE3", luz: "#5DB38F" },
        nevoa: "#F1F4F6",
        giz: "#DDE3E8",
        tinta: "#1B2026",
        bruma: { DEFAULT: "#6C7885", texto: "#5A6573", luz: "#8A96A3" },
      },
      fontFamily: {
        display: ["var(--fonte-display)", "system-ui", "sans-serif"],
        corpo: ["var(--fonte-corpo)", "system-ui", "sans-serif"],
        dado: ["var(--fonte-dado)", "ui-monospace", "monospace"],
      },
      fontSize: {
        saldo: ["56px", { lineHeight: "1", fontWeight: "700" }],
        tela: ["28px", { lineHeight: "1.15", fontWeight: "700" }],
        rotulo: ["12px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "600" }],
        corpo: ["15px", { lineHeight: "1.5" }],
        denso: ["13px", { lineHeight: "1.4" }],
        dado: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      borderRadius: { DEFAULT: "6px", sm: "4px", md: "6px", lg: "10px" },
      spacing: { toque: "48px", acao: "56px", rodape: "64px" },
    },
  },
  plugins: [],
};

export default config;

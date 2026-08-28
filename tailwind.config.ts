import type { Config } from "tailwindcss";

/**
 * Tokens do StockManager.
 * Nao adicione cor fora desta lista. Ambar e carmim sao exclusivos
 * de estado do estoque e nunca decoram elemento neutro.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbono: "#14181D",
        aco: "#212933",
        grafite: "#3A4450",
        petroleo: { DEFAULT: "#0F5563", claro: "#177A8F" },
        ambar: "#F5A524",
        carmim: "#D64545",
        musgo: "#3F8F6F",
        nevoa: "#F1F4F6",
        giz: "#DDE3E8",
        tinta: "#1B2026",
        bruma: "#6C7885",
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

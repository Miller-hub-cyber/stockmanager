import type { Config } from "tailwindcss";

/**
 * Tokens do StockManager, derivados da logo: azul-marinho #13233F (aco),
 * laranja #F2A33A (ambar) e azul-acinzentado #A9B7CF (bruma-luz).
 * Nao adicione familia de cor fora desta lista. Ambar e carmim sao exclusivos
 * de estado do estoque e nunca decoram elemento neutro. Laranja tem o mesmo
 * tom do ambar, mas e acento de marca: so em navegacao e identidade, nunca em
 * botao, dado ou perto de estado de item.
 * Subchaves: DEFAULT = icone, borda, barra | texto = texto em fundo claro |
 * luz = texto em fundo escuro | fundo = badge em contexto claro.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbono: "#0C1A2E",
        aco: "#13233F",
        grafite: "#2E4366",
        cobalto: { DEFAULT: "#1F4E94", claro: "#2F6ED3", luz: "#598BDC" },
        laranja: { DEFAULT: "#F2A33A", texto: "#A05C0D", fundo: "#FCEDD9" },
        ambar: { DEFAULT: "#F2A33A", texto: "#8A5A00", fundo: "#FBEBCB" },
        carmim: { DEFAULT: "#D64545", texto: "#B03030", fundo: "#F6DADA", luz: "#E57373" },
        musgo: { DEFAULT: "#3F8F6F", texto: "#2F6F55", fundo: "#D8EBE3", luz: "#5DB38F" },
        nevoa: "#EEF2F7",
        giz: "#D8E0EB",
        tinta: "#13233F",
        bruma: { DEFAULT: "#687792", texto: "#53627C", luz: "#A9B7CF" },
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
      // Movimento: saida rapida e assentamento suave. Tudo e desligado por
      // prefers-reduced-motion em globals.css.
      transitionTimingFunction: { mola: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      keyframes: {
        entrada: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      // "backwards" e nao "both": terminada a animacao, o transform some e nao
      // vira bloco de contenção para filhos com position: fixed.
      animation: { entrada: "entrada 220ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards" },
    },
  },
  plugins: [],
};

export default config;

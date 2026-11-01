import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  { ignores: [".next/**", "public/**"] },
  // Regra de performance nova no eslint-config-next 16. Os quatro usos
  // existentes so limpam estado ao montar ou trocar de rota.
  { rules: { "react-hooks/set-state-in-effect": "off" } },
];

export default config;

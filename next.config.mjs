import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Server Actions e chamadas ao Supabase sao sempre POST/autenticadas — o
  // Workbox so intercepta GET por padrao, entao nada de mutacao entra em
  // cache aqui. Sem runtimeCaching customizado: fica so o precache padrao
  // de assets estaticos (JS/CSS/fontes/imagens), nada de dado dinamico.
  register: true,
  skipWaiting: true,
})(nextConfig);

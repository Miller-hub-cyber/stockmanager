import withPWA from "next-pwa";
import cachePadrao from "next-pwa/cache.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O app nao usa next/image. Desligar fecha a rota /_next/image, alvo de
  // falhas sem correcao na linha 14 do Next.
  images: { unoptimized: true },
};

// O cache padrao do next-pwa tambem guarda paginas, rotas de exportacao e
// respostas do Supabase. Saldo velho na tela e dado de empresa em celular
// compartilhado sao piores que nao abrir offline: fica so asset estatico.
const CACHES_DINAMICOS = new Set(["apis", "others", "cross-origin", "next-data", "static-data-assets"]);

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Server Actions e chamadas ao Supabase sao sempre POST/autenticadas — o
  // Workbox so intercepta GET por padrao, entao nada de mutacao entra em
  // cache aqui.
  register: true,
  skipWaiting: true,
  runtimeCaching: cachePadrao.filter((regra) => !CACHES_DINAMICOS.has(regra.options.cacheName)),
  cacheStartUrl: false,
  dynamicStartUrl: false,
})(nextConfig);

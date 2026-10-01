/**
 * Esqueleto mostrado na hora do clique enquanto o servidor busca a página.
 * Também é o que o Link pré-carrega, então a troca de tela não espera rede.
 */
export default function CarregandoGestao() {
  return (
    <main className="p-6 sm:p-8" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="relative">
        <span className="absolute -left-4 bottom-1 top-1 w-1 rounded-sm bg-laranja" aria-hidden="true" />
        <div className="h-8 w-56 animate-pulse rounded bg-giz" />
      </div>
      <div className="mt-2.5 h-4 w-80 max-w-full animate-pulse rounded bg-giz" />

      <div className="mt-7 flex flex-wrap gap-3">
        {[64, 48, 44].map((largura) => (
          <div key={largura} className="h-10 animate-pulse rounded bg-giz" style={{ width: largura * 4 }} />
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded border border-giz bg-white">
        <div className="h-11 border-b border-giz bg-nevoa" />
        {Array.from({ length: 7 }, (_, linha) => (
          <div key={linha} className="flex h-11 items-center gap-6 border-b border-giz px-4 last:border-b-0">
            <div className="h-3 w-20 animate-pulse rounded bg-giz" />
            <div className="h-3 flex-1 animate-pulse rounded bg-giz" />
            <div className="h-3 w-16 animate-pulse rounded bg-giz" />
          </div>
        ))}
      </div>
    </main>
  );
}

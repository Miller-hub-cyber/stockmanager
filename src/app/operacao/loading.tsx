/** Esqueleto da operação: aparece no toque da aba, antes da resposta do servidor. */
export default function CarregandoOperacao() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="flex gap-2">
        <div className="h-14 w-16 animate-pulse rounded border border-grafite bg-aco" />
        <div className="h-14 flex-1 animate-pulse rounded border border-grafite bg-aco" />
      </div>
      {[0, 1, 2].map((indice) => (
        <div key={indice} className="h-[104px] animate-pulse rounded border border-grafite bg-aco" />
      ))}
    </div>
  );
}

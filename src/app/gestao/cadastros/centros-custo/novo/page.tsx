import { FormularioCentroCusto } from "../FormularioCentroCusto";

export default function PaginaNovoCentroCusto() {
  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Novo centro de custo</h1>
        <div className="mt-6">
          <FormularioCentroCusto />
        </div>
      </div>
    </main>
  );
}

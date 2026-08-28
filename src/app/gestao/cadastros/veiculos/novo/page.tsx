import { FormularioVeiculo } from "../FormularioVeiculo";

export default function PaginaNovoVeiculo() {
  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Novo veículo</h1>
        <div className="mt-6">
          <FormularioVeiculo />
        </div>
      </div>
    </main>
  );
}

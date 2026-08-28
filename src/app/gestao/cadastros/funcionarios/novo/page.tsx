import { FormularioFuncionario } from "../FormularioFuncionario";

export default function PaginaNovoFuncionario() {
  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Novo funcionário</h1>
        <div className="mt-6">
          <FormularioFuncionario />
        </div>
      </div>
    </main>
  );
}

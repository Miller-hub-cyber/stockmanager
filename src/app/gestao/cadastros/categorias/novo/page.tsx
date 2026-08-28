import { FormularioCategoria } from "../FormularioCategoria";

export default function PaginaNovaCategoria() {
  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Nova categoria</h1>
        <div className="mt-6">
          <FormularioCategoria />
        </div>
      </div>
    </main>
  );
}

import { FormularioFornecedor } from "../FormularioFornecedor";

export default function PaginaNovoFornecedor() {
  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Novo fornecedor</h1>
        <div className="mt-6">
          <FormularioFornecedor />
        </div>
      </div>
    </main>
  );
}

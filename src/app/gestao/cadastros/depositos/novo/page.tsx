import { FormularioDeposito } from "../FormularioDeposito";

export default function PaginaNovoDeposito() {
  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="titulo-tela">Novo depósito</h1>
        <div className="mt-6">
          <FormularioDeposito />
        </div>
      </div>
    </main>
  );
}

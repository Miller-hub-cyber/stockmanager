import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioDeposito } from "../FormularioDeposito";

export default async function PaginaEditarDeposito(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: deposito } = await supabase
    .from("depositos")
    .select("id, nome, descricao")
    .eq("id", params.id)
    .single();

  if (!deposito) notFound();

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="titulo-tela">Editar depósito</h1>
        <div className="mt-6">
          <FormularioDeposito deposito={deposito} />
        </div>
      </div>
    </main>
  );
}

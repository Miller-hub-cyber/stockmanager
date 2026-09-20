import { createClient } from "@/lib/supabase/server";
import { OperacaoSaida } from "./OperacaoSaida";

export default async function PaginaSaida() {
  const supabase = createClient();

  const [{ data: deposito }, { data: veiculos }, { data: centros }, { data: funcionarios }] = await Promise.all([
    supabase.from("depositos").select("id, nome").eq("ativo", true).order("nome").limit(1).maybeSingle(),
    supabase.from("veiculos").select("id, placa").eq("ativo", true).order("placa"),
    supabase.from("centros_custo").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  if (!deposito) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="font-corpo text-sm text-bruma-luz">
          Nenhum depósito cadastrado. Cadastre um depósito em Gestão antes de registrar movimentações.
        </p>
      </div>
    );
  }

  return (
    <OperacaoSaida
      depositoId={deposito.id}
      veiculos={veiculos ?? []}
      centrosCusto={centros ?? []}
      funcionarios={funcionarios ?? []}
    />
  );
}

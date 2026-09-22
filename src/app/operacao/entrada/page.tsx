import { createClient } from "@/lib/supabase/server";
import { OperacaoEntrada } from "./OperacaoEntrada";

export default async function PaginaEntrada() {
  const supabase = createClient();

  const [{ data: deposito }, { data: fornecedores }, { data: veiculos }] = await Promise.all([
    supabase.from("depositos").select("id, nome").eq("ativo", true).order("nome").limit(1).maybeSingle(),
    supabase.from("fornecedores").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("veiculos").select("id, placa").eq("ativo", true).order("placa"),
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

  return <OperacaoEntrada depositoId={deposito.id} fornecedores={fornecedores ?? []} veiculos={veiculos ?? []} />;
}

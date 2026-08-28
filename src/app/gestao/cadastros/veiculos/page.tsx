import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { desativarVeiculo } from "@/actions/desativarVeiculo";
import { quantidade } from "@/lib/formato";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, Botao, BotaoConfirmar, PontoEstado } from "@/components/ui";
import { cores } from "@/lib/tokens";

export default async function PaginaVeiculos() {
  const supabase = createClient();
  const { data: veiculos } = await supabase
    .from("veiculos")
    .select("id, placa, modelo, km_atual, ativo")
    .order("placa");
  const lista = veiculos ?? [];

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Veículos</h1>
          <p className="mt-1 font-corpo text-sm text-bruma">Frota usada como destino de saída.</p>
        </div>
        <div className="w-40">
          <Botao href="/gestao/cadastros/veiculos/novo">Novo veículo</Botao>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma">
          Nenhum veículo cadastrado.{" "}
          <Link href="/gestao/cadastros/veiculos/novo" className="text-petroleo hover:underline">
            Cadastre o primeiro
          </Link>
          .
        </div>
      ) : (
        <Tabela>
          <TabelaCabecalho>
            <TabelaCelula cabecalho mono className="max-w-[100px] flex-none">
              Placa
            </TabelaCelula>
            <TabelaCelula cabecalho>Modelo</TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[130px] flex-none">
              Km atual
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[100px] flex-none">
              Status
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[180px] flex-none">
              Ações
            </TabelaCelula>
          </TabelaCabecalho>
          {lista.map((veiculo) => (
            <TabelaLinha key={veiculo.id}>
              <TabelaCelula mono className="max-w-[100px] flex-none">
                {veiculo.placa}
              </TabelaCelula>
              <TabelaCelula className="text-bruma">{veiculo.modelo ?? "—"}</TabelaCelula>
              <TabelaCelula align="direita" mono className="max-w-[130px] flex-none">
                {quantidade(veiculo.km_atual)} km
              </TabelaCelula>
              <TabelaCelula align="direita" className="max-w-[100px] flex-none">
                <PontoEstado
                  cor={veiculo.ativo ? cores.musgo : cores.carmim}
                  texto={veiculo.ativo ? "Ativo" : "Inativo"}
                />
              </TabelaCelula>
              <TabelaCelula align="direita" className="max-w-[180px] flex-none">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/gestao/cadastros/veiculos/${veiculo.id}`}
                    className="font-corpo text-sm text-petroleo hover:underline"
                  >
                    Editar
                  </Link>
                  {veiculo.ativo && (
                    <form action={desativarVeiculo.bind(null, veiculo.id)} className="w-24">
                      <BotaoConfirmar mensagem={`Desativar o veículo "${veiculo.placa}"?`}>
                        Desativar
                      </BotaoConfirmar>
                    </form>
                  )}
                </div>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </Tabela>
      )}
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { desativarCentroCusto } from "@/actions/desativarCentroCusto";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, Botao, BotaoConfirmar, PontoEstado } from "@/components/ui";
import { cores } from "@/lib/tokens";

export default async function PaginaCentrosCusto() {
  const supabase = createClient();
  const { data: centros } = await supabase
    .from("centros_custo")
    .select("id, nome, codigo, ativo")
    .order("nome");
  const lista = centros ?? [];

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Centros de custo</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Setores usados como destino de saída.</p>
        </div>
        <div className="w-52">
          <Botao href="/gestao/cadastros/centros-custo/novo">Novo centro de custo</Botao>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
          Nenhum centro de custo cadastrado.{" "}
          <Link href="/gestao/cadastros/centros-custo/novo" className="text-petroleo hover:underline">
            Cadastre o primeiro
          </Link>
          .
        </div>
      ) : (
        <Tabela>
          <TabelaCabecalho>
            <TabelaCelula cabecalho>Nome</TabelaCelula>
            <TabelaCelula cabecalho mono className="max-w-[100px] flex-none">
              Código
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[100px] flex-none">
              Status
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[180px] flex-none">
              Ações
            </TabelaCelula>
          </TabelaCabecalho>
          {lista.map((centro) => (
            <TabelaLinha key={centro.id}>
              <TabelaCelula>{centro.nome}</TabelaCelula>
              <TabelaCelula mono className="max-w-[100px] flex-none text-bruma-texto">
                {centro.codigo ?? "—"}
              </TabelaCelula>
              <TabelaCelula align="direita" className="max-w-[100px] flex-none">
                <PontoEstado
                  cor={centro.ativo ? cores.musgo : cores.bruma}
                  texto={centro.ativo ? "Ativo" : "Inativo"}
                  estado={centro.ativo ? "normal" : "inativo"}
                />
              </TabelaCelula>
              <TabelaCelula align="direita" className="max-w-[180px] flex-none">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/gestao/cadastros/centros-custo/${centro.id}`}
                    className="font-corpo text-sm text-petroleo hover:underline"
                  >
                    Editar
                  </Link>
                  {centro.ativo && (
                    <form action={desativarCentroCusto.bind(null, centro.id)} className="w-24">
                      <BotaoConfirmar mensagem={`Desativar o centro de custo "${centro.nome}"?`}>
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

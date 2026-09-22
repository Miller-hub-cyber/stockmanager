import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { desativarDeposito } from "@/actions/desativarDeposito";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, Botao, BotaoConfirmar, PontoEstado } from "@/components/ui";
import { cores } from "@/lib/tokens";

export default async function PaginaDepositos() {
  const supabase = createClient();
  const { data: depositos } = await supabase
    .from("depositos")
    .select("id, nome, descricao, ativo")
    .order("nome");
  const lista = depositos ?? [];

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Depósitos</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Locais de armazenamento do estoque.</p>
        </div>
        <div className="w-40">
          <Botao href="/gestao/cadastros/depositos/novo">Novo depósito</Botao>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
          Nenhum depósito cadastrado.{" "}
          <Link href="/gestao/cadastros/depositos/novo" className="text-petroleo hover:underline">
            Cadastre o primeiro
          </Link>
          .
        </div>
      ) : (
        <Tabela>
          <TabelaCabecalho>
            <TabelaCelula cabecalho>Nome</TabelaCelula>
            <TabelaCelula cabecalho>Descrição</TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="w-[100px] flex-none">
              Status
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="w-[180px] flex-none">
              Ações
            </TabelaCelula>
          </TabelaCabecalho>
          {lista.map((deposito) => (
            <TabelaLinha key={deposito.id}>
              <TabelaCelula>{deposito.nome}</TabelaCelula>
              <TabelaCelula className="text-bruma-texto">{deposito.descricao ?? "—"}</TabelaCelula>
              <TabelaCelula align="direita" className="w-[100px] flex-none">
                <PontoEstado
                  cor={deposito.ativo ? cores.musgo : cores.bruma}
                  texto={deposito.ativo ? "Ativo" : "Inativo"}
                  estado={deposito.ativo ? "normal" : "inativo"}
                />
              </TabelaCelula>
              <TabelaCelula align="direita" className="w-[180px] flex-none">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/gestao/cadastros/depositos/${deposito.id}`}
                    className="font-corpo text-sm text-petroleo hover:underline"
                  >
                    Editar
                  </Link>
                  {deposito.ativo && (
                    <form action={desativarDeposito.bind(null, deposito.id)}>
                      <BotaoConfirmar mensagem={`Desativar o depósito "${deposito.nome}"?`}>
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

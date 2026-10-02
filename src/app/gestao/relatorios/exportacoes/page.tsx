import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { listarExportacoes } from "@/lib/exportacoes";

const LIMITE = 200;

export default async function PaginaExportacoes() {
  const supabase = createClient();
  const exportacoes = await listarExportacoes(supabase, { limite: LIMITE, comUsuario: true });

  return (
    <main className="p-6 sm:p-8">
      <Link
        href="/gestao/relatorios"
        className="flex items-center gap-1.5 font-corpo text-sm text-bruma-texto hover:text-cobalto"
      >
        <ArrowLeft size={16} /> Voltar para relatórios
      </Link>

      <h1 className="titulo-tela mt-4">Histórico de exportações</h1>
      <p className="mt-1 font-corpo text-sm text-bruma-texto">
        As últimas {LIMITE} exportações de relatório da empresa. Baixar de novo usa os mesmos filtros, com os dados
        de agora.
      </p>

      <div className="mt-6">
        {exportacoes === null ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
            Não foi possível carregar o histórico. Tente novamente.
          </div>
        ) : exportacoes.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
            Nenhuma exportação registrada ainda.
          </div>
        ) : (
          <Tabela>
            <TabelaCabecalho>
              <TabelaCelula cabecalho className="w-[140px] flex-none">
                Data
              </TabelaCelula>
              <TabelaCelula cabecalho className="w-[200px] flex-none">
                Relatório
              </TabelaCelula>
              <TabelaCelula cabecalho className="w-[80px] flex-none">
                Formato
              </TabelaCelula>
              <TabelaCelula cabecalho>Filtros</TabelaCelula>
              <TabelaCelula cabecalho className="w-[150px] flex-none">
                Usuário
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="w-[110px] flex-none">
                {""}
              </TabelaCelula>
            </TabelaCabecalho>
            {exportacoes.map((exportacao) => (
              <TabelaLinha key={exportacao.id}>
                <TabelaCelula mono className="w-[140px] flex-none text-bruma-texto">
                  {exportacao.quando}
                </TabelaCelula>
                <TabelaCelula className="w-[200px] flex-none">{exportacao.nome}</TabelaCelula>
                <TabelaCelula mono className="w-[80px] flex-none uppercase">
                  {exportacao.formato}
                </TabelaCelula>
                <TabelaCelula className="text-bruma-texto">{exportacao.alcance}</TabelaCelula>
                <TabelaCelula className="w-[150px] flex-none text-bruma-texto">{exportacao.usuario}</TabelaCelula>
                <TabelaCelula align="direita" className="w-[110px] flex-none">
                  {/* <a> e não <Link>: o prefetch do Next chamaria a rota de exportação à toa. */}
                  <a href={exportacao.url} className="font-corpo text-sm text-cobalto hover:underline">
                    Baixar de novo
                  </a>
                </TabelaCelula>
              </TabelaLinha>
            ))}
          </Tabela>
        )}
      </div>
    </main>
  );
}

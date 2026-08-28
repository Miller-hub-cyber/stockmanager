import { createClient } from "@/lib/supabase/server";
import { Botao, Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { brl, quantidade } from "@/lib/formato";

export default async function PaginaValorEstoque() {
  const supabase = createClient();
  const { data: linhas } = await supabase
    .from("v_valor_estoque")
    .select("categoria, itens, unidades, valor")
    .order("valor", { ascending: false });

  const lista = linhas ?? [];
  const totalValor = lista.reduce((s, l) => s + l.valor, 0);

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Valor imobilizado</h1>
          <p className="mt-1 font-corpo text-sm text-bruma">Saldo multiplicado pelo custo médio, por categoria.</p>
        </div>
        <div className="w-36">
          <Botao href="/gestao/relatorios/valor-estoque/exportar" variante="secundario">
            Exportar CSV
          </Botao>
        </div>
      </div>

      <div className="mt-6">
        {lista.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma">
            Nenhum item ativo com saldo cadastrado.
          </div>
        ) : (
          <Tabela>
            <TabelaCabecalho>
              <TabelaCelula cabecalho>Categoria</TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[90px] flex-none">
                Itens
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[110px] flex-none">
                Unidades
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[140px] flex-none">
                Valor
              </TabelaCelula>
            </TabelaCabecalho>
            {lista.map((linha) => (
              <TabelaLinha key={linha.categoria}>
                <TabelaCelula>{linha.categoria}</TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[90px] flex-none">
                  {linha.itens}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[110px] flex-none">
                  {quantidade(linha.unidades)}
                </TabelaCelula>
                <TabelaCelula align="direita" mono className="max-w-[140px] flex-none">
                  {brl(linha.valor)}
                </TabelaCelula>
              </TabelaLinha>
            ))}
            <TabelaLinha className="bg-nevoa">
              <TabelaCelula className="font-semibold">Total</TabelaCelula>
              <TabelaCelula className="max-w-[90px] flex-none">{""}</TabelaCelula>
              <TabelaCelula className="max-w-[110px] flex-none">{""}</TabelaCelula>
              <TabelaCelula align="direita" mono className="max-w-[140px] flex-none font-semibold">
                {brl(totalValor)}
              </TabelaCelula>
            </TabelaLinha>
          </Tabela>
        )}
      </div>
    </main>
  );
}

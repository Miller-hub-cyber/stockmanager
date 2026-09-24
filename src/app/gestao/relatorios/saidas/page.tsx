import { RelatorioMovimentacoes } from "../_componentes/RelatorioMovimentacoes";

interface Props {
  searchParams: { [chave: string]: string | string[] | undefined };
}

export default function PaginaRelatorioSaidas({ searchParams }: Props) {
  return (
    <RelatorioMovimentacoes
      modo="saida"
      titulo="Relatório de saídas"
      descricao="Peças e materiais que saíram do estoque, com frota, colaborador e centro de custo."
      rota="/gestao/relatorios/saidas"
      searchParams={searchParams}
    />
  );
}

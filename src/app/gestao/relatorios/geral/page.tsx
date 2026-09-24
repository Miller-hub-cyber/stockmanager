import { RelatorioMovimentacoes } from "../_componentes/RelatorioMovimentacoes";

interface Props {
  searchParams: { [chave: string]: string | string[] | undefined };
}

export default function PaginaRelatorioGeral({ searchParams }: Props) {
  return (
    <RelatorioMovimentacoes
      modo="geral"
      titulo="Relatório geral"
      descricao="Todas as movimentações, entradas e saídas juntas, inclusive estornos."
      rota="/gestao/relatorios/geral"
      searchParams={searchParams}
    />
  );
}

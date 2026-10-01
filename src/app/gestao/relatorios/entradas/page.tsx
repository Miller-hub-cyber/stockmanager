import { RelatorioMovimentacoes } from "../_componentes/RelatorioMovimentacoes";

interface Props {
  searchParams: { [chave: string]: string | string[] | undefined };
}

export default function PaginaRelatorioEntradas({ searchParams }: Props) {
  return (
    <RelatorioMovimentacoes
      modo="entrada"
      titulo="Relatório de entradas"
      descricao="Peças e materiais que entraram no estoque, com fornecedor e frota."
      rota="/gestao/relatorios/entradas"
      searchParams={searchParams}
    />
  );
}

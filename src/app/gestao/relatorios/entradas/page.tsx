import { RelatorioMovimentacoes } from "../_componentes/RelatorioMovimentacoes";

interface Props {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}

export default async function PaginaRelatorioEntradas(props: Props) {
  const searchParams = await props.searchParams;
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

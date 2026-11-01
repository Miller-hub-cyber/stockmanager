import { RelatorioMovimentacoes } from "../_componentes/RelatorioMovimentacoes";

interface Props {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}

export default async function PaginaRelatorioGeral(props: Props) {
  const searchParams = await props.searchParams;
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

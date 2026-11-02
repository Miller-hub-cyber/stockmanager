# Banco de produção e carga inicial

Como o banco de produção funciona e como preparar as planilhas da carga inicial. O passo a passo para criar o banco, liberar usuários e fazer o deploy está em [`implantacao-producao.md`](implantacao-producao.md).

## Como o banco funciona

- **Projeto separado do de testes.** O banco de desenvolvimento tem a "Transportadora Exemplo" e movimentações fictícias. Como movimentação não pode ser apagada, produção começa num projeto novo e limpo.
- **Saldo é derivado.** Ninguém digita saldo. Ele é calculado pelo banco a partir das entradas e saídas, inclusive o custo médio.
- **Data de corte.** A carga inicial usa uma data de corte, por exemplo 01/10/2026:
  1. o saldo que existia no corte entra como **entrada** com a data do corte;
  2. as entradas e saídas posteriores entram **com a data original**, em ordem.

  Só o admin, ou um script rodado direto no banco, pode lançar movimentação com data passada. O banco recusa data no futuro e recusa uma data anterior à última movimentação do mesmo item, para não bagunçar o custo médio (migration `0023`).
- **Biblioteca de nomes.** `catalogo_itens` tem cerca de 300 nomes padronizados de peças e materiais, com categoria, unidade e NCM sugerido (migrations `0021` e `0022`). Ao cadastrar um item em Gestão → Itens → Novo, o nome é sugerido enquanto se digita. **O NCM é uma sugestão e precisa ser confirmado com a contabilidade.**

## Planilhas para a carga

| O quê | Modelo | Observação |
|---|---|---|
| Itens + saldo no corte | Gestão → Itens → Importar → baixar modelo | "Saldo inicial" e "Custo inicial" = posição na data de corte |
| Movimentações após o corte | [`docs/modelos/movimentacoes-apos-corte.csv`](modelos/movimentacoes-apos-corte.csv) | Uma linha por movimentação, em ordem de data |

Regras da planilha de movimentações:

- **Tipo**: `entrada` ou `saida`.
- **Entrada**: informe o custo unitário. Fornecedor é opcional.
- **Saída**: obrigatório informar **frota/placa** ou **centro de custo**. Saída sem destino é recusada pelo banco.
- **SKU** precisa existir na planilha de itens.
- Quantidade e valor no formato brasileiro (`48,90`).

A carga dos itens com data de corte e a das movimentações é feita por script SQL gerado a partir das planilhas. A importação pela tela lança o saldo inicial com a data de hoje, não com a data do corte.

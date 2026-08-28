# Prompt de design — StockManager

Cole o bloco abaixo no Claude Code, com o `CLAUDE.md` já na raiz do repositório.
Este prompt define a identidade visual. O `CLAUDE.md` define as regras técnicas. Os dois se complementam.

---

## PROMPT (copie daqui para baixo)

Leia o `CLAUDE.md` antes de começar. Este prompt define o sistema de design do projeto. Implemente o design system completo antes de construir qualquer tela: tokens no `tailwind.config.ts`, estilos globais em `globals.css` e os componentes base em `src/components/ui/`.

### Produto

**StockManager** — controle de estoque operacional interno para empresa de logística. Controla peças de frota, lubrificantes, EPI, insumos e ferramentas de uso próprio.

Dois usuários com contextos opostos:

- **Almoxarife.** De pé no balcão do almoxarifado, celular ou tablet na mão, às vezes de luva, luz irregular, pressa. Registra dezenas de saídas por dia. Precisa confirmar o resultado a um braço de distância, sem ler texto pequeno.
- **Gestor.** Sentado, no computador, poucas vezes por semana. Lê tabela densa, filtra, exporta.

O design não é o mesmo para os dois. É o mesmo sistema com duas densidades.

### Direção visual

A referência não é software SaaS genérico. É o vocabulário visual do próprio almoxarifado: etiqueta de prateleira, sinalização de segurança, numeral estampado em caixa, mostrador de balança industrial.

Isso significa: superfícies sólidas e foscas, contraste alto, numerais grandes com unidade em rótulo pequeno, tipografia condensada em títulos, largura fixa em código e quantidade.

Não use: gradiente colorido, glassmorphism, sombra difusa grande, ilustração 3D, emoji na interface, fundo creme ou bege, verde-limão neon.

### Paleta

Defina exatamente estes tokens no Tailwind. Não invente cor fora desta lista.

| Token | Hex | Uso |
|---|---|---|
| `carbono` | `#14181D` | Fundo da área de operação |
| `aco` | `#212933` | Superfície elevada sobre carbono, cabeçalho da gestão |
| `grafite` | `#3A4450` | Bordas e divisórias no escuro |
| `petroleo` | `#0F5563` | Cor de marca, ação primária, estados ativos |
| `petroleo-claro` | `#177A8F` | Hover e foco da ação primária |
| `ambar` | `#F5A524` | Alerta operacional: abaixo do ponto de reposição |
| `carmim` | `#D64545` | Bloqueio e erro: saldo insuficiente, item esgotado |
| `musgo` | `#3F8F6F` | Confirmação de sucesso |
| `nevoa` | `#F1F4F6` | Fundo da área de gestão |
| `giz` | `#DDE3E8` | Bordas e divisórias no claro |
| `tinta` | `#1B2026` | Texto principal sobre fundo claro |
| `bruma` | `#6C7885` | Texto secundário nos dois modos |

Regra de dominância: `petroleo` é a cor da marca e aparece em toda ação primária. `ambar` e `carmim` são exclusivos de estado do estoque e nunca decoram nada. Se você usar âmbar em um botão que não seja de alerta, está errado.

A área de operação é escura por decisão funcional: balcão de almoxarifado tem luz ruim e tela escura cansa menos em uso repetitivo. A área de gestão é clara porque tabela densa se lê melhor em fundo claro.

### Tipografia

Carregue via `next/font/google`:

- **Archivo** — títulos, rótulos de seção e numerais grandes. Pesos 600 e 700. Use `font-stretch` condensado onde disponível.
- **IBM Plex Sans** — corpo, formulários, descrições. Pesos 400 e 500.
- **IBM Plex Mono** — SKU, código de barras, quantidade, valor e placa de veículo. Peso 500.

Mono em dado numérico e código não é estética, é função: alinha coluna em tabela e evita confusão entre caracteres parecidos na leitura rápida.

Escala de tipo:

| Papel | Tamanho | Face |
|---|---|---|
| Numeral de saldo (operação) | 56px / 700 | Archivo |
| Título de tela | 28px / 700 | Archivo |
| Rótulo de seção | 12px / 600, letra espaçada 0.08em, caixa alta | Archivo |
| Corpo | 15px / 400 | IBM Plex Sans |
| Corpo denso (tabela) | 13px / 400 | IBM Plex Sans |
| Dado e código | 14px / 500 | IBM Plex Mono |
| Legenda | 12px / 400, cor `bruma` | IBM Plex Sans |

### Elemento de assinatura

**A etiqueta de item.** Todo item aparece no sistema no mesmo formato, em qualquer tela:

```
┌──────────────────────────────────────┐
│ FILTRO DE ÓLEO MANN W950             │  Archivo 600
│ FLT-0042                             │  Plex Mono, cor bruma
│                                      │
│  12  UN            ● ABAIXO DO MÍNIMO│  numeral Archivo 700 + ponto ambar
└──────────────────────────────────────┘
```

O numeral do saldo é sempre o maior elemento do bloco, com a unidade em rótulo pequeno ao lado, como mostrador de balança. O ponto colorido de estado fica sempre à direita, na mesma posição, em todas as telas. Quem usa aprende a ler o estado pela posição, não pela leitura.

Estados do ponto: `musgo` normal, `ambar` abaixo do ponto de reposição, `carmim` esgotado.

**Confirmação de tela cheia.** Após registrar uma saída, o resultado ocupa a tela inteira por 1,4 segundo em `musgo` com o nome do item e a quantidade em corpo grande, depois volta sozinho para a busca. O almoxarife confirma o acerto de longe, sem ler. Em caso de erro, o mesmo padrão em `carmim` com a mensagem do que aconteceu, sem retorno automático.

Gaste a ousadia do projeto nesses dois elementos. Todo o resto é discreto.

### Layout

**Operação (`/operacao`)** — mobile first, coluna única, largura máxima 520px centralizada.

```
┌─────────────────────────────┐
│  StockManager      Almox ▾  │  cabeçalho 56px, fundo aco
├─────────────────────────────┤
│                             │
│  [ 📷 ]  Buscar item        │  campo 56px, ícone abre a câmera
│                             │
│  ┌───────────────────────┐  │
│  │ etiqueta do item      │  │
│  └───────────────────────┘  │
│                             │
│  QUANTIDADE                 │  rótulo de seção
│    [ − ]    2    [ + ]      │  botões 56x56, numeral 40px
│                             │
│  DESTINO                    │
│  [ABC-1234] [DEF-5678] ...  │  últimos usados, chips 48px
│                             │
├─────────────────────────────┤
│   REGISTRAR SAÍDA           │  fixo no rodapé, 64px, petroleo
└─────────────────────────────┘
```

Regras da operação: alvo de toque mínimo 48px, ação primária ancorada no rodapé dentro do alcance do polegar, nenhum campo digitado quando puder ser selecionado ou escaneado, sem menu lateral, sem migalha de navegação.

**Gestão (`/gestao`)** — desktop first, trilho lateral fixo de 240px em `aco`, conteúdo em `nevoa`.

```
┌────────┬────────────────────────────────────────┐
│ Stock  │  Itens                        [+ Novo] │
│ Manager│  ────────────────────────────────────  │
│        │  [busca] [categoria ▾] [estado ▾]      │
│ Painel │  ┌──────────────────────────────────┐  │
│ Itens  │  │ SKU     Item      Saldo  Custo ● │  │
│ Compras│  │ mono    plex      mono   mono    │  │
│ Relat. │  └──────────────────────────────────┘  │
│ Cadast.│                                        │
└────────┴────────────────────────────────────────┘
```

Regras da gestão: número sempre alinhado à direita em mono, linha de tabela com 44px de altura, cabeçalho de tabela fixo na rolagem, filtro sempre visível acima da tabela.

### Componentes base

Crie em `src/components/ui/`, cada um com variante `operacao` e `gestao`:

`Botao`, `Campo`, `Seletor`, `Etiqueta` (o card de item), `Chip` (destino e filtro), `Tabela`, `Indicador` (card de número no painel), `PontoEstado`, `Aviso`, `TelaResultado`.

Raio de canto: 6px em tudo. Sem exceção, sem elemento arredondado por completo exceto o `Chip` e o `PontoEstado`.

Sombra: apenas uma, sutil, em elemento flutuante (modal e menu). Card não tem sombra, tem borda.

### Movimento

Só três, e nada além disso:

1. Transição de cor em 120ms em botão e chip
2. Entrada da tela de resultado com fade e escala de 0.98 para 1 em 180ms
3. Estado de carregamento como pulso de opacidade, nunca girando

Respeite `prefers-reduced-motion`: desligue tudo, mantenha a tela de resultado sem animação.

### Voz da interface

Português do Brasil, frase em caixa baixa exceto rótulos de seção, verbo no infinitivo em botão de ação.

- O botão diz "Registrar saída" e o resultado diz "Saída registrada". Mesma palavra do começo ao fim.
- Erro explica o que houve e o que fazer: "Saldo insuficiente. Disponível: 3 UN. Faça o ajuste por inventário antes de registrar."
- Erro não pede desculpa e não é vago. Nada de "Ops, algo deu errado".
- Tela vazia convida à ação: "Nenhum item cadastrado. Comece importando sua planilha atual."
- Nunca use termo de sistema na interface. É "material" e "retirada", não "registro" e "transação".

### Piso de qualidade

Antes de considerar qualquer tela pronta: responsiva até 360px de largura, foco de teclado visível em `petroleo-claro` com anel de 2px, contraste mínimo 4.5:1 em texto, área de toque de 48px em toda a operação, e a tela de saída inteira funcionando com uma única mão.

### Ordem de execução

1. Configure fontes e tokens no `tailwind.config.ts` e `globals.css`
2. Construa os dez componentes base com uma página de demonstração em `/design` mostrando todos os estados
3. Só depois construa as telas reais

Ao terminar o passo 2, me mostre a página `/design` antes de avançar.

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

Defina exatamente estes tokens no Tailwind. Não invente família de cor fora desta lista.

A paleta sai da logo: azul-marinho `#13233F` (`aco` e `tinta`), laranja `#F2A33A` (`ambar`) e azul-acinzentado `#A9B7CF` (`bruma-luz`). Os demais neutros e o `cobalto` são da mesma matiz do marinho (~217°).

| Token | Hex | Uso |
|---|---|---|
| `carbono` | `#0C1A2E` | Fundo da área de operação |
| `aco` | `#13233F` | Marinho da logo. Superfície elevada sobre carbono, cabeçalho da operação, trilho da gestão |
| `grafite` | `#2E4366` | Bordas e divisórias estruturais no escuro (não interativas) |
| `cobalto` | `#1F4E94` | Ação primária, estados ativos |
| `cobalto-claro` | `#2F6ED3` | Hover da ação primária, borda de item selecionado (passa 3:1 contra `aco` e branco) |
| `cobalto-luz` | `#598BDC` | Foco e link em contexto escuro (4.5:1 contra `aco`, 3:1 contra `nevoa`) |
| `laranja` | `#F2A33A` | Laranja da logo como acento de marca: traço de título e de rótulo, indicador de navegação ativa, mira do leitor (7.5:1 contra `aco`) |
| `laranja-texto` | `#A05C0D` | Ícone/texto de marca em contexto claro (5.2:1 contra branco) |
| `laranja-fundo` | `#FCEDD9` | Fundo de ícone de atalho em contexto claro |
| `ambar` | `#F2A33A` | Mesmo tom do `laranja`, papel diferente: ícone/borda de alerta em contexto **escuro** (reprova texto/ícone em fundo claro) |
| `ambar-texto` | `#8A5A00` | Texto/ícone de alerta em contexto claro |
| `ambar-fundo` | `#FBEBCB` | Fundo de badge de alerta em contexto claro |
| `carmim` | `#D64545` | Bloqueio, erro, ícone/borda de estado crítico nos dois contextos |
| `carmim-texto` | `#B03030` | Texto de estado crítico em contexto claro |
| `carmim-luz` | `#E57373` | Texto de estado crítico em contexto escuro |
| `carmim-fundo` | `#F6DADA` | Fundo de badge crítico em contexto claro |
| `musgo` | `#3F8F6F` | Confirmação de sucesso, ícone/borda nos dois contextos |
| `musgo-texto` | `#2F6F55` | Texto de sucesso em contexto claro |
| `musgo-luz` | `#5DB38F` | Texto de sucesso em contexto escuro |
| `musgo-fundo` | `#D8EBE3` | Fundo de badge de sucesso em contexto claro |
| `nevoa` | `#EEF2F7` | Fundo da área de gestão |
| `giz` | `#D8E0EB` | Bordas e divisórias estruturais no claro (não interativas) |
| `tinta` | `#13233F` | Texto principal sobre fundo claro |
| `bruma` | `#687792` | Ícone/borda de estado inativo; borda de campo e card clicável nos dois contextos |
| `bruma-texto` | `#53627C` | Texto secundário em contexto claro — `bruma` sozinho reprova 4.5:1 |
| `bruma-luz` | `#A9B7CF` | Azul-acinzentado da logo. Texto secundário em contexto escuro — `bruma` sozinho reprova 4.5:1 |

Subchaves: `DEFAULT` é ícone, borda e barra; `texto` é texto em fundo claro; `luz` é texto em fundo escuro; `fundo` é badge em contexto claro.

Regra de dominância: `aco` (o marinho da logo) é a cor da marca e domina as superfícies de marca. `cobalto` aparece em toda ação primária. `ambar` e `carmim` são exclusivos de estado do estoque e nunca decoram nada. Se você usar âmbar em um botão que não seja de alerta, está errado.

O laranja da logo aparece em dois tokens com o mesmo hex. `ambar` é estado; `laranja` é personalidade. O que separa os dois é o lugar: `laranja` vive só na moldura do app (navegação, títulos, rótulos, perfil do usuário, ícone de atalho, seleção de texto, mira do leitor) e nunca em botão, em número, em barra de gráfico nem dentro da `Etiqueta`. Se o laranja puder ser lido como "este item precisa de atenção", use outra cor.

Formas de uso já prontas em `globals.css`: `titulo-tela` (título com traço laranja pendurado na margem esquerda) e `rotulo-secao` (rótulo da operação com traço laranja à esquerda).

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

Estados do ponto: `musgo` normal (ícone `CircleCheck`), `ambar` abaixo do ponto de reposição (ícone `TriangleAlert`), `carmim` esgotado (ícone `OctagonX`), `bruma` inativo (ícone `Archive`). O ícone substitui o ponto colorido quando o estado é conhecido; nunca depende só da cor, o texto ao lado é a alternativa acessível.

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
│   REGISTRAR SAÍDA           │  fixo no rodapé, 64px, cobalto
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

Movimento existe para confirmar a ação, não para enfeitar. Todo ele usa a curva `ease-mola` (`cubic-bezier(0.2, 0.8, 0.2, 1)`: sai rápido e assenta suave) e nada passa de 300ms. Este é o vocabulário completo:

1. **Cor** — transição de 150ms em botão, chip, link e borda de card.
2. **Toque** — o elemento pressionado encolhe: botão e card para 0.98–0.99, chip para 0.95, ícone de navegação para 0.9. Confirma o toque mesmo de luva.
3. **Indicador deslizante** — menu lateral da gestão e abas da operação têm um único destaque que desliza até o item escolhido em 300ms. Ele se move no clique (`useCaminhoOtimista`), sem esperar a resposta do servidor.
4. **Entrada** — `animate-entrada`: fade com subida de 6px em 220ms. Vale para toda página nova (aplicado no layout), para cada troca de bloco na operação (busca → item → lista) e para os cartões de atalho, escalonados em 30ms.
5. **Tela de resultado** — fade e escala de 0.98 para 1 em 200ms.
6. **Carregamento** — pulso de opacidade, nunca girando. Navegação mostra o esqueleto de `loading.tsx` na hora do clique; filtro esmaece o resultado e pulsa o botão até a nova página chegar.

Não anime dado: numeral de saldo, valor e linha de tabela aparecem prontos. Respeite `prefers-reduced-motion`: `globals.css` desliga toda animação e transição, e a tela de resultado aparece sem animação.

### Voz da interface

Português do Brasil, frase em caixa baixa exceto rótulos de seção, verbo no infinitivo em botão de ação.

- O botão diz "Registrar saída" e o resultado diz "Saída registrada". Mesma palavra do começo ao fim.
- Erro explica o que houve e o que fazer: "Saldo insuficiente. Disponível: 3 UN. Faça o ajuste por inventário antes de registrar."
- Erro não pede desculpa e não é vago. Nada de "Ops, algo deu errado".
- Tela vazia convida à ação: "Nenhum item cadastrado. Comece importando sua planilha atual."
- Nunca use termo de sistema na interface. É "material" e "retirada", não "registro" e "transação".

### Piso de qualidade

Antes de considerar qualquer tela pronta: responsiva até 360px de largura, foco de teclado visível em `cobalto-luz` com anel de 2px (passa 3:1 tanto em fundo claro quanto escuro), contraste mínimo 4.5:1 em texto normal e 3:1 em texto grande/ícone/borda de campo, área de toque de 48px em toda a operação, e a tela de saída inteira funcionando com uma única mão.

### Ordem de execução

1. Configure fontes e tokens no `tailwind.config.ts` e `globals.css`
2. Construa os dez componentes base com uma página de demonstração em `/design` mostrando todos os estados
3. Só depois construa as telas reais

Ao terminar o passo 2, me mostre a página `/design` antes de avançar.

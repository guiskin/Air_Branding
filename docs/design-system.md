# Design System do Air Gestor

Fonte única: `src/estilos.css`. Este arquivo descreve o que existe lá e as regras para mexer. Se o CSS mudar, atualize aqui.

Origem da identidade: site e Instagram da Air (cores, fontes e formas lidos em 2026-11-17). O laranja `#FF3301`, o vinho `#661100`, o amarelo `#FFCD4D`, o preto `#121212`, Barlow Condensed nos títulos e Poppins no texto são da marca. Os neutros, os tons de status e o tema escuro são decisões deste projeto, não da marca.

## Regras de uso

1. Nenhuma cor em hex fora de `:root` e do bloco `:root[data-tema='escuro']` em `estilos.css`. Nada de hex em JS ou JSX.
2. Estilo inline só para valor calculado em tempo de execução (hoje, só a largura da `Barra`).
3. Reaproveite as classes abaixo antes de criar outra. Classe nova em português.
4. Cor nova entra nos dois temas e passa pela checagem de contraste (seção Acessibilidade).
5. Laranja da marca só em ação principal, item ativo e progresso. Status não usa laranja.

## Tema

- Claro é o padrão. O escuro é ativado pelo atributo `data-tema="escuro"` no `<html>`; todas as cores vêm das variáveis, então nada mais muda.
- O botão para o usuário alternar (e lembrar a escolha) chega na fase 2 da tarefa 003. Até lá o atributo só pode ser posto manualmente.

## Tokens de cor

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--marca` | `#ff3301` | igual | Cabeçalho, fundo do login |
| `--marca-escura` | `#661100` | igual | Barra do timer |
| `--destaque` | `#ffcd4d` | igual | Reservado (amarelo oficial); ainda sem uso |
| `--sobre-marca` | `#121212` | igual | Texto sobre o laranja |
| `--sobre-marca-hover` | `rgba(18,18,18,.12)` | igual | Hover dos botões de navegação no cabeçalho |
| `--veu` | `rgba(18,18,18,.55)` | `rgba(0,0,0,.7)` | Fundo escurecido atrás das janelas |
| `--fundo` | `#f5f5f5` | `#0f0f0f` | Fundo da página e blocos internos |
| `--cartao` | `#ffffff` | `#181818` | Cartões, campos, janelas |
| `--tinta` | `#121212` | `#f2f2f2` | Texto principal e foco |
| `--suave` | `#555555` | `#a9a9a9` | Texto de apoio |
| `--borda` | `#e0e0e0` | `#2e2e2e` | Contorno decorativo de cartões |
| `--borda-forte` | `#858585` | `#8c8c8c` | Contorno de campos e botões |
| `--linha` | `#ececec` | `#262626` | Divisores de lista |
| `--trilho` | `#e6e6e6` | `#333333` | Fundo da barra de progresso |
| `--acento` | `#e12f00` | igual | Botão primário e progresso |
| `--acento-hover` | `#c42a00` | igual | Botão primário em hover |
| `--acento-texto` | `#b82500` | `#ff8466` | Links e texto de ação |
| `--perigo` | `#b3261e` | `#ff6b63` | Texto de erro e atraso |
| `--perigo-fundo` | `#b3261e` | igual | Fundo de botão e aviso de erro |
| `--bom` | `#14592e` | `#5ccb8a` | Texto de sucesso |
| `--branco`, `--branco-hover` | `#ffffff`, `#e8e8e8` | igual | Botão `.claro` (fixo sobre laranja e vinho) |
| `--inverso`, `--sobre-inverso` | `#121212`, `#fff` | `#2b2b2b`, `#fff` | Aviso (toast) |

### Status das entregas

Cada status tem fundo e texto, nos dois temas. A classe `status-<id>` define `--st-bg` e `--st-fg`; `.etiqueta`, `.status-seletor`, `.coluna-topo` e `.pilula` consomem esses dois.

| Status | Claro (fundo / texto) | Escuro (fundo / texto) |
|---|---|---|
| backlog | `#eceef1` / `#3d4753` | `#2a2d33` / `#c5cbd6` |
| aguardando | `#f6e7d2` / `#7a4a0b` | `#3a2b14` / `#f0c98a` |
| planejado | `#dde7fb` / `#1d439c` | `#1b2a4d` / `#a9c1f5` |
| andamento | `#ffe9a8` / `#5e4300` | `#3e3208` / `#f5d26b` |
| revisao | `#eadcf8` / `#5a2a8c` | `#33204d` / `#d4b5f2` |
| aprovacao | `#d6f0f2` / `#0d5560` | `#0e3a40` / `#8fd8e2` |
| ajustes | `#fbdde6` / `#8a1c44` | `#4a1527` / `#f5a8c0` |
| concluido | `#d5efdd` / `#14592e` | `#12351f` / `#8edba8` |

Os ids e nomes dos status vivem em `src/dados.js` (e no `check` do SQL); as cores vivem só no CSS.

### Avatares

Oito cores (`--avatar-0` a `--avatar-7`), iguais nos dois temas, texto sempre branco. `corPessoa(id)` em `dados.js` devolve o índice; o componente aplica `.avatar.cor-N`.

## Tipografia

- Títulos: Barlow Condensed 800, caixa alta, `h1` 40px (32px no celular), `h2` 26px, `h2.titulo-grupo` 20px.
- Texto: Poppins 400/500/600/700, 15px base, `.pequeno` 13px, rótulos de campo 13px em negrito.
- Números de horas e relógio: `font-variant-numeric: tabular-nums` no timer.

## Espaçamento e forma

- Espaços entre blocos: `.pilha` (12px), `.pilha.minima` 4, `.curta` 6, `.media` 8, `.solta` 16, `.larga` 20. `.fila` 12px na horizontal.
- Margens da página: 24px (16px até 600px de largura), conteúdo até 1240px.
- Raios: `--raio-botao` 8px, `--raio-campo` 8px, `--raio-cartao` 10px, `--raio-janela` 12px, `--raio-interno` 8px (blocos dentro de cartão). Etiquetas, pílulas e avatares são totalmente arredondados.
- Alvo de toque mínimo: 44px de altura em botões, campos e linhas clicáveis.

## Componentes (classes existentes)

| Componente | Classes | Observações |
|---|---|---|
| Botão | `.botao` + `.primario`, `.escuro`, `.vermelho`, `.claro`, `.nav`, `.texto`, `.pequeno` | Um primário por área. `.claro` é branco fixo (usado sobre laranja e vinho). `.escuro` inverte conforme o tema. |
| Campo | `.campo` (rótulo + controle), `.entrada`, `.status-seletor` | Sempre com `label` e `htmlFor`. |
| Cartão | `.cartao`, `.projeto-cartao`, `.cartao-quadro`, `.bloco`, `.comentario` | |
| Lista | `.linha`, `.linha-titulo` | Linha clicável tem hover sublinhado no título. |
| Status | `.etiqueta`, `.status-seletor`, `.coluna-topo`, `.pilula` | Sempre com a classe `status-<id>`. |
| Tarefa e etapa | `.etapa`, `.marca-etapa` (`feito`, `agora`, `depois`), `.nome-etapa` | |
| Pessoas | `.avatar`, `.avatares`, `.pilula.pessoa` | |
| Progresso | `.barra` | Tem `role="img"` e rótulo com a porcentagem. |
| Timer | `.timer`, `.relogio` | Fundo vinho, texto branco. |
| Aviso | `.aviso`, `.aviso.erro` | Erro usa `role="alert"`; sucesso `role="status"` e some em 4 s. |
| Janela | `.veu`, `.janela` | `role="dialog"` e `aria-modal`. |
| Estados | texto "Carregando…", cartão de erro com "Tentar de novo", frases de vazio | Ainda sem esqueleto de carregamento nem ação nos vazios; melhoria prevista. |
| Layout | `.colunas`, `.principal`, `.lateral`, `.grade`, `.centro` | |

## Acessibilidade

Meta: WCAG 2.2 AA.

- Foco visível: `:focus-visible` com contorno de 3px em `--tinta`; sobre o laranja, vinho e avisos o contorno muda para uma cor que contrasta.
- Contraste mínimo: 4,5:1 em texto, 3:1 em contorno de campo e botão, 3:1 em texto grande. Medido nos dois temas.
- Movimento: transições curtas (0,12 s) só em cor e contorno; `prefers-reduced-motion` desliga todas.
- Erro anunciado com `role="alert"`. Botões de alternância com `aria-pressed`.
- Celular: sem rolagem horizontal da página em 375px (o Quadro rola dentro da própria área).

### Contraste medido (fase 1, 2026-11-17)

Cálculo WCAG sobre os valores das variáveis:

| Par | Claro | Escuro |
|---|---|---|
| `--suave` sobre `--cartao` | 7,46 | 7,55 |
| `--suave` sobre `--fundo` | 6,84 | 8,16 |
| `--acento-texto` sobre `--cartao` | 6,36 | 7,39 |
| `--perigo` sobre `--fundo` (claro) / `--cartao` (escuro) | 6,00 | 6,37 |
| `--bom` sobre `--fundo` (claro) / `--cartao` (escuro) | 7,71 | 8,76 |
| Branco sobre `--acento` | 4,56 | 4,56 |
| Branco sobre `--perigo-fundo` | 6,54 | 6,54 |
| Branco sobre `--marca-escura` | 12,76 | 12,76 |
| `--sobre-marca` sobre `--marca` | 5,11 | 5,11 |
| `--borda-forte` sobre `--cartao` (3:1) | 3,69 | 5,28 |
| `--acento` sobre `--trilho` (barra, 3:1) | 3,65 | 3,45 |
| Status (texto sobre fundo), pior dos oito | 6,15 | 7,71 |
| Texto branco sobre os avatares, pior dos oito | 6,41 | 6,41 |

Conferência no navegador: um script percorreu todo texto visível e todos os campos de Meu dia, Projetos, Projeto (lista e Quadro), painel da entrega, Equipe e piloto e Login, nos dois temas, com as transições desligadas, e não achou par abaixo do mínimo. Largura de 375px sem rolagem horizontal em todas essas telas, exceto o Login, que não foi medido nessa largura.

Limites: o contraste do contorno dos campos (3:1) foi calculado, não medido na tela; o script mede só texto. Não foi testado com leitor de tela.

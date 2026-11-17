# 003: Air Creative Workspace (menu lateral, tema claro/escuro e painéis do projeto)

- **Status:** aprovada pelo usuário no chat em 2026-11-17. Fase 1 publicada na `main`; fase 2 implementada (aguarda revisão e merge); fases 3 a 5 não iniciadas.
- **Branch:** uma por fase: `feat/ux-1-fundacao`, `feat/ux-2-menu-lateral`, `feat/ux-3-projeto`, `feat/ux-4-coluna-lateral`, `feat/ux-5-foto` (fase 5 só se aprovada)

## Objetivo

Trocar o visual do piloto (topo laranja e telas de coluna única) por um workspace de agência, moderno e corporativo, com a identidade da Air: menu lateral com clientes e projetos, lista densa de entregas agrupada por status, painel da entrega ao lado, botão Claro/Escuro e, ao lado do projeto, linha do tempo, regras automáticas e equipe do projeto. Resolve também o problema de usabilidade em que o painel da entrega aparece abaixo da lista no celular.

Referências aprovadas no chat: esboço "D3" (menu lateral, lista agrupada, coluna de painéis), inspirado em monday, Onplana, PixStudio e Linear/Descript. Nenhuma decisão visual foi validada com usuários reais; é direção de design aprovada pelo dono do projeto, não resultado de pesquisa.

## Escopo

**Fase 1: fundação visual (sem mudar o layout)**
- Tokens em `:root` e tema escuro por `[data-tema="escuro"]`: cores neutras (laranja `#FF3301` só em ação principal, item ativo e progresso), raios (8px botões e campos, 10px cartões), cores de status por ponto, bordas com contraste mínimo de 3:1, estado de foco visível, hover e `prefers-reduced-motion`.
- Trocar os 37 estilos inline e as cores fixas em hex de `Painel.jsx` por classes e variáveis.
- Tirar as cores fixas de `src/dados.js` (`STATUS` com `bg` e `fg`, `CORES` dos avatares) e passá-las para variáveis CSS com versão clara e escura. `dados.js` mantém `id` e `nome` dos status; o `check` do SQL não muda, pois não guarda cores.
- Erros de aviso com `role="alert"`.
- Criar `docs/design-system.md` com tokens, componentes e regras de acessibilidade.

**Fase 2: estrutura (menu lateral e barra superior)**
- Menu lateral: Meu dia, Projetos, Equipe e piloto (só gestor), árvore Cliente > Projeto ativo, bloco do usuário (iniciais, nome, área), botão **Claro / Escuro** logo abaixo do nome (sol e meia-lua, com rótulo, `aria-pressed`) e botão **Sair**.
- Barra superior: caminho (cliente / código do projeto), timer rodando com parar, Reportar bug ou ideia.
- Preferência de tema lembrada no navegador. Primeira visita: claro.
- Celular: menu vira gaveta aberta por botão, com foco gerenciado.

**Fase 3: projeto (lista, indicadores e painel da entrega)**
- Lista de entregas em colunas (entrega, quem, prazo, status), agrupada por status e recolhível, com horas e etapa atual sob o título.
- Faixa de indicadores com dados já calculados: abertas, atrasadas, horas lançadas, % concluído.
- Visão Quadro mantida (sem arrastar).
- Painel da entrega como gaveta lateral no computador e folha de baixo no celular (corrige o painel que hoje cai abaixo da lista). Fecha com Esc e com o botão; foco entra no painel e volta à linha ao fechar.

**Fase 4: coluna ao lado do projeto**
- **Equipe do projeto:** pessoas com entregas no projeto, área e horas lançadas por pessoa. Iniciais no lugar da foto.
- **Linha do tempo:** uma barra por entrega aberta, da data de início até o prazo, com marcador de hoje e contorno para atrasada. Entrega sem prazo não tem barra e aparece numa linha "Sem prazo: N". Clique na barra abre o painel.
- **Regras automáticas (versão 1, só informativa):** lista as regras que já existem e são fixas: concluir etapa passa para o dono da próxima, chegar em "Aprovação do cliente" muda o status para Em aprovação, avançar etapa registra comentário. **Sem chave de ligar e desligar.**
- Desktop: coluna à direita da lista. Celular: os três painéis empilham abaixo da lista.

**Fase 5 (opcional, depende de aprovação separada do banco): foto de perfil**
- Foto no bloco do usuário e na Equipe do projeto. Ver seção Banco.

**Documentação (ao aprovar)**
- Linha do tempo sai da lista "fica para depois": atualizar `CLAUDE.md` (Escopo do piloto), `README.md`, `docs/regras-de-negocio.md` e `docs/decisoes.md`, com o pedido registrado.

## Fora do escopo

- Chaves reais nas automações, regras novas (por exemplo "prazo vencido: avisar quem faz") e qualquer notificação. Exigem regra de negócio definida pelo cliente e provavelmente banco.
- Busca de entregas (o esboço mostra o campo; não existe hoje). Fica como proposta a validar.
- Arrastar cartões no Quadro, rotas na URL, menções, Gantt interativo (editar datas pela barra), carga da equipe por semana, funil comercial, importação do ClickUp, exportação para BI.
- Mudança nas regras de negócio, nos 8 status e nos fluxos de etapas.
- Criar o agente `air-ux-ui-designer` e o `AGENTS.md` para o Codex: tarefa própria, a aprovar.

## Funcionalidades que devem continuar funcionando

Login e primeiro acesso; Meu dia (com "Hora sem tarefa" e tipo de hora); Projetos agrupados por cliente com progresso, atrasadas, pessoas e horas; criar cliente e projeto (gestor); Nova entrega (fluxo, quem começa, prazo, horas, Drive); painel da entrega (timer, lançamento manual, etapas com dono, concluir etapa e passar, status, prazo, prioridade, estimativa, responsáveis, briefing, link, comentários); barra do timer; relato de bug; Equipe e piloto (pessoas, convites, relatos); Sair; aviso de erro e barreira de erro; realtime.

## Arquivos prováveis

- `src/estilos.css` (tokens, componentes, tema escuro, responsivo).
- `src/App.jsx` (estrutura: menu lateral, barra superior, tema, gaveta no celular; `Login` ganha só os tokens).
- `src/telas.jsx` (lista agrupada, indicadores, coluna lateral).
- `src/Painel.jsx` (gaveta e folha de baixo; remoção das cores fixas).
- `src/pecas.jsx` (status em ponto, avatar, novos componentes de painel).
- `src/dados.js` apenas para funções puras de derivação (equipe do projeto, intervalo da linha do tempo), sem novas consultas.
- `docs/design-system.md` (novo), `docs/arquitetura.md`, `docs/regras-de-negocio.md`, `docs/decisoes.md`, `CLAUDE.md`, `README.md`.
- `index.html` se for preciso carregar mais um peso de fonte.

## Banco

Fases 1 a 4: **nenhuma mudança**. Linha do tempo usa o início e o prazo que `entregas` já guarda; equipe usa `entrega_responsaveis`, `pessoas` e `horas`; o tema fica no navegador.

Análise do `analista-banco` (somente leitura; o estado real da produção não está no repositório e precisa ser conferido no painel):

- **Tema claro/escuro: sem banco.** Fica no navegador (`localStorage`, com `try/catch` para modo privado). Coluna em `pessoas` só valeria para seguir a pessoa entre aparelhos, e traria a mesma barreira de permissão da foto, mais um piscar do tema errado até os dados carregarem. Dá para somar depois, usando o navegador como cache.
- **Linha do tempo: sem banco.** `entregas.inicio` e `entregas.prazo` são `date`, anuláveis. O início é gravado pelo front em `criarEntrega` (`inicio: hoje()`), sem gatilho nem valor padrão no banco, e nenhuma tela o edita: é a data de criação, não o início real do trabalho. Nada impede `prazo < inicio` e linhas gravadas por outro caminho podem ter `inicio` nulo. O desenho precisa tratar prazo nulo, início nulo (usar `criado_em`), prazo anterior ao início e entregas concluídas, e calcular dias a partir do texto `AAAA-MM-DD` sem `new Date('AAAA-MM-DD')`, que lê como UTC e pode deslocar um dia no fuso do Brasil.
- **Foto de perfil (fase 5): precisa de banco.** (1) Coluna nova em `pessoas` (por exemplo `foto_url`, anulável; sem foto, a interface cai nas iniciais) e um bucket novo no Storage, com políticas em `storage.objects`. (2) A política `pessoas_editar` hoje exige gestor: um membro que gravasse a própria foto teria 0 linhas atualizadas, **sem erro**, e a tela acharia que salvou. Abrir "update onde `id = auth.uid()`" é perigoso, porque a RLS não limita colunas e o membro poderia mudar o próprio `perfil` e virar admin. Caminhos seguros: (a) função `security definer` que atualiza só a foto da própria pessoa, a menor superfície; (b) política própria mais gatilho que rejeita mudança em outras colunas; (c) só gestor troca a foto de todos, simples e ruim de usar. (3) Bucket privado com política de leitura para membros, escrita só na pasta com o próprio `auth.uid()`, limite de 1 a 2 MB, só JPEG, PNG e WebP (sem SVG), imagem reduzida no navegador (por exemplo 256x256). Guardar o caminho do arquivo, não uma URL assinada (expira), e gerar a assinatura em `dados.js`, mantendo `montar()` pura. (4) Riscos: foto é dado pessoal (LGPD); apagar a pessoa não apaga o arquivo; cache mostra foto velha se o nome for fixo. O realtime de `pessoas` e o `select('*')` já levam a coluna nova; só o componente `Avatar` muda.
- **A conferir no painel do Supabase, antes de qualquer script:** quantas entregas têm `inicio` ou `prazo` nulos e se alguma tem `prazo < inicio`; se `pessoas` já ganhou `foto_url` por fora do repositório; quais buckets e políticas de Storage existem; se `pessoas_editar` ainda é só gestor; se `pessoas` está na publicação realtime; a cota de Storage do plano gratuito.
- Qualquer mudança de banco vira script novo `03_…` em `supabase/` (skill `nova-migracao`), com impacto e reversão, executado por você no SQL Editor, e `docs/banco-de-dados.md` atualizado junto. Nenhum script foi escrito.

## Decisões pendentes (para você ou para o cliente)

1. Linha do tempo entra no piloto? (hoje está em "fica para depois"). Mostra só entregas abertas ou também as concluídas recentes?
2. Regras automáticas: ficam só informativas na versão 1, ou o cliente quer chaves reais? Quais regras novas ele quer?
3. Foto de perfil: upload manual ou vinda da conta Google? Quem pode trocar a própria foto (a própria pessoa, por função segura no banco, ou só o gestor)? Bucket privado (recomendado) ou público?
4. Tema inicial na primeira visita: sempre claro, ou seguir a configuração do sistema do usuário? A escolha fica só no navegador ou deve seguir a pessoa entre aparelhos (exigiria banco)?
5. O início da entrega continua sendo a data de criação? Hoje não dá para editar, então a barra começa no dia em que a entrega foi cadastrada, não quando o trabalho começou.
6. Prioridade (hoje invisível nas listas) entra como indicador na lista? Não está no escopo; proponho decidir na fase 3.
7. Cores dos pontos de status: as do esboço são novas e ainda sem checagem de contraste.

## Riscos

- É a maior mudança visual do projeto: toca quase todos os arquivos de interface. Por isso uma branch por fase, e cada fase só segue após a anterior verificada.
- Regra do projeto de "classes CSS já existentes" e "sem estilo inline novo": o plano reaproveita os nomes atuais (`.cartao`, `.pilha`, `.fila`, `.botao`, `.campo`) e cria novas classes em português só quando falta.
- Tema escuro dobra a conferência de contraste (cada cor em dois temas).
- Verificar as telas internas no navegador exige um login de teste no Supabase; sem ele, só login e build ficam verificados.
- Linha do tempo e regras automáticas ampliam a expectativa do cliente. A versão 1 é informativa; isso precisa estar claro para quem usa.
- Branch `fix/seguranca-fase1` (segurança, tarefa 001) ainda não foi mesclada e mexe em `dados.js` e SQL. Conflitos prováveis em `dados.js` se as duas andarem juntas.
- `.claude/settings.json` está modificado pela instalação do plugin `frontend-design` (ativado no projeto) e ainda não foi commitado.

## Critérios de aceite

Valem para todas as fases, depois os específicos de cada uma.

- [ ] `npm run build` passa.
- [ ] Nenhuma funcionalidade da lista "Funcionalidades que devem continuar funcionando" foi removida ou quebrada.
- [ ] Nenhuma cor em hex fora de `:root` e do bloco do tema escuro em `src/`; nenhum estilo inline novo.
- [ ] Texto de interface com contraste mínimo de 4,5:1 e bordas de campos e controles com 3:1, nos dois temas (medido por script, resultado anotado em `docs/design-system.md`).
- [ ] Navegação por teclado: Tab percorre menu, lista e painel com foco visível; Esc fecha o painel.
- [ ] Sem rolagem horizontal da página em 375 px (o Quadro pode rolar dentro da própria área).

**Fase 1**
- [ ] Hover e foco visíveis em botões, campos, linhas e cartões clicáveis.
- [ ] Mensagens de erro anunciadas com `role="alert"`.
- [ ] `docs/design-system.md` existe e lista todos os tokens usados.

**Fase 2**
- [ ] Menu lateral mostra Meu dia, Projetos e a árvore Cliente > Projeto; "Equipe e piloto" aparece só para admin e coordenação.
- [ ] Sob o nome do usuário há o botão Claro / Escuro: clicar em Escuro muda o sistema inteiro; recarregar a página mantém a escolha.
- [ ] O timer rodando aparece na barra superior e "Parar" lança as horas como hoje.
- [ ] Sair e Reportar bug ou ideia continuam acessíveis.
- [ ] Em 375 px o menu fica fechado e abre por botão, com foco preso na gaveta e Esc para fechar.

**Fase 3**
- [ ] Lista do projeto agrupada por status, recolhível, com entrega, quem, prazo e status; atrasada em destaque.
- [ ] Faixa de indicadores confere com os números do card do projeto em Projetos (abertas, atrasadas, horas, % concluído).
- [ ] Clicar em uma entrega abre o painel ao lado no computador e como folha de baixo em 375 px, já visível sem rolar; fechar devolve o foco à linha.
- [ ] Mudar status, concluir etapa, iniciar e parar timer funcionam dentro do painel.

**Fase 4**
- [ ] Equipe do projeto lista as pessoas com entregas no projeto, com área e horas que conferem com a soma das horas lançadas.
- [ ] Linha do tempo: cada entrega aberta com prazo tem barra do início ao prazo; hoje está marcado; atrasada tem contorno; entrega sem prazo aparece em "Sem prazo: N"; clicar na barra abre o painel.
- [ ] Linha do tempo com dados difíceis: entrega com início nulo usa a data de criação; prazo anterior ao início não quebra a tela; um prazo em 20 de novembro cai no dia 20, não no 19, mesmo no fuso do Brasil.
- [ ] Regras automáticas listam só regras que existem no código e não têm chave de ligar e desligar.
- [ ] Em 375 px os três painéis ficam abaixo da lista, um embaixo do outro.

**Fase 5 (se aprovada)**
- [ ] Script de banco novo e numerado, executado por você, antes de qualquer código.
- [ ] Foto aparece no menu e na equipe; sem foto, aparecem as iniciais.

## Resumo do que mudou

### Fase 2 (branch `feat/ux-2-menu-lateral`)

- Criados: `src/menu.jsx` (menu lateral e barra superior), `src/tema.js` (tema no navegador).
- Alterados: `src/App.jsx` (cabeçalho e faixa do timer saem; entram `Menu`, `BarraTopo`, estado do menu e do tema), `src/estilos.css` (estrutura em menu lateral + barra superior, gaveta no celular, tokens `--ativo-*` e `--sombra-menu`; saem `.topo`, `.nav`, `.botao.nav` e `.timer`), `index.html` (script que aplica o tema salvo antes de pintar), `docs/design-system.md`, `docs/arquitetura.md`.
- Removidos: o cabeçalho laranja e a faixa de timer (substituídos pela barra superior e pelo menu); nenhuma funcionalidade. Meu dia, Projetos, Equipe e piloto, Reportar, Sair e Parar e lançar continuam.
- Mudanças visíveis: menu lateral fixo com clientes e projetos; barra superior branca com caminho, timer em chip vinho e Reportar; seletor Claro/Escuro sob o nome; o laranja deixa de ser o cabeçalho e fica no logo, no item ativo e nos botões primários.
- Verificado (dados simulados, perfis admin e membro): build; menu com Meu dia, Projetos e Equipe e piloto só para gestor; árvore expande e abre o projeto, com item ativo e caminho corretos; tema troca, persiste ao recarregar e é aplicado antes da página; timer aparece e o botão Sair responde; contraste de texto por script em Meu dia, Projetos, Projeto e Equipe, nos dois temas, em 1024 px e em 375 px, sem falhas; 375 px sem rolagem horizontal; gaveta: escondida, abre, Tab e Shift+Tab ficam presos, Esc e o fundo fecham, o foco volta ao botão do menu.
- Não verificado: dados reais e perfis coordenação e freelancer; leitor de tela; o aspecto final do nome do projeto em duas linhas no menu (ajuste feito depois do último teste visual); Parar e lançar gravando horas (o mock não grava).

### Fase 1 (branch `feat/ux-1-fundacao`)

- Criados: `docs/design-system.md`.
- Alterados: `src/estilos.css` (reescrito: tokens, tema escuro, status por classe, avatar por classe, foco, hover, `prefers-reduced-motion`, raios novos), `src/dados.js` (`STATUS` sem cores; `corPessoa` devolve índice), `src/pecas.jsx`, `src/telas.jsx`, `src/Painel.jsx`, `src/App.jsx` (classes no lugar de estilos inline e hex; erro com `role="alert"`), `docs/arquitetura.md`, `docs/decisoes.md`, `.claude/rules/frontend.md`.
- Removidos: nenhuma funcionalidade; saíram 36 estilos inline e todas as cores fixas em JS (resta só a largura calculada da `Barra`).
- Mudanças visíveis: fundo `#f5f5f5` (era `#faf6f2`), cantos de botões e campos em 8px e de cartões em 10px (eram pílula e 24px), barra do timer em vinho `#661100` (era preto), contorno de campos mais escuro, hover e foco.
- Verificado: `npm run build`; contraste de texto por script em 6 telas e no login, nos dois temas, sem falhas; 375px sem rolagem horizontal; foco por teclado visível. Feito com dados simulados, porque não há login de teste no Supabase.
- Não verificado: dados reais, leitor de tela, Login em 375px, contraste do contorno de campos medido na tela, alternância do tema (botão só na fase 2).
- Pendente do critério de aceite da fase 1: nenhum item aberto; "nenhum hex fora de `:root`" vale para `src/` (o `index.html` não tem cor).

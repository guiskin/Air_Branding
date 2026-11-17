# Roteiro de QA por perfil

Roteiro técnico para validar o piloto no navegador, perfil por perfil. É diferente do `docs/roteiro-de-testes.md`, que é para os testadores da equipe. Este serve ao agente `qa` e a quem fizer a conferência antes de uma publicação.

O que cada perfil deve ver e poder fazer vem das políticas do banco (`docs/banco-de-dados.md`) e das telas (`docs/regras-de-negocio.md`).

## Como executar

1. **Quem faz o login é a pessoa, nunca o agente.** O agente não digita senhas. Entre no navegador do Claude com a conta do perfil a testar e avise o agente.
2. Um perfil por vez. Para trocar de perfil, a pessoa clica em "Sair" e entra com a outra conta. O agente nunca sai de uma conta sozinho.
3. Tudo o que for criado leva o prefixo **`[QA]`** no nome ou no título, para ser achado e limpo depois.
4. Não há botão de apagar entrega, comentário nem horas na interface. A limpeza dos `[QA]` é feita depois, por SQL, e só com aprovação do usuário.
5. Não teste cadastro de conta nova nem reenvio de e-mail de confirmação: o limite de e-mails do Supabase (plano gratuito) é do projeto todo e bloqueia os cadastros reais.
6. Se aparecer um erro inesperado, copie a mensagem e o que você estava fazendo, e anote o caminho (tela, entrega).

Cada teste termina em **Passou**, **Falhou** (com o que apareceu), **Bloqueado** (não deu para testar) ou **Não testado**.

## A. Todos os perfis

| ID | Passos | Resultado esperado |
|---|---|---|
| QA-01 | Entrar com e-mail e senha corretos. | Abre "Meu dia" com "Olá, {primeiro nome}" e o nome no cabeçalho. |
| QA-02 | (Só com a tela de login aberta) Senha errada. | Mensagem "E-mail ou senha incorretos." Sem entrar. |
| QA-03 | Em aba anônima, abrir o endereço. | Só a tela de login. Nenhum dado aparece. |
| QA-04 | Em "Meu dia", ler a saudação. | Mostra a contagem de entregas "com você" e as horas lançadas hoje, ou o texto de que ainda não lançou. |
| QA-05 | "Hora sem tarefa": escolher projeto e tipo, "Iniciar timer", esperar alguns segundos, "Parar". | O timer aparece no cabeçalho e conta; ao parar, o tempo entra nas horas de hoje (mínimo 1 min). |
| QA-06 | Em "Projetos", abrir um projeto e "Nova entrega" (`[QA] Entrega`), fluxo "Conteúdo, design e aprovação do cliente", você como quem começa. | A entrega abre no painel, com 3 etapas e você como responsável da primeira. Status "Backlog". |
| QA-07 | No painel, editar título, briefing, prazo, prioridade e horas estimadas; sair de cada campo. | Os valores ficam salvos depois de recarregar a página. |
| QA-08 | Incluir e tirar uma pessoa em "Quem faz". | A pessoa aparece e some; a lista da entrega e "Meu dia" acompanham. |
| QA-09 | Definir quem faz cada etapa. "Concluir {etapa} e passar para {pessoa}". | A etapa vira "Feito", a próxima "Agora"; entra o comentário automático; o status muda (para "Em aprovação" quando a próxima é "Aprovação do cliente"). Na última etapa, o status vira "Concluído". |
| QA-10 | Mudar o status pela linha da lista e pelo quadro do projeto. | O novo status aparece nos dois lugares. |
| QA-11 | Escrever um comentário (botão e tecla Enter). | Entra na conversa com seu nome e a hora. |
| QA-12 | No painel, "Iniciar timer", "Parar"; depois "Lançar manual" com 30 minutos. | As horas da entrega somam o tempo medido e os 30 min. |
| QA-13 | Com um timer aberto, iniciar outro em outra entrega. | O primeiro é parado e fechado; só um timer fica aberto. |
| QA-14 | Com duas abas do mesmo usuário, mudar o status em uma. | A outra aba atualiza sozinha em instantes (realtime). |
| QA-15 | "Reportar bug ou ideia": tipo "Tenho uma sugestão", texto `[QA] sugestão`, "Enviar relato". | Mensagem "Relato enviado". O contexto (tela, cliques, navegador) aparece em "Ver ou copiar o texto do relato". |
| QA-16 | Janela de 375 px de largura: "Meu dia", "Projetos", um projeto e o painel. | Tudo legível, sem rolagem horizontal da página; botões clicáveis. |
| QA-17 | Recarregar a página com um timer aberto. | O timer continua contando, sem perder o início. |
| QA-18 | Ver o console do navegador durante o teste. | Sem erros em vermelho (anote os que aparecerem). |

## B. Membro (por exemplo, design e freelancer)

Pergunte ao usuário o perfil de cada conta antes de usar este bloco.

| ID | Passos | Resultado esperado |
|---|---|---|
| QA-20 | Olhar o menu. | Só "Meu dia" e "Projetos". **Não** existe "Equipe e piloto". |
| QA-21 | Em "Meu dia". | Aparecem "Com você agora" e "Em outra etapa". **Não** aparece "Precisa de atenção". |
| QA-22 | Em "Projetos". | Lista clientes e projetos. **Não** aparece "Cadastrar" (novo cliente e novo projeto). |
| QA-23 | Criar entrega, comentar, lançar horas, mudar status e etapa (QA-06 a QA-13). | Tudo funciona: membro cria e edita entregas. |
| QA-24 | Procurar qualquer botão de apagar entrega, comentário ou horas. | Não existe (e o banco também não permite a membro apagar entrega). |

## C. Coordenação

| ID | Passos | Resultado esperado |
|---|---|---|
| QA-30 | Abrir "Equipe e piloto". | Lista as pessoas com área, perfil, entregas abertas e horas do mês, os convites (com "Já entrou" ou "Ainda não entrou") e os relatos. |
| QA-31 | Em "Projetos", "Cadastrar": novo cliente `[QA] Cliente` e novo projeto `[QA]` com código `QA_001`. | Cliente e projeto aparecem na lista. Repetir o mesmo código mostra erro legível, sem quebrar a tela. |
| QA-32 | Convidar um e-mail fictício `qa-membro@exemplo.test` como "Membro", e outro como "Coordenação". | Os dois convites entram em "Convites" como "Ainda não entrou". |
| QA-33 | Tentar convidar como "Administrador". | **Falha**, porque só administrador convida administrador. Hoje a opção ainda aparece e o erro vem do banco (texto cru); anote a mensagem. |
| QA-34 | Remover um convite pendente `[QA]`. | O convite some da lista. |
| QA-35 | Em "Relatos dos testadores", "Marcar como resolvido" e depois "Reabrir". | O estado muda e persiste ao atualizar. |
| QA-36 | Em "Meu dia", seção "Precisa de atenção". | Mostra entregas atrasadas ou sem responsável de todos os projetos. |
| QA-37 | Procurar onde promover, rebaixar ou desativar uma pessoa. | Não existe tela ainda (esperado até a tarefa D5 e D7). |

## D. Administrador

| ID | Passos | Resultado esperado |
|---|---|---|
| QA-40 | Tudo do bloco C. | Funciona igual, exceto QA-33. |
| QA-41 | Convidar um e-mail fictício como "Administrador". | **Funciona** (só administrador convida administrador). Remova o convite em seguida. |

## E. Configurações, clientes e equipes (todos os perfis, exceto onde indicado)

Requer as migrações 04 e 05 no ambiente testado. Prefira o projeto `airbranding-teste`, em `localhost`, com contas de teste.

| ID | Passos | Resultado esperado |
|---|---|---|
| QA-50 | Abrir Configurações pelo menu do usuário. | Mostra foto, nome completo e troca de senha. |
| QA-51 | Alterar o nome para `[QA] Nome` e salvar; depois voltar ao nome original. | O nome muda no menu e nas listas; ao recarregar, persiste. |
| QA-52 | Enviar uma foto JPEG de até 2 MB. | A foto aparece no menu, nos responsáveis, na equipe e na conversa. |
| QA-53 | Enviar um arquivo que não é imagem e outro com mais de 2 MB. | Mensagem legível de recusa, sem alterar a foto atual. |
| QA-54 | Remover a foto. | Volta ao avatar padrão em todos os lugares. |
| QA-55 | Alterar a senha com a senha atual errada. | Mensagem "A senha atual está incorreta."; nada muda. (Não teste a troca real com contas reais.) |
| QA-56 | Em Clientes, selecionar uma entrega na lista, no quadro e na linha do tempo. | A entrega selecionada fica em cor diferente nos três lugares. |
| QA-57 | Abrir os detalhes da entrega. | Abre em modal central (tela inteira a 375 px); a conversa fica num bloco de chat separado. |
| QA-58 | Com o modal aberto, sair da pasta do cliente. | O modal fecha. |
| QA-59 | Procurar "Cadastrar cliente" na aba principal e o botão "+" ao lado de "Clientes" na barra lateral. | Não está na aba principal; o "+" abre o cadastro (só para quem pode cadastrar). |
| QA-60 | (Coordenação ou administrador) Criar equipe `[QA] Equipe` com 2 pessoas ativas e aplicá-la a um projeto `[QA]`. | A equipe aparece no projeto com os integrantes. Membro não vê os controles de edição. |
| QA-61 | (Coordenação ou administrador) Criar projeto com código já existente. | Erro visível; nenhum projeto parcial. |
| QA-62 | Abrir os painéis de entregas e horas e filtrar por cliente, projeto, equipe e período. | Os números mudam coerentes com os filtros, sem erro no console. |

## Relatório do QA

O agente devolve uma tabela por perfil (ID, resultado, o que apareceu) e uma lista de achados, cada um com:

- gravidade (bloqueia uso, atrapalha, detalhe);
- passos para reproduzir;
- resultado esperado e resultado obtido;
- tela e perfil.

Nada é corrigido pelo agente. Os achados viram itens em `tasks/` ou no `tasks/backlog.md`.

## Depois do teste

1. Liste o que foi criado com `[QA]` (entregas, clientes, projetos, convites, relatos, horas).
2. A limpeza é por SQL e só com aprovação do usuário. Convites podem ser removidos pela própria tela Equipe.
3. Registre a data e o resultado resumido no fim deste arquivo.

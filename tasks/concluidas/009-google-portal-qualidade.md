# 009: Google Agenda, Google Tasks, portal do cliente e qualidade

- **Status:** implementada e validada em teste
- **Branch:** `feat/google-portal-qualidade`

## Escopo

- Conectar Google Agenda e Google Tasks em modo somente leitura. Selecionar um projeto e uma agenda ou lista. Importar como entregas os itens cujo título começa com `[Air]`, com título e data. Sincronizar enquanto a integração estiver aberta e a autorização for válida.
- Autorizar e revogar acesso a projetos por e-mail. Uma conta externa confirmada vê os projetos autorizados, o total de horas contratadas e lançadas e o status e prazo das entregas publicadas explicitamente por um gestor.
- Registrar a versão de cada entrega, ajustar o limite por projeto e alertar gestores quando uma entrega em aberto exceder esse limite.

## Fora do escopo

- Sincronização com o navegador fechado, alterações na conta Google, resumo diário de e-mail e busca no Google Drive.

## Banco

- `09`: vínculo entre e-mail e projeto e leitura restrita do portal. O cadastro com convite interno segue a regra atual.
- `10`: limites de versão, contador de versão e gravação concorrente segura.
- `11`: importação atômica e deduplicação por projeto e origem.

## Critérios de aceite

- [x] Reimportar o mesmo item na mesma origem e projeto não duplica a entrega.
- [x] Cliente confirmado vê somente projetos autorizados e perde acesso ao revogar o vínculo. Cliente não lê nem edita dados internos.
- [x] Registrar uma nova versão acima do limite produz um alerta com acesso à entrega.
- [x] A tela oferece um estado de integração desabilitada quando falta o ID OAuth do Google.
- [x] Build, lint e testes passam.

## Validação

- Migrações aplicadas em `airbranding-teste`. A transação de QA exercitou o cadastro externo, a lista de projetos autorizados, entregas publicadas, o bloqueio de acesso interno, a revogação, o avanço de V1 a V4 e a importação sem duplicatas para as duas origens. Os dados de QA foram revertidos.
- No navegador local, com APIs simuladas, foram verificados o cadastro de acesso, a publicação da entrega, o alerta de qualidade, a importação de um evento e de uma tarefa, o reenvio sem duplicatas e a visão do cliente.
- `npm test` passou com 13 testes. O build passou e o lint terminou sem erros, com cinco avisos preexistentes.
- A publicação, o teste com OAuth real do Google e a confirmação externa de e-mail seguem pendentes.

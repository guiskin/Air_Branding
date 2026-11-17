# Regras de negócio (como estão implementadas hoje)

Extraído de `src/dados.js` e das telas. Se o código mudar, atualize aqui.

## Status da entrega

Oito, nesta ordem: Backlog, Aguardando material, Planejado, Em andamento, Em revisão, Em aprovação, Ajustes, Concluído. Entrega nova começa em Backlog. Também são validados no SQL (`check`).

## Entregas e etapas

- Uma entrega pertence a um projeto, tem briefing, link do Drive, prazo, início (data de criação), horas estimadas e responsáveis.
- Ao criar, escolhe-se um fluxo de etapas:
  - Conteúdo, design e aprovação do cliente.
  - Design e aprovação do cliente.
  - Etapa única (sem etapas).
- A pessoa escolhida ao criar vira responsável e dona da primeira etapa.
- **Etapa atual** = primeira etapa não concluída. A entrega está "com você" se você é dono da etapa atual (ou, sem etapas, é responsável).
- **Avançar etapa** (`avancarEtapa`): conclui a atual; se a próxima tem dono que ainda não é responsável, adiciona como responsável; muda o status para Em aprovação quando a próxima se chama "Aprovação do cliente", Em andamento para as demais, Concluído se não há próxima; registra comentário automático.
- **Atrasada**: tem prazo anterior a hoje e status diferente de Concluído.

## Horas

- Tipos: Produção, Atendimento, Reunião interna.
- Timer: uma pessoa só tem um aberto; iniciar outro para o anterior. Ao parar, minutos = tempo decorrido, mínimo 1.
- Lançamento manual grava início e fim iguais, com os minutos informados.
- Pode lançar em projeto sem entrega ("hora sem tarefa").
- Só horas com `fim` contam no total da entrega.

## Perfis

- **Membro:** vê tudo, cria e edita entregas, lança as próprias horas.
- **Coordenação e Administrador:** além disso, cadastram clientes e projetos, convidam pessoas, leem todos os relatos e veem "Equipe e piloto" e "Precisa de atenção".

## Relatos

Qualquer membro reporta bug ou melhoria. O contexto (tela, projeto, entrega, últimos 15 cliques, último erro, navegador, janela, versão) segue junto.

## Fora do piloto

Funil comercial, carga da equipe, Gantt, relatório de projeto, importação do ClickUp, exportação para BI.

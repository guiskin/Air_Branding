# Registro de decisões

Uma entrada por decisão: data, decisão, motivo. Mais recente no topo.

## 2026-11-17: direção visual "Air Creative Workspace" (tarefa 003)

- Direção escolhida pelo usuário a partir de esboços: menu lateral com clientes e projetos, lista densa agrupada por status, painel da entrega ao lado, botão Claro/Escuro sob o nome do usuário e, ao lado do projeto, linha do tempo, regras automáticas e equipe. Referências do usuário: monday, Onplana, PixStudio e Linear/Descript. Nada disso foi validado com usuários reais.
- Plano aprovado em fases (`tasks/003-air-creative-workspace.md`). A fase 1 troca cores e estilos fixos por tokens, com tema escuro e foco visível, sem mudar o layout; as cores de status saíram de `dados.js` e foram para o CSS.
- Linha do tempo deixa de estar em "fica para depois" **somente se** o usuário confirmar a decisão pendente 1 do plano. Regras automáticas começam informativas, sem chave de ligar e desligar. Foto de perfil depende de mudança de banco e aprovação à parte.
- Plugin `frontend-design` (Anthropic) ativado no projeto para orientar as próximas fases.

## 2026-11-16: organização do projeto para desenvolvimento com Claude Code

- `CLAUDE.md` enxuto, regras por área em `.claude/rules/`, agentes `revisor` e `analista-banco`, skills de planejamento, migração e fechamento. Tarefas em `tasks/`.
- Push, merge na `main`, deploy e SQL em produção continuam exclusivos do usuário.
- Sem testes automatizados por ora; verificação mínima é `npm run build`. Testes unitários de `dados.js` ficam como sugestão no backlog (exigem instalar dependência, que precisa de aprovação).

## Pendente de decisão

- Qualquer membro editar qualquer entrega e etapa (RLS atual) é intencional?
- O projeto deve sair do OneDrive? Worktrees e `node_modules` ali geram sincronização pesada.

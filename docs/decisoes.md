# Registro de decisões

Uma entrada por decisão: data, decisão, motivo. Mais recente no topo.

## 2026-11-16: organização do projeto para desenvolvimento com Claude Code

- `CLAUDE.md` enxuto, regras por área em `.claude/rules/`, agentes `revisor` e `analista-banco`, skills de planejamento, migração e fechamento. Tarefas em `tasks/`.
- Push, merge na `main`, deploy e SQL em produção continuam exclusivos do usuário.
- Sem testes automatizados por ora; verificação mínima é `npm run build`. Testes unitários de `dados.js` ficam como sugestão no backlog (exigem instalar dependência, que precisa de aprovação).

## Pendente de decisão

- Qualquer membro editar qualquer entrega e etapa (RLS atual) é intencional?
- O projeto deve sair do OneDrive? Worktrees e `node_modules` ali geram sincronização pesada.

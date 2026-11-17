# Registro de decisões

Uma entrada por decisão: data, decisão, motivo. Mais recente no topo.

## 2026-11-16: organização do projeto para desenvolvimento com Claude Code

- `CLAUDE.md` enxuto, regras por área em `.claude/rules/`, agentes `revisor` e `analista-banco`, skills de planejamento, migração e fechamento. Tarefas em `tasks/`.
- Push, merge na `main`, deploy e SQL em produção continuam exclusivos do usuário.
- Sem testes automatizados por ora; verificação mínima é `npm run build`. Testes unitários de `dados.js` ficam como sugestão no backlog (exigem instalar dependência, que precisa de aprovação).

## 2026-11-16: auditoria técnica e plano em fases

- Agentes: manter só `revisor` e `analista-banco`. Frontend, backend e arquitetura não valem um agente (não há backend; regras por área e o agente `Plan` cobrem). QA só depois de existirem testes.
- Fase 1 (segurança e processo): tarefa `001`, `supabase/APLICADO.md`, achados registrados abaixo.

## 2026-11-16: achados de segurança e integridade (a tratar)

Plano na tarefa `tasks/001-seguranca-perfis-e-convites.md` (S1, S2, S3 e B1). S4 não tem tarefa ainda. S5 e B2 entram no registro `supabase/APLICADO.md` (R4). B3 e B4 estão no backlog.

- **S1:** coordenação consegue se promover a admin ou convidar admins pela API (políticas `pessoas_editar` e `convites_gestor`).
- **S2:** com "Confirm email" desligado, o e-mail do convite não é verificado; alguém pode criar a conta de um convidado antes dele.
- **S3:** a mensagem de erro do cadastro revela se um e-mail está convidado.
- **S4:** qualquer membro edita qualquer entrega e etapa, inclusive `projeto_id`.
- **S5:** backup do banco não confirmado.
- **B1:** apagar uma pessoa apaga suas horas e comentários (`on delete cascade`).
- **B2:** não há controle de versão do banco; o estado de produção não está no repositório.
- **B3:** status, tipos e perfis estão duplicados entre `dados.js` e os `check` do SQL.
- **B4:** `avancarEtapa` faz 4 gravações sem transação e decide o status pelo texto "Aprovação do cliente".

## Pendente de decisão

- **S4:** qualquer membro editar qualquer entrega e etapa é intencional?
- **Tarefa 001, D1 a D7** (detalhes na tarefa): D1 coordenação promove ou rebaixa coordenação? D2 S2 por código de convite, confirmação de e-mail ou outra? D3 aprovar mudar políticas e funções existentes; D4 `restrict` no lugar de `cascade`; D5 regra de desativação; D6 políticas de horas; D7 tela de perfil.
- O projeto deve sair do OneDrive? Worktrees e `node_modules` ali geram sincronização pesada.

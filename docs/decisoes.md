# Registro de decisões

Uma entrada por decisão: data, decisão, motivo. Mais recente no topo.

## 2026-11-17: direção visual "Air Creative Workspace" (tarefa 003)

- Direção escolhida pelo usuário a partir de esboços: menu lateral com clientes e projetos, lista densa agrupada por status, painel da entrega ao lado, botão Claro/Escuro sob o nome do usuário e, ao lado do projeto, linha do tempo, regras automáticas e equipe. Referências do usuário: monday, Onplana, PixStudio e Linear/Descript. Nada disso foi validado com usuários reais.
- Plano aprovado em fases (`tasks/003-air-creative-workspace.md`). A fase 1 troca cores e estilos fixos por tokens, com tema escuro e foco visível, sem mudar o layout; as cores de status saíram de `dados.js` e foram para o CSS.
- O pedido de executar as fases 1 a 4 incluiu a linha do tempo informativa de entregas abertas e as regras automáticas existentes. O Gantt interativo permanece no planejamento futuro.
- O pedido de configurações incluiu foto de perfil enviada pela própria pessoa. A migração 04 usa um bucket privado.
- Após comparar os exemplos, o usuário escolheu o modal central para os detalhes da entrega. No celular, o modal abre em tela inteira.
- Plugin `frontend-design` (Anthropic) ativado no projeto para orientar as próximas fases.

## 2026-11-17: agente de QA e credenciais de teste

- Criado o agente `qa` e o `docs/roteiro-de-qa.md` (roteiro por perfil). A auditoria tinha adiado o agente de QA até existirem testes; o usuário pediu, e o roteiro manual já dá o que ele executar.
- O agente nunca digita senhas: quem faz o login no navegador do Claude é o usuário, um perfil por vez. Motivo: o endereço publicado fala com o banco real, e senhas não devem ser digitadas nem registradas por Claude.
- Senhas passadas em chat ficam na transcrição: recomendado trocá-las e, para testes repetidos, usar contas de teste dedicadas no projeto de teste.
- Tudo o que o QA cria leva o prefixo `[QA]`; a limpeza é por SQL, com aprovação.

## 2026-11-17: quem executa SQL

- Decisão do usuário: depois de testar no projeto de teste (`airbranding-teste`), Claude pode aplicar sozinho, pelo conector do Supabase, scripts numerados no banco real, com revisão, estado "antes" conferido e reversão no cabeçalho.
- Continuam exigindo aprovação explícita: `drop` de tabela ou coluna, `truncate`, `delete` ou `update` em massa, perda de dados, mudança de Authentication ou do projeto, criar ou apagar projetos, e SQL de escrita fora de script numerado.
- Push, merge na `main` e deploy continuam do usuário.
- Motivo: o usuário quer que o fluxo de banco funcione sem depender dele a cada passo; o projeto de teste reduz o risco enquanto o plano gratuito não tem backup. Primeira aplicação seguindo o fluxo: script 03 (2026-11-17).
- Regra completa em `.claude/rules/banco.md`.

## 2026-11-16: decisões da tarefa 001 (segurança de perfis, convites e desativação)

Tomadas pelo usuário. Detalhes e critérios de aceite em `tasks/001-seguranca-perfis-e-convites.md`.

- **D1:** coordenação pode promover membro a coordenação e rebaixar ou desativar outra coordenação. Só administrador altera administrador.
- **D2:** a confirmação de e-mail fica **ligada** (README corrigido). Antes de convidar a equipe, testar se um e-mail externo recebe o link. Código de convite (scripts 04 e 05) adiado; só se o e-mail não chegar ou ao entrar cliente real.
- **D3:** aprovado trocar as políticas `pessoas_editar` e `convites_gestor`, as funções `eh_membro` e `eh_gestor`, e os privilégios de `pessoas` (só `update` por coluna).
- **D4:** trocar `on delete cascade` por `restrict` em `horas`, `comentarios` e `relatos`, para apagar um usuário não destruir o histórico.
- **D5:** ao desativar, manter a pessoa nas entregas e no histórico. A tela Equipe avisa quantas entregas abertas ela tem, e entrega sem nenhum responsável ativo aparece em "Precisa de atenção".
- **D6:** as políticas de edição e exclusão de horas passam a exigir pessoa ativa.
- **D7:** tela para promover e rebaixar perfil entra agora, junto de Desativar e Reativar na tela Equipe.
- **D8:** retirar de `anon` e `authenticated` os privilégios que o app não usa (`truncate`, `references`, `trigger`) e ajustar o padrão para tabelas futuras.

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
- **S2:** se a confirmação de e-mail estiver desligada, o e-mail do convite não é verificado e alguém pode criar a conta de um convidado antes dele. Em 2026-11-16 a confirmação está **ligada** (README corrigido por D2), o que reduz o risco; resta o risco de o e-mail de confirmação não chegar a convidados externos (SMTP embutido).
- **S3:** a mensagem de erro do cadastro revela se um e-mail está convidado.
- **S4:** qualquer membro edita qualquer entrega e etapa, inclusive `projeto_id`.
- **S5:** confirmado em 2026-11-16: o plano gratuito do Supabase não faz backup.
- **S6:** `authenticated` tem `truncate`, `references` e `trigger` nas tabelas (padrão do Supabase); a API não expõe `truncate`, mas é privilégio a retirar (D8 da tarefa 001).
- **B1:** apagar uma pessoa apaga suas horas e comentários (`on delete cascade`).
- **B2:** não há controle de versão do banco; o estado de produção não está no repositório.
- **B3:** status, tipos e perfis estão duplicados entre `dados.js` e os `check` do SQL.
- **B4:** `avancarEtapa` faz 4 gravações sem transação e decide o status pelo texto "Aprovação do cliente".

## Pendente de decisão

- **S4:** qualquer membro editar qualquer entrega e etapa é intencional?
- O projeto deve sair do OneDrive? Worktrees e `node_modules` ali geram sincronização pesada.

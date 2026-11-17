# Backlog

Sugestões, sem compromisso. Nada aqui é implementado sem pedido e aprovação.

## Ideias do usuário (2026-11-17)

Configurações (foto de perfil, senha, nome completo, fonte -1) e ajustes da tela de clientes: detalhes em `tasks/concluidas/004-ideias-configuracoes-e-clientes.md`.

### Recursos inspirados no ClickUp

- **Equipes reutilizáveis (implementado, script `05`).** Criar uma equipe com nome e membros e selecioná-la ao criar ou editar um projeto, para montar a equipe do projeto de uma vez. A atribuição de responsáveis por entrega continua disponível.
- **Google Agenda.** Conectar a agenda do e-mail Google de cada pessoa e exibir seus compromissos no Air Branding ao lado dos prazos das entregas. Definir quais agendas poderão ser exibidas e se a integração também criará eventos.
- **Google Drive e documentos do projeto (parcial: link da pasta implementado, script `08`; falta destacar documentos e buscar arquivos, que exigem OAuth).** Vincular uma pasta do Drive ao projeto. Na visão geral, destacar documentos como briefing, atas de reunião e materiais de referência. Permitir buscar pelo nome dos arquivos da pasta e abrir os resultados conforme as permissões do Drive.
- **Painéis (implementado, ver `tasks/concluidas/006-paineis.md`).** Criar painéis com filtros de cliente, projeto, equipe e período. Aproveitar os indicadores já existentes para mostrar entregas por status, atrasos e horas lançadas em relação às estimadas.

## Escopo futuro do produto (já definido no README)

- Funil comercial
- Carga da equipe por semana
- Gantt
- Relatório de projeto
- Importação do ClickUp
- Exportação para BI

## Roadmap técnico (auditoria de 2026-11-16)

Prioridade P1 a P4, esforço P/M/G, risco de executar.

| Ref. | Item | Prio | Esforço | Risco |
|---|---|---|---|---|
| R1 | Corrigir escalada de perfil (S1), conta pré-registrada (S2) e mensagem que revela convite (S3): tarefa `001` | P1 | M | Médio (RLS em produção) |
| R2 | Desativar pessoa em vez de apagar, sem perder horas e comentários (B1): também na tarefa `001` | P1 | M | Médio |
| R3 | Trabalhar em branches e só fazer merge na `main` com aprovação | P1 | P | Baixo |
| R4 | Registrar scripts aplicados e confirmar backup (`supabase/APLICADO.md`) | P1 | P | Baixo |
| R5 | Testes unitários (Vitest) de `dados.js`; exige instalar dependência | P2 | M | Baixo |
| R6 | `avancarEtapa` atômico (função no banco) e sem texto fixo "Aprovação do cliente" (B4) | P2 | M | Médio |
| R7 | Bug de fuso em "horas do mês" (usa UTC) | P2 | P | Baixo |
| R8 | ESLint e Prettier | P3 | P | Baixo |
| R9 | Lacunas do piloto: desativar projeto, editar horas, histórico, alterar perfil | P3 | M | Baixo |
| R10 | Carregamento incremental; dividir `App.jsx` e `telas.jsx` | P4 | G | Médio |

Sem item R: **S4** (qualquer membro edita qualquer entrega) depende de decisão sua; S5 (backup) e B2 (versão do banco) entram no R4; B3 (regras duplicadas) está na lista abaixo.

Agente de QA: só criar depois do R5. Agentes de frontend, backend e arquitetura: não criar (as regras por área e o agente `Plan` cobrem).

## Qualidade e robustez (observadas no diagnóstico)

- Testes unitários (Vitest) para funções puras de `dados.js`: `montar`, `fmtMin`, `fmtData`, regra de status do `avancarEtapa`. Exige instalar dependência.
- Tornar `avancarEtapa` atômico (hoje são 4 gravações sem transação; falha no meio deixa estado inconsistente). Exige função no banco.
- Evitar duplicidade dos status entre `dados.js` e o `check` do SQL.
- Carregar só o necessário em vez de todas as tabelas a cada mudança do realtime.
- Decidir se qualquer membro pode editar qualquer entrega (RLS atual).
- Controle de versão do banco: registrar quais scripts já foram aplicados em produção.
- Recuperação de senha (hoje manual pelo painel do Supabase).
- Logo oficial no lugar do selo "air" provisório.

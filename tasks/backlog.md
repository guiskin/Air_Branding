# Backlog

Sugestões, sem compromisso. Nada aqui é implementado sem pedido e aprovação.

## Escopo futuro do produto (já definido no README)

- Funil comercial
- Carga da equipe por semana
- Gantt
- Relatório de projeto
- Importação do ClickUp
- Exportação para BI

## Qualidade e robustez (observadas no diagnóstico)

- Testes unitários (Vitest) para funções puras de `dados.js`: `montar`, `fmtMin`, `fmtData`, regra de status do `avancarEtapa`. Exige instalar dependência.
- Tornar `avancarEtapa` atômico (hoje são 4 gravações sem transação; falha no meio deixa estado inconsistente). Exige função no banco.
- Evitar duplicidade dos status entre `dados.js` e o `check` do SQL.
- Carregar só o necessário em vez de todas as tabelas a cada mudança do realtime.
- Decidir se qualquer membro pode editar qualquer entrega (RLS atual).
- Controle de versão do banco: registrar quais scripts já foram aplicados em produção.
- Recuperação de senha (hoje manual pelo painel do Supabase).
- Logo oficial no lugar do selo "air" provisório.

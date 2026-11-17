---
paths:
  - "supabase/**"
---

# Banco (Supabase/Postgres)

- `01_estrutura.sql` e `02_convites_e_exemplos.sql` são a base do piloto: **não edite scripts existentes**. Mudança é um script novo, numerado (`03_…`), com o que ele faz, o impacto em dados existentes e como reverter, no cabeçalho.
- `supabase/APLICADO.md` registra o que já foi executado em produção: consulte antes de numerar um script novo; só o usuário preenche a data de aplicação.
- Antes de escrever ou propor SQL, rode o agente `analista-banco`. Quem executa no SQL Editor do Supabase é o usuário, nunca você.
- Toda tabela nova: RLS habilitada, políticas explícitas, `grant` coerente e inclusão no realtime se a tela depender dela.
- Evite `drop`, `truncate`, `delete` sem `where` e alteração de coluna com perda de dados. Se for inevitável, peça aprovação explícita antes.
- Sem e-mails, chaves ou dados reais de clientes nos scripts; use exemplos fictícios.
- Atualize `docs/banco-de-dados.md` junto.

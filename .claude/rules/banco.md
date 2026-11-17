---
paths:
  - "supabase/**"
---

# Banco (Supabase/Postgres)

- `01_estrutura.sql` e `02_convites_e_exemplos.sql` são a base do piloto: **não edite scripts existentes**. Mudança é um script novo, numerado (`03_…`), com o que ele faz, o impacto em dados existentes e como reverter, no cabeçalho.
- `supabase/APLICADO.md` registra o que já foi executado em produção: consulte antes de numerar um script novo; quem aplicar preenche a data, o que foi conferido e o estado depois.
- Antes de escrever ou propor SQL, rode o agente `analista-banco`.
- **Quem executa SQL (regra do usuário, 2026-11-17):**
  - **Projeto de teste (`airbranding-teste`):** posso aplicar e testar livremente pelo conector do Supabase. Os dados dele são descartáveis. Nunca use o `project_id` do banco real nessas chamadas.
  - **Banco real:** aplico sozinho **só** um script numerado de `supabase/` que (1) já foi aplicado e testado no projeto de teste, (2) passou pelo `analista-banco` e pelo `revisor`, (3) teve o estado "antes" consultado (só leitura) e conferido contra o que o script espera, e (4) tem trava e reversão no cabeçalho. Use `begin`/`commit`, rode as consultas "depois" e registre tudo em `supabase/APLICADO.md`.
  - **Peço aprovação explícita antes de:** `drop` de tabela ou coluna, `truncate`, `delete` ou `update` em massa de dados, qualquer alteração que perca dados, mudar configurações de Authentication ou do projeto, criar ou apagar projetos, e qualquer SQL de escrita fora de script numerado. `drop` de política, função ou constraint que o próprio script recria não conta como perda de dados.
  - Se a trava do script falhar ou o estado "antes" for diferente do esperado, **pare** e avise o usuário; não adapte o script por conta própria no banco real.
- Toda tabela nova: RLS habilitada, políticas explícitas, `grant` coerente e inclusão no realtime se a tela depender dela.
- Evite `drop`, `truncate`, `delete` sem `where` e alteração de coluna com perda de dados. Se for inevitável, peça aprovação explícita antes.
- Sem e-mails, chaves ou dados reais de clientes nos scripts; use exemplos fictícios.
- Atualize `docs/banco-de-dados.md` junto.

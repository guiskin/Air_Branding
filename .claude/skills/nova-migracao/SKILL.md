---
name: nova-migracao
description: Cria um script SQL numerado em supabase/ para mudança de banco, com impacto e reversão, sem executá-lo. Use para qualquer alteração de tabela, política, função ou constraint.
---

1. Rode o agente `analista-banco` com a mudança desejada e traga o resultado ao usuário.
2. Após aprovação, crie `supabase/NN_descricao.sql` (próximo número). Cabeçalho em comentário: o que faz, impacto em dados existentes, como reverter.
3. Ajuste o que depende do banco: constantes e funções em `src/dados.js`, telas, `docs/banco-de-dados.md`.
4. Nunca edite scripts existentes e nunca execute SQL. Entregue ao usuário a instrução "execute este script no SQL Editor do Supabase" e diga o que conferir depois.

---
name: nova-migracao
description: Cria um script SQL numerado em supabase/ para mudança de banco, com impacto e reversão, testa no projeto de teste e aplica no banco real conforme a regra de SQL. Use para qualquer alteração de tabela, política, função ou constraint.
---

1. Rode o agente `analista-banco` com a mudança desejada e traga o resultado ao usuário.
2. Após aprovação, crie `supabase/NN_descricao.sql` (próximo número). Cabeçalho em comentário: o que faz, impacto em dados existentes, como reverter.
3. Ajuste o que depende do banco: constantes e funções em `src/dados.js`, telas, `docs/banco-de-dados.md`.
4. Nunca edite scripts existentes. Aplique o script no projeto de teste (`airbranding-teste`), rode o estado "antes" e "depois" e testes de comportamento, e registre o resultado em `tasks/`.
5. Banco real: só aplique se a regra de SQL em `.claude/rules/banco.md` permitir (script testado, revisado, estado "antes" conferido, nada que peça aprovação explícita). Caso contrário, peça a aprovação ao usuário ou entregue a instrução "execute este script no SQL Editor do Supabase" e diga o que conferir depois.
6. Registre em `supabase/APLICADO.md` e atualize `docs/banco-de-dados.md`.

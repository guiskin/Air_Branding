---
paths:
  - "src/dados.js"
  - "src/supabase.js"
---

# Dados e regras de negócio

- Todo acesso ao Supabase fica em `src/dados.js`, via o helper `ok(consulta)`, que lança erro para o `agir` mostrar.
- Constantes de domínio (`STATUS`, `TIPOS`, `AREAS`, `PERFIS`, `FLUXOS`) vivem aqui. `STATUS`, `TIPOS` e `PERFIS` também existem como `check` no SQL: mudar um lado exige mudar o outro (script novo em `supabase/`, via skill `nova-migracao`).
- `montar()` deriva dados (etapa atual, atraso, horas) a partir do que `carregar()` leu. Mantenha-a pura, sem chamadas ao banco.
- Operações com várias gravações em sequência (como `avancarEtapa`) não são transacionais: não adicione passos sem avaliar o estado parcial em caso de falha.
- Só a chave pública (anon/publishable) via variáveis `VITE_*`. Nunca `service_role`, nunca chave literal no código.
- Mudou regra de negócio: atualize `docs/regras-de-negocio.md`.

# 007: Ajustes de equipes, roadmap técnico e integrações Google

- **Status:** concluída em 2026-11-17 (decisões: instalar Vitest/ESLint, excluir equipe só sem projetos, equipe segue como cópia, Google só com Drive por link)
- **Branch:** `feat/ajustes-e-roadmap` (partes 4 e 5), `feat/google` (parte 6, depois)

## Objetivo

Executar os passos 4, 5 e 6 combinados em 2026-11-17: pequenos ajustes de equipes, itens do roadmap técnico e as integrações Google do backlog.

## Parte 4: ajustes de equipes e projetos

- [x] Mensagem em português para código de projeto duplicado (hoje sai o erro cru do banco), na criação com e sem equipe.
- [x] Excluir equipe (hoje não há como). Exige RPC nova e script `06`; a FK `projeto_equipes.equipe_id` está em `restrict`, então a exclusão só vale para equipe sem projeto, ou desvincula antes. **Decisão D1.**
- [x] Equipe como cópia ou sincronizada com projetos existentes. **Decisão D2.** Recomendação: manter como cópia (já implementado e documentado) e mostrar aviso "reaplicar" na edição.

## Parte 5: roadmap técnico

- [x] **R7:** "horas do mês" usa UTC (`telas.jsx:471`, `toISOString().slice(0, 7)`); trocar por mês local. Sem dependência nova.
- [x] **R6:** `avancarEtapa` (`dados.js:280`) faz várias gravações sem transação. Mover para função no banco (script `07`). O texto fixo "Aprovação do cliente" foi mantido, agora só dentro da função. Exige `analista-banco`, teste em `airbranding-teste` e `revisor`.
- [x] **R5:** testes unitários (Vitest) para as funções puras de `dados.js`. **Instalar dependência: exige aprovação (D3).**
- [x] **R8:** ESLint e Prettier. **Instalar dependência: exige aprovação (D3).**

## Parte 6: Google Agenda e Google Drive

Maior e dependente de fora do código. Não dá para começar sem:

- Projeto no Google Cloud, tela de consentimento OAuth e ID de cliente (feito por você).
- Decidir: só leitura ou também criar eventos? Quais agendas? Pasta do Drive por projeto: guardar o link/ID na tabela `projetos` (script de banco).
- Como o app não tem servidor, o token OAuth ficaria no navegador de cada pessoa. Avaliar riscos antes. Decisão D4: só o Drive por link, sem OAuth (script `08`). Google Agenda e busca por arquivos do Drive ficam no backlog.

## Fora do escopo

- Funil comercial, carga da equipe, Gantt interativo, relatório de projeto, importação do ClickUp, BI.
- Excluir equipe em cascata nos projetos já vinculados.

## Banco

Scripts novos numerados: `06` (excluir equipe, se D1 for sim) e `07` (`avancarEtapa` atômico). Cada um passa por `analista-banco`, teste, `revisor` e a regra de SQL do `CLAUDE.md`. O banco real só depois do teste.

## Riscos

- `avancarEtapa` é o coração do fluxo: erro aqui quebra o avanço de entregas. Testar no ambiente de teste antes.
- Dependências novas aumentam a superfície do projeto.
- OAuth sem servidor próprio expõe tokens no navegador.

## Critérios de aceite

- [x] `npm run build` passa em cada parte.
- [x] Código de projeto repetido mostra "Já existe um projeto com esse código." e não cria projeto parcial.
- [x] (Se D1 = sim) Excluir equipe sem projetos a remove; com projetos, mostra aviso e não apaga.
- [x] "Horas do mês" conta o mês local: um lançamento às 23h do último dia do mês no Brasil não cai no mês seguinte.
- [x] `avancarEtapa` roda em uma única transação: falha no meio não deixa estado parcial (testado no `airbranding-teste`).
- [x] (Se D3 = sim) `npm test` e `npm run lint` rodam e passam.
- [x] Docs (`banco-de-dados.md`, `regras-de-negocio.md`) e `supabase/APLICADO.md` atualizados.

## Resumo do que mudou

- Banco: scripts `06` (excluir equipe), `07` (`avancar_etapa` atômico) e `08` (`projetos.pasta_drive`), testados em `airbranding-teste` e aplicados no real.
- App: `dados.js` (código duplicado, `excluirEquipe`, `salvarPastaDrive`, `avancarEtapa` via RPC), `telas.jsx` (fuso das horas do mês, `PastaDrive`), `EquipesProjeto.jsx` (Excluir), `Painel.jsx`.
- Ferramentas: Vitest (`npm test`, 10 testes), ESLint (`npm run lint`, 0 erros, 5 avisos antigos) e `.prettierrc.json`; `vitest@2` por compatibilidade com o Vite 5.
- Não feito: Google Agenda e busca de arquivos do Drive (backlog). Não verificado: o app publicado em uso.

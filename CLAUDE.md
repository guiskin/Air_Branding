# Air Branding: gestor de projetos (piloto)

Piloto da ferramenta própria de gestão de projetos da Air Branding. Vite + React 18 (JavaScript) + Supabase, sem servidor próprio: o navegador fala direto com o Supabase e a segurança está nas políticas RLS do banco. Publicação e uso no `README.md`. Arquitetura, banco e regras de negócio em `docs/`.

## Comandos

- `npm run dev`: servidor local (precisa de `.env`, copiado de `.env.example`).
- `npm run build`: build de produção (saída em `dist`). É a verificação mínima; não há testes nem lint.

## Estrutura

- `src/App.jsx`, `src/telas.jsx`, `src/pecas.jsx`, `src/Painel.jsx`: interface. `src/estilos.css`: todo o CSS.
- `src/dados.js`, `src/supabase.js`: acesso ao banco e regras de negócio.
- `supabase/`: scripts SQL numerados. `docs/`: documentação. `tasks/`: backlog e tarefas.
- `.claude/rules/` (regras por área, carregam sozinhas), `.claude/agents/` (`revisor`, `analista-banco`), `.claude/skills/` (`planejar-tarefa`, `nova-migracao`, `fechar-entrega`).

## Fluxo de trabalho

1. **Planejar antes de executar.** Mudança relevante (várias telas, dados, banco, regra de negócio) vira um arquivo em `tasks/` com critérios de aceite verificáveis (skill `planejar-tarefa`) e só começa após aprovação. Correção pequena e óbvia dispensa o arquivo.
2. **Nada é removido sem aprovação:** funcionalidade, tela, coluna, política ou arquivo existente.
3. **Banco:** antes de qualquer SQL, use o agente `analista-banco`. Mudança vira script novo e numerado em `supabase/` (skill `nova-migracao`); scripts já aplicados nunca são editados. Quem executa o SQL no Supabase é o usuário.
4. **Seguir os padrões existentes:** nomes em português, `agir(rotulo, fn)` para mutações, acesso ao banco só em `src/dados.js`, classes CSS já existentes. Detalhes em `.claude/rules/`.
5. **Verificar:** rode `npm run build` e confira a mudança no navegador local quando mexer na interface. Diga o que não foi verificado.
6. **Fechar** com a skill `fechar-entrega`: build, revisão (`revisor`), resumo dos arquivos alterados, docs atualizadas, commit.
7. **Docs vivas:** mudou comportamento, banco ou arquitetura, atualize o arquivo correspondente em `docs/`.

## Regras de trabalho

- **Push é do usuário.** Cada push na `main` publica no Cloudflare Pages. Nunca faça push, merge na `main`, deploy nem execute SQL em produção; commite e pare. Operação destrutiva (apagar dados, `reset --hard`, `--force`) só com aprovação explícita.
- **Branches:** `main` é produção. Trabalhe em `feat/…`, `fix/…` ou `docs/…`. Worktree só para tarefas em paralelo (cada uma precisa de `npm install` e `.env` próprios; o projeto está no OneDrive, então use com moderação).
- **Git sem identidade nesta máquina.** Commite com `git -c user.name="Guilherme Ueno" -c user.email="gui.ueno@hotmail.com" commit ...`, sem gravar configuração.
- Mensagens de commit e textos da interface em português.
- Termine a mensagem de commit com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- **Segredos:** nunca use a chave `service_role` no aplicativo, só a pública (anon/publishable). Não commite `.env` nem registre chaves, URLs de projeto ou senhas em docs, tasks ou commits.
- Instalar dependência exige aprovação.

## Identidade visual

- Laranja da marca `#FF3301`; títulos em Barlow Condensed, texto em Poppins; cards com cantos arredondados.
- O selo "air" no cabeçalho e no login é provisório (aguarda o logo oficial).

## Escopo do piloto

Entregas, etapas, timer e horas, comentários, relatos de bug. Fica para depois: funil comercial, carga da equipe, Gantt, relatório de projeto, importação do ClickUp, exportação para BI. Não implemente o que está nessa lista sem pedido explícito.

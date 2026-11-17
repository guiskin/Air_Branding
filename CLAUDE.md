# Air Branding: gestor de projetos (piloto)

Piloto da ferramenta própria de gestão de projetos da Air Branding. Vite + React 18 + Supabase. Detalhes de publicação e uso no `README.md`.

## Comandos

- `npm run dev`: servidor local (precisa de `.env`, copiado de `.env.example`).
- `npm run build`: build de produção (saída em `dist`). Rode antes de commitar mudanças de código.

## Estrutura

- `src/App.jsx`, `src/telas.jsx`, `src/pecas.jsx`, `src/Painel.jsx`: interface.
- `src/dados.js`, `src/supabase.js`: acesso aos dados.
- `src/estilos.css`: todo o CSS.
- `supabase/`: scripts SQL do banco. `docs/`: documentação.

## Regras de trabalho

- **Push é do usuário.** Cada push na `main` publica no Cloudflare Pages. Nunca faça push; commite e pare.
- **Git sem identidade nesta máquina.** Commite com `git -c user.name="Guilherme Ueno" -c user.email="gui.ueno@hotmail.com" commit ...`, sem gravar configuração.
- Mensagens de commit e textos da interface em português.
- Termine a mensagem de commit com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Nunca use a chave `service_role` do Supabase no aplicativo, só a pública (anon/publishable). Não commite `.env`.

## Identidade visual

- Laranja da marca `#FF3301`; títulos em Barlow Condensed, texto em Poppins; cards com cantos arredondados.
- O selo "air" no cabeçalho e no login é provisório (aguarda o logo oficial).

## Escopo do piloto

Entregas, etapas, timer e horas, comentários, relatos de bug. Fica para depois: funil comercial, carga da equipe, Gantt, relatório de projeto, importação do ClickUp, exportação para BI.

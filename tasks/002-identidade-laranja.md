# 002: identidade laranja com o logo oficial

- **Status:** aprovada (pelo usuário, no chat)
- **Branch:** feat/identidade-laranja

## Objetivo

Deixar o laranja `#FF3301` como cor dominante e usar o logo oficial da Air, para o piloto parecer da marca. Referência: identidades de agência (Pentagram, Wolff Olins, Collins): bloco sólido da cor da marca, tipografia condensada grande em caixa alta, poucas cores com contraste alto, logo grande no login e pequeno e fixo nas telas internas.

## Escopo

- Cabeçalho sólido laranja com o logo oficial e título em branco; textos pequenos em preto (contraste).
- Login em tela cheia laranja, logo grande e card branco por cima.
- Navegação: aba ativa em preto sobre o laranja.
- Fundo off-white quente no lugar do cinza frio.
- Títulos de seção maiores (Barlow Condensed, caixa alta).
- Logo oficial no lugar do selo provisório; `logo.jpg` também como ícone da aba.

## Fora do escopo

- Logo em SVG/transparente (os arquivos recebidos são JPG/PNG): trocar quando existir.
- Mudança de layout, dados, banco ou regras de negócio.
- Redesenho do quadro por status e das cores de status.

## Arquivos prováveis

- `src/estilos.css`, `src/App.jsx`, `index.html`, `public/` (logos).

## Banco

Nenhuma mudança.

## Riscos

- Branco sobre `#FF3301` tem cerca de 3,6:1: só em texto grande e em negrito. Texto pequeno sobre laranja fica em preto.
- O JPG pode ter tom ligeiramente diferente do laranja do CSS; o logo é exibido como selo de cantos arredondados para não depender disso.

## Critérios de aceite

- [ ] `npm run build` passa.
- [ ] Login: fundo laranja, logo oficial grande, card branco legível.
- [ ] Telas internas: cabeçalho laranja com logo e nome, abas legíveis, aba ativa destacada.
- [ ] Nenhum texto pequeno branco sobre laranja.
- [ ] Layout sem quebra em 375 px de largura.

## Resumo do que mudou

- Criados: `public/logo.jpg`, `public/logo-escuro.png`, `public/logo-palavra.png`.
- Alterados: `src/estilos.css` (cabeçalho laranja, login laranja, fundo off-white, h2 maior, `.logo` como imagem), `src/App.jsx` (logo oficial no login e no cabeçalho), `index.html` (ícone da aba).
- Verificado: build e tela de login no navegador. Não verificado: telas internas (exigem login no Supabase).

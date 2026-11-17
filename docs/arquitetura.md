# Arquitetura

Aplicação de página única (SPA) em Vite + React 18, em JavaScript. Não há servidor próprio: o navegador fala direto com o Supabase (Postgres + Auth + Realtime) pelo `@supabase/supabase-js`. A segurança dos dados está nas políticas de acesso por linha (RLS) do banco.

## Camadas

| Camada | Arquivos | Papel |
|---|---|---|
| Entrada | `index.html`, `src/main.jsx` | Monta `App` com `React.StrictMode`; carrega fontes do Google Fonts. |
| Interface | `src/App.jsx` | Login, estrutura da tela, timer global, avisos, barreira de erro, janela de relato. |
| | `src/menu.jsx` | Menu lateral (navegação, clientes e projetos, usuário, tema, Sair) e barra superior (caminho, timer, Reportar). |
| | `src/tema.js` | Lê e grava a escolha claro/escuro no navegador e aplica `data-tema` no `<html>`. |
| | `src/telas.jsx` | Meu dia, Projetos, Projeto, Equipe e piloto. |
| | `src/paineis-projeto.jsx` | Indicadores, linha do tempo, regras e equipe do projeto. |
| | `src/Paineis.jsx` | Visão geral de entregas e horas, filtros e lista de atrasadas. |
| | `src/PortalCliente.jsx` | Área externa de leitura e gestão de acessos por projeto. |
| | `src/Qualidade.jsx` | Registro de versão, limite do projeto e alertas para gestores. |
| | `src/Google.jsx`, `src/google-api.js` | Autorização Google e importação de itens selecionados para entregas. |
| | `src/Configuracoes.jsx` | Alteração de nome, foto e senha da própria conta. |
| | `src/Painel.jsx` | Detalhe da entrega. |
| | `src/pecas.jsx` | Peças reutilizáveis (avatar, status, barra, campo salvo). |
| | `src/estilos.css` | Todo o CSS: tokens em `:root`, tema escuro em `:root[data-tema='escuro']`, cores de status e de avatar por classe. Ver `design-system.md`. |
| Dados | `src/dados.js` | Constantes de domínio, leitura (`carregar`), derivação (`montar`) e gravações. |
| | `src/dados-paineis.js` | Aplica os filtros e calcula os indicadores de Painéis. |
| | `src/supabase.js` | Cliente Supabase e leitura das variáveis `VITE_*`. |
| Banco | `supabase/*.sql` | Estrutura, RLS, gatilho de convite, realtime. |

## Fluxo de dados

1. `Sistema` (em `App.jsx`) chama `D.carregar()`, que lê as tabelas usadas na interface em paralelo. Clientes, projetos, entregas, horas e equipes são percorridos em páginas.
2. `D.montar(dados, euId)` deriva as entregas completas (etapa atual, responsáveis, horas, atraso) e o timer ativo.
3. As telas recebem o objeto `app` por props. Toda mutação passa por `app.agir(rotulo, fn)`: registra o clique, executa, recarrega tudo e mostra erro se falhar.
4. O Realtime do Supabase avisa mudanças em qualquer tabela; a tela recarrega após 400 ms. Há também recarga a cada 60 s.

Consequência conhecida: o volume lido cresce com o total de dados, não com o que está na tela. Adequado ao piloto.

## Navegação

Sem roteador. A tela ativa (`dia`, `projetos`, `projeto`, `paineis`, `google`, `equipe`, `configuracoes`) e a entrega aberta ficam no estado de `Sistema`. Os atalhos do menu chamam `app.ir`, que fecha os detalhes quando a pessoa troca de tela ou de projeto. Em tela estreita o menu é uma gaveta controlada pelo estado `menuAberto`. O formulário de cadastro de cliente abre em um diálogo nativo pelo botão "+" do menu.

Os detalhes da entrega abrem em um diálogo nativo central. No celular, o diálogo ocupa a tela inteira. A tela de origem permanece montada e mantém sua posição ao fechar. Avisos de operações na entrega aparecem dentro do diálogo, e o formulário de relato pode abrir por cima dele.

## Autenticação e acesso

E-mail e senha pelo Supabase Auth. O gatilho em `auth.users` cria uma linha em `pessoas` para convites internos e aceita cadastro externo quando existe uma autorização para projeto ativo. Após o login, a interface consulta o vínculo interno para abrir o workspace ou o portal. A função do portal verifica a confirmação do e-mail e devolve só a visão autorizada. Detalhes em `banco-de-dados.md`.

## Variáveis de ambiente

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (chave pública), `VITE_FEEDBACK_URL` (opcional). Modelo em `.env.example`. Nunca registrar valores reais em documentação.

## Publicação

Cloudflare Pages, build `npm run build`, saída `dist`, Node 22. Cada push na `main` publica. O hash do commit (`CF_PAGES_COMMIT_SHA`) vira `__VERSAO__` e aparece nos relatos. Passo a passo no `README.md`.

## Ferramentas

Não há testes automatizados, lint nem CI. Verificação mínima: `npm run build` e conferência no navegador.

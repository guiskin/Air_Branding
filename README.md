# Gestor de Projetos (piloto)

Piloto da ferramenta própria de gestão de projetos, para substituir o Gestor atual. Roda em paralelo ao atual em fase de testes, com um grupo pequeno e dados de teste.

## O que o piloto faz

- Entrada com e-mail e senha, só para quem foi convidado.
- Clientes, projetos (com código e linha de serviço) e entregas com etapas.
- Meu dia, lista e quadro por status (oito status padronizados).
- Indicadores, linha do tempo de entregas abertas, regras automáticas e equipe do projeto.
- Configurações de perfil para editar nome e foto, e alterar a senha.
- Timer e lançamento manual de horas, com tipo de hora, inclusive hora sem tarefa.
- Comentários, responsáveis, prazo, prioridade, briefing e link do Drive.
- Botão "Reportar bug ou ideia", que grava o relato com o contexto (tela, entrega, últimos cliques, último erro, navegador).
- Tela "Equipe e piloto" para coordenação e administradores: pessoas, convites e relatos.

Fica para depois: funil comercial, carga da equipe por semana, Gantt interativo, relatório de projeto, importação do ClickUp e exportação para o BI.

## Publicação

### 1. Banco (Supabase)

1. No painel do projeto, abra o SQL Editor.
2. Cole e execute o conteúdo de `supabase/01_estrutura.sql`.
3. Abra `supabase/02_convites_e_exemplos.sql`, troque os dois e-mails e nomes de exemplo pelos administradores reais e execute.
4. Em Authentication, nas configurações do provedor Email, deixe a confirmação de e-mail ("Confirm email") **ligada**: assim ninguém cria a conta de um e-mail que não é seu. O plano gratuito envia os e-mails por um servidor embutido com limite baixo de envios; antes de convidar a equipe, teste o cadastro com um e-mail externo e confira se o link de confirmação chega.
5. Em Project Settings, na parte de API, copie a URL do projeto e a chave pública (anon ou publishable). Nunca use a chave `service_role` no aplicativo.

### 2. Hospedagem (Cloudflare Pages)

1. No painel da Cloudflare, crie um projeto Pages conectado ao repositório do GitHub.
2. Comando de build: `npm run build`. Pasta de saída: `dist`.
3. Variáveis de ambiente (produção):
   - `VITE_SUPABASE_URL`: URL do projeto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: chave pública.
   - `VITE_FEEDBACK_URL`: opcional, link do formulário do ClickUp para relatos.
   - `NODE_VERSION`: `22`.
4. Publique. Cada push na branch `main` gera uma nova publicação.
5. De volta ao Supabase, em Authentication, na configuração de URLs, coloque o endereço publicado como Site URL.

### 3. Primeiro acesso

1. Abra o endereço publicado e use "Primeiro acesso? Criar minha conta" com um dos e-mails de administrador.
2. Em "Equipe e piloto", convide as pessoas do teste (e-mail, nome, área e perfil).
3. Cada convidado cria a própria senha em "Primeiro acesso" e confirma o e-mail pelo link que recebe.
4. Cadastre clientes pelo botão "+" ao lado de "Clientes" no menu. Cadastre projetos na tela "Projetos".

## Durante o piloto

- Os relatos aparecem em "Equipe e piloto". Cada um traz o contexto para reproduzir o erro.
- No plano gratuito, o Supabase pausa o projeto depois de sete dias sem uso. Para voltar, alguém com acesso ao painel precisa reativar.
- Não há recuperação de senha no piloto. Se alguém esquecer, um administrador redefine pelo painel do Supabase, em Authentication, na lista de usuários.

## Desenvolvimento local

```
cp .env.example .env
npm install
npm run dev
```

## Estrutura

- `src/dados.js`: leitura e gravação no banco e regras de negócio.
- `src/App.jsx`: entrada, navegação, timer, avisos e relatos.
- `src/telas.jsx`: Meu dia, Projetos, Projeto e Equipe.
- `src/Painel.jsx`: detalhe da entrega.
- `supabase/`: scripts do banco.
- `docs/roteiro-de-testes.md`: tarefas para os testadores.

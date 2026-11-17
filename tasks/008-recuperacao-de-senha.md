# 008: recuperação de senha pela tela de login

- **Status:** proposta
- **Branch:** feat/recuperacao-de-senha

## Objetivo

Hoje quem esquece a senha depende de alguém redefini-la pelo painel do Supabase. Com a equipe real entrando, o próprio usuário deve conseguir pedir um link por e-mail e definir uma senha nova, sem ajuda de ninguém. É o item "Recuperação de senha" do backlog.

## Escopo

- Link "Esqueci minha senha" na tela de login: pede o e-mail e envia o link de recuperação.
- Mensagem sempre igual ("Se o e-mail estiver cadastrado, você receberá um link."), para não revelar quem tem conta.
- Ao abrir o link, o app mostra uma tela para digitar a senha nova (e confirmar) e salva; depois entra normalmente.
- Mesmas regras de senha que a troca em Configurações (tamanho mínimo e confirmação).
- Funções novas só em `src/dados.js` (`pedirRecuperacaoSenha`, e o uso do evento de recuperação), mensagens em português.
- Atualizar `docs/arquitetura.md` (Auth) e `README.md` (retirar "recuperação manual").

## Fora do escopo

- Login com Google, código de convite, autenticação em dois fatores.
- Mudar o texto do e-mail enviado (modelo do Supabase): é ajuste de painel, feito à parte.

## Arquivos prováveis

- `src/App.jsx` (login e tela de senha nova), `src/dados.js`, `src/estilos.css` (só classes já existentes, se possível), `docs/arquitetura.md`, `README.md`.

## Banco

Nenhuma mudança de SQL. Depende de configuração no painel do Supabase real (feita pelo usuário): o endereço do site publicado precisa estar em Authentication, URL Configuration, Redirect URLs, e o SMTP próprio precisa estar funcionando (Resend).

## Riscos

- O link de recuperação só volta para o site se o endereço estiver na lista de redirecionamentos permitidos; sem isso, ele cai em outra página.
- Limite de envios do e-mail: com o SMTP embutido, pode falhar. Por isso a tarefa só entra depois do SMTP próprio.
- A sessão de recuperação deixa a pessoa logada; a tela de senha nova deve aparecer antes do app normal, para não pular a troca.

## Critérios de aceite

- [ ] `npm run build` e `npm test` passam.
- [ ] Na tela de login, "Esqueci minha senha" pede o e-mail e mostra a mensagem neutra, com e sem conta existente.
- [ ] Com uma conta de teste, o e-mail chega, o link abre o app na tela de senha nova e a senha antiga deixa de valer.
- [ ] Senha curta ou confirmação diferente mostra erro em português e não grava.
- [ ] Depois de salvar, o usuário entra no app com a senha nova.
- [ ] Feito primeiro no ambiente de teste; só depois publicado.
- [ ] Docs atualizadas.

## Resumo do que mudou

(preencher ao fechar)

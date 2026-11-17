# Ambiente de teste

Roteiro para testar o app com login de verdade **sem tocar nos dados reais**. Vale para o desenvolvimento (fases da tarefa 003, novos scripts SQL) e para a conferência antes de publicar.

Regra de ouro: o app só deve apontar para o projeto de teste quando você estiver testando. Nunca grave URL, chave ou senha neste arquivo nem em qualquer arquivo versionado.

## O que existe (conferido em 2026-11-17)

| Item | Estado |
|---|---|
| Projeto Supabase de teste | `airbranding-teste`, ativo, criado em 2026-11-17 na mesma organização do projeto real (`Airbranding`). Dados descartáveis. |
| Scripts aplicados nele | `01`, uma versão fictícia do `02` (pessoas com e-mail `@teste.test`), `03`, `04` e `05`. Fonte: `supabase/APLICADO.md` (na `main`). |
| Dados | 4 pessoas (1 administrador, 1 coordenação, 2 membros), 6 convites (4 já entraram), 3 clientes, 2 projetos, 1 entrega, 4 lançamentos de horas, 2 relatos. |
| Endereço publicado de teste | **Não existe.** O único endereço publicado, `air-branding.pages.dev`, é o app real, ligado ao banco real. |
| `.env` local | **Não existe** nesta máquina. Sem ele, o `npm run dev` mostra "Falta configurar o banco". |

Não verificado: a confirmação de e-mail ("Confirm email") e o Site URL do projeto de teste; as senhas das contas `@teste.test` (não estão no repositório). Uma consulta à tabela de usuários do Auth foi negada pela sessão e não foi repetida.

## Como rodar o app contra o projeto de teste

### Opção A: no seu computador (recomendada)

1. No painel do Supabase, **confira no canto superior que o projeto aberto é `airbranding-teste`**.
2. Em Project Settings, API, copie a URL do projeto e a chave pública (publishable ou anon). Nunca use a `service_role`.
3. Na pasta do projeto: `cp .env.example .env` e cole a URL e a chave nos dois campos. O `.env` não é versionado.
4. `npm install` (só na primeira vez) e `npm run dev`. O endereço é `http://localhost:5173`.
5. No Supabase de teste, em Authentication, URL Configuration, deixe `http://localhost:5173` em Redirect URLs. Isso é mudança de Authentication: faça você mesmo ou me peça.
6. Antes de qualquer teste que grave dados, abra o app e confira que os dados são os de teste (clientes `Exemplo` e pessoas `@teste.test`). Se aparecerem os clientes reais, **pare e feche**: o `.env` está apontando para o banco errado.

Para voltar ao banco real, apague ou renomeie o `.env`.

### Opção B: endereço publicado só de teste (se precisar de link para mais gente)

1. Crie uma branch `staging` e conecte no Cloudflare Pages. O endereço de visualização dela terá `staging` no nome.
2. No Cloudflare Pages, em Settings, Variables, defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` **só no ambiente de Preview**, com os valores do projeto de teste. Nunca copie as variáveis de Production.
3. No Supabase de teste, ponha esse endereço em Site URL e Redirect URLs.

## Contas de teste por perfil

O projeto de teste já tem contas fictícias `@teste.test`: administrador (`Admin Teste`), coordenação (`Coord Um`) e membros (`Membro Teste`, `C1A`). Falta uma conta de **freelancer** (membro com área Freelancer).

Para ter login em cada perfil:

1. Garanta o convite do e-mail em "Equipe e piloto" (ou por SQL no projeto de teste). Sem convite, o cadastro é recusado.
2. Crie a conta sem depender de e-mail: no painel do Supabase de teste, Authentication, Users, **Add user**, e-mail do convite, senha digitada por você, marcando "Auto Confirm User". O gatilho cria a linha em `pessoas` com o perfil do convite.
3. Use senhas **diferentes** das de produção. As contas reais do site publicado não existem no projeto de teste.

Quem digita a senha: por padrão, a pessoa, como diz o `docs/roteiro-de-qa.md`. Em `localhost` com contas só de teste, você pode autorizar o Claude a entrar; nesse caso a senha fica na memória local do Claude, nunca no repositório.

## O que testar

- Conferência por perfil: `docs/roteiro-de-qa.md` (na branch `docs/roteiro-qa`, ainda não mesclada na `main`).
- Tudo o que o teste criar leva o prefixo `[QA]`.
- No projeto de teste, a limpeza é por SQL e o Claude pode aplicá-la pelo conector, sem tocar no projeto real. No banco real, nunca.
- Refazer do zero: apagar as tabelas do projeto de teste e reaplicar `01`, `02` (versão fictícia), `03`, `04` e `05`, nessa ordem, mais os scripts novos já numerados.

## O que este ambiente não cobre

- E-mail de confirmação para endereço externo e o limite de envios do plano gratuito (é por projeto: o de teste tem o seu).
- Volume de dados reais e desempenho com a equipe toda.
- Site URL, SMTP e demais configurações do projeto real.
- O app publicado em `air-branding.pages.dev`: ele só é verificado por quem faz o login nele.

## Se algo falhar

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "Falta configurar o banco" | Não há `.env` | Passo 3 da opção A |
| "E-mail ou senha incorretos." | Conta inexistente no projeto de teste | Criar com Add user |
| "Este e-mail não está na lista de convidados" | Falta o convite | Convidar o e-mail |
| `email rate limit exceeded` | Limite de envio do Supabase | Criar a conta com Add user, sem e-mail |
| Aparecem clientes reais | `.env` aponta para o banco real | Fechar e corrigir o `.env` |

# Scripts aplicados em produção

Registro do que já foi executado no SQL Editor do Supabase. O repositório não consegue saber isso sozinho: **só o usuário atualiza a coluna "Aplicado em"**, depois de executar o script.

| Script | O que faz | Aplicado em | Observação |
|---|---|---|---|
| `01_estrutura.sql` | Estrutura, RLS, gatilho de convite, realtime | 2026-11-16 (noite, horário de Brasília) | Informado pelo usuário. Políticas de `pessoas` e `convites` conferidas: batem com o script. |
| `02_convites_e_exemplos.sql` | Convites dos administradores e dados de exemplo | 2026-11-16 (noite, horário de Brasília) | Convites conferidos: só existe o convite do administrador real, sem e-mails fictícios. |
| `03_perfil_admin_e_desativar_pessoa.sql` | Perfil admin protegido, `pessoas.ativo`, `restrict` no histórico, privilégios mínimos | 2026-11-17 | Testado antes no projeto de teste (35 testes de comportamento e 22 operações do app, todos como esperado; ver o fim de `tasks/001-roteiro-de-aplicacao.md`). Aplicado no banco real por Claude, pelo conector do Supabase, com aprovação explícita do usuário; script executado inteiro com `begin`/`commit`, sem erro. Conferido depois: ver "Estado do banco após o 03". |

Nenhum outro script foi executado no banco real. Próximo número livre: `04`.

## Projeto de teste

Existe um segundo projeto gratuito, `airbranding-teste`, criado em 2026-11-17 na mesma organização, só para testar scripts antes do banco real. Tem o `01`, uma versão fictícia do `02` (pessoas de teste com e-mails `.test`) e o `03`. Seus dados são descartáveis. Para repetir um teste do zero, apague as tabelas e reaplique em ordem.

## Estado do banco após o 03 (2026-11-17)

Antes do 03, no banco real: as 10 tabelas conhecidas e nenhuma outra em `public`; `anon` e `authenticated` com todos os privilégios (incluindo `truncate`, `references`, `trigger` e `maintain`) em todas as tabelas, concedidos pelo papel `postgres`; chaves de `horas`, `comentarios` e `relatos` em `cascade`; políticas iguais ao `01`.

Depois do 03, conferido no banco real:
- `anon`: nenhum acesso a nenhuma tabela. Nenhum `truncate`, `references`, `trigger` ou `maintain` para `anon` e `authenticated`.
- `authenticated`: só o que as políticas usam (`pessoas`: `select`, com `update` apenas em `nome`, `area`, `perfil`, `capacidade_mensal` e `ativo`).
- 3 chaves de histórico em `restrict`; gatilho `pessoas_proteger` presente; `pessoas.ativo` verdadeiro para a 1 pessoa existente; políticas de `pessoas`, `convites` e `horas` como no script.
- Dados intactos: 1 pessoa (administrador ativo), 1 convite, 2 clientes, 3 projetos, 1 relato.
- Simulando o login do administrador: carrega as tabelas, lê convites e relatos, `eh_admin()` verdadeiro. Simulando `anon`: acesso negado a `pessoas`.

Não verificado no real: o app em uso (login pela tela e realtime) e o e-mail de confirmação com endereço externo. O `alter default privileges` só vale para tabelas criadas pelo papel `postgres`.

## Configurações fora do SQL (painel do Supabase)

| Item | Onde | Estado em 2026-11-16 |
|---|---|---|
| Confirmação de e-mail ("Confirm email") | Authentication, provedor Email | **Ligada** (decisão D2: fica ligada; README já corrigido. Falta testar se um e-mail externo recebe o link) |
| Permitir novos cadastros ("Allow new users to sign up") | Authentication | Ligado |
| Provedor de e-mail (embutido ou SMTP próprio) | Authentication, SMTP Settings | Não verificado; no plano gratuito, sem SMTP próprio configurado, é o embutido, com limite baixo de envios (conferir os limites atuais na documentação) |
| Backup do banco | Project Settings, Database | **Não há** (plano gratuito) |
| Site URL | Authentication, URL Configuration | _a confirmar_ |

## Como usar

1. Antes de criar um script novo, confira esta tabela para saber qual é o próximo número.
2. Depois de executar um script no Supabase, preencha a data aqui e commite.
3. Nunca registre aqui URL do projeto, chaves ou e-mails reais.

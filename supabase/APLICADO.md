# Scripts aplicados em produção

Registro do que já foi executado no SQL Editor do Supabase. O repositório não consegue saber isso sozinho: **só o usuário atualiza a coluna "Aplicado em"**, depois de executar o script.

| Script | O que faz | Aplicado em | Observação |
|---|---|---|---|
| `01_estrutura.sql` | Estrutura, RLS, gatilho de convite, realtime | 2026-11-16 (noite, horário de Brasília) | Informado pelo usuário. Políticas de `pessoas` e `convites` conferidas: batem com o script. |
| `02_convites_e_exemplos.sql` | Convites dos administradores e dados de exemplo | 2026-11-16 (noite, horário de Brasília) | Convites conferidos: só existe o convite do administrador real, sem e-mails fictícios. |
| `03_perfil_admin_e_desativar_pessoa.sql` | Perfil admin protegido, `pessoas.ativo`, `restrict` no histórico, privilégios mínimos | **Não aplicado** | Pronto; seguir `tasks/001-roteiro-de-aplicacao.md`. |

Nenhum outro script foi executado. Próximo número livre: `04`.

## Estado do banco na conferência de 2026-11-16

- `convites`: 1 linha (o administrador real). Nenhum convite pendente.
- `pessoas`: 1 pessoa, perfil admin, criada logo depois da aplicação do `01`.
- Políticas de `pessoas` e `convites`: `convites_gestor` (all), `pessoas_editar` (update) e `pessoas_ver` (select), iguais ao `01`.
- Privilégios: o papel `authenticated` tem, além de select, insert e update, também `delete`, `truncate`, `references` e `trigger` em `pessoas` (padrão do Supabase). A listagem completa tinha 28 linhas e não foi vista inteira: falta confirmar quais papéis (por exemplo `anon`) têm o quê. Ver tarefa `001`, D8.

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

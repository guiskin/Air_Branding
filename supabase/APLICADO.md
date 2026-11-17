# Scripts aplicados em produção

Registro do que já foi executado no SQL Editor do Supabase. O repositório não consegue saber isso sozinho: **só o usuário atualiza a coluna "Aplicado em"**, depois de executar o script.

| Script | O que faz | Aplicado em | Observação |
|---|---|---|---|
| `01_estrutura.sql` | Estrutura, RLS, gatilho de convite, realtime | _a confirmar_ | |
| `02_convites_e_exemplos.sql` | Convites dos administradores e dados de exemplo | _a confirmar_ | Os e-mails de exemplo precisam ter sido trocados antes de executar. |

## Configurações fora do SQL (conferir no painel)

| Item | Onde | Estado |
|---|---|---|
| Confirmação de e-mail ("Confirm email") | Authentication, provedor Email | _a confirmar_ (o README manda desligar) |
| Backup do banco | Project Settings, Database | _a confirmar_ (o plano gratuito não garante backup e pausa o projeto após 7 dias sem uso) |
| Site URL | Authentication, URL Configuration | _a confirmar_ |

## Como usar

1. Antes de criar um script novo, confira esta tabela para saber qual é o próximo número.
2. Depois de executar um script no Supabase, preencha a data aqui e commite.
3. Nunca registre aqui URL do projeto, chaves ou e-mails reais.

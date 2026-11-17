# Scripts aplicados em produção

Registro do que já foi executado no SQL Editor do Supabase. Quem aplica o script registra a data depois de confirmar a execução em produção.

| Script | O que faz | Aplicado em | Observação |
|---|---|---|---|
| `01_estrutura.sql` | Estrutura, RLS, gatilho de convite, realtime | 2026-11-16 (noite, horário de Brasília) | Informado pelo usuário. Políticas de `pessoas` e `convites` conferidas: batem com o script. |
| `02_convites_e_exemplos.sql` | Convites dos administradores e dados de exemplo | 2026-11-16 (noite, horário de Brasília) | Convites conferidos: só existe o convite do administrador real, sem e-mails fictícios. |
| `03_perfil_admin_e_desativar_pessoa.sql` | Perfil admin protegido, `pessoas.ativo`, `restrict` no histórico, privilégios mínimos | 2026-11-17 | Testado antes no projeto de teste (35 testes de comportamento e 22 operações do app, todos como esperado; ver o fim de `tasks/001-roteiro-de-aplicacao.md`). Aplicado no banco real por Claude, pelo conector do Supabase, com aprovação explícita do usuário; script executado inteiro com `begin`/`commit`, sem erro. Conferido depois: ver "Estado do banco após o 03". |
| `04_configuracoes_de_perfil.sql` | Nome próprio editável e fotos de perfil em bucket privado | 2026-11-17 | Validado por SQL em `airbranding-teste` e aplicado no banco real com autorização explícita do usuário. Ver "Estado do banco após o 04". |
| `05_equipes_em_projetos.sql` | Cadastro de equipes e cópia dos integrantes para projetos | 2026-11-17 | Validado antes em `airbranding-teste`, revisado pelo `analista-banco` e pelo `revisor`, estado "antes" conferido e aplicado no banco real com aprovação explícita do usuário, inteiro com `begin`/`commit`. Ver "Estado do banco após o 05". |
| `06_excluir_equipe.sql` | Função `excluir_equipe` (só gestor; recusa equipe em uso) | 2026-11-17 | Testada em `airbranding-teste` (transação revertida), `analista-banco` e `revisor` ok; aplicada no real com `begin`/`commit`. Ver "Estado do banco após 06 a 08". |
| `07_avancar_etapa_atomico.sql` | Função `avancar_etapa` (`security invoker`), conclui etapa, responsável, status e comentário em uma transação | 2026-11-17 | Igual à 06. Testada com os três avanços, entrega sem etapa pendente, entrega inexistente e `anon` negado. |
| `08_pasta_drive_do_projeto.sql` | Coluna `projetos.pasta_drive` com check de link do Drive | 2026-11-17 | Igual à 06. Testada com gestor (grava), membro (0 linhas) e links inválidos (recusados, 23514). |

Nenhum outro script foi executado no banco real. Próximo número livre: `09`.

## Projeto de teste

Existe um segundo projeto gratuito, `airbranding-teste`, criado em 2026-11-17 na mesma organização, só para testar scripts antes do banco real. Tem o `01`, uma versão fictícia do `02` (pessoas de teste com e-mails `.test`) e os scripts `03` a `08`. Seus dados são descartáveis. Para repetir um teste do zero, apague as tabelas e reaplique em ordem.

Na validação do `04`, a sessão simulada de um membro alterou o próprio nome e associou, substituiu e removeu a foto. A segunda conta teve acesso à foto em uso. Os testes confirmaram o bloqueio de nome vazio, gravação em pasta alheia, associação de foto alheia e execução das funções sem login. A transação de teste foi revertida após as verificações. O bucket permaneceu privado, com limite de 2 MiB e formatos JPEG, PNG e WebP.

Na validação do `05`, sessões simuladas conferiram cadastro, edição, cópia de membros para projetos novos e existentes, reaplicação e remoção da equipe. A criação com equipe inválida foi revertida sem deixar projeto parcial. Membros ativos conseguiram ler as atribuições, as escritas indevidas foram bloqueadas e as quatro tabelas estavam na publicação Realtime. A transação de teste foi revertida após as verificações.

## Estado do banco após 06 a 08 (2026-11-17)

- Antes: nenhuma das funções `excluir_equipe` e `avancar_etapa`, sem a coluna `projetos.pasta_drive`, tabelas da 05 presentes, `eh_gestor()` presente, `authenticated` com select, insert e update em `projetos`, Postgres 17.12; 11 pessoas, 4 projetos, 3 entregas, 5 etapas, 1 comentário.
- Depois: `excluir_equipe` (`security definer`) e `avancar_etapa` (`security invoker`) executáveis só por `authenticated`; coluna `pasta_drive` `text not null default ''` com o check `projetos_pasta_drive_valida`; nenhum projeto com link ainda; contagens iguais às de antes.
- No deploy `58dcda2`, a entrega `[QA] Fluxo de etapas 1711` avançou de Conteúdo para Design e registrou o comentário automático. O link fictício do Drive persistiu no projeto `QA_1711_PAIN` após recarregar. A equipe descartável de QA deixou de aparecer após recarregar a lista. O usuário informou que os testes de foto e senha passaram.
- Limpeza dos dados `[QA]` em 2026-11-17, com aprovação do usuário: apagados o projeto `QA_1711_PAIN` (com suas 2 entregas, etapas e comentário, por cascade) e a equipe `[QA] Equipe Painéis 1711`, em uma transação com travas. Contagens finais (3 projetos, 2 entregas, 5 etapas, 1 comentário, 1 hora, 11 pessoas, 0 equipes) iguais às da exportação local do mesmo dia.

## Estado do banco após o 05 (2026-11-17)

- Antes: nenhuma das quatro tabelas de equipes existia, 03 e gatilho `pessoas_proteger` presentes, publicação Realtime não era `all tables`, 11 pessoas, 3 projetos, 2 entregas, 5 etapas, 1 lançamento de horas.
- Depois: as quatro tabelas existem com RLS ligada e só a política de leitura; `authenticated` tem somente `select`, `anon` nada. As três funções são executáveis só por `authenticated` (e checam `eh_gestor()`). As quatro tabelas estão no Realtime. Contagens existentes iguais às de antes.
- Não verificado no real: criar e aplicar equipe pela interface publicada (exige gestor logado).

## Estado do banco após o 04 (2026-11-17)

- Antes da execução, foram confirmados o gatilho da migração 03, a RLS do Storage, os privilégios restritos de `pessoas` e a ausência de políticas e buckets no Storage.
- Após o `commit`, as funções `alterar_meu_nome` e `alterar_minha_foto` estavam disponíveis para `authenticated` e bloqueadas para `anon`. A coluna `foto_caminho` estava presente, sem permissão de edição direta pelo papel `authenticated`.
- Os 11 perfis existentes foram preservados, todos ainda sem foto associada. O bucket `fotos-perfil` estava privado, com quatro políticas, limite de 2 MiB e formatos JPEG, PNG e WebP.
- O envio de arquivo pela interface publicada ainda precisa ser validado.

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

| Item | Onde | Estado |
|---|---|---|
| Confirmação de e-mail ("Confirm email") | Authentication, provedor Email | **Ligada** (decisão D2: fica ligada; README já corrigido. Falta testar se um e-mail externo recebe o link) |
| Permitir novos cadastros ("Allow new users to sign up") | Authentication | Ligado |
| Provedor de e-mail (embutido ou SMTP próprio) | Authentication, SMTP Settings | SMTP próprio desativado, conferido em 2026-11-17. |
| Backup do banco | Exportação manual | Exportação concluída, conforme informado pelo usuário em 2026-11-17. |
| Site URL | Authentication, URL Configuration | `https://air-branding.pages.dev`, gravado e conferido em 2026-11-17. |

## Como usar

1. Antes de criar um script novo, confira esta tabela para saber qual é o próximo número.
2. Depois de executar um script no Supabase, preencha a data aqui e commite.
3. Nunca registre aqui URL do projeto, chaves ou e-mails reais.

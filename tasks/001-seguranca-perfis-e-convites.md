# 001: segurança de perfis, convites e desativação de pessoas

- **Status:** proposta (aguarda decisões e conferência no painel)
- **Branch:** `fix/seguranca-fase1` (documentação). A implementação do script e das telas usa branch própria, depois da aprovação.
- **Origem:** auditoria de 2026-11-16 (S1, S2, S3, B1; itens R1 e R2 do backlog). Análise feita pelo agente `analista-banco`.

## Objetivo

1. **S1:** só administrador cria, edita ou promove administrador. Coordenação não se promove nem convida admin pela API.
2. **S2:** impedir que alguém crie a conta de uma pessoa convidada antes dela.
3. **B1:** desativar uma pessoa sem apagar suas horas, comentários e relatos.

## Antes de qualquer script: conferir no painel do Supabase (somente leitura)

1. **Convites de exemplo (urgente).** `select * from public.convites;` e procure `exemplo.com`. O `02_convites_e_exemplos.sql` cria convites de **admin** com e-mails fictícios. Se nunca foram trocados ou removidos, e "Confirm email" está desligado, qualquer pessoa pode se cadastrar com um deles e virar admin. Se existirem, remova-os agora.
2. **Quem é admin hoje:** `select email, nome, perfil, criado_em from public.pessoas order by criado_em;`. Compare com Authentication, Users, e procure contas desconhecidas.
3. **Convites pendentes:** `select c.* from public.convites c left join public.pessoas p on lower(p.email) = lower(c.email) where p.id is null;`
4. **Políticas e gatilhos reais:** `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='public' and tablename in ('pessoas','convites');` e `select tgname, tgrelid::regclass from pg_trigger where not tgisinternal and tgrelid::regclass::text in ('public.pessoas','public.convites');`
5. **Privilégios em `pessoas`:** `select grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='pessoas';`
6. **Authentication:** "Confirm email" ligado ou desligado, "Allow new users to sign up", provedor de e-mail (embutido ou próprio) e limites, tamanho mínimo de senha.
7. **Algum script além do `01` e do `02` foi aplicado?** Registrar em `supabase/APLICADO.md`.

## Decisões necessárias

| # | Decisão | Recomendação do analista |
|---|---|---|
| D1 | Coordenação pode promover membro a coordenação, e rebaixar ou desativar outra coordenação? (o rascunho permite os dois, porque só protege linhas de admin) | Aceitável (par seu). Alternativa: só admin altera qualquer perfil. |
| D2 | S2: código de convite de uso único (b), confirmação de e-mail (a) ou outra? | (b), em duas etapas (04 e 05). (a) só com SMTP próprio. Até lá, criar o convite só quando a pessoa for se cadastrar na hora e remover os pendentes. |
| D3 | Aprovar `drop policy` de `pessoas_editar` e `convites_gestor`, `create or replace` de `eh_membro()` e `eh_gestor()`, e os `revoke` de `update`, `insert` e `delete` em `pessoas` (passa a valer só `update` por coluna) | Necessário para S1 e B1. |
| D4 | Trocar `on delete cascade` por `restrict` em `horas`, `comentarios` e `relatos`? | Sim, para que apagar o usuário no painel não destrua o histórico. Exige conferir os nomes reais das constraints. |
| D5 | Regra de negócio da desativação: o que fazer com entregas e etapas abertas de quem sai? "Sem dono" passa a considerar só responsáveis ativos? | A definir. |
| D6 | Corrigir `horas_editar` e `horas_apagar`, que não exigem `eh_membro()` (pessoa desativada ainda edita as próprias horas)? | Risco baixo; decidir. |
| D7 | Criar tela para promover e rebaixar perfil? | Sem ela, mudança de perfil é pelo painel. |

## Banco

Mudança de banco: scripts 03 (S1 e B1), 04 e 05 (S2). Rascunho do 03 em `tasks/001-rascunho-03.sql`. Admin só é editado por admin (a política de `using` barra linhas de admin para coordenação).

## Arquivos prováveis

`supabase/03_…`, `04_…`, `05_…`, `src/App.jsx` (cadastro com código), `src/dados.js` (`definirAtivo`, `convidar` via função), `src/telas.jsx` (Equipe, seletores), `src/Painel.jsx` (seletores de pessoa ativa), `docs/banco-de-dados.md`, `docs/regras-de-negocio.md`, `supabase/APLICADO.md`.

## Escopo (após as decisões)

1. **Script 03 (S1 e B1):** rascunho em `tasks/001-rascunho-03.sql`. Cria `pessoas.ativo` e `eh_admin()`, faz `eh_membro()`/`eh_gestor()` exigirem `ativo`, restringe as políticas de `pessoas` e `convites`, limita as colunas editáveis de `pessoas` e adiciona um gatilho que impede alterar o próprio perfil e fecha o timer ao desativar.
2. **Ajustes de interface do 03** (branch própria):
   - Esconder "Administrador" no convite para quem não é admin.
   - Seletores de responsável e etapa listam só pessoas ativas.
   - Tela Equipe separa ativas e desativadas, com "Desativar" e "Reativar".
   - Texto da tela de acesso negado.
3. **S2 em duas etapas:** script 04 (aditivo: coluna de código, função `convidar_pessoa`), publicar o front com o campo de código e, só então, script 05 (o gatilho passa a exigir o código). Convites pendentes terão de ser refeitos.

## Fora do escopo

- Corrigir escalada que já tenha ocorrido (o script não faz isso; ver conferência acima).
- `relatos_editar` permitir ao gestor alterar qualquer coluna.
- Corrigir S4 (qualquer membro edita qualquer entrega).

## Riscos

- Mexe em RLS de produção. O script usa `begin`/`commit`, e a reversão está no cabeçalho do rascunho.
- Qualquer script futuro que repita `grant ... update ... on all tables ... to authenticated` desfaz a restrição de colunas de `pessoas`.
- Dois admins podem se rebaixar ao mesmo tempo e ficar sem admin. A recuperação é pelo SQL Editor (o gatilho não bloqueia quem roda SQL lá).
- Desativar alguém não remove a pessoa de entregas e etapas abertas, e `avancarEtapa` pode passar a etapa para alguém inativo (ver D5).
- Comportamento do cadastro com mensagens de erro do gatilho e limites do SMTP embutido vêm de conhecimento geral: conferir na documentação e no painel atuais.

## Critérios de aceite

- [ ] Conferências 1 a 7 respondidas pelo usuário e registradas em `supabase/APLICADO.md`.
- [ ] D1 a D7 decididas e registradas em `docs/decisoes.md`.
- [ ] Como coordenação, pela interface e pela API: convidar admin e se promover a admin falham; convidar membro funciona.
- [ ] Como admin: convidar e promover admin funciona; alterar o próprio perfil falha.
- [ ] Desativar uma pessoa: ela perde o acesso na hora, o timer aberto é fechado e suas horas e comentários continuam visíveis. Reativar devolve o acesso.
- [ ] Cadastro sem código válido falha com mensagem única; com código válido funciona uma só vez (S2).
- [ ] `npm run build` passa.
- [ ] `docs/banco-de-dados.md`, `docs/regras-de-negocio.md` e `supabase/APLICADO.md` atualizados.

## Resumo do que mudou

(preencher ao fechar)

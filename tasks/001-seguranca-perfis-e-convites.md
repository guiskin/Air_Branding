# 001: segurança de perfis, convites e desativação de pessoas

- **Status:** decisões D1 a D8 tomadas (2026-11-16, em `docs/decisoes.md`). Script 03 pronto em `supabase/` e **não aplicado**; roteiro em `tasks/001-roteiro-de-aplicacao.md`. Interface (D5, D7) ainda sem implementação: aguarda aprovação para abrir a branch.
- **Branch:** `fix/seguranca-fase1` (documentação). A implementação do script e das telas usa branch própria, depois da aprovação.
- **Origem:** auditoria de 2026-11-16 (S1, S2, S3, B1; itens R1 e R2 do backlog). Análise feita pelo agente `analista-banco`.

## Objetivo

1. **S1:** só administrador cria, edita ou promove administrador. Coordenação não se promove nem convida admin pela API.
2. **S2:** impedir que alguém crie a conta de uma pessoa convidada antes dela.
3. **B1:** desativar uma pessoa sem apagar suas horas, comentários e relatos.

## Resultado das conferências (2026-11-16)

| # | Resultado | Efeito |
|---|---|---|
| 1 | Só existe o convite do administrador real; sem `exemplo.com`. | O caso mais grave (cadastro em convite fictício de admin) **não existe**. |
| 2 | 1 pessoa, admin, criada logo após o `01`. | Nenhuma conta desconhecida. |
| 3 | Nenhum convite pendente. | Hoje ninguém pode ser "ultrapassado" no cadastro (S2 sem alvo no momento). |
| 4 | Políticas iguais ao `01`. Privilégios: `authenticated` tem também `delete`, `truncate`, `references`, `trigger` (padrão do Supabase). | S1 confirmada no banco, mas só é explorável quando existir um usuário de coordenação. Privilégios: ver D8. |
| 5 | "Confirm email" **ligado**, "Allow new users to sign up" ligado, SMTP não verificado. | O README mandava desligar (divergência; já corrigido por D2). S2 cai de gravidade (quem cadastra um e-mail alheio não entra sem confirmar), mas surge o risco inverso: convidado externo pode não receber o e-mail. |
| 6 | Sem backup (plano gratuito). | Aceitável com dados de teste; reavaliar antes de dados reais de cliente. |
| 7 | `01` e `02` aplicados agora; nada além disso. | Próximo script é o `03`. Registrado em `supabase/APLICADO.md`. |

**Leitura geral:** o banco está limpo e só tem o administrador. Este é o melhor momento para aplicar o 03 (S1 e B1), porque ainda não há coordenação nem membros a migrar. D1 a D8 já foram decididas (ver abaixo). Antes de convidar a primeira pessoa externa, falta testar se ela recebe o e-mail de confirmação (D2).

## Conferências originais (mantidas como referência)

1. **Convites de exemplo.** `select * from public.convites;` e procure `exemplo.com`. O `02_convites_e_exemplos.sql` cria convites de **admin** com e-mails fictícios. Se nunca foram trocados ou removidos, e "Confirm email" está desligado, qualquer pessoa pode se cadastrar com um deles e virar admin. Se existirem, remova-os agora.
2. **Quem é admin hoje:** `select email, nome, perfil, criado_em from public.pessoas order by criado_em;`. Compare com Authentication, Users, e procure contas desconhecidas.
3. **Convites pendentes:** `select c.* from public.convites c left join public.pessoas p on lower(p.email) = lower(c.email) where p.id is null;`
4. **Políticas e gatilhos reais:** `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='public' and tablename in ('pessoas','convites');` e `select tgname, tgrelid::regclass from pg_trigger where not tgisinternal and tgrelid in ('public.pessoas'::regclass, 'public.convites'::regclass);`
5. **Privilégios em `pessoas`:** `select grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='pessoas';`
6. **Authentication:** "Confirm email" ligado ou desligado, "Allow new users to sign up", provedor de e-mail (embutido ou próprio) e limites, tamanho mínimo de senha.
7. **Algum script além do `01` e do `02` foi aplicado?** Registrar em `supabase/APLICADO.md`.

## Decisões (tomadas em 2026-11-16)

Resumo do que foi decidido, em `docs/decisoes.md`: D1 sim; D2 manter a confirmação de e-mail ligada, sem código de convite por ora; D3 aprovado; D4 sim (`restrict`); D5 manter e destacar; D6 sim; D7 tela de perfil agora, junto de desativar; D8 sim. A tabela abaixo é o texto original das perguntas, com a recomendação do analista.

| # | Decisão | Recomendação do analista |
|---|---|---|
| D1 | Coordenação pode promover membro a coordenação, e rebaixar ou desativar outra coordenação? (o rascunho permite os dois, porque só protege linhas de admin) | Aceitável (par seu). Alternativa: só admin altera qualquer perfil. |
| D2 | S2: manter a confirmação de e-mail **ligada** (estado real; o README mandava desligar e já foi corrigido), código de convite de uso único (b), ou as duas? | Com a confirmação ligada, o risco de S2 é baixo, mas depende de o e-mail chegar (SMTP embutido tem limite baixo e restrições; conferir na documentação atual). Se a entrega falhar com convidados externos, ou for aceitar cliente real: (b), em duas etapas (04 e 05), ou SMTP próprio. Antes, testar o cadastro de uma pessoa externa e o que acontece quando alguém cadastra o e-mail de outra (o analista não afirmou esse comportamento). |
| D3 | Aprovar `drop policy` de `pessoas_editar` e `convites_gestor`, `create or replace` de `eh_membro()` e `eh_gestor()`, e os `revoke` de `update`, `insert` e `delete` em `pessoas` (passa a valer só `update` por coluna) | Necessário para S1 e B1. |
| D4 | Trocar `on delete cascade` por `restrict` em `horas`, `comentarios` e `relatos`? | Sim, para que apagar o usuário no painel não destrua o histórico. Exige conferir os nomes reais das constraints. |
| D5 | Regra de negócio da desativação: o que fazer com entregas e etapas abertas de quem sai? "Sem dono" passa a considerar só responsáveis ativos? | A definir. |
| D6 | Corrigir `horas_editar` e `horas_apagar`, que não exigem `eh_membro()` (pessoa desativada ainda edita as próprias horas)? | Risco baixo; decidir. |
| D7 | Criar tela para promover e rebaixar perfil? | Sem ela, mudança de perfil é pelo painel. |
| D8 | Retirar de `anon` e `authenticated` os privilégios que o app não usa (`truncate`, `references`, `trigger`) nas tabelas de `public`, e conferir o que `anon` tem? A API (PostgREST) não expõe `truncate`, então não é explorável por ela hoje; é endurecimento. | Fazer junto do 03, via `revoke` e `alter default privileges` (o Supabase reaplica o padrão em tabelas novas). Antes, rodar: `select grantee, string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema='public' and table_name='pessoas' group by grantee;` |

## Banco

Mudança de banco: script `supabase/03_perfil_admin_e_desativar_pessoa.sql` (S1, B1, D4, D6, D8). Os scripts 04 e 05 (código de convite, S2) ficam adiados por D2. Admin só é editado por admin (a política de `using` barra linhas de admin para coordenação). O script tem uma trava: aborta sem aplicar nada se houver tabela inesperada em `public` ou foreign key com formato diferente do esperado.

## Arquivos prováveis

`supabase/03_perfil_admin_e_desativar_pessoa.sql`, `src/dados.js` (`definirAtivo`, `definirPerfil`, `montar`, `avancarEtapa`), `src/telas.jsx` (Equipe, Nova entrega, "Precisa de atenção"), `src/Painel.jsx` (seletores de pessoa ativa), `src/App.jsx` (texto de acesso negado), `docs/banco-de-dados.md`, `docs/regras-de-negocio.md`, `supabase/APLICADO.md`.

## Escopo (após as decisões)

1. **Script 03 (pronto, não aplicado):** cria `pessoas.ativo` e `eh_admin()`, faz `eh_membro()`/`eh_gestor()` exigirem `ativo`, restringe as políticas de `pessoas` e `convites`, limita as colunas editáveis de `pessoas`, adiciona um gatilho que impede alterar o próprio perfil e fecha o timer ao desativar, exige pessoa ativa nas políticas de edição e exclusão de horas (D6), troca `cascade` por `restrict` em `horas`, `comentarios` e `relatos` (D4) e retira privilégios não usados de `anon` e `authenticated` (D8). O app atual continua funcionando depois dele (não grava em `pessoas`).
2. **Interface (branch própria, depois do 03 aplicado e testado):**
   - Tela Equipe: separar ativas e desativadas, com "Desativar" e "Reativar", aviso de quantas entregas abertas a pessoa tem (D5) e troca de perfil respeitando as regras do banco (D7).
   - Esconder "Administrador" no convite e na troca de perfil para quem não é admin.
   - Seletores de responsável e de etapa (`Painel.jsx`, Nova entrega) listam só pessoas ativas.
   - "Precisa de atenção" considera "sem dono" a entrega sem nenhum responsável ativo (D5). Atualizar `docs/regras-de-negocio.md`.
   - Texto da tela de acesso negado, que distingue "não convidado" de "desativado" só se for possível sem custo; senão, texto geral.
   - Novas funções em `src/dados.js`: `definirAtivo` e `definirPerfil` (a segunda só devolve erro claro ao usuário se o banco recusar).
3. **S2 (adiado por D2):** manter a confirmação de e-mail ligada e testar a entrega com um e-mail externo. Se o e-mail não chegar, ou ao entrar cliente real, retomar o código de convite (scripts 04 e 05). Esboço:
   - **04 (aditivo):** `convites` ganha `codigo_hash` e `codigo_expira`; índice único em `lower(email)` (falha se houver duplicata por caixa); função `convidar_pessoa(email, nome, area, perfil)` com `security definer`, só gestor, só admin convida admin, que gera o código, guarda o `sha256` e o devolve uma única vez. Aplicar antes de publicar o front novo.
   - **Front:** campo "Código do convite" no cadastro (`signUp` com `options.data`), mensagem única de erro, tela Equipe mostra o código uma vez ao convidar.
   - **05 (depois do front publicado):** `ao_criar_usuario` passa a exigir código válido e não vencido (`raw_user_meta_data->>'codigo'`) e o zera após o uso. Convites sem código deixam de funcionar: refazer com "Remover" e convidar de novo.

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

- [x] Conferências 1 a 7 respondidas pelo usuário e registradas em `supabase/APLICADO.md` (2026-11-16). Resta confirmar os privilégios por papel (D8) e se o SMTP é o embutido.
- [ ] D1 a D8 decididas e registradas em `docs/decisoes.md`.
- [ ] Como coordenação, pela interface e pela API: convidar admin e se promover a admin falham; convidar membro funciona.
- [ ] Como admin: convidar e promover admin funciona; alterar o próprio perfil falha.
- [ ] Desativar uma pessoa: ela perde o acesso na hora, o timer aberto é fechado e suas horas e comentários continuam visíveis. Reativar devolve o acesso.
- [ ] Um e-mail externo recebe o link de confirmação no cadastro (D2); o resultado é registrado em `supabase/APLICADO.md`.
- [ ] Apagar no painel um usuário com histórico falha e o histórico continua intacto (D4); consulta de privilégios "depois" sem `truncate`, `references`, `trigger` nem acesso de `anon` (D8).
- [ ] `npm run build` passa.
- [ ] `docs/banco-de-dados.md`, `docs/regras-de-negocio.md` e `supabase/APLICADO.md` atualizados.

## Resumo do que mudou

(preencher ao fechar)

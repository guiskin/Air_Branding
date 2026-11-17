# 001: roteiro de aplicação do script 03

Para quem executa: o usuário, no SQL Editor do Supabase. O script `supabase/03_perfil_admin_e_desativar_pessoa.sql` é transacional (`begin`/`commit`): se qualquer trava falhar, nada é aplicado.

**Ordem:** 1) consultas "antes" e guardar a saída; 2) executar o script; 3) consultas "depois"; 4) testes; 5) preencher `supabase/APLICADO.md`. O app atual continua funcionando depois do 03 (ele não grava em `pessoas`); as telas de desativar e de perfil vêm depois, em branch própria.

## 1. Consultas antes (guarde a saída: serve para reverter)

```sql
-- a) Objetos em public (a trava do script exige só as 10 tabelas conhecidas)
select c.relname, c.relkind, c.relowner::regrole as dono
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p','v','m','f')
order by c.relname;

-- b) Privilégios de tabela por papel e quem concedeu
select c.relname,
       case when g.grantee = 0 then 'PUBLIC' else g.grantee::regrole::text end as papel,
       g.grantor::regrole as quem_concedeu,
       string_agg(g.privilege_type, ', ' order by g.privilege_type) as privilegios
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) g
where n.nspname = 'public' and c.relkind in ('r','p')
group by c.relname, g.grantee, g.grantor
order by c.relname, papel;

-- c) Privilégios por coluna já existentes em pessoas (esperado: nenhum)
select attname, attacl from pg_attribute
where attrelid = 'public.pessoas'::regclass and attnum > 0 and attacl is not null;

-- d) Default privileges
select defaclrole::regrole as papel, defaclnamespace::regnamespace as schema,
       defaclobjtype as tipo, defaclacl
from pg_default_acl;

-- e) FKs que apontam para pessoas (c=cascade, r=restrict, n=set null, a=no action)
select conrelid::regclass as tabela, conname, confdeltype, pg_get_constraintdef(oid) as definicao
from pg_constraint
where contype = 'f' and confrelid = 'public.pessoas'::regclass
order by 1, 2;

-- f) FK de pessoas para auth.users (deve continuar cascade)
select conname, confdeltype from pg_constraint
where contype = 'f' and conrelid = 'public.pessoas'::regclass and confrelid = 'auth.users'::regclass;

-- g) Políticas e gatilhos
select tablename, policyname, cmd, roles, qual, with_check from pg_policies
where schemaname = 'public' and tablename in ('pessoas','convites','horas') order by 1, 2;
select tgname, tgrelid::regclass from pg_trigger
where not tgisinternal and tgrelid in ('public.pessoas'::regclass, 'public.convites'::regclass);

-- h) Estado de pessoas
select email, nome, perfil, criado_em from public.pessoas order by criado_em;
```

Se a consulta (a) listar algo além das 10 tabelas, **não execute**: o script vai abortar de propósito. Me avise.

## 2. Consultas depois

```sql
-- a) Repita 1b: authenticated só com select/insert/update/delete conforme o script
--    (pessoas: só SELECT na linha de tabela); anon não deve aparecer; quem_concedeu = postgres.

-- b) Deve voltar ZERO linhas
select c.relname, r.rolname, p.priv
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join (values ('anon'), ('authenticated')) r(rolname)
cross join (values ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) p(priv)
where n.nspname = 'public' and c.relkind = 'r'
  and has_table_privilege(r.rolname, c.oid, p.priv);

-- c) anon sem nenhum acesso: deve voltar ZERO linhas
select c.relname, p.priv
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) p(priv)
where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege('anon', c.oid, p.priv);

-- d) Colunas editáveis de pessoas: nome, area, perfil, capacidade_mensal, ativo
select attname, attacl from pg_attribute
where attrelid = 'public.pessoas'::regclass and attnum > 0 and attacl is not null;

-- e) Repita 1d: não deve restar entrada concedendo a anon/authenticated para o papel postgres.
-- f) Repita 1e: horas, comentarios e relatos com confdeltype = 'r', mesmos nomes. Repita 1f: continua 'c'.
-- g) Repita 1g: pessoas_editar nova; convites_ver/criar/editar/apagar; horas_editar e horas_apagar com eh_membro(); gatilho pessoas_proteger presente.

-- h) Coluna e funções
select column_name, data_type, column_default, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'pessoas' and column_name = 'ativo';
select proname, prosecdef from pg_proc
where pronamespace = 'public'::regnamespace and proname in ('eh_admin','eh_membro','eh_gestor','proteger_pessoas');
select email, perfil, ativo from public.pessoas;   -- todos ativo = true
```

## 3. Testes (critérios de aceite)

Hoje só existe o administrador. Para testar coordenação e membro, crie 2 usuários de teste com e-mails que você controla. **Depois do D4, usuário com horas, comentário ou relato não pode mais ser apagado no painel**: prefira desativar os de teste ou limpe antes as linhas deles.

Para simular uma pessoa pelo SQL Editor (sempre termina em `rollback`):

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<UUID_DA_PESSOA>","role":"authenticated"}', true);
-- comando do teste
rollback;
```

**Logo após aplicar, como admin (interface)**
- Editar um membro (capacidade mensal ou área) funciona. Isto prova que revogar `execute` de `proteger_pessoas` não quebrou o gatilho. Se der "permission denied for function proteger_pessoas": `grant execute on function public.proteger_pessoas() to authenticated;`.
- Convidar um membro, um coordenador e um admin: os 3 convites são gravados.
- Alterar o próprio perfil falha com "Ninguem altera o proprio perfil".

**Como coordenação**
- Convida membro e coordenação: OK. Convida admin: erro de RLS.
- `update public.pessoas set perfil='admin' where id='<UUID_MEMBRO>';` falha por RLS.
- `update public.pessoas set nome='x' where id='<UUID_ADMIN>';` não altera nada (0 linhas).
- Promover membro a coordenação funciona; rebaixar ou desativar outra coordenação funciona (D1).
- Alterar o próprio perfil ou desativar a própria conta falha com a mensagem do gatilho.
- `update ... set email=...` falha com "permission denied" por coluna; `insert` ou `delete` em `pessoas` falham com "permission denied for table".
- `delete from public.convites where perfil='admin'` não apaga nada.

**Como admin:** convidar e promover admin funcionam; alterar o próprio perfil falha; rebaixar ou desativar outro admin funciona.

**Desativar e reativar**
1. Como o membro de teste, deixe um timer aberto. Desative-o como admin ou coordenação.
2. `select fim, minutos from public.horas where pessoa_id='<UUID>' order by inicio desc limit 1;` mostra `fim` preenchido e `minutos >= 1`.
3. O membro atualiza a página e cai na tela de acesso negado. Simulado com o token dele: `select count(*) from public.entregas;` retorna 0 e `insert` em horas falha por RLS.
4. Como admin, as horas, comentários e relatos dele continuam visíveis.
5. Como o desativado (simulado), `update public.horas set observacao='x' where pessoa_id=auth.uid();` não altera nada (D6).
6. Reativar volta o acesso sem novo cadastro; o timer fechado continua fechado.
7. Coordenação desativa outra coordenação: funciona. Coordenação tenta desativar admin: 0 linhas.

**Apagar usuário no painel (D4)**
1. Conferir antes: `select 'horas', count(*) from public.horas where pessoa_id='<UUID>' union all select 'comentarios', count(*) from public.comentarios where autor_id='<UUID>' union all select 'relatos', count(*) from public.relatos where autor_id='<UUID>';`
2. Usuário **com** histórico: Authentication, Users, excluir. Esperado: falha e o usuário continua na lista, com `pessoas` e histórico intactos. A mensagem exata do painel não foi verificada; confira em Logs, Postgres.
3. Usuário **sem** histórico: excluir funciona e `pessoas` some em cascata.

**Cadastro e regressão (D2 e D8)**
1. Cadastro com e-mail não convidado falha.
2. Cadastro com e-mail convidado cria `pessoas` com `ativo = true` e continua exigindo confirmação de e-mail. **Teste o recebimento do e-mail com um convidado externo antes de convidar a equipe.**
3. Login, logout e cada tela (Projetos, Entregas, Timer, Comentários, Relato de bug, Equipe, Convites) funcionam como membro, coordenação e admin; o realtime atualiza outras sessões.
4. Em aba anônima, a tela de login abre e aceita login e cadastro (valida a retirada de privilégios de `anon`).

## 4. Riscos residuais

- **Último admin:** dois admins podem se rebaixar ao mesmo tempo e ficar sem admin; um admin sem histórico pode ser apagado no painel. A recuperação é pelo SQL Editor (o gatilho não bloqueia quem roda SQL lá). Não há trava de "último admin" (não foi decidida).
- **D1 é amplo:** qualquer coordenação rebaixa ou desativa outra, e não existe registro de auditoria.
- **D4:** apagar de verdade deixa de ser possível para quem tem histórico (inclui pedido de exclusão de dados). Será preciso procedimento manual (reatribuir ou anonimizar o autor, depois apagar).
- **Desativar não bloqueia o login no Auth**, só o acesso aos dados. A pessoa vê a tela de acesso negado, que ainda não distingue "não convidado" de "desativado" (texto a ajustar na interface).
- **D5 (interface):** `montar()`, `avancarEtapa`, `alternarResponsavel`, `definirPessoaEtapa` e `criarEntrega` em `src/dados.js`, e os seletores de pessoa em Equipe, Nova entrega e `Painel.jsx`, precisam considerar só pessoas ativas, e "sem dono" só responsáveis ativos.
- **D8:** o `revoke` só alcança concessões feitas pelo papel que executa; política nova sem `grant` passa a dar "permission denied" (intencional); o `alter default privileges` vale só para tabelas criadas pelo papel `postgres`; o padrão da plataforma pode mudar, então reconferir ao criar tabela nova. As funções `eh_membro`, `eh_gestor` e `ao_criar_usuario` mantêm o `execute` padrão (não explorável, mas fora deste script).
- Qualquer script futuro com `grant ... on all tables ... to authenticated` desfaz o D8 e a restrição de colunas de `pessoas`.
- O gatilho sem `execute` para `authenticated` depende de comportamento do Postgres que não foi testado aqui (ver o primeiro teste).
- Sem backup (plano gratuito): a reversão de D4 e D8 depende da saída salva das consultas "antes".

## 5. Resultado no projeto de teste (2026-11-17)

Aplicado e testado em um projeto de teste separado (`airbranding-teste`, plano gratuito), criado vazio e preenchido com o `01`, uma versão fictícia do `02` (4 pessoas de teste: admin, 2 coordenações e 1 membro, com e-mails `.test`) e alguns dados (entrega, horas com timer aberto, comentário e relato). **O banco real não foi tocado.**

**Antes (no teste, igual ao real pelo que se viu):** `anon` e `authenticated` com todos os privilégios em `pessoas` (select, insert, update, delete, truncate, references, trigger e `maintain`, que existe no Postgres 17); as 10 tabelas e nada mais em `public`; FKs `horas_pessoa_id_fkey`, `comentarios_autor_id_fkey` e `relatos_autor_id_fkey` com `cascade`.

**Script 03:** executado inteiro, com `begin`/`commit`, sem erro. A trava e o bloco dinâmico das FKs passaram.

**Depois:**
- `anon`: nenhum privilégio em nenhuma tabela. Nenhum `truncate`, `references`, `trigger` ou `maintain` para `anon` e `authenticated`.
- `authenticated`: só o que as políticas usam (`pessoas`: `select`, e `update` apenas em `nome`, `area`, `perfil`, `capacidade_mensal`, `ativo`).
- FKs de `horas`, `comentarios` e `relatos` em `restrict`; `pessoas.id` para `auth.users` continua `cascade`.
- Políticas novas de `pessoas`, `convites` e `horas`, como no script.

**Testes de comportamento (35, todos como esperado):**
- Admin edita membro (prova que o gatilho executa mesmo sem `execute` para `authenticated`), cria convite de admin, e não altera o próprio perfil nem desativa a própria conta.
- Coordenação convida membro e coordenação; não convida admin, não promove ninguém a admin, não edita nem desativa admin (0 linhas); promove e rebaixa membro, desativa e reativa outra coordenação (D1); não altera o próprio perfil nem desativa a própria conta; não troca e-mail, não apaga nem insere `pessoas`; não apaga convite de admin.
- Desativar o membro fechou o timer aberto (12 min); desativado não vê entregas, não cria horas e não edita horas; reativar devolve o acesso.
- `anon` não lê `pessoas` nem cria convite.
- Apagar usuário com histórico falha por `horas_pessoa_id_fkey`; sem histórico funciona e a pessoa some.
- Cadastro de e-mail não convidado falha; de convidado funciona e nasce `ativo = true`.

**Operações do app (22, como membro e como coordenação, espelhando `dados.js`):** carregar as 8 tabelas, criar entrega, responsável, etapas, concluir etapa, mudar status, comentar, iniciar e parar timer, hora manual, tirar responsável, enviar relato, criar cliente e projeto, editar projeto, ler convites e relatos, marcar relato resolvido, remover convite, apagar entrega. Todas passaram; as proibidas falharam como deveriam. A coluna `ativo` e as demais colunas de `pessoas` aparecem como editáveis.

**O que não foi testado:** o app em si contra o projeto de teste (login real, tela e realtime), o e-mail de confirmação (D2) e o botão de apagar usuário no painel (a falha da FK foi vista por SQL). O `alter default privileges` só vale para tabelas criadas pelo papel `postgres`; o `supabase_admin` mantém o padrão da plataforma (conferido em `pg_default_acl`).

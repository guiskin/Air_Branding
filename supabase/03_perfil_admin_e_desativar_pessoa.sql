-- 03: perfil admin protegido, desativar pessoa, historico preservado, privilegios minimos.
-- Tarefa 001 (decisoes D1 a D6 e D8). Quem executa no SQL Editor do Supabase e o usuario.
-- Scripts 04 e 05 (codigo de convite) ficam adiados: nao fazem parte deste.
-- Antes de executar, siga tasks/001-roteiro-de-aplicacao.md (consultas "antes" e guardar a saida).
--
-- O QUE FAZ
--  S1 (D1): so admin cria, edita ou promove admin (em pessoas e em convites). Coordenacao
--     continua gerenciando membros E outras coordenacoes (promover membro a coordenacao,
--     rebaixar e desativar coordenacao). Ninguem altera o proprio perfil nem desativa a
--     propria conta (gatilho). Colunas editaveis pela API em pessoas: nome, area, perfil,
--     capacidade_mensal, ativo (id, email, criado_em ficam imutaveis).
--  B1: coluna pessoas.ativo. Pessoa desativada perde acesso (eh_membro/eh_gestor/eh_admin
--     exigem ativo) sem apagar horas, comentarios nem relatos. Ao desativar, o gatilho
--     fecha o timer aberto da pessoa. NAO remove a pessoa de entregas/etapas (D5: isso e
--     tratado na interface).
--  D6: horas_editar e horas_apagar passam a exigir tambem eh_membro() (pessoa ativa).
--  D4: horas.pessoa_id, comentarios.autor_id e relatos.autor_id passam de on delete cascade
--     para on delete restrict. Apagar no painel um usuario que tenha historico passa a
--     FALHAR (a pessoa deve ser desativada). pessoas.id -> auth.users continua cascade.
--  D8: remove de anon e authenticated todos os privilegios de tabela em public e devolve a
--     authenticated apenas select/insert/update/delete conforme as politicas existentes
--     (pessoas: select + update por coluna). anon fica sem nenhum privilegio de tabela.
--     Ajusta alter default privileges para tabelas futuras criadas pelo papel postgres.
--
-- MODIFICA OBJETOS EXISTENTES (aprovacao ja dada: D3, D4, D6, D8)
--  - drop policy pessoas_editar, convites_gestor, horas_editar, horas_apagar (recriadas)
--  - create or replace eh_membro() e eh_gestor() (agora exigem ativo)
--  - 3 foreign keys recriadas com o mesmo nome (restrict)
--  - privilegios de tabela de anon e authenticated em todo o schema public
--  - default privileges do papel postgres no schema public
--
-- IMPACTO EM DADOS EXISTENTES
--  - pessoas ganha ativo = true em todas as linhas. Nenhuma outra linha e alterada.
--  - Nenhum check novo; nada e rejeitado retroativamente. As FKs recriadas revalidam as
--    linhas existentes (todas ja validas; tabelas pequenas, bloqueio de instantes).
--  - NAO corrige escalada de perfil ja ocorrida.
--  - O script aborta (sem aplicar nada) se existir tabela fora das 10 conhecidas em public
--    ou se uma das 3 FKs nao tiver o formato esperado.
--  - Depois de aplicar: nenhum script futuro deve repetir
--    "grant ... on all tables in schema public to authenticated" (reabriria pessoas e
--    devolveria truncate/references/trigger). Toda tabela ou politica nova precisa de grant
--    explicito na propria migracao.
--
-- REVERSAO (manual, nesta ordem; guarde antes a saida das consultas de conferencia)
--  1. Privilegios (D8): o estado original de anon/authenticated esta na consulta "antes".
--     Padrao Supabase: grant all on all tables in schema public to anon, authenticated;
--     e alter default privileges in schema public grant all on tables to anon, authenticated;
--     (ajuste conforme a saida salva).
--  2. FKs (D4): para cada (horas.pessoa_id, comentarios.autor_id, relatos.autor_id):
--     alter table public.<tabela> drop constraint <nome>,
--       add constraint <nome> foreign key (<coluna>) references public.pessoas (id) on delete cascade;
--  3. drop policy horas_editar, horas_apagar on public.horas; recriar como em 01_estrutura.sql.
--  4. drop trigger pessoas_proteger on public.pessoas; drop function public.proteger_pessoas();
--  5. drop policy convites_ver, convites_criar, convites_editar, convites_apagar on public.convites;
--     recriar convites_gestor exatamente como em 01_estrutura.sql.
--  6. drop policy pessoas_editar on public.pessoas; recriar como em 01_estrutura.sql.
--  7. create or replace eh_membro() e eh_gestor() sem "and ativo" (texto em 01_estrutura.sql);
--     drop function public.eh_admin();
--  8. alter table public.pessoas drop column ativo;  -- perde quem estava desativado (pedir aprovacao)

begin;

-- 0. Trava: so as 10 tabelas conhecidas podem existir em public (o revoke all mais abaixo
--    cortaria o acesso da API a qualquer outra).
do $$
declare
  extras text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into extras
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r', 'p', 'v', 'm', 'f')
     and c.relname not in ('convites', 'pessoas', 'clientes', 'projetos', 'entregas',
                           'entrega_responsaveis', 'etapas', 'horas', 'comentarios', 'relatos');
  if extras is not null then
    raise exception 'Objetos fora do esperado em public: %. Inclua-os no script antes de executar.', extras;
  end if;
end;
$$;

-- 1. Coluna e funcoes de perfil
alter table public.pessoas add column if not exists ativo boolean not null default true;

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pessoas where id = auth.uid() and perfil = 'admin' and ativo);
$$;

create or replace function public.eh_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pessoas where id = auth.uid() and ativo);
$$;

create or replace function public.eh_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pessoas where id = auth.uid() and ativo and perfil in ('admin', 'coordenacao'));
$$;

revoke execute on function public.eh_admin() from public, anon;
grant execute on function public.eh_admin() to authenticated;

-- 2. Politicas
-- pessoas: so admin toca em linha admin; coordenacao nao cria nem edita admin (using barra a
-- linha antiga, with check barra a nova). Coordenacao pode promover/rebaixar/desativar
-- coordenacao e membro (D1).
drop policy if exists pessoas_editar on public.pessoas;
create policy pessoas_editar on public.pessoas for update to authenticated
  using (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'))
  with check (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));

-- convites: gestor ve; so admin cria, edita ou apaga convite de admin
drop policy if exists convites_gestor on public.convites;
drop policy if exists convites_ver on public.convites;
drop policy if exists convites_criar on public.convites;
drop policy if exists convites_editar on public.convites;
drop policy if exists convites_apagar on public.convites;
create policy convites_ver on public.convites for select to authenticated using (public.eh_gestor());
create policy convites_criar on public.convites for insert to authenticated
  with check (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));
create policy convites_editar on public.convites for update to authenticated
  using (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'))
  with check (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));
create policy convites_apagar on public.convites for delete to authenticated
  using (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));

-- horas (D6): editar e apagar as proprias horas exige pessoa ativa
drop policy if exists horas_editar on public.horas;
create policy horas_editar on public.horas for update to authenticated
  using (pessoa_id = auth.uid() and public.eh_membro())
  with check (pessoa_id = auth.uid() and public.eh_membro());
drop policy if exists horas_apagar on public.horas;
create policy horas_apagar on public.horas for delete to authenticated
  using (pessoa_id = auth.uid() and public.eh_membro());

-- 3. Gatilho: regras que a RLS nao enxerga (old x new). auth.uid() e nulo no SQL Editor e
-- na chave service_role, entao la nada e bloqueado (recuperacao de emergencia).
create or replace function public.proteger_pessoas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and old.id = auth.uid() then
    if new.perfil is distinct from old.perfil then
      raise exception 'Ninguem altera o proprio perfil';
    end if;
    if new.ativo is distinct from old.ativo then
      raise exception 'Ninguem desativa a propria conta';
    end if;
  end if;
  if old.ativo and not new.ativo then
    -- fecha o timer aberto (mesma conta de pararTimer em dados.js: minimo de 1 minuto)
    update public.horas
       set fim = now(),
           minutos = greatest(1, round(extract(epoch from (now() - inicio)) / 60)::int)
     where pessoa_id = old.id and fim is null;
  end if;
  return new;
end;
$$;

revoke execute on function public.proteger_pessoas() from public, anon, authenticated;

drop trigger if exists pessoas_proteger on public.pessoas;
create trigger pessoas_proteger
before update on public.pessoas
for each row execute function public.proteger_pessoas();

-- 4. D4: historico nao some quando o usuario e apagado. Descobre o nome real de cada FK no
-- catalogo e recria com o mesmo nome. Qualquer surpresa aborta a transacao inteira.
do $$
declare
  alvo record;
  fk record;
  v_qtd integer;
  v_nome name;
  v_acao "char";
  v_upd "char";
  v_defer boolean;
begin
  for alvo in
    select * from (values ('horas', 'pessoa_id'), ('comentarios', 'autor_id'), ('relatos', 'autor_id'))
      as t(tabela, coluna)
  loop
    v_qtd := 0;
    for fk in
      select c.conname, c.confdeltype, c.confupdtype, c.condeferrable
        from pg_constraint c
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
       where c.contype = 'f'
         and c.conrelid = format('public.%I', alvo.tabela)::regclass
         and c.confrelid = 'public.pessoas'::regclass
         and array_length(c.conkey, 1) = 1
         and a.attname = alvo.coluna
    loop
      v_qtd := v_qtd + 1;
      v_nome := fk.conname;
      v_acao := fk.confdeltype;
      v_upd := fk.confupdtype;
      v_defer := fk.condeferrable;
    end loop;

    if v_qtd <> 1 then
      raise exception 'Esperava 1 FK de public.%.% para public.pessoas, achei %. Nada foi aplicado.',
        alvo.tabela, alvo.coluna, v_qtd;
    end if;

    if v_acao = 'r' then
      raise notice 'FK % ja e restrict; nada a fazer.', v_nome;
    elsif v_acao = 'c' and v_upd = 'a' and not v_defer then
      execute format(
        'alter table public.%I drop constraint %I, add constraint %I foreign key (%I) references public.pessoas (id) on delete restrict',
        alvo.tabela, v_nome, v_nome, alvo.coluna);
      raise notice 'FK % recriada com on delete restrict.', v_nome;
    else
      raise exception 'FK % tem formato inesperado (delete=%, update=%, deferivel=%). Nada foi aplicado.',
        v_nome, v_acao, v_upd, v_defer;
    end if;
  end loop;
end;
$$;

-- 5. D8: privilegios minimos. revoke all e independente de versao do Postgres. Revogar o que
-- nao existe nao da erro. So revoga o que foi concedido pelo papel que executa (postgres):
-- confira a coluna grantor na consulta "depois".
revoke all on all tables in schema public from anon, authenticated;

-- authenticated recebe so o que as politicas usam
grant select, insert, update, delete on public.convites to authenticated;
grant select on public.pessoas to authenticated;
grant update (nome, area, perfil, capacidade_mensal, ativo) on public.pessoas to authenticated;
grant select, insert, update on public.clientes to authenticated;
grant select, insert, update on public.projetos to authenticated;
grant select, insert, update, delete on public.entregas to authenticated;
grant select, insert, delete on public.entrega_responsaveis to authenticated;
grant select, insert, update on public.etapas to authenticated;
grant select, insert, update, delete on public.horas to authenticated;
grant select, insert on public.comentarios to authenticated;
grant select, insert, update on public.relatos to authenticated;

-- tabelas futuras criadas pelo papel postgres nao nascem com acesso para anon/authenticated
alter default privileges in schema public revoke all on tables from anon, authenticated;

commit;

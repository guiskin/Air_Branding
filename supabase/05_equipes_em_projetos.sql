-- Cria equipes reutilizáveis e uma cópia da composição aplicada a cada projeto.
-- Requer 03 e realtime. Os projetos, entregas, etapas e responsáveis existentes
-- permanecem intactos. Projetos existentes começam sem equipe cadastrada.
-- Reversão operacional: retire a versão do app que usa as funções e revogue
-- EXECUTE nas três RPCs. As tabelas podem ser mantidas para preservar o cadastro.
-- Cria 4 tabelas (equipes, equipe_membros, projeto_equipes, projeto_equipe_membros) com RLS
-- só de leitura para membros e 3 funções (salvar_equipe, aplicar_equipe_projeto,
-- criar_projeto_com_equipe) executáveis só por gestor, que são o único caminho de escrita.
-- A equipe aplicada a um projeto é uma cópia: editar a equipe depois não altera projetos
-- que já a usam; é preciso reaplicá-la.
-- Trava inicial: aborta se faltar a 03 ou o Realtime, ou se as tabelas já existirem.
-- Reversão completa (apaga o cadastro de equipes; exige aprovação explícita):
--   alter publication supabase_realtime drop table public.equipes, public.equipe_membros,
--     public.projeto_equipes, public.projeto_equipe_membros;
--   drop function public.salvar_equipe(uuid, text, uuid[]);
--   drop function public.aplicar_equipe_projeto(uuid, uuid);
--   drop function public.criar_projeto_com_equipe(uuid, text, text, text, numeric, uuid);
--   drop table public.projeto_equipe_membros, public.projeto_equipes,
--     public.equipe_membros, public.equipes;

begin;

do $$
begin
  if to_regprocedure('public.eh_admin()') is null
     or to_regprocedure('public.eh_gestor()') is null
     or not exists (select 1 from pg_publication where pubname = 'supabase_realtime' and not puballtables)
     or to_regclass('public.equipes') is not null
     or to_regclass('public.equipe_membros') is not null
     or to_regclass('public.projeto_equipes') is not null
     or to_regclass('public.projeto_equipe_membros') is not null then
    raise exception 'Confira a migração 03, a publicação Realtime e as tabelas antes da migração 05.';
  end if;
end;
$$;

create table public.equipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 80 and nome = btrim(nome) and nome !~ '[[:cntrl:]]')
);

create unique index equipes_nome_unico on public.equipes (lower(nome));

create table public.equipe_membros (
  equipe_id uuid not null references public.equipes (id) on delete cascade,
  pessoa_id uuid not null references public.pessoas (id) on delete cascade,
  primary key (equipe_id, pessoa_id)
);

create table public.projeto_equipes (
  projeto_id uuid primary key references public.projetos (id) on delete cascade,
  equipe_id uuid not null references public.equipes (id) on delete restrict
);

create table public.projeto_equipe_membros (
  projeto_id uuid not null references public.projeto_equipes (projeto_id) on delete cascade,
  pessoa_id uuid not null references public.pessoas (id) on delete cascade,
  primary key (projeto_id, pessoa_id)
);

create index equipe_membros_por_pessoa on public.equipe_membros (pessoa_id);
create index projeto_equipes_por_equipe on public.projeto_equipes (equipe_id);
create index projeto_equipe_membros_por_pessoa on public.projeto_equipe_membros (pessoa_id);

alter table public.equipes enable row level security;
alter table public.equipe_membros enable row level security;
alter table public.projeto_equipes enable row level security;
alter table public.projeto_equipe_membros enable row level security;

revoke all on public.equipes, public.equipe_membros, public.projeto_equipes, public.projeto_equipe_membros from public, anon, authenticated;
grant select on public.equipes, public.equipe_membros, public.projeto_equipes, public.projeto_equipe_membros to authenticated;

create policy equipes_ver on public.equipes for select to authenticated using ((select public.eh_membro()));
create policy equipe_membros_ver on public.equipe_membros for select to authenticated using ((select public.eh_membro()));
create policy projeto_equipes_ver on public.projeto_equipes for select to authenticated using ((select public.eh_membro()));
create policy projeto_equipe_membros_ver on public.projeto_equipe_membros for select to authenticated using ((select public.eh_membro()));

create function public.salvar_equipe(equipe uuid, novo_nome text, membros uuid[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  nome_limpo text := btrim(novo_nome);
  ids uuid[] := array(select distinct unnest(membros));
  ativos integer;
begin
  if not public.eh_gestor() then
    raise exception 'Somente gestores podem salvar equipes.' using errcode = '42501';
  end if;
  if nome_limpo is null or char_length(nome_limpo) not between 1 and 80 or nome_limpo ~ '[[:cntrl:]]' then
    raise exception 'Informe um nome de equipe de até 80 caracteres.';
  end if;
  if cardinality(ids) = 0 then
    raise exception 'Selecione ao menos uma pessoa ativa.';
  end if;

  if equipe is not null then
    perform 1 from public.equipes where id = equipe for update;
    if not found then raise exception 'Equipe não encontrada.'; end if;
  end if;

  perform 1 from public.pessoas where id = any(ids) and ativo order by id for share;
  get diagnostics ativos = row_count;
  if ativos <> cardinality(ids) then
    raise exception 'Selecione apenas pessoas ativas.';
  end if;

  if equipe is null then
    insert into public.equipes (nome) values (nome_limpo) returning id into equipe;
  else
    update public.equipes set nome = nome_limpo where id = equipe;
    delete from public.equipe_membros where equipe_id = equipe;
  end if;

  insert into public.equipe_membros (equipe_id, pessoa_id)
  select equipe, pessoa_id from unnest(ids) as pessoa_id;
  return equipe;
exception when unique_violation then
  raise exception 'Já existe uma equipe com esse nome.' using errcode = '23505';
end;
$$;

create function public.aplicar_equipe_projeto(projeto uuid, equipe uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  ativos uuid[];
begin
  if not public.eh_gestor() then
    raise exception 'Somente gestores podem aplicar equipes.' using errcode = '42501';
  end if;
  perform 1 from public.projetos where id = projeto and ativo for update;
  if not found then raise exception 'Projeto ativo não encontrado.'; end if;

  if equipe is null then
    delete from public.projeto_equipes where projeto_id = projeto;
    return;
  end if;

  perform 1 from public.equipes where id = equipe for share;
  if not found then raise exception 'Equipe não encontrada.'; end if;

  ativos := array(
    select p.id from public.equipe_membros m join public.pessoas p on p.id = m.pessoa_id
    where m.equipe_id = equipe and p.ativo order by p.id for share of p
  );
  if cardinality(ativos) = 0 then
    raise exception 'A equipe precisa ter ao menos uma pessoa ativa.';
  end if;

  insert into public.projeto_equipes (projeto_id, equipe_id) values (projeto, equipe)
  on conflict (projeto_id) do update set equipe_id = excluded.equipe_id;
  delete from public.projeto_equipe_membros where projeto_id = projeto;
  insert into public.projeto_equipe_membros (projeto_id, pessoa_id)
  select projeto, pessoa_id from unnest(ativos) as pessoa_id;
end;
$$;

create function public.criar_projeto_com_equipe(cliente uuid, codigo text, nome text, linha text, horas numeric, equipe uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  projeto uuid;
begin
  if not public.eh_gestor() then
    raise exception 'Somente gestores podem criar projetos.' using errcode = '42501';
  end if;
  insert into public.projetos (cliente_id, codigo, nome, linha, horas_vendidas)
  values (cliente, codigo, nome, linha, horas) returning id into projeto;
  perform public.aplicar_equipe_projeto(projeto, equipe);
  return projeto;
end;
$$;

revoke all on function public.salvar_equipe(uuid,text,uuid[]), public.aplicar_equipe_projeto(uuid,uuid), public.criar_projeto_com_equipe(uuid,text,text,text,numeric,uuid) from public, anon, authenticated;
grant execute on function public.salvar_equipe(uuid,text,uuid[]), public.aplicar_equipe_projeto(uuid,uuid), public.criar_projeto_com_equipe(uuid,text,text,text,numeric,uuid) to authenticated;

alter publication supabase_realtime add table public.equipes, public.equipe_membros, public.projeto_equipes, public.projeto_equipe_membros;

commit;

-- Cada entrega começa em V1. Se passar do limite do projeto, aparece em Qualidade.
-- O limite padrão é V3 e a migração não gera alertas para entregas antigas.
-- Reversão: reverta o app e revogue EXECUTE de registrar_versao; preserve as versões.
begin;

do $$
begin
  if to_regprocedure('public.eh_admin()') is null
     or to_regclass('public.entrega_versoes') is not null
     or not exists (select 1 from pg_publication where pubname = 'supabase_realtime' and not puballtables) then
    raise exception 'Confira a migração 03, o Realtime e as tabelas antes da 10.';
  end if;
end;
$$;

alter table public.projetos add column limite_versao integer not null default 3 check (limite_versao between 1 and 99);

create table public.entrega_versoes (
  entrega_id uuid primary key references public.entregas(id) on delete cascade,
  versao integer not null check (versao >= 2)
);

alter table public.entrega_versoes enable row level security;
revoke all on public.entrega_versoes from public, anon, authenticated;
grant select on public.entrega_versoes to authenticated;
create policy entrega_versoes_ver on public.entrega_versoes for select to authenticated using ((select public.eh_membro()));

create function public.registrar_versao(entrega uuid, versao_anterior integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  versao_atual integer;
begin
  if not public.eh_membro() then
    raise exception 'Acesso restrito à equipe interna.' using errcode = '42501';
  end if;

  perform 1 from public.entregas e join public.projetos p on p.id = e.projeto_id
    where e.id = entrega and p.ativo and e.status <> 'concluido' for update of e;
  if not found then raise exception 'A entrega precisa estar aberta em um projeto ativo.'; end if;

  select coalesce((select versao from public.entrega_versoes where entrega_id = entrega), 1) into versao_atual;
  if versao_anterior is distinct from versao_atual then
    return versao_atual;
  end if;

  insert into public.entrega_versoes (entrega_id, versao) values (entrega, versao_atual + 1)
    on conflict (entrega_id) do update set versao = excluded.versao;
  return versao_atual + 1;
end;
$$;

revoke all on function public.registrar_versao(uuid,integer) from public, anon, authenticated;
grant execute on function public.registrar_versao(uuid,integer) to authenticated;
alter publication supabase_realtime add table public.entrega_versoes;

commit;

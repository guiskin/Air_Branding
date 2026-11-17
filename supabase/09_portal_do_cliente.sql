-- Portal de leitura para contas externas por e-mail confirmado e projeto ativo.
-- Requer 03. Mantém contas, convites internos e dados existentes.
-- Reversão: volte o app e revogue os grants do portal. Restaure a função
-- ao_criar_usuario da 01 antes de desabilitar novos cadastros externos.
-- Preserve os vínculos para permitir reativação sem perda de dados.
-- Só reative a publicação Realtime de DELETE depois de retirar o acesso externo.
begin;

do $$
begin
  if to_regprocedure('public.eh_admin()') is null
     or to_regprocedure('public.ao_criar_usuario()') is null
     or to_regclass('public.projeto_acessos_cliente') is not null
     or not exists (select 1 from pg_publication where pubname = 'supabase_realtime' and pubinsert and pubupdate) then
    raise exception 'Confira a migração 03 e se o portal já foi instalado.';
  end if;
end;
$$;

create table public.projeto_acessos_cliente (
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  primary key (projeto_id, email)
);
create index projeto_acessos_cliente_email on public.projeto_acessos_cliente(email);

alter table public.projeto_acessos_cliente enable row level security;
revoke all on public.projeto_acessos_cliente from public, anon, authenticated;
grant select, insert, delete on public.projeto_acessos_cliente to authenticated;
create policy acesso_cliente_ver on public.projeto_acessos_cliente for select to authenticated using ((select public.eh_gestor()));
create policy acesso_cliente_conceder on public.projeto_acessos_cliente for insert to authenticated with check (
  (select public.eh_gestor()) and exists (select 1 from public.projetos p where p.id = projeto_id and p.ativo)
);
create policy acesso_cliente_revogar on public.projeto_acessos_cliente for delete to authenticated using ((select public.eh_gestor()));

create table public.portal_entregas (
  entrega_id uuid primary key references public.entregas(id) on delete cascade
);
alter table public.portal_entregas enable row level security;
revoke all on public.portal_entregas from public, anon, authenticated;
grant select, insert, delete on public.portal_entregas to authenticated;
create policy portal_entregas_ver on public.portal_entregas for select to authenticated using ((select public.eh_gestor()));
create policy portal_entregas_publicar on public.portal_entregas for insert to authenticated with check ((select public.eh_gestor()));
create policy portal_entregas_ocultar on public.portal_entregas for delete to authenticated using ((select public.eh_gestor()));

-- Postgres Changes não aplica RLS em DELETE. As exclusões passam a chegar às
-- outras sessões internas pela atualização periódica do aplicativo.
alter publication supabase_realtime set (publish = 'insert, update');

create or replace function public.ao_criar_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c public.convites%rowtype;
begin
  select * into c from public.convites where lower(email) = lower(new.email);
  if found then
    insert into public.pessoas (id, email, nome, area, perfil)
    values (new.id, lower(new.email), c.nome, c.area, c.perfil);
    return new;
  end if;

  if exists (
    select 1 from public.projeto_acessos_cliente a join public.projetos p on p.id = a.projeto_id
    where a.email = lower(new.email) and p.ativo
  ) then
    return new;
  end if;
  raise exception 'E-mail nao convidado para o piloto';
end;
$$;

create function public.painel_do_cliente() returns table (
  id uuid, codigo text, nome text, cliente text, horas_contratadas numeric, minutos_lancados bigint, entregas jsonb
)
language sql stable security definer set search_path = '' as $$
  select p.id, p.codigo, p.nome, c.nome, p.horas_vendidas,
    coalesce((select sum(h.minutos) from public.horas h where h.projeto_id = p.id and h.fim is not null), 0),
    coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'titulo', e.titulo, 'status', e.status, 'prazo', e.prazo)
        order by e.prazo nulls last, e.titulo, e.id)
      from public.entregas e join public.portal_entregas pe on pe.entrega_id = e.id
      where e.projeto_id = p.id
    ), '[]'::jsonb)
  from auth.users u
    join public.projeto_acessos_cliente a on a.email = lower(u.email)
    join public.projetos p on p.id = a.projeto_id and p.ativo
    join public.clientes c on c.id = p.cliente_id
  where u.id = (select auth.uid()) and u.email_confirmed_at is not null
    and u.deleted_at is null and (u.banned_until is null or u.banned_until <= now())
    and not exists (select 1 from public.pessoas i where i.id = u.id)
  order by p.codigo;
$$;

revoke all on function public.painel_do_cliente() from public, anon, authenticated;
grant execute on function public.painel_do_cliente() to authenticated;

commit;

create table public.convites (
  email text primary key,
  nome text not null,
  area text not null default 'Produção',
  perfil text not null default 'membro' check (perfil in ('admin', 'coordenacao', 'membro'))
);

create table public.pessoas (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nome text not null,
  area text not null,
  perfil text not null check (perfil in ('admin', 'coordenacao', 'membro')),
  capacidade_mensal integer not null default 168,
  criado_em timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  criado_em timestamptz not null default now()
);

create table public.projetos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  codigo text not null unique,
  nome text not null,
  linha text not null default '',
  horas_vendidas numeric not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  titulo text not null,
  briefing text not null default '',
  link_drive text not null default '',
  status text not null default 'backlog' check (status in ('backlog', 'aguardando', 'planejado', 'andamento', 'revisao', 'aprovacao', 'ajustes', 'concluido')),
  inicio date,
  prazo date,
  prioridade text not null default 'normal' check (prioridade in ('baixa', 'normal', 'alta')),
  horas_estimadas numeric not null default 0,
  criado_por uuid references public.pessoas (id) on delete set null,
  criado_em timestamptz not null default now()
);

create table public.entrega_responsaveis (
  entrega_id uuid not null references public.entregas (id) on delete cascade,
  pessoa_id uuid not null references public.pessoas (id) on delete cascade,
  primary key (entrega_id, pessoa_id)
);

create table public.etapas (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.entregas (id) on delete cascade,
  ordem integer not null,
  nome text not null,
  pessoa_id uuid references public.pessoas (id) on delete set null,
  concluida boolean not null default false,
  concluida_em timestamptz
);

create table public.horas (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null default auth.uid() references public.pessoas (id) on delete cascade,
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  entrega_id uuid references public.entregas (id) on delete set null,
  tipo text not null check (tipo in ('producao', 'atendimento', 'reuniao')),
  inicio timestamptz not null default now(),
  fim timestamptz,
  minutos integer not null default 0,
  observacao text not null default ''
);

create unique index horas_um_timer_por_pessoa on public.horas (pessoa_id) where fim is null;

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.entregas (id) on delete cascade,
  autor_id uuid not null default auth.uid() references public.pessoas (id) on delete cascade,
  texto text not null,
  criado_em timestamptz not null default now()
);

create table public.relatos (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null default auth.uid() references public.pessoas (id) on delete cascade,
  tipo text not null check (tipo in ('bug', 'melhoria')),
  descricao text not null,
  contexto jsonb not null default '{}'::jsonb,
  resolvido boolean not null default false,
  criado_em timestamptz not null default now()
);

create function public.ao_criar_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c public.convites%rowtype;
begin
  select * into c from public.convites where lower(email) = lower(new.email);
  if not found then
    raise exception 'E-mail nao convidado para o piloto';
  end if;
  insert into public.pessoas (id, email, nome, area, perfil)
  values (new.id, lower(new.email), c.nome, c.area, c.perfil);
  return new;
end;
$$;

create trigger ao_criar_usuario
after insert on auth.users
for each row execute function public.ao_criar_usuario();

create function public.eh_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pessoas where id = auth.uid());
$$;

create function public.eh_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pessoas where id = auth.uid() and perfil in ('admin', 'coordenacao'));
$$;

alter table public.convites enable row level security;
alter table public.pessoas enable row level security;
alter table public.clientes enable row level security;
alter table public.projetos enable row level security;
alter table public.entregas enable row level security;
alter table public.entrega_responsaveis enable row level security;
alter table public.etapas enable row level security;
alter table public.horas enable row level security;
alter table public.comentarios enable row level security;
alter table public.relatos enable row level security;

create policy convites_gestor on public.convites for all to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

create policy pessoas_ver on public.pessoas for select to authenticated using (public.eh_membro());
create policy pessoas_editar on public.pessoas for update to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

create policy clientes_ver on public.clientes for select to authenticated using (public.eh_membro());
create policy clientes_criar on public.clientes for insert to authenticated with check (public.eh_gestor());
create policy clientes_editar on public.clientes for update to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

create policy projetos_ver on public.projetos for select to authenticated using (public.eh_membro());
create policy projetos_criar on public.projetos for insert to authenticated with check (public.eh_gestor());
create policy projetos_editar on public.projetos for update to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

create policy entregas_ver on public.entregas for select to authenticated using (public.eh_membro());
create policy entregas_criar on public.entregas for insert to authenticated with check (public.eh_membro());
create policy entregas_editar on public.entregas for update to authenticated using (public.eh_membro()) with check (public.eh_membro());
create policy entregas_apagar on public.entregas for delete to authenticated using (public.eh_gestor());

create policy responsaveis_ver on public.entrega_responsaveis for select to authenticated using (public.eh_membro());
create policy responsaveis_criar on public.entrega_responsaveis for insert to authenticated with check (public.eh_membro());
create policy responsaveis_apagar on public.entrega_responsaveis for delete to authenticated using (public.eh_membro());

create policy etapas_ver on public.etapas for select to authenticated using (public.eh_membro());
create policy etapas_criar on public.etapas for insert to authenticated with check (public.eh_membro());
create policy etapas_editar on public.etapas for update to authenticated using (public.eh_membro()) with check (public.eh_membro());

create policy horas_ver on public.horas for select to authenticated using (public.eh_membro());
create policy horas_criar on public.horas for insert to authenticated with check (pessoa_id = auth.uid() and public.eh_membro());
create policy horas_editar on public.horas for update to authenticated using (pessoa_id = auth.uid()) with check (pessoa_id = auth.uid());
create policy horas_apagar on public.horas for delete to authenticated using (pessoa_id = auth.uid());

create policy comentarios_ver on public.comentarios for select to authenticated using (public.eh_membro());
create policy comentarios_criar on public.comentarios for insert to authenticated with check (autor_id = auth.uid() and public.eh_membro());

create policy relatos_ver on public.relatos for select to authenticated using (public.eh_gestor() or autor_id = auth.uid());
create policy relatos_criar on public.relatos for insert to authenticated with check (autor_id = auth.uid() and public.eh_membro());
create policy relatos_editar on public.relatos for update to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.eh_membro() to authenticated;
grant execute on function public.eh_gestor() to authenticated;

alter publication supabase_realtime add table public.entregas, public.entrega_responsaveis, public.etapas, public.horas, public.comentarios, public.projetos, public.clientes, public.pessoas;

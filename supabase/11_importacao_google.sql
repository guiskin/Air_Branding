-- Registra importações de Google Agenda e Google Tasks sem duplicar entregas.
-- Armazena identificadores externos, título e prazo. Nenhuma credencial é gravada.
-- Reversão: reverta o app e revogue EXECUTE de importar_entregas_google;
-- preserve entregas e o registro de importações.
begin;

do $$
begin
  if to_regprocedure('public.eh_admin()') is null or to_regclass('public.google_importacoes') is not null then
    raise exception 'Confira a migração 03 e se a 11 já foi aplicada.';
  end if;
end;
$$;

create table public.google_importacoes (
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  origem text not null check (origem in ('agenda', 'tasks')),
  colecao text not null check (char_length(colecao) between 1 and 1024),
  item_id text not null check (char_length(item_id) between 1 and 1024),
  entrega_id uuid references public.entregas(id) on delete set null,
  primary key (projeto_id, origem, colecao, item_id)
);
create index google_importacoes_entrega on public.google_importacoes(entrega_id);
alter table public.google_importacoes enable row level security;
revoke all on public.google_importacoes from public, anon, authenticated;

create function public.importar_entregas_google(projeto uuid, fonte text, colecao_id text, itens jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  pessoa uuid := auth.uid();
  item record;
  nova_entrega uuid;
  total integer := 0;
begin
  if not public.eh_membro() then
    raise exception 'Acesso restrito à equipe interna.' using errcode = '42501';
  end if;
  if fonte is null or fonte not in ('agenda', 'tasks') or colecao_id is null or char_length(colecao_id) not between 1 and 1024
     or octet_length(colecao_id) > 1200 or jsonb_typeof(itens) is distinct from 'array' then
    raise exception 'Origem inválida.';
  end if;
  if jsonb_array_length(itens) > 100 then raise exception 'Importe no máximo 100 itens por lote.'; end if;

  perform 1 from public.projetos where id = projeto and ativo for share;
  if not found then raise exception 'Projeto ativo não encontrado.'; end if;

  for item in select * from jsonb_to_recordset(itens) as x(id text, titulo text, prazo date) order by id loop
    if item.id is null or char_length(item.id) not between 1 and 1024 or octet_length(item.id) > 1200
       or item.titulo is null or char_length(btrim(item.titulo)) not between 1 and 250 then
      raise exception 'O item precisa de identificador e título de até 250 caracteres.';
    end if;

    insert into public.google_importacoes (projeto_id, origem, colecao, item_id)
      values (projeto, fonte, colecao_id, item.id) on conflict do nothing;
    if not found then continue; end if;

    insert into public.entregas (projeto_id, titulo, prazo, criado_por)
      values (projeto, btrim(item.titulo), item.prazo, pessoa) returning id into nova_entrega;
    insert into public.entrega_responsaveis (entrega_id, pessoa_id) values (nova_entrega, pessoa);
    update public.google_importacoes set entrega_id = nova_entrega
      where projeto_id = projeto and origem = fonte and colecao = colecao_id and item_id = item.id;
    total := total + 1;
  end loop;

  return total;
end;
$$;

revoke all on function public.importar_entregas_google(uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.importar_entregas_google(uuid,text,text,jsonb) to authenticated;

commit;

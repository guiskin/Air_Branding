-- Migração 04 para edição do próprio nome e foto de perfil em um bucket privado.
-- Aplique a migração 03 primeiro. Antes de executar, confirme os grants de
-- pessoas e que as políticas existentes de storage.objects não alcançam o bucket
-- fotos-perfil. Se o bucket, a coluna ou uma função já existir, o script aborta.
-- Pessoas existentes conservam o nome e passam a ter foto_caminho nulo.
-- As permissões existentes em pessoas e a publicação Realtime são preservadas.
-- Para reverter, revogue EXECUTE nas duas RPCs e remova as políticas fotos_perfil_*.
-- Se for necessário remover os dados, peça aprovação. Esvazie e remova o bucket
-- pela API de Storage ou painel, depois remova as funções e a coluna foto_caminho.
-- Nomes já editados não são revertidos automaticamente.

begin;

do $$
begin
  if to_regprocedure('public.eh_admin()') is null
     or not exists (
       select 1 from pg_trigger
       where tgrelid = 'public.pessoas'::regclass and tgname = 'pessoas_proteger' and tgenabled <> 'D'
     )
     or not exists (
       select 1 from pg_class where oid = 'storage.objects'::regclass and relrowsecurity
     )
     or has_any_column_privilege('anon', 'public.pessoas', 'UPDATE')
     or has_table_privilege('authenticated', 'public.pessoas', 'UPDATE') then
    raise exception 'Confira a migração 03, os privilégios de pessoas e a RLS do Storage antes da 04.';
  end if;
end;
$$;

alter table public.pessoas add column foto_caminho text
  constraint pessoas_foto_caminho_proprio check (
    foto_caminho ~ ('^' || id::text || '/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-perfil', 'fotos-perfil', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy fotos_perfil_ver on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-perfil' and (select public.eh_membro()) and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or exists (select 1 from public.pessoas p where p.foto_caminho = storage.objects.name)
    )
  );

create policy fotos_perfil_enviar on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos-perfil' and (select public.eh_membro()) and
    name ~ ('^' || (select auth.uid()::text) || '/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$')
  );

create policy fotos_perfil_remover on storage.objects for delete to authenticated
  using (
    bucket_id = 'fotos-perfil' and (select public.eh_membro()) and
    (storage.foldername(name))[1] = (select auth.uid()::text) and
    not exists (select 1 from public.pessoas p where p.foto_caminho = storage.objects.name)
  );

create policy fotos_perfil_imutavel on storage.objects as restrictive for update to public
  using (bucket_id <> 'fotos-perfil')
  with check (bucket_id <> 'fotos-perfil');

create function public.alterar_meu_nome(novo_nome text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  nome_limpo text := btrim(novo_nome, E' \t\r\n');
begin
  if nome_limpo is null or char_length(nome_limpo) not between 1 and 120 or nome_limpo ~ '[[:cntrl:]]' then
    raise exception 'Informe um nome de até 120 caracteres.';
  end if;

  update public.pessoas set nome = nome_limpo where id = auth.uid() and ativo;
  if not found then
    raise exception 'Perfil indisponível.';
  end if;
end;
$$;

create function public.alterar_minha_foto(novo_caminho text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  pessoa uuid := auth.uid();
  caminho_anterior text;
begin
  select foto_caminho into caminho_anterior from public.pessoas
    where id = pessoa and ativo for update;
  if not found then
    raise exception 'Perfil indisponível.';
  end if;

  if novo_caminho is not null and (
    (storage.foldername(novo_caminho))[1] is distinct from pessoa::text
    or not exists (select 1 from storage.objects where bucket_id = 'fotos-perfil' and name = novo_caminho)
  ) then
    raise exception 'Foto indisponível.';
  end if;

  if novo_caminho is distinct from caminho_anterior then
    update public.pessoas set foto_caminho = novo_caminho where id = pessoa;
  end if;
  return caminho_anterior;
end;
$$;

revoke all on function public.alterar_meu_nome(text), public.alterar_minha_foto(text) from public, anon;
grant execute on function public.alterar_meu_nome(text), public.alterar_minha_foto(text) to authenticated;

commit;

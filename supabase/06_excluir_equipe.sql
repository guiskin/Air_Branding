-- Migração 06: permite excluir uma equipe cadastrada, só quando nenhum projeto a usa.
-- Requer a 05. Cria a função public.excluir_equipe(uuid), executável só por gestor
-- (escrita continua só por função; as tabelas seguem sem delete direto).
-- Impacto: nada existente muda. Excluir uma equipe apaga a equipe e a lista dos seus
-- integrantes (equipe_membros, por cascade); projetos que já receberam a cópia não
-- são afetados porque a função recusa a exclusão se a equipe estiver aplicada a algum.
-- Trava inicial: aborta se a 05 não estiver aplicada ou se a função já existir.
-- Reversão: drop function public.excluir_equipe(uuid);
-- (equipes já excluídas não voltam; faça backup antes se houver dados reais).

begin;

do $$
begin
  if to_regclass('public.equipes') is null
     or to_regclass('public.projeto_equipes') is null
     or to_regprocedure('public.eh_gestor()') is null
     or to_regprocedure('public.excluir_equipe(uuid)') is not null then
    raise exception 'Confira a migração 05 e se a 06 já não foi aplicada.';
  end if;
end;
$$;

create function public.excluir_equipe(equipe uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_gestor() then
    raise exception 'Somente gestores podem excluir equipes.' using errcode = '42501';
  end if;

  perform 1 from public.equipes where id = equipe for update;
  if not found then
    raise exception 'Equipe não encontrada.';
  end if;

  if exists (select 1 from public.projeto_equipes where equipe_id = equipe) then
    raise exception 'A equipe está aplicada a projetos. Remova-a dos projetos antes de excluir.';
  end if;

  delete from public.equipes where id = equipe;
end;
$$;

revoke all on function public.excluir_equipe(uuid) from public, anon, authenticated;
grant execute on function public.excluir_equipe(uuid) to authenticated;

commit;

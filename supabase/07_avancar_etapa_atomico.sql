-- Migração 07: "concluir etapa e passar para a próxima" em uma única transação.
-- Hoje o app faz 4 gravações separadas (etapa, responsável, status, comentário); uma
-- falha no meio deixa a entrega inconsistente. A função public.avancar_etapa(uuid) faz
-- tudo de uma vez e trava a entrega durante a operação (duas pessoas clicando juntas
-- não concluem duas etapas).
-- A função roda com os direitos de quem chama (security invoker): vale exatamente a
-- mesma RLS de hoje (qualquer membro ativo). Nada existente é alterado.
-- Regra mantida: se a próxima etapa se chama "Aprovação do cliente", o status vira
-- "aprovacao"; senão "andamento"; sem próxima etapa, "concluido".
-- Trava inicial: aborta se as tabelas faltarem ou se a função já existir.
-- Reversão: drop function public.avancar_etapa(uuid); e voltar o app à versão anterior.

begin;

do $$
begin
  if to_regclass('public.etapas') is null
     or to_regclass('public.entregas') is null
     or to_regclass('public.entrega_responsaveis') is null
     or to_regclass('public.comentarios') is null
     or to_regprocedure('public.avancar_etapa(uuid)') is not null then
    raise exception 'Confira as tabelas de entregas e se a 07 já não foi aplicada.';
  end if;
end;
$$;

create function public.avancar_etapa(entrega uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  atual public.etapas;
  proxima public.etapas;
  primeiro_nome text;
  novo_status text;
  texto text;
begin
  perform 1 from public.entregas where id = entrega for update;
  if not found then
    raise exception 'Entrega não encontrada ou sem permissão.';
  end if;

  select * into atual from public.etapas
    where entrega_id = entrega and not concluida order by ordem limit 1;
  if not found then
    return;
  end if;

  select * into proxima from public.etapas
    where entrega_id = entrega and not concluida and ordem > atual.ordem order by ordem limit 1;

  update public.etapas set concluida = true, concluida_em = now() where id = atual.id;

  if proxima.id is not null and proxima.pessoa_id is not null then
    insert into public.entrega_responsaveis (entrega_id, pessoa_id)
    values (entrega, proxima.pessoa_id)
    on conflict do nothing;
  end if;

  if proxima.id is null then
    novo_status := 'concluido';
    texto := 'Todas as etapas concluídas.';
  else
    novo_status := case when proxima.nome = 'Aprovação do cliente' then 'aprovacao' else 'andamento' end;
    select split_part(nome, ' ', 1) into primeiro_nome from public.pessoas where id = proxima.pessoa_id;
    texto := 'Etapa ' || atual.nome || ' concluída. ' || case
      when primeiro_nome is null then 'A próxima etapa (' || proxima.nome || ') está sem responsável.'
      else 'Agora é com ' || primeiro_nome || ' (' || proxima.nome || ').'
    end;
  end if;

  update public.entregas set status = novo_status where id = entrega;
  insert into public.comentarios (entrega_id, texto) values (entrega, texto);
end;
$$;

revoke all on function public.avancar_etapa(uuid) from public, anon;
grant execute on function public.avancar_etapa(uuid) to authenticated;

commit;

-- RASCUNHO da tarefa 001. NAO EXECUTAR. Nao esta em supabase/ de proposito.
-- So vira supabase/03_perfil_admin_e_desativar_pessoa.sql depois das decisoes D1 a D7
-- e da conferencia no painel (ver tasks/001-seguranca-perfis-e-convites.md).
-- Quem executa no SQL Editor do Supabase e o usuario.
--
-- O QUE FAZ
--  S1: so admin define, altera ou edita perfil/linha 'admin' (em pessoas e em convites).
--      Coordenacao continua gerenciando membros e coordenacao. Ninguem altera o proprio
--      perfil nem desativa a propria conta. Colunas editaveis em pessoas: nome, area,
--      perfil, capacidade_mensal, ativo (id, email, criado_em ficam imutaveis pela API).
--  B1: coluna pessoas.ativo; pessoa desativada perde acesso (eh_membro/eh_gestor exigem
--      ativo) sem apagar horas, comentarios nem relatos. Ao desativar, fecha o timer aberto.
--
-- MODIFICA OBJETOS EXISTENTES (aprovacao do usuario necessaria)
--  - drop policy pessoas_editar e convites_gestor (recriadas, mais restritas)
--  - create or replace eh_membro() e eh_gestor() (agora exigem ativo)
--  - revoke update em pessoas (substituido por update por coluna) e revoke insert/delete
--
-- IMPACTO EM DADOS EXISTENTES
--  - Linhas de pessoas ganham ativo = true. Nenhuma linha e alterada alem disso.
--  - Nenhum check novo; nada e rejeitado retroativamente.
--  - NAO corrige escalada ja ocorrida: conferir antes quem e admin (pessoas) e se
--    existem convites de exemplo (exemplo.com) em convites.
--  - Depois de aplicar, nenhum script futuro deve repetir
--    "grant ... update ... on all tables ... to authenticated" (reabriria pessoas).
--
-- REVERSAO (manual, nesta ordem)
--  drop trigger pessoas_proteger on public.pessoas;
--  drop function public.proteger_pessoas();
--  drop policy convites_ver/criar/editar/apagar on public.convites; recriar convites_gestor
--    exatamente como em 01_estrutura.sql;
--  drop policy pessoas_editar on public.pessoas; recriar como em 01_estrutura.sql;
--  grant update, insert, delete on public.pessoas to authenticated;
--  create or replace eh_membro() e eh_gestor() sem "and ativo" (texto em 01_estrutura.sql);
--  drop function public.eh_admin();
--  alter table public.pessoas drop column ativo;  -- perde quem estava desativado (pedir aprovacao)

begin;

alter table public.pessoas add column ativo boolean not null default true;

create function public.eh_admin() returns boolean
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

grant execute on function public.eh_admin() to authenticated;
revoke execute on function public.eh_admin() from public, anon;

-- pessoas: so admin toca em admin; coordenacao nao cria nem edita admin
drop policy pessoas_editar on public.pessoas;
create policy pessoas_editar on public.pessoas for update to authenticated
  using (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'))
  with check (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));

-- pessoas: so estas colunas sao editaveis pela API
revoke update on public.pessoas from authenticated;
grant update (nome, area, perfil, capacidade_mensal, ativo) on public.pessoas to authenticated;
revoke insert, delete on public.pessoas from authenticated; -- o gatilho ao_criar_usuario nao e afetado

-- pessoas: regras que a RLS nao enxerga (old x new)
create function public.proteger_pessoas() returns trigger
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
    -- fecha timer aberto (mesma conta de pararTimer em dados.js: minimo de 1 minuto)
    update public.horas
       set fim = now(),
           minutos = greatest(1, round(extract(epoch from (now() - inicio)) / 60)::int)
     where pessoa_id = old.id and fim is null;
  end if;
  return new;
end;
$$;

create trigger pessoas_proteger
before update on public.pessoas
for each row execute function public.proteger_pessoas();

-- convites: gestor ve; so admin cria, edita ou apaga convite de admin
drop policy convites_gestor on public.convites;
create policy convites_ver on public.convites for select to authenticated using (public.eh_gestor());
create policy convites_criar on public.convites for insert to authenticated
  with check (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));
create policy convites_editar on public.convites for update to authenticated
  using (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'))
  with check (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));
create policy convites_apagar on public.convites for delete to authenticated
  using (public.eh_admin() or (public.eh_gestor() and perfil <> 'admin'));

-- OPCIONAL (decisao D4; conferir os nomes das constraints em producao antes):
-- impede que apagar o usuario no painel destrua o historico.
-- alter table public.horas       drop constraint horas_pessoa_id_fkey,
--   add constraint horas_pessoa_id_fkey foreign key (pessoa_id) references public.pessoas (id) on delete restrict;
-- alter table public.comentarios drop constraint comentarios_autor_id_fkey,
--   add constraint comentarios_autor_id_fkey foreign key (autor_id) references public.pessoas (id) on delete restrict;
-- alter table public.relatos     drop constraint relatos_autor_id_fkey,
--   add constraint relatos_autor_id_fkey foreign key (autor_id) references public.pessoas (id) on delete restrict;

commit;

-- S2 (opcao b), esbocos para os scripts 04 e 05, so depois da decisao D2:
--  04 (aditivo): convites ganha codigo_hash e codigo_expira; indice unico em lower(email)
--     (falha se houver duplicata por caixa); funcao convidar_pessoa(email, nome, area, perfil)
--     security definer, so gestor, so admin convida admin, gera codigo, guarda sha256 e
--     devolve o codigo uma unica vez. Aplicar ANTES de publicar o front novo.
--  05 (depois do front publicado): ao_criar_usuario passa a exigir codigo valido e nao vencido
--     (raw_user_meta_data->>'codigo') e zera o codigo apos o uso. Convites sem codigo
--     deixam de funcionar: refazer com "Remover" + convidar.

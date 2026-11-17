-- Migração 08: guarda o link da pasta do Google Drive de cada projeto (sem login Google).
-- Cria a coluna public.projetos.pasta_drive (texto, vazio por padrão). Só aceita vazio ou um
-- endereço https de drive.google.com ou docs.google.com. Quem edita é quem já edita projetos
-- (gestor, pela política projetos_editar); todos os membros ativos leem.
-- Impacto: aditivo. Projetos existentes ficam com pasta_drive vazio; nenhuma política,
-- privilégio ou dado existente muda (o grant de update em projetos já cobre a coluna nova).
-- Trava inicial: aborta se a tabela faltar ou se a coluna já existir.
-- Reversão (exige aprovação, apaga os links gravados):
--   alter table public.projetos drop column pasta_drive;

begin;

do $$
begin
  if to_regclass('public.projetos') is null
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'projetos' and column_name = 'pasta_drive'
     ) then
    raise exception 'Confira a tabela projetos e se a 08 já não foi aplicada.';
  end if;
end;
$$;

alter table public.projetos add column pasta_drive text not null default ''
  constraint projetos_pasta_drive_valida check (
    pasta_drive = '' or (
      char_length(pasta_drive) <= 500
      and pasta_drive ~ '^https://(drive|docs)[.]google[.]com/[^[:space:][:cntrl:]]+$'
    )
  );

commit;

insert into public.convites (email, nome, area, perfil) values
  ('TROQUE-PELO-SEU-EMAIL@exemplo.com', 'Seu Nome', 'Tecnologia', 'admin'),
  ('TROQUE-PELO-EMAIL-DO-RESPONSAVEL@exemplo.com', 'Nome do Responsável', 'Diretoria', 'admin');

insert into public.clientes (nome) values ('Cliente Exemplo A'), ('Cliente Exemplo B');

insert into public.projetos (cliente_id, codigo, nome, linha, horas_vendidas)
select id, '2026_901', 'Redes sociais (teste)', 'Redes e Mídia', 120 from public.clientes where nome = 'Cliente Exemplo A';

insert into public.projetos (cliente_id, codigo, nome, linha, horas_vendidas)
select id, '2026_902', 'Campanha de fim de ano (teste)', 'Projetos e Campanhas', 60 from public.clientes where nome = 'Cliente Exemplo A';

insert into public.projetos (cliente_id, codigo, nome, linha, horas_vendidas)
select id, '2026_903', 'Marca empregadora (teste)', 'Consultoria', 160 from public.clientes where nome = 'Cliente Exemplo B';

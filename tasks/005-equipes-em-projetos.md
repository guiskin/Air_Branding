# 005: Equipes reutilizáveis em projetos

- **Status:** implementada e validada em teste
- **Branch:** `feat/equipes-em-projetos`

## Objetivo

Permitir que coordenação e administradores cadastrem equipes e atribuam seus integrantes a um projeto de uma vez.

## Escopo

- Criar e editar equipes em **Equipe e piloto**, escolhendo pessoas ativas.
- Selecionar uma equipe ao cadastrar um projeto ou aplicar uma equipe na seção **Equipe do projeto** de um projeto existente.
- Copiar os integrantes ativos quando a equipe é aplicada. Reaplicar ou trocar a equipe é uma ação explícita que atualiza a lista copiada daquele projeto.
- Exibir a equipe aplicada e incluir seus membros nos avatares dos projetos e na seção **Equipe do projeto**, junto de quem já responde por entregas ou etapas.
- Preservar o fluxo de criação sem equipe e os responsáveis das entregas e etapas.

## Fora do escopo

- Painéis novos, Google Agenda, Google Drive e novas regras de acesso a projetos.

## Banco

A migração 05 armazena as equipes reutilizáveis, seus integrantes e a composição aplicada em cada projeto. A gravação de cadastros e atribuições é atômica e exige gestor. A leitura segue a regra de membros ativos do piloto.

## Critérios de aceite

- [x] Um gestor cadastra uma equipe e edita seus integrantes.
- [x] Um gestor aplica a equipe a um projeto novo e a um projeto existente.
- [x] Editar a equipe deixa intacta a composição que já foi copiada. Reaplicar atualiza a composição daquele projeto.
- [x] Projetos antigos e entregas continuam disponíveis. Seus responsáveis permanecem após trocar ou limpar a equipe aplicada.
- [x] Membros ativos podem ver a equipe do projeto. Somente gestores podem cadastrar equipes e aplicá-las.
- [x] `npm run build` passa.

## Validação

- Supabase `airbranding-teste`. Sessões simuladas de gestor e membro validaram cadastro, edição, cópia, reaplicação, remoção, permissões e reversão da criação de projeto com equipe inválida. Os dados de QA foram revertidos. As quatro tabelas entraram no Realtime.
- Navegador local com API simulada. Validados o cadastro e a edição da equipe, a aplicação em projeto existente, o cadastro de projeto com equipe, a reaplicação e a remoção. A responsável da entrega permaneceu no projeto após a remoção da equipe cadastrada.
- A migração de produção e a publicação da interface estão pendentes.

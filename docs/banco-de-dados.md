# Banco de dados (Supabase/Postgres)

Fonte: `supabase/01_estrutura.sql` e `02_convites_e_exemplos.sql`. O estado real do banco de produção **não está no repositório**: antes de uma mudança, confira no painel do Supabase o que já foi aplicado.

## Tabelas

| Tabela | Conteúdo | Observações |
|---|---|---|
| `convites` | e-mail, nome, área, perfil | Lista de quem pode criar conta. |
| `pessoas` | usuários (id = `auth.users.id`) | Criada pelo gatilho. `capacidade_mensal` (padrão 168) ainda não é usada na interface. |
| `clientes` | nome único | |
| `projetos` | cliente, `codigo` único, nome, linha, `horas_vendidas`, `ativo` | `on delete restrict` no cliente. |
| `entregas` | projeto, título, briefing, `link_drive`, status, início, prazo, prioridade, `horas_estimadas` | `check` nos oito status e em prioridade (baixa, normal, alta). |
| `entrega_responsaveis` | entrega x pessoa | Chave composta. |
| `etapas` | entrega, `ordem`, nome, pessoa, `concluida`, `concluida_em` | |
| `horas` | pessoa, projeto, entrega (opcional), tipo, início, fim, minutos | Índice único: um timer aberto (`fim is null`) por pessoa. |
| `comentarios` | entrega, autor, texto | Sem edição nem exclusão. |
| `relatos` | autor, tipo (bug, melhoria), descrição, `contexto` jsonb, `resolvido` | |

Exclusões em cascata: apagar entrega remove etapas, responsáveis e comentários; horas da entrega ficam com `entrega_id` nulo.

## Gatilho de convite

`ao_criar_usuario` (após inserir em `auth.users`): procura o e-mail em `convites`; se não achar, aborta o cadastro; se achar, cria a linha em `pessoas` com nome, área e perfil do convite.

## Funções e permissões (RLS)

`eh_membro()`: existe linha em `pessoas` para o usuário. `eh_gestor()`: perfil `admin` ou `coordenacao`. RLS ligada em todas as tabelas.

| Tabela | Ver | Criar | Editar | Apagar |
|---|---|---|---|---|
| convites | gestor | gestor | gestor | gestor |
| pessoas | membro | (gatilho) | gestor | n/d |
| clientes, projetos | membro | gestor | gestor | n/d |
| entregas | membro | membro | membro | gestor |
| entrega_responsaveis | membro | membro | n/d | membro |
| etapas | membro | membro | membro | n/d |
| horas | membro | só as próprias | só as próprias | só as próprias |
| comentarios | membro | membro (autor = si) | n/d | n/d |
| relatos | gestor ou autor | membro (autor = si) | gestor | n/d |

Qualquer membro edita qualquer entrega e etapa. Se isso é intencional, está registrado em `decisoes.md`.

## Realtime

Publicação `supabase_realtime` inclui entregas, responsáveis, etapas, horas, comentários, projetos, clientes e pessoas.

## Riscos conhecidos (ainda não corrigidos)

Detalhes e plano na tarefa `tasks/001-seguranca-perfis-e-convites.md`.

- **Escalada de perfil:** `pessoas_editar` e `convites_gestor` deixam coordenação se promover a admin ou convidar admins pela API.
- **Cadastro por e-mail não verificado:** com "Confirm email" desligado, quem souber um e-mail convidado cria a conta antes da pessoa. Convites de exemplo do `02` com e-mails fictícios, se ainda existirem, são o caso mais grave.
- **Histórico apagável:** `horas.pessoa_id`, `comentarios.autor_id` e `relatos.autor_id` usam `on delete cascade`; apagar um usuário no painel destrói o histórico.
- **Políticas de horas:** `horas_editar` e `horas_apagar` não exigem `eh_membro()`.
- **Armadilha:** o `grant ... on all tables` do `01` dá `update` na tabela inteira; qualquer restrição de colunas futura se perde se um script repetir esse `grant`.

## Como evoluir

1. Agente `analista-banco` descreve o impacto.
2. Script novo e numerado em `supabase/` (skill `nova-migracao`), nunca editar os existentes.
3. O usuário executa no SQL Editor do Supabase e confere.
4. Atualizar este arquivo e as constantes de `src/dados.js`. Os valores de `STATUS`, `TIPOS` e `PERFIS` existem nos dois lugares.

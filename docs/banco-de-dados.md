# Banco de dados (Supabase/Postgres)

Os scripts numerados estão em `supabase/`. O registro de aplicação está em `supabase/APLICADO.md`. Antes de uma mudança, confira no painel do Supabase quais scripts foram aplicados e o estado atual dos objetos afetados.

## Tabelas

| Tabela | Conteúdo | Observações |
|---|---|---|
| `convites` | e-mail, nome, área, perfil | Lista de quem pode criar conta. |
| `pessoas` | usuários (id = `auth.users.id`) | Criada pelo gatilho. O `03` adiciona `ativo`. O `04` adiciona `foto_caminho` opcional. |
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

Com o `03`, `eh_membro()` exige uma pessoa ativa, `eh_gestor()` exige também perfil `admin` ou `coordenacao`, e `eh_admin()` exige perfil `admin`. As tabelas têm RLS.

| Tabela | Ver | Criar | Editar | Apagar |
|---|---|---|---|---|
| convites | gestor | gestor, com perfil admin reservado ao admin | gestor, com perfil admin reservado ao admin | gestor, com perfil admin reservado ao admin |
| pessoas | membro | (gatilho) | gestor, com perfil admin reservado ao admin. Com o `04`, cada pessoa também edita seu nome e foto por funções específicas. | n/d |
| clientes, projetos | membro | gestor | gestor | n/d |
| entregas | membro | membro | membro | gestor |
| entrega_responsaveis | membro | membro | n/d | membro |
| etapas | membro | membro | membro | n/d |
| horas | membro | só as próprias | membro ativo, só as próprias | membro ativo, só as próprias |
| comentarios | membro | membro (autor = si) | n/d | n/d |
| relatos | gestor ou autor | membro (autor = si) | gestor | n/d |

Qualquer membro edita qualquer entrega e etapa. Se isso é intencional, está registrado em `decisoes.md`.

## Configurações de perfil (migração 04)

- `alterar_meu_nome(novo_nome)` edita apenas o nome da pessoa ativa da sessão. `alterar_minha_foto(novo_caminho)` vale para a mesma pessoa, exige que o objeto exista em sua pasta e retorna o caminho anterior. Um caminho nulo remove a associação.
- O bucket privado `fotos-perfil` aceita JPEG, PNG e WebP de até 2 MiB. Cada pessoa envia arquivos novos para sua pasta identificada pelo UUID. Membros ativos podem acessar as fotos em uso, e cada pessoa pode apagar arquivos de sua pasta que estejam sem associação.
- O banco armazena o caminho do objeto. O app usa URLs assinadas temporárias e mostra as iniciais quando o perfil está sem foto ou a imagem está indisponível. Uma URL emitida pode ser usada até expirar. A substituição usa um caminho novo e remove o arquivo anterior pela API de Storage depois de gravar a associação nova.
- A troca de senha usa Supabase Auth. As regras do projeto de Authentication continuam valendo.

Antes de aplicar o `04` no ambiente de teste, confirme que o `03` foi aplicado, que o bucket `fotos-perfil` ainda não existe e que nenhuma política existente de Storage pode conceder acesso a esse bucket. Após aplicar, confira o nome e a foto de um membro em duas contas, a substituição e remoção da foto, a rejeição de arquivos fora do formato ou limite e a ausência de acesso para pessoa desativada ou sem sessão. Confirme também que um membro segue sem acesso para editar outras pessoas, promover-se ou gravar na pasta de outro membro.

## Realtime

Publicação `supabase_realtime` inclui entregas, responsáveis, etapas, horas, comentários, projetos, clientes e pessoas.

## Segurança do piloto

Detalhes e plano na tarefa `tasks/001-seguranca-perfis-e-convites.md`.

- O `03` protege a administração, restringe edição de horas a pessoas ativas, preserva o histórico de horas, comentários e relatos e concede privilégios específicos por tabela e coluna.
- A verificação de e-mail do cadastro depende de "Confirm email" no painel do Supabase. A decisão do piloto mantém a confirmação ligada.

## Como evoluir

1. Agente `analista-banco` descreve o impacto.
2. Script novo e numerado em `supabase/` (skill `nova-migracao`), nunca editar os existentes.
3. Aplicar e conferir no ambiente de teste antes de seguir a regra de produção de `.claude/rules/banco.md`.
4. Atualizar este arquivo e as constantes de `src/dados.js`. Os valores de `STATUS`, `TIPOS` e `PERFIS` existem nos dois lugares.

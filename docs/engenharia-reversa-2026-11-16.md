# Engenharia reversa do piloto e aderência ao diagnóstico

Data: 2026-11-16. Base: `main` em `9feea2d` e a branch `fix/seguranca-fase1` (auditoria ainda não mesclada). Referência do cliente: "Air — Do ClickUp ao app próprio: diagnóstico e plano até 8/dez" (15/nov).

Nenhum código, banco ou configuração foi alterado nesta análise. O áudio de WhatsApp anexado (16/nov, 20h18) foi analisado pela transcrição enviada pelo usuário (ver seção 0.1).

**Legenda de evidência** (usada em todo o documento):

- **[C]** comprovado no código ou nos scripts SQL do repositório.
- **[R]** registrado em docs/tarefas do repositório (inclui conferências feitas pelo usuário no painel do Supabase).
- **[D]** requisito ou observação do diagnóstico do cliente.
- **[T]** dito pelo cliente no áudio de 16/nov (transcrição).
- **[H]** hipótese ou inferência minha, a confirmar.

---

## 0. Achado que muda a leitura do diagnóstico

O diagnóstico descreve o protótipo como "navegável, com dados de exemplo, sem backend nem login da Air", com **Gantt, relatório, carga do time com 168h/mês** e status como Backlog…Concluído **[D]**. O repositório é outra coisa: um **piloto funcional com banco real** (Supabase), login, permissões por linha (RLS), timer gravado no banco e realtime **[C]**. Gantt e relatório **não existem** no código **[C]** e estão listados como "fica para depois" no `CLAUDE.md` e no `README.md` **[R]**.

**[H]** O diagnóstico avaliou um protótipo anterior (provavelmente uma maquete navegável), não este piloto. Vários "o que falta" do diagnóstico já estão resolvidos aqui (timer, tipo de hora, etapas, cliente como eixo, código do projeto, status "Em aprovação" e "Ajustes"). **Isso precisa ser confirmado com o autor do diagnóstico** antes de usar a seção "O que falta" como lista de trabalho.

### 0.1 O que o áudio acrescenta **[T]**

| O que foi dito | Leitura para o projeto |
|---|---|
| O diagnóstico foi gerado conectando o Claude ao ClickUp da agência, que "escaneou" o que se usa e o que não se usa | Os números do raio-x vêm de uma amostra automática (o próprio diagnóstico declara os limites: 100 tarefas recentes, 2 dias de horas). Bons para direção, não para dimensionar a migração **[H]** |
| O cliente ainda não leu o material com calma ("li ontem só") | O diagnóstico **não é uma posição validada da Air**. Reforça tratar cada requisito [D] como "a validar" até ele confirmar |
| O dev (você) estaria ausente até o dia 9; a pergunta é o que a agência consegue puxar nesse meio-tempo | A proposta de execução precisa separar o que a **agência** faz sem o dev (contrato, acessos, exportação, entrevistas, status) do que depende de código (seção 7) |
| Sugestão de trazer "especialistas", usuários mais pesados, para arredondar o projeto | Coincide com as 6 conversas da semana 2 do diagnóstico. Quem são essas pessoas ainda não está definido |
| Não encerrar o ClickUp no fim do ano; ter "um, dois meses avulsos" para implementar; ele vai olhar o contrato | Confirma a ponte proposta no diagnóstico. A data de desligamento depende de uma resposta do contrato que ainda não existe |
| Lembra que o diagnóstico fala em um MVP com cerca de seis pessoas testando antes da virada | **Divergência:** o diagnóstico fala em **6 conversas de 30 min** com o protótipo, não em um piloto de 6 pessoas. Um grupo piloto é uma boa ideia, mas é uma decisão nova e precisa ser confirmada (quem, por quanto tempo, usando o app em paralelo ao ClickUp?) |

---

## 1. Diagnóstico técnico

### 1.1 Tecnologias **[C]**

| Item | Valor |
|---|---|
| Front-end | SPA, React 18.3 (JavaScript, sem TypeScript), Vite 5.4 |
| Dependências de produção | `react`, `react-dom`, `@supabase/supabase-js` 2.45. Nada mais (sem roteador, sem biblioteca de UI, sem gerenciador de estado) |
| Backend | Nenhum próprio. Navegador fala direto com Supabase (Postgres + Auth + Realtime) |
| Segurança | RLS no Postgres; funções `eh_membro()` e `eh_gestor()` |
| Hospedagem | Cloudflare Pages, deploy a cada push na `main`; hash do commit vira `__VERSAO__` |
| Qualidade | Sem testes, lint, CI ou TypeScript. Verificação mínima: `npm run build` |
| Tamanho | ~1.600 linhas: `telas.jsx` 580, `App.jsx` 505, `Painel.jsx` 216, `dados.js` 198, `estilos.css` 156, `pecas.jsx` 88, SQL 195 |

### 1.2 Arquitetura **[C]**

- `App.jsx`: `App` (sessão) → `Login` ou `Sistema`. `Sistema` guarda a tela ativa em estado (sem URL/roteador), o timer global, avisos, barreira de erro e a janela de relato.
- `dados.js`: única camada de acesso ao banco. `carregar()` lê **as 8 tabelas inteiras** a cada recarga; `montar()` (pura) deriva etapa atual, atraso, horas, "comigo" e timer ativo.
- Toda mutação passa por `app.agir(rotulo, fn)`: registra o clique (últimos 15), executa, recarrega tudo, mostra erro.
- Realtime: um canal escuta qualquer mudança em `public` e recarrega tudo após 400 ms; também recarrega a cada 60 s.

### 1.3 Banco de dados **[C]**

10 tabelas: `convites`, `pessoas`, `clientes`, `projetos`, `entregas`, `entrega_responsaveis`, `etapas`, `horas`, `comentarios`, `relatos`. Detalhes em `docs/banco-de-dados.md` (está fiel aos scripts).

Pontos relevantes para a migração:

- `projetos.codigo` é `unique` e texto livre (sem validação do formato AAAA_NNN).
- `projetos.linha` é texto livre (não é lista controlada).
- `entregas.status` tem `check` com 8 valores; `prioridade` com 3.
- `horas`: `projeto_id` obrigatório, `entrega_id` opcional, `tipo` em 3 valores, índice que garante **um timer aberto por pessoa**. Coluna `observacao` existe e **não é usada** na interface.
- `pessoas.capacidade_mensal` (padrão 168) **é exibida** na tela Equipe ("Xh de 168h"). O `docs/banco-de-dados.md` diz que não é usada: divergência pequena de documentação.
- Exclusões em cascata: apagar uma pessoa no painel apaga horas, comentários e relatos dela (achado B1 da auditoria) **[R]**.
- Estado de produção **[R]** (conferido pelo usuário em 16/nov, branch `fix/seguranca-fase1`): scripts 01 e 02 aplicados; 1 pessoa (admin); "Confirm email" ligado (o README manda desligar); **sem backup** (plano gratuito).

### 1.4 Integrações **[C]**

| Integração | Situação |
|---|---|
| Supabase Auth | E-mail e senha, cadastro só com convite (gatilho em `auth.users`). **Não há login Google.** Sem recuperação de senha na interface |
| Supabase Realtime | Ligado em 8 tabelas |
| Google Drive | Só um campo de texto com link; abre em nova aba se começar com http(s). Sem API |
| ClickUp | Só um link opcional (`VITE_FEEDBACK_URL`) para o formulário de relatos. Nenhuma leitura ou escrita |
| BI | Nenhuma exportação |
| Google Fonts | Barlow Condensed e Poppins via `index.html` |

### 1.5 Telas e funcionalidades **[C]**

| Tela | Quem vê | O que faz |
|---|---|---|
| Login | todos | Entrar; "Primeiro acesso" cria conta se o e-mail estiver em `convites` |
| Meu dia | todos | Resumo (entregas comigo, horas lançadas hoje); **Hora sem tarefa** (timer em projeto sem entrega, com tipo); grupos "Com você agora", "Em outra etapa"; "Precisa de atenção" (atrasadas ou sem dono, só gestor) |
| Projetos | todos | Projetos ativos agrupados por cliente, com código, linha, % concluído, atrasadas, pessoas, horas lançadas x vendidas. Gestor cadastra cliente e projeto |
| Projeto | todos | Lista agrupada por status e Quadro (8 colunas, mover por seletor, sem arrastar). Horas por tipo. Nova entrega (título, briefing, fluxo de etapas, quem começa, prazo, horas estimadas, link Drive) |
| Painel da entrega | todos | Timer e lançamento manual com tipo; etapas com dono e "Concluir e passar para…"; status; prazo; prioridade; estimativa; responsáveis; briefing; link Drive; comentários |
| Equipe e piloto | gestor | Pessoas com entregas abertas e horas do mês x capacidade; convites (criar, remover pendente); relatos (ler contexto, marcar resolvido) |
| Barra do timer | todos | Fixa no topo quando há timer aberto; "Parar e lançar" |
| Relato | todos | Bug ou melhoria com contexto automático (tela, entrega, cliques, último erro, navegador, versão) |

### 1.6 Regras de negócio implementadas **[C]**

Fiéis a `docs/regras-de-negocio.md`. Destaques:

1. 8 status fixos; entrega nova em Backlog.
2. 3 fluxos de etapas: Conteúdo → Design → Aprovação do cliente; Design → Aprovação do cliente; etapa única. Quem é escolhido ao criar vira responsável e dono da 1ª etapa; as outras ficam "A definir".
3. Etapa atual = primeira não concluída. "Com você" = dono da etapa atual (ou responsável, se sem etapas).
4. Avançar etapa: conclui a atual, inclui o dono da próxima como responsável, muda status (Em aprovação se a próxima se chama literalmente "Aprovação do cliente", senão Em andamento; Concluído se acabou) e grava comentário automático. **4 gravações sem transação** e decisão por texto fixo.
5. Atrasada = prazo < hoje e status ≠ Concluído.
6. Timer: 1 aberto por pessoa (garantido no banco); iniciar outro para o anterior; mínimo de 1 min ao parar. O timer sobrevive a fechar o navegador (fica no banco).
7. Lançamento manual: grava `inicio = fim = agora`. **Não permite escolher a data** (não dá para lançar horas de ontem).
8. Hora sem tarefa: vai direto ao projeto, com tipo (substitui as tarefas-balde "AON"/"Reuniões Gerais").
9. Perfis: membro, coordenação, admin. **Qualquer membro vê tudo e edita qualquer entrega/etapa** (S4, decisão pendente) **[R]**.

### 1.7 Dados simulados e funcionalidades sem implementação real **[C]**

Não há dados falsos no front-end: tudo vem do banco. Simulação só existe em:

- `02_convites_e_exemplos.sql`: 2 clientes e 3 projetos de teste (`2026_901`–`903`) e 2 convites fictícios de admin. Em produção, os convites fictícios **não existem** **[R]**; os clientes/projetos de exemplo **[H]** provavelmente sim.

Campos ou recursos que existem mas não têm uso completo:

| Item | Situação |
|---|---|
| `horas.observacao` | Coluna existe, nenhuma tela grava ou mostra |
| `projetos.ativo` | Usado como filtro, mas não há como desativar projeto pela interface |
| `prioridade` | Editável no painel, mas não aparece em listas nem ordena nada |
| `capacidade_mensal` | Fixa em 168, sem edição pela interface, comparada só com horas do mês |
| Editar/apagar horas | RLS permite (próprias), interface não oferece |
| Editar/apagar comentário | Não existe (nem no banco) |
| Apagar entrega | RLS permite ao gestor, interface não oferece |
| Recuperação de senha | Só pelo painel do Supabase |
| Menções em comentários e notificações | Não existem |

### 1.8 Defeitos e limites técnicos encontrados

| # | Achado | Evidência | Impacto |
|---|---|---|---|
| T1 | `carregar()` lê tabelas inteiras sem paginação. O Supabase limita por padrão o número de linhas por requisição (configuração "Max rows" da API) | **[C]** consulta sem `range`; **[H]** valor do limite no projeto (conferir no painel) | Com o uso real (~50 lançamentos/dia segundo o diagnóstico), `horas` passa desse limite em semanas: totais de horas, timer ativo e "Meu dia" ficariam **errados sem aviso**. Bloqueia a importação do histórico |
| T2 | Toda mudança de qualquer pessoa recarrega as 8 tabelas para todos | **[C]** | Custo e lentidão crescem com o volume e com o nº de usuários (33) |
| T3 | Horas do mês na tela Equipe usam mês em UTC (`toISOString`) | **[C]** | Lançamentos da noite do último dia do mês (após 21h) caem no mês seguinte (R7 do backlog) |
| T4 | `avancarEtapa` sem transação e dependente do nome "Aprovação do cliente" | **[C]** | Estado parcial em falha; renomear a etapa quebra a regra |
| T5 | Lançamento manual sem data | **[C]** | Não cobre o hábito de lançar depois; distorce relatório por dia |
| T6 | Sem rotas na URL | **[C]** | Não dá para mandar link de uma entrega a alguém (substituto de "link da tarefa do ClickUp") |
| T7 | Segurança S1 a S6, B1 a B4 | **[R]** auditoria na branch `fix/seguranca-fase1`, não mesclada | Coordenação pode se promover a admin pela API; apagar pessoa apaga histórico; sem backup |
| T8 | Constantes duplicadas entre `dados.js` e `check` do SQL | **[C]** | Mudar status exige dois lugares |

---

## 2. Matriz de aderência

Comparação de cada item do diagnóstico com o piloto. Classificações: **Funcional** (implementado e funcional), **Parcial** (implementado parcialmente), **Ausente** (não implementado), **Validar** (necessita validação com o cliente). Um item pode ter classificação + nota "validar".

### 2.1 Escopo mínimo v1 do diagnóstico (itens 1 a 9)

| # | Requisito [D] | Piloto [C] | Classificação |
|---|---|---|---|
| 1a | Login com conta Google da Air | E-mail e senha com convite | **Parcial** (login existe, Google não) |
| 1b | Permissões por perfil (5 perfis do diagnóstico) | 3 perfis; membro vê tudo | **Parcial** + **Validar** (freelancer e cliente veriam tudo) |
| 2a | Cliente → Projeto com código AAAA_NNN e linha de serviço | Implementado; código e linha em texto livre | **Funcional** (sem validação de formato) |
| 2b | Projeto → Entrega → Etapas | Implementado com 3 fluxos fixos | **Funcional** + **Validar** (fluxos cobrem vídeo, mídia, consultoria?) |
| 3 | Cerca de 8 status padronizados | 8 status fixos no banco | **Funcional** + **Validar** (lista exata; falta "Cancelado", "Pausado", "Publicado/Impulsionado") |
| 4a | Briefing e link do Drive | Implementado | **Funcional** |
| 4b | Comentários com menção | Comentários sem menção nem notificação | **Parcial** |
| 5a | Timer | Implementado, persistido, 1 por pessoa | **Funcional** |
| 5b | Lançamento manual | Só "agora", sem data | **Parcial** |
| 5c | Tipo de hora | 3 tipos | **Funcional** + **Validar** (tipos suficientes para o BI?) |
| 5d | Exportação CSV ou integração BI | Nada | **Ausente** (fora do escopo do piloto [R]) |
| 6a | Tela "Meu dia" | Implementada | **Funcional** |
| 6b | Visão do projeto lista e quadro | Implementada (quadro sem arrastar) | **Funcional** |
| 6c | Carga do time | Só total de horas do mês x 168h, sem planejado nem semana | **Parcial** (carga semanal fora do escopo do piloto [R]) |
| 7 | Funil comercial; proposta aceita vira projeto | Nada | **Ausente** (fora do escopo do piloto [R]) |
| 8 | Formulário de pausa e ausência | Nada | **Ausente** |
| 9 | Importação do histórico (projetos ativos, horas 2025–2026) | Nada; T1 impede volume | **Ausente** (fora do escopo do piloto [R]) |

### 2.2 Lacunas apontadas no diagnóstico ("O que falta")

| Lacuna [D] | Situação real [C] | Classificação |
|---|---|---|
| Timer e tipos de hora | Existe | **Funcional** |
| Etapas da entrega (conteúdo → design → aprovação → ajustes → publicado) | Existe com conteúdo/design/aprovação; sem etapa de ajustes nem publicado, e sem voltar etapa quando o cliente pede ajuste | **Parcial** + **Validar** |
| Funil comercial ligado ao projeto | Não existe | **Ausente** |
| Código do projeto, cliente como eixo, linha de serviço | Existe | **Funcional** |
| Permissões por perfil e login Google | Ver 1a/1b | **Parcial** |
| Importação do ClickUp | Não existe | **Ausente** |
| Pausas e ausências | Não existe | **Ausente** |
| Carteira com saúde do contrato | Card do projeto mostra % concluído, atrasadas e horas x vendidas; não há status de saúde nem "fechamento pendente" | **Parcial** + **Validar** |
| Status "Em aprovação" e "Ajustes" | Existem | **Funcional** |
| Espanhol e acesso do cliente | Não existe | **Ausente** (baixa prioridade [D]) |
| Capacidade de 168h | Existe, fixa | **Validar** (RH, meio período, freelancer) |

### 2.3 Itens do "Raio-x" e do "Excesso"

| Item [D] | Piloto [C] | Classificação |
|---|---|---|
| Várias pessoas por tarefa | Responsáveis múltiplos | **Funcional** |
| Subtarefas / tarefa duplicada "(DESIGN)" | Substituído por etapas | **Funcional** |
| Tags (design, conteúdo, instagram, linkedin, aon) | Não existem | **Validar** (são necessárias ou a etapa/tipo de hora substitui?) |
| Prioridade só em urgência | Existe campo, sem destaque | **Parcial** |
| Estimativa de horas (hoje vazia no ClickUp) | Existe | **Funcional** + **Validar** (alguém vai preencher?) |
| Horas "AON"/"Reuniões Gerais" como balde | Substituído por "Hora sem tarefa" com tipo | **Funcional** + **Validar** (horas internas sem projeto de cliente precisam de um projeto "Air interno") |
| Lista "Gestão Geral, NPS e E-NPS" | Não existe | **Ausente** (NPS fica para depois [D]) |
| Freelancers (Paquino, Alle) | Área "Freelancer" no convite; sem restrição de visão | **Parcial** + **Validar** |
| Cliente convidado (YC) | Não existe | **Ausente** |
| Remover ex-colaboradores | Não há desativar pessoa (tarefa 001, B1) | **Ausente** |
| Status "Cancelado" e "Pausado" | Não existem | **Validar** |

### 2.4 Itens do áudio **[T]**

| Item [T] | Piloto [C] | Classificação |
|---|---|---|
| Grupo piloto de ~6 pessoas testando antes da virada | O app já suporta convidar pessoas e coletar relatos de bug com contexto | **Validar** (decisão nova; o diagnóstico fala em entrevistas) |
| ClickUp como ponte por 1 a 2 meses avulsos | Não depende do app | **Validar** (contrato) |
| Envolver usuários mais pesados como especialistas | Não depende do app | **Validar** (quem) |

### 2.5 Resumo

| Classificação | Itens (aprox.) |
|---|---|
| Implementado e funcional | 15 |
| Implementado parcialmente | 11 |
| Não implementado | 11 |
| Necessita validação (inclui itens marcados junto de outra classe e os 3 do áudio) | 19 |

---

## 3. Dependências técnicas e riscos da migração do ClickUp

### 3.1 Dependências (ordem obrigatória)

1. **Segurança antes de dados reais:** tarefa 001 (S1, B1, desativar pessoa) e backup. Sem isso, dados de clientes reais ficam sem cópia e o histórico some se alguém for apagado **[R]**.
2. **Carregamento paginado/filtrado (T1, T2) antes da importação:** o histórico de horas sozinho estoura o limite padrão de linhas.
3. **Modelo de dados fechado antes do importador:** status finais, fluxos de etapas, tipos de hora, projeto interno para horas sem cliente, perfis. Cada um vira `check` no SQL.
4. **Login Google** depende de configurar o provedor no Supabase e no Google Cloud da Air (quem administra o Google Workspace da Air?) **[H]**.
5. **Exportação para o BI** depende de saber como o BI lê as horas hoje (pergunta aberta do diagnóstico) **[D]**.
6. **Funil comercial** depende de decidir se a proposta é uma entidade própria e qual o vínculo com `projetos.codigo`.

### 3.2 Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Horas lançadas erradas ou perdidas na virada (BI de rentabilidade perde a fonte) [D] | Média | Alto | Rodar em paralelo; conferir totais por pessoa/projeto/semana entre ClickUp e app antes de desligar |
| Limite de linhas trunca dados sem aviso (T1) | Alta com uso real | Alto | Paginar ou filtrar por período/pessoa antes de convidar a equipe toda |
| Mapear 14+ status do ClickUp para 8 | Certa | Médio | Tabela de-para validada com coordenação; status sem par viram decisão do cliente |
| Mesmo cliente em vários espaços (Elo, Patria, Solar…) [D] | Certa | Médio | Normalizar nomes de clientes antes de importar |
| Tarefas "(DESIGN)" duplicadas viram entregas duplicadas | Alta | Médio | Regra de fusão no importador ou importar só projetos ativos e recomeçar entregas |
| Membros e freelancers veem tudo (RLS atual) | Certa | Alto ao convidar externos | Decidir S4 e perfil "externo" antes de convidar freelancer ou cliente |
| Plano gratuito: pausa após 7 dias sem uso, sem backup, limite de e-mails [R] | Média | Alto | Decidir plano antes da virada (memória: grátis por ora, sobe conforme o cliente) |
| Dependência de uma pessoa só [D] | Alta | Alto | Docs vivas já existem; definir dono interno e quem mantém |
| Coincidência com recesso, reestruturação e licenças [D] | Alta | Médio | Virada em fevereiro, ClickUp como ponte [D] |
| Export do ClickUp incompleto (views/automações não acessíveis) [D] | Média | Baixo | Importar só o essencial: clientes, projetos ativos, entregas abertas, horas 2025–2026 |

---

## 4. Proposta de backlog priorizado para o MVP

Princípio: o piloto já cobre o núcleo de produção. O MVP precisa de **robustez para dados reais** e dos itens do diagnóstico que impedem desligar o ClickUp. Itens marcados "decisão" esperam resposta do cliente ou sua.

Prioridade: P0 bloqueia dados reais; P1 bloqueia desligar o ClickUp; P2 importante; P3 depois. Esforço: P, M, G.

| Ordem | Item | Prio | Esforço | Origem | Depende de |
|---|---|---|---|---|---|
| 1 | Mesclar a auditoria (`fix/seguranca-fase1`) e decidir D1 a D8 | P0 | P | [R] | você |
| 2 | Script 03: S1 (escalada de perfil), B1 (desativar pessoa, `restrict` no histórico) e telas de desativar | P0 | M | [R] tarefa 001 | 1 |
| 3 | Leitura paginada/filtrada (horas por período; entregas abertas + recentes) e realtime por tabela | P0 | M | T1, T2 | — |
| 4 | Backup: plano pago ou exportação agendada | P0 | P | [R] S5 | decisão de custo |
| 5 | Validar com o cliente: status, fluxos de etapas, tipos de hora, tags, perfis (oficina da semana 2 do diagnóstico) | P0 | P | [D] | — |
| 6 | Lançamento manual com data e observação (usa `horas.observacao`); editar e apagar as próprias horas | P1 | P | T5, [D] | — |
| 7 | Exportação de horas em CSV (pessoa, projeto, código, cliente, entrega, tipo, data, minutos) | P1 | P | [D] item 5 | 3, 5 |
| 8 | Ajustes de status/etapas conforme item 5 (ex.: Cancelado, Pausado, etapa de ajustes, voltar etapa) e `avancarEtapa` atômico | P1 | M | [D], T4 | 5 |
| 9 | Perfil "externo" (freelancer/cliente) com visão restrita aos próprios projetos; decidir S4 | P1 | M | [D], [R] | 2, 5 |
| 10 | Login Google (domínio da Air) mantendo convite | P1 | M | [D] item 1 | acesso ao Google Workspace |
| 11 | Importador do ClickUp (script fora do app: CSV → SQL de clientes, projetos ativos, entregas abertas, horas 2025–2026) e roteiro de conferência de totais | P1 | G | [D] item 9 | 3, 5, 8 |
| 12 | Links por URL (rotas para projeto e entrega) | P2 | M | T6 | — |
| 13 | Menções em comentários (sem notificação por e-mail na 1ª versão) | P2 | M | [D] item 4 | — |
| 14 | Formulário de pausa e ausência | P2 | M | [D] item 8 | 5 |
| 15 | Funil comercial: proposta → projeto com o mesmo código | P2 | G | [D] item 7 | 5, decisão de escopo |
| 16 | Carteira com saúde do projeto (no prazo, atrasado, fechamento pendente) e desativar projeto | P2 | M | [D] | 5 |
| 17 | Carga da equipe por semana com capacidade editável | P3 | M | [D] | 5 (168h com RH) |
| 18 | Testes unitários de `dados.js`, ESLint, correção de fuso (T3) | P2 | P | [R] R5, R7, R8 | aprovação para instalar dependências |
| 19 | Gantt, relatório de projeto, espanhol, acesso do cliente, NPS | P3 | — | [D] "depois" | — |

**Conflito a decidir:** os itens 7, 11, 15 e 17 estão no escopo v1 do diagnóstico, mas o `CLAUDE.md` e o `README.md` os colocam "fora do piloto". Pela regra de preservar decisões, não entram sem você mudar o escopo explicitamente.

---

## 5. Divisão entre Claude Code e OpenAI Codex

O repositório já está montado para o Claude Code: `CLAUDE.md`, regras por área em `.claude/rules/`, agentes `revisor` e `analista-banco`, skills de planejamento, migração e fechamento. O Codex lê `AGENTS.md`, não lê `.claude/`. Sem um `AGENTS.md` equivalente, ele não conhece as regras (nomes em português, `agir`, acesso ao banco só em `dados.js`, nunca editar SQL aplicado).

**Claude Code (dono da integração, do banco e das regras de negócio):**

- Tudo que toca `supabase/` e RLS (itens 1–4, 8, 9): usa `analista-banco` e `nova-migracao`.
- Mudanças que cruzam várias telas e regras (8, 9, 12, 15, 16).
- Planejamento (`planejar-tarefa`), revisão (`revisor`), fechamento e docs vivas.
- Revisar e mesclar o trabalho vindo do Codex.

**Codex (tarefas fechadas, com entrada e saída claras, em branch própria):**

- Importador do ClickUp (item 11) como script Node isolado em pasta própria, que gera CSV/SQL para revisão, sem tocar no app.
- Exportação CSV (item 7): uma função pura de formatação + botão, com especificação de colunas pronta.
- Testes unitários e lint (item 18), depois da aprovação das dependências.
- Componentes visuais com especificação fechada (ex.: formulário de pausa, depois que o banco existir).

**Regras para os dois não colidirem:**

1. Um item, uma branch, um agente. Nunca os dois nos mesmos arquivos ao mesmo tempo (`dados.js`, `telas.jsx` e `App.jsx` são pontos de conflito).
2. Antes de usar o Codex, criar um `AGENTS.md` que aponte para as mesmas regras do `CLAUDE.md` (proposta; não criado nesta etapa).
3. Codex não escreve SQL de produção; se a tarefa precisar de banco, a migração vem antes, pelo Claude Code.
4. Todo PR do Codex passa pelo `revisor` e por `npm run build` antes do merge.

---

## 6. Perguntas para validar com o cliente

1. O diagnóstico avaliou este piloto ou um protótipo anterior? (seção 0)
2. Os 8 status bastam? Precisa de Cancelado, Pausado, Publicado/Impulsionado?
3. Os 3 fluxos de etapas cobrem vídeo, mídia e consultoria? Quando o cliente pede ajuste, a entrega volta para a etapa de design?
4. Três tipos de hora (Produção, Atendimento, Reunião interna) bastam para o BI? Horas internas sem cliente vão para um projeto "Air interno"?
5. Freelancers e cliente convidado entram no MVP? Se sim, o que podem ver?
6. Qualquer membro pode editar qualquer entrega (S4)?
7. Login Google é obrigatório no MVP? Quem administra o Google Workspace da Air?
8. Funil comercial, importação e exportação para BI entram no MVP (mudando o escopo do piloto)?
9. Capacidade de 168h/mês vale para todos? Exceções?
10. Qual plano do Supabase aceitar antes de dados reais (backup)?
11. Vai haver um grupo piloto usando o app de verdade antes da virada? Quantas pessoas, quais áreas e por quanto tempo em paralelo ao ClickUp? **[T]**
12. Quem são os usuários mais pesados que vão validar (um por área: design, conteúdo, mídia, atendimento, coordenação, financeiro/BI)? **[T]**
13. O contrato do ClickUp permite 1 a 2 meses avulsos ou menos assentos? Qual a data-limite para decidir? **[T]**

---

## 7. Proposta de execução (para aprovação)

O áudio deixa claro que até ~9/dez quem anda é a agência **[T]**. Por isso a proposta tem duas trilhas que não dependem uma da outra.

**Trilha da agência (sem código, responde à pergunta "o que a gente puxa de cá")**

| Quando | O que | Alimenta |
|---|---|---|
| 17 a 21/nov | Contrato do ClickUp (data, plano, ponte de 1–2 meses); revisar os 33 acessos; exportar CSV de tarefas e horas 2025–2026 para o Drive; definir dono interno | Perguntas 13; itens 4 e 11 do backlog |
| 24 a 28/nov | Conversas com os usuários pesados **usando o piloto real**, não o protótipo antigo; validar status, fluxos de etapas, tipos de hora, tags e perfis | Perguntas 2 a 5, 9, 12; item 5 do backlog |
| 1 a 5/dez | Fechar respostas das perguntas 1, 6, 8 e 11; decidir data de virada (sugestão do diagnóstico: fevereiro) | Escopo do MVP |

**Trilha de desenvolvimento (depende de aprovação, item a item)**

1. **Agora:** você aprova este documento e decide o conflito de escopo da seção 4 (itens 7, 11, 15 e 17).
2. **Primeiro bloco (P0):** itens 1 a 4 do backlog (segurança, leitura paginada, backup). Não dependem das respostas do cliente e são pré-requisito para o grupo piloto e para qualquer dado real.
3. **Segundo bloco (P1):** itens 6 a 11, à medida que a trilha da agência devolver as decisões. O importador é testado num projeto Supabase separado antes de produção.
4. **8/dez:** reunião com a matriz atualizada, o modelo de dados fechado, o de-para do ClickUp e a decisão sobre o grupo piloto.

Nada disso começa sem aprovação, e cada item relevante passa pela skill `planejar-tarefa`.

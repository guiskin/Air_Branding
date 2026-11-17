# 004: Ideias de configurações e tela de clientes

Status: implementação solicitada no chat. Configurações, fontes e ajustes de clientes estão implementados. A migração 04 aguarda teste no Supabase. O formato dos detalhes da entrega aguarda a escolha do usuário.

## 1. Botão de configurações (novo)

Um botão de configurações com as funcionalidades:

- [x] **Foto de perfil:** upload e remoção. O avatar compartilhado mostra a foto no menu, nos responsáveis, na equipe e na conversa. Depende da migração 04.
- [x] **Alterar senha:** exige senha atual e confirmação da nova.
- [x] **Dados pessoais:** nome completo editável. Depende da migração 04.
- [x] **Reduzir a fonte em geral:** reduzir 1 px nos tamanhos definidos no CSS.

## 2. Tela de clientes

- [x] **Entrega selecionada em cor diferente** na lista, no Quadro e na linha do tempo.
- [x] **Conversa em bloquinho separado**, para ficar evidente que é um chat.
- [ ] **Repensar a janela lateral direita da entrega:** o usuário não acha que ficou boa. **Não implementar ainda:** primeiro enviar ao usuário propostas de alternativa (ex.: abrir a entrega em página própria, expandir inline no card, modal centralizado, abas dentro da pasta do cliente) para ele escolher.
- [x] **Ao sair da pasta do cliente, fechar o painel lateral direito da entrega.**
- [x] **Mover "Cadastrar cliente"** para o botão **"+"** ao lado de "Clientes" na barra lateral esquerda.

## Observações

- A reduzir fonte e o painel lateral dialogam com a tarefa `003-air-creative-workspace.md` (menu lateral, barra superior, tema): conferir antes para não duplicar.
- Perfil/foto e senha tocam em Authentication e perfis (ver `001-seguranca-perfis-e-convites.md`): cuidado com a RLS de perfis.

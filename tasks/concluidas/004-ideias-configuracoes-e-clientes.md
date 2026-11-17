# 004: Ideias de configurações e tela de clientes

Status: configurações, fontes e ajustes de clientes implementados. A migração 04 já está aplicada no banco real (ver `supabase/APLICADO.md`); falta validar o envio de foto pela interface publicada.

## 1. Botão de configurações (novo)

Um botão de configurações com as funcionalidades:

- [x] **Foto de perfil:** upload e remoção. O avatar compartilhado mostra a foto no menu, nos responsáveis, na equipe e na conversa. Depende da migração 04.
- [x] **Alterar senha:** exige senha atual e confirmação da nova.
- [x] **Dados pessoais:** nome completo editável. Depende da migração 04.
- [x] **Reduzir a fonte em geral:** reduzir 1 px nos tamanhos definidos no CSS.

## 2. Tela de clientes

- [x] **Entrega selecionada em cor diferente** na lista, no Quadro e na linha do tempo.
- [x] **Conversa em bloquinho separado**, para ficar evidente que é um chat.
- [x] **Abrir os detalhes em modal central**, escolhido pelo usuário após comparar os exemplos. No celular, o modal ocupa a tela inteira.
- [x] **Ao sair da pasta do cliente, fechar o painel lateral direito da entrega.**
- [x] **Mover "Cadastrar cliente"** para o botão **"+"** ao lado de "Clientes" na barra lateral esquerda.

## Observações

- A reduzir fonte e o painel lateral dialogam com a tarefa `003-air-creative-workspace.md` (menu lateral, barra superior, tema): conferir antes para não duplicar.
- Perfil/foto e senha tocam em Authentication e perfis (ver `001-seguranca-perfis-e-convites.md`): cuidado com a RLS de perfis.

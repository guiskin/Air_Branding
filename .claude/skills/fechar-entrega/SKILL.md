---
name: fechar-entrega
description: Fecha uma entrega de código: build, revisão, resumo dos arquivos alterados, docs e commit (push só se pedido). Use quando a implementação estiver pronta.
---

1. Rode `npm run build`. Se falhar, corrija antes de continuar.
2. Rode o agente `revisor` e trate os problemas apontados (ou justifique ao usuário o que não vai tratar).
3. Confira os critérios de aceite da tarefa em `tasks/`, um a um, dizendo o que foi verificado e o que não foi.
4. Atualize `docs/` se mudou comportamento, banco ou arquitetura. Se a tarefa tem arquivo, mova-o para `tasks/concluidas/`.
5. Mostre o resumo: arquivos criados, alterados e removidos, com uma linha cada.
6. Commite na branch de trabalho (identidade e assinatura conforme `CLAUDE.md`, mensagem em português). Push e merge na `main` só se o usuário pedir; sem pedido, pare no commit e diga que falta publicar.

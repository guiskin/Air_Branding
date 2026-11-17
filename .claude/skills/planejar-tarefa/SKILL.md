---
name: planejar-tarefa
description: Cria o arquivo de tarefa em tasks/ com escopo, fora de escopo e critérios de aceite verificáveis, antes de implementar mudança relevante. Use quando o usuário pedir funcionalidade, mudança de dados ou refatoração.
---

1. Leia `tasks/_modelo.md` e `tasks/backlog.md`. Descubra o próximo número em `tasks/` e `tasks/concluidas/`.
2. Pesquise o código afetado (não suponha; confirme nos arquivos).
3. Crie `tasks/NNN-resumo-curto.md` a partir do modelo: objetivo, escopo, fora do escopo, arquivos prováveis, impacto em banco (se houver, acione `analista-banco`), riscos e **critérios de aceite que alguém consiga verificar** (o que clicar e o que deve ver; `npm run build` passa).
4. Informe a branch sugerida (`feat/…` ou `fix/…`) e **pare para aprovação**. Não implemente antes disso.

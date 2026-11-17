---
paths:
  - "src/**/*.jsx"
  - "src/estilos.css"
---

# Interface

- JavaScript puro, componentes em função. Nomes de variáveis, funções e classes CSS em português (`agir`, `recarregar`, `.cartao`, `.pilha`, `.fila`).
- Telas recebem o objeto `app` (`dados`, `m`, `eu`, `gestor`, `agir`, `ir`, `abrir`, `avisar`). Não crie novo canal de estado global.
- Toda mutação passa por `app.agir('rótulo', () => D.funcao(...))`: ele registra o clique, mostra erro e recarrega os dados. Não chame o Supabase direto numa tela.
- Todo CSS fica em `src/estilos.css`, usando as variáveis de `:root` (`--marca`, `--tinta`, `--suave`, `--borda`…). Reaproveite as classes existentes antes de criar outras. Sem estilo inline novo além do que já existe.
- Cores: nenhum hex fora de `:root` e de `:root[data-tema='escuro']` em `estilos.css`. Status e avatar usam as classes `status-<id>` e `cor-N`. Cor nova entra nos dois temas e passa pela checagem de contraste de `docs/design-system.md`.
- Acessibilidade: campos com `label` e `htmlFor`, botões de alternância com `aria-pressed`, erros com `role="alert"`, alvos de toque confortáveis no celular.
- Textos da interface em português, tom direto. Identidade: laranja `#FF3301`, Barlow Condensed nos títulos, Poppins no texto.
- O que só gestor (admin/coordenação) vê usa `app.gestor`; a barreira real é a RLS do banco, não a interface.

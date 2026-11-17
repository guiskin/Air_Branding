# 006: Painéis de entregas e horas

- **Status:** implementada e validada localmente
- **Branch:** `feat/paineis`

## Objetivo

Dar uma visão geral das entregas e horas dos projetos no menu **Painéis**, com acesso direto aos detalhes das entregas atrasadas.

## Escopo

- Filtrar por cliente, projeto, equipe cadastrada e intervalo de datas.
- Mostrar contagem total, por status e por atraso, além de horas estimadas e lançadas.
- Usar a equipe aplicada ao projeto. Com datas selecionadas, usar o prazo para as entregas e a data local de início para as horas encerradas.
- Reaproveitar os dados já disponíveis a membros ativos. Nenhuma alteração de banco.

## Critérios de aceite

- [x] Os totais e o gráfico refletem os filtros, inclusive nos extremos do período.
- [x] Horas sem entrega entram nas horas lançadas. Timers em andamento ficam fora do total.
- [x] Uma entrega atrasada abre no modal de detalhes.
- [x] Limpar filtros restaura a visão geral. Intervalos invertidos e ausência de resultados recebem mensagens claras.
- [x] O painel carrega em ambientes em que a migração de equipes ainda não foi aplicada.
- [x] `npm run build` passa.

## Validação

- O cálculo foi exercitado com extremos inclusivos, datas de início próximas à meia-noite no fuso de São Paulo, filtros combinados e entregas sem prazo.
- No navegador, uma conta simulada de membro conferiu os totais, gráfico, mensagens de intervalo invertido e de lista vazia, limpeza de filtros e retorno do foco após fechar o modal.
- A API simulada limitou cada página a duas linhas. O carregamento buscou páginas adicionais de entregas e horas. Também foi verificada a abertura do painel quando as tabelas de equipes estão ausentes.
- A publicação está pendente.

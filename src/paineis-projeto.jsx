import { fmtData, fmtMin, hoje } from './dados'
import { Avatar, Barra } from './pecas'

export function IndicadoresProjeto({ resumo, vendidas, porTipo }) {
  return (
    <section className="cartao pilha curta" aria-label="Indicadores do projeto">
      <dl className="indicadores-projeto">
        <div>
          <dt>Abertas</dt>
          <dd>{resumo.entregas.length - resumo.feitas}</dd>
        </div>
        <div>
          <dt>Atrasadas</dt>
          <dd className={resumo.atrasadas ? 'perigo' : undefined}>{resumo.atrasadas}</dd>
        </div>
        <div>
          <dt>Horas lançadas</dt>
          <dd>{fmtMin(resumo.minutos)}</dd>
          {vendidas > 0 && <dd className="pequeno suave">de {vendidas}h vendidas</dd>}
        </div>
        <div>
          <dt>Concluído</dt>
          <dd>{Math.round(resumo.pct)}%</dd>
          <dd><Barra pct={resumo.pct} rotulo="Progresso do projeto" /></dd>
        </div>
      </dl>
      <p className="pequeno suave">{porTipo.map((t) => `${t.nome} ${fmtMin(t.minutos)}`).join(' · ')}</p>
    </section>
  )
}

function diaCivil(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(0)
  data.setUTCFullYear(ano, mes - 1, dia)
  return data.getTime() / 86400000
}

function dataDeCriacao(iso) {
  const data = new Date(iso)
  return `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`
}

function montarLinhaDoTempo(entregas, dataAtual) {
  const diaAtual = diaCivil(dataAtual)
  const abertas = entregas.filter((entrega) => entrega.status !== 'concluido')
  const barras = abertas.filter((entrega) => entrega.prazo).map((entrega) => {
    const prazo = diaCivil(entrega.prazo)
    const inicio = entrega.inicio || (entrega.criado_em ? dataDeCriacao(entrega.criado_em) : entrega.prazo)
    return { entrega, inicio: Math.min(diaCivil(inicio), prazo), prazo }
  }).sort((a, b) => a.prazo - b.prazo)
  const primeiroDia = Math.min(diaAtual, ...barras.map((barra) => barra.inicio))
  const ultimoDia = Math.max(diaAtual, ...barras.map((barra) => barra.prazo))
  const total = ultimoDia - primeiroDia + 1
  return {
    hoje: (diaAtual - primeiroDia + 0.5) / total * 100,
    semPrazo: abertas.length - barras.length,
    barras: barras.map(({ entrega, inicio, prazo }) => ({
      entrega,
      esquerda: (inicio - primeiroDia) / total * 100,
      largura: (prazo - inicio + 1) / total * 100,
    })),
  }
}

function LinhaDoTempo({ app, entregas }) {
  const dia = hoje()
  const linha = montarLinhaDoTempo(entregas, dia)
  return (
    <section className="cartao pilha curta" aria-labelledby="titulo-linha-do-tempo">
      <div className="fila entre">
        <h2 id="titulo-linha-do-tempo" className="titulo-grupo">Linha do tempo</h2>
        <span className="pequeno suave">Hoje, {fmtData(dia)}</span>
      </div>
      {linha.barras.length === 0 && <p className="pequeno suave">Nenhuma entrega aberta com prazo.</p>}
      {linha.barras.length > 0 && (
        <ul className="itens-painel">
          {linha.barras.map(({ entrega, esquerda, largura }) => {
            const selecionada = app.entregaId === entrega.id
            return (
              <li key={entrega.id}>
                <button type="button" className={`entrega-tempo${selecionada ? ' entrega-selecionada' : ''}`} aria-expanded={selecionada} onClick={() => app.abrir(entrega.id)}>
                  <span className="tempo-entrega-cabeca">
                    <span>{entrega.titulo}</span>
                    <span className={`pequeno ${entrega.atrasada ? 'perigo forte' : 'suave'}`}>
                      {fmtData(entrega.prazo)}{entrega.atrasada ? ' · Atrasada' : ''}
                    </span>
                  </span>
                  <svg className={`tempo-trilho${entrega.atrasada ? ' tempo-atrasada' : ''}`} width="100%" height="12" aria-hidden="true" focusable="false">
                    <rect className="tempo-barra" x={`${esquerda}%`} y="2" width={`${largura}%`} height="8" rx="2" />
                    <line className="tempo-hoje" x1={`${linha.hoje}%`} x2={`${linha.hoje}%`} y1="0" y2="12" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="pequeno suave">Sem prazo: {linha.semPrazo}</p>
    </section>
  )
}

function EquipeDoProjeto({ app, entregas, horas }) {
  const envolvidos = new Set()
  for (const entrega of entregas) {
    for (const pessoa of entrega.responsaveis) envolvidos.add(pessoa.id)
    for (const etapa of entrega.etapas) envolvidos.add(etapa.pessoa_id)
  }
  const minutosPorPessoa = new Map()
  for (const hora of horas) {
    minutosPorPessoa.set(hora.pessoa_id, (minutosPorPessoa.get(hora.pessoa_id) || 0) + hora.minutos)
  }
  const pessoas = app.dados.pessoas.filter((pessoa) => envolvidos.has(pessoa.id))
  return (
    <section className="cartao pilha curta" aria-labelledby="titulo-equipe-projeto">
      <h2 id="titulo-equipe-projeto" className="titulo-grupo">Equipe do projeto</h2>
      {pessoas.length === 0 && <p className="pequeno suave">Ainda não há pessoas atribuídas às entregas.</p>}
      {pessoas.length > 0 && (
        <ul className="itens-painel equipe-projeto">
          {pessoas.map((pessoa) => (
            <li key={pessoa.id}>
              <Avatar pessoa={pessoa} />
              <div>
                <strong>{pessoa.nome}</strong>
                {pessoa.area && <p className="pequeno suave">{pessoa.area}</p>}
              </div>
              <span className="pequeno suave">{fmtMin(minutosPorPessoa.get(pessoa.id) || 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function PaineisProjeto({ app, entregas, horas }) {
  return (
    <aside className="pilha paineis-projeto" aria-label="Acompanhamento do projeto">
      <LinhaDoTempo app={app} entregas={entregas} />
      <section className="cartao pilha curta" aria-labelledby="titulo-regras-projeto">
        <h2 id="titulo-regras-projeto" className="titulo-grupo">Regras automáticas</h2>
        <ul className="regras-projeto pequeno suave">
          <li>Ao concluir uma etapa, a pessoa definida para a próxima assume e entra na lista de responsáveis.</li>
          <li>Ao chegar a Aprovação do cliente, a entrega passa para Em aprovação.</li>
          <li>Ao avançar uma etapa, o sistema registra um comentário.</li>
        </ul>
      </section>
      <EquipeDoProjeto app={app} entregas={entregas} horas={horas} />
    </aside>
  )
}

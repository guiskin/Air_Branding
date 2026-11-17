import { useState } from 'react'
import { STATUS, fmtData, fmtMin, hoje } from './dados'
import { montarPainel } from './dados-paineis'
import { Barra, Etiqueta } from './pecas'

const FILTROS_INICIAIS = { clienteId: '', projetoId: '', equipeId: '', de: '', ate: '' }

function FiltrosPainel({ app, filtros, setFiltros, periodoInvalido }) {
  const { clientes, projetos, cadastroEquipes } = app.dados
  const equipes = cadastroEquipes?.equipes || []
  const projetosDoCliente = projetos.filter((projeto) => !filtros.clienteId || projeto.cliente_id === filtros.clienteId)
  const mudar = (campo) => (ev) => {
    const valor = ev.target.value
    setFiltros((atuais) => ({ ...atuais, [campo]: valor, ...(campo === 'clienteId' ? { projetoId: '' } : {}) }))
  }

  return (
    <section className="cartao pilha" aria-labelledby="titulo-filtros-paineis">
      <div className="fila entre">
        <h2 id="titulo-filtros-paineis" className="titulo-grupo">Filtros</h2>
        <button type="button" className="botao pequeno" disabled={!Object.values(filtros).some(Boolean)} onClick={() => setFiltros(FILTROS_INICIAIS)}>
          Limpar filtros
        </button>
      </div>
      <div className="grade filtros-paineis">
        <label className="campo" htmlFor="painel-cliente">
          <span>Cliente</span>
          <select id="painel-cliente" className="entrada" value={filtros.clienteId} onChange={mudar('clienteId')}>
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
          </select>
        </label>
        <label className="campo" htmlFor="painel-projeto">
          <span>Projeto</span>
          <select id="painel-projeto" className="entrada" value={filtros.projetoId} onChange={mudar('projetoId')}>
            <option value="">Todos os projetos</option>
            {projetosDoCliente.map((projeto) => (
              <option key={projeto.id} value={projeto.id}>{projeto.codigo} · {projeto.nome}{projeto.ativo ? '' : ' (inativo)'}</option>
            ))}
          </select>
        </label>
        {equipes.length > 0 && (
          <label className="campo" htmlFor="painel-equipe">
            <span>Equipe</span>
            <select id="painel-equipe" className="entrada" value={filtros.equipeId} onChange={mudar('equipeId')}>
              <option value="">Todas as equipes</option>
              {equipes.map((equipe) => <option key={equipe.id} value={equipe.id}>{equipe.nome}</option>)}
            </select>
          </label>
        )}
        <label className="campo" htmlFor="painel-de">
          <span>De</span>
          <input id="painel-de" className="entrada" type="date" value={filtros.de} onChange={mudar('de')} aria-describedby="periodo-paineis" aria-invalid={periodoInvalido} />
        </label>
        <label className="campo" htmlFor="painel-ate">
          <span>Até</span>
          <input id="painel-ate" className="entrada" type="date" value={filtros.ate} onChange={mudar('ate')} aria-describedby="periodo-paineis" aria-invalid={periodoInvalido} />
        </label>
      </div>
      <p id="periodo-paineis" className="pequeno suave">O período usa o prazo das entregas e a data de início das horas lançadas.</p>
      {periodoInvalido && <p className="pequeno perigo" role="alert">A data inicial deve ser igual ou anterior à final.</p>}
    </section>
  )
}

function Indicadores({ painel }) {
  return (
    <section className="cartao" aria-label="Resumo dos indicadores">
      <dl className="indicadores-projeto">
        <div><dt>Entregas</dt><dd>{painel.total}</dd></div>
        <div><dt>Atrasadas</dt><dd className={painel.atrasadas.length ? 'perigo' : undefined}>{painel.atrasadas.length}</dd></div>
        <div><dt>Horas estimadas</dt><dd>{fmtMin(painel.minutosEstimados)}</dd></div>
        <div><dt>Horas lançadas</dt><dd>{fmtMin(painel.minutosLancados)}</dd></div>
      </dl>
    </section>
  )
}

function DistribuicaoStatus({ painel }) {
  return (
    <section className="cartao pilha" aria-labelledby="titulo-distribuicao-status">
      <h2 id="titulo-distribuicao-status" className="titulo-grupo">Entregas por status</h2>
      {painel.total === 0 ? <p className="suave">Nenhuma entrega para os filtros selecionados.</p> : (
        <ul className="itens-painel pilha">
          {STATUS.map(({ id, nome }) => {
            const quantidade = painel.porStatus.get(id) || 0
            return (
              <li key={id} className={`status-${id} status-painel`}>
                <Etiqueta status={id} />
                <div aria-hidden="true"><Barra pct={quantidade / painel.total * 100} rotulo={nome} /></div>
                <strong>{quantidade}</strong>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function EntregasAtrasadas({ app, atrasadas }) {
  return (
    <section className="cartao pilha" aria-labelledby="titulo-atrasadas-painel">
      <h2 id="titulo-atrasadas-painel" className="titulo-grupo">Entregas atrasadas</h2>
      {atrasadas.length === 0 && <p className="suave">Nenhuma entrega atrasada para os filtros selecionados.</p>}
      <ul className="itens-painel">
        {atrasadas.map((entrega) => (
          <li key={entrega.id} className="linha">
            <button type="button" className="linha-titulo" aria-haspopup="dialog" onClick={() => app.abrir(entrega.id)}>
              <strong>{entrega.titulo}</strong>
              {entrega.projeto && <span>{entrega.projeto.codigo} · {entrega.projeto.nome}</span>}
            </button>
            <span className="pequeno perigo forte">{fmtData(entrega.prazo)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Paineis({ app }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const periodoInvalido = Boolean(filtros.de && filtros.ate && filtros.de > filtros.ate)
  const painel = periodoInvalido ? null : montarPainel({
    projetos: app.dados.projetos,
    horas: app.dados.horas,
    entregas: app.m.entregas,
    equipePorProjeto: app.m.equipePorProjeto,
  }, filtros, hoje())

  return (
    <div className="pilha larga">
      <h1>Painéis</h1>
      <FiltrosPainel app={app} filtros={filtros} setFiltros={setFiltros} periodoInvalido={periodoInvalido} />
      {painel && (
        <>
          <Indicadores painel={painel} />
          <div className="grade graficos-paineis">
            <DistribuicaoStatus painel={painel} />
            <EntregasAtrasadas app={app} atrasadas={painel.atrasadas} />
          </div>
        </>
      )}
    </div>
  )
}

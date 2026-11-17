import { useState } from 'react'
import * as D from './dados'
import { CampoSalvo, relogio, textoPrazo } from './pecas'
import { SeletorTipo } from './telas'

export default function Painel({ app, entrega }) {
  const [minutos, setMinutos] = useState('30')
  const [texto, setTexto] = useState('')
  const e = entrega
  const rodando = app.m.timer && app.m.timer.entrega_id === e.id
  const salvar = (rotulo, mudancas) => app.agir(`${rotulo} em "${e.titulo}"`, () => D.atualizarEntrega(e.id, mudancas))
  const proxima = e.etapaAtual ? e.etapas.find((x) => x.ordem > e.etapaAtual.ordem && !x.concluida) : null
  const enviarComentario = async () => {
    const t = texto.trim()
    if (!t) return
    const feito = await app.agir(`Comentar em "${e.titulo}"`, () => D.comentar(e.id, t))
    if (feito !== undefined) setTexto('')
  }
  return (
    <aside className="cartao pilha solta" aria-label="Detalhe da entrega">
      <div className="fila entre">
        <span className="pequeno suave">
          {e.cliente ? `${e.cliente.nome}, ` : ''}
          {e.projeto ? `${e.projeto.codigo} ${e.projeto.nome}` : ''}
        </span>
        <button className="botao pequeno" onClick={() => app.abrir(null)}>
          Fechar
        </button>
      </div>
      <label className="campo" htmlFor="pe-titulo">
        <span>O que precisa ser feito</span>
        <CampoSalvo id="pe-titulo" valor={e.titulo} aoSalvar={(v) => v.trim() && salvar('Renomear', { titulo: v.trim() })} classe="destaque" />
      </label>

      <div className="bloco pilha">
        <div className="fila entre">
          <div>
            <div className="rotulo">Horas</div>
            <div className="forte numero-grande">
              {D.fmtMin(e.minutos)}
              {Number(e.horas_estimadas) ? ` de ${Number(e.horas_estimadas)}h` : ''}
            </div>
          </div>
          {rodando ? (
            <button className="botao vermelho" onClick={() => app.agir('Parar timer', () => D.pararTimer(app.m.timer))}>
              Parar {relogio(app.m.timer.inicio)}
            </button>
          ) : (
            <button
              className="botao primario"
              onClick={() => app.agir(`Iniciar timer em "${e.titulo}"`, () => D.iniciarTimer({ projeto_id: e.projeto_id, entrega_id: e.id, tipo: app.tipo }, app.m.timer))}
            >
              Iniciar timer
            </button>
          )}
        </div>
        <div className="fila fim">
          <label className="campo tipo-hora" htmlFor="pe-tipo">
            <span>Tipo de hora</span>
            <SeletorTipo app={app} id="pe-tipo" />
          </label>
          <label className="campo minutos" htmlFor="pe-min">
            <span>Minutos</span>
            <input id="pe-min" className="entrada" type="number" min="1" value={minutos} onChange={(ev) => setMinutos(ev.target.value)} />
          </label>
          <button
            className="botao"
            disabled={!(Number(minutos) > 0)}
            onClick={() => app.agir(`Lançar ${minutos} min em "${e.titulo}"`, () => D.lancarManual({ projeto_id: e.projeto_id, entrega_id: e.id, tipo: app.tipo, minutos: Math.round(Number(minutos)) }))}
          >
            Lançar manual
          </button>
        </div>
      </div>

      <div className="pilha curta">
        <div className="rotulo">Etapas da entrega</div>
        {e.etapas.length === 0 && <p className="pequeno suave">Entrega de etapa única.</p>}
        {e.etapas.map((x) => {
          const agora = e.etapaAtual && x.id === e.etapaAtual.id
          const estado = x.concluida ? ['feito', 'Feito'] : agora ? ['agora', 'Agora'] : ['depois', 'Depois']
          return (
            <div key={x.id} className="etapa">
              <span className={`marca-etapa ${estado[0]}`}>{estado[1]}</span>
              <span className="nome-etapa">{x.nome}</span>
              <select
                className="entrada"
                aria-label={`Quem faz a etapa ${x.nome}`}
                value={x.pessoa_id || ''}
                disabled={x.concluida}
                onChange={(ev) => app.agir(`Definir quem faz ${x.nome} em "${e.titulo}"`, () => D.definirPessoaEtapa(x.id, ev.target.value))}
              >
                <option value="">A definir</option>
                {app.dados.pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
        {e.etapaAtual && (
          <div>
            <button className="botao primario" onClick={() => app.agir(`Concluir etapa ${e.etapaAtual.nome} em "${e.titulo}"`, () => D.avancarEtapa(e, app.m.pessoaPorId))}>
              {proxima ? `Concluir ${e.etapaAtual.nome} e passar para ${D.primeiroNome(app.m.pessoaPorId[proxima.pessoa_id])}` : 'Concluir a última etapa'}
            </button>
          </div>
        )}
      </div>

      <div className="pilha curta">
        <div className="rotulo">Em que pé está</div>
        <div className="pilulas">
          {D.STATUS.map((s) => (
            <button
              key={s.id}
              className={`pilula status-${s.id}`}
              aria-pressed={e.status === s.id}
              onClick={() => e.status !== s.id && salvar(`Mudar status para ${s.id}`, { status: s.id })}
            >
              {s.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="grade estreita">
        <label className="campo" htmlFor="pe-prazo">
          <span>Para quando</span>
          <input id="pe-prazo" className="entrada" type="date" value={e.prazo || ''} onChange={(ev) => salvar('Mudar prazo', { prazo: ev.target.value || null })} />
        </label>
        <label className="campo" htmlFor="pe-prio">
          <span>Prioridade</span>
          <select id="pe-prio" className="entrada" value={e.prioridade} onChange={(ev) => salvar('Mudar prioridade', { prioridade: ev.target.value })}>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
          </select>
        </label>
        <label className="campo" htmlFor="pe-est">
          <span>Horas estimadas</span>
          <CampoSalvo id="pe-est" tipo="number" min="0" valor={String(Number(e.horas_estimadas))} aoSalvar={(v) => salvar('Mudar estimativa', { horas_estimadas: Number(v) || 0 })} />
        </label>
      </div>
      {e.atrasada && <p className="pequeno perigo forte">{textoPrazo(e)}</p>}

      <div className="pilha curta">
        <div className="rotulo">Quem faz</div>
        <div className="pilulas">
          {app.dados.pessoas.map((p) => {
            const dentro = e.responsaveis.some((x) => x.id === p.id)
            return (
              <button
                key={p.id}
                className="pilula pessoa"
                aria-pressed={dentro}
                onClick={() => app.agir(`${dentro ? 'Tirar' : 'Incluir'} ${p.nome} em "${e.titulo}"`, () => D.alternarResponsavel(e.id, p.id, !dentro))}
              >
                {p.nome}
              </button>
            )
          })}
        </div>
      </div>

      <label className="campo" htmlFor="pe-briefing">
        <span>Briefing</span>
        <CampoSalvo id="pe-briefing" multilinha valor={e.briefing} aoSalvar={(v) => salvar('Editar briefing', { briefing: v })} />
      </label>
      <label className="campo" htmlFor="pe-link">
        <span>Link dos insumos (Google Drive)</span>
        <CampoSalvo id="pe-link" valor={e.link_drive} aoSalvar={(v) => salvar('Editar link', { link_drive: v.trim() })} placeholder="Cole o link da pasta" />
      </label>
      {/^https?:\/\//.test(e.link_drive) && (
        <a href={e.link_drive} target="_blank" rel="noopener noreferrer">
          Abrir pasta de insumos
        </a>
      )}

      <div className="pilha media">
        <div className="rotulo">Conversa</div>
        {e.comentarios.map((c) => (
          <div key={c.id} className="comentario">
            <div className="pequeno forte">
              {(app.m.pessoaPorId[c.autor_id] || {}).nome || 'Alguém'}, {new Date(c.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="texto-livre">{c.texto}</div>
          </div>
        ))}
        <label className="pequeno suave" htmlFor="pe-comentario">
          Escrever comentário
        </label>
        <div className="fila">
          <input
            id="pe-comentario"
            className="entrada comentario-novo"
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            onKeyDown={(ev) => ev.key === 'Enter' && enviarComentario()}
          />
          <button className="botao" disabled={!texto.trim()} onClick={enviarComentario}>
            Enviar
          </button>
        </div>
      </div>
    </aside>
  )
}

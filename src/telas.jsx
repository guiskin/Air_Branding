import { useEffect, useRef, useState } from 'react'
import * as D from './dados'
import { Avatares, Barra, CampoSalvo, Etiqueta, SeletorStatus, relogio, textoEtapa, textoPrazo } from './pecas'
import { IndicadoresProjeto, PaineisProjeto } from './paineis-projeto'
import { CadastroEquipes, SeletorEquipe } from './EquipesProjeto'

function BotaoTimer({ app, entrega }) {
  const rodando = app.m.timer && app.m.timer.entrega_id === entrega.id
  if (rodando) {
    return (
      <button className="botao vermelho pequeno" onClick={() => app.agir('Parar timer', () => D.pararTimer(app.m.timer))}>
        Parar {relogio(app.m.timer.inicio)}
      </button>
    )
  }
  return (
    <button
      className="botao pequeno"
      onClick={() => app.agir(`Iniciar timer em "${entrega.titulo}"`, () => D.iniciarTimer({ projeto_id: entrega.projeto_id, entrega_id: entrega.id, tipo: app.tipo }, app.m.timer))}
    >
      Iniciar timer
    </button>
  )
}

function LinhaEntrega({ app, entrega, comProjeto = true, comTimer = true }) {
  const selecionada = app.entregaId === entrega.id
  const classe = `linha${comProjeto ? '' : ' linha-projeto'}${selecionada ? ' entrega-selecionada' : ''}`
  const timer = comTimer ? <BotaoTimer app={app} entrega={entrega} /> : null
  return (
    <div className={classe}>
      <button className="linha-titulo" aria-expanded={selecionada} onClick={() => app.abrir(entrega.id)}>
        <strong>{entrega.titulo}</strong>
        {comProjeto && entrega.projeto && (
          <span>
            {entrega.cliente ? `${entrega.cliente.nome}, ` : ''}
            {entrega.projeto.codigo} {entrega.projeto.nome}
          </span>
        )}
        <span>{textoEtapa(entrega, app.m.pessoaPorId)}</span>
        {!comProjeto && (
          <span>
            {D.fmtMin(entrega.minutos)} lançadas{entrega.horas_estimadas ? ` de ${entrega.horas_estimadas}h` : ''}
          </span>
        )}
      </button>
      <div className={comProjeto ? undefined : 'linha-responsaveis'}>
        <Avatares pessoas={entrega.responsaveis} />
      </div>
      <span className={`pequeno ${entrega.atrasada ? 'perigo forte' : 'suave'}`}>{textoPrazo(entrega)}</span>
      {comProjeto && (
        <span className="pequeno suave">
          {D.fmtMin(entrega.minutos)}
          {entrega.horas_estimadas ? ` de ${entrega.horas_estimadas}h` : ''}
        </span>
      )}
      <div className={comProjeto ? 'linha-controles-dia' : 'linha-controles-projeto'}>
        {comProjeto && timer}
        <SeletorStatus valor={entrega.status} aoMudar={(v) => app.agir(`Mudar status de "${entrega.titulo}" para ${v}`, () => D.atualizarEntrega(entrega.id, { status: v }))} />
        {!comProjeto && timer}
      </div>
    </div>
  )
}

function Grupo({ app, titulo, dica, vazio, entregas }) {
  return (
    <section className="cartao">
      <h2>{titulo}</h2>
      <p className="pequeno suave">{entregas.length ? dica : vazio}</p>
      {entregas.map((e) => (
        <LinhaEntrega key={e.id} app={app} entrega={e} />
      ))}
    </section>
  )
}

export function SeletorTipo({ app, id }) {
  return (
    <select id={id} className="entrada" value={app.tipo} onChange={(e) => app.setTipo(e.target.value)}>
      {D.TIPOS.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nome}
        </option>
      ))}
    </select>
  )
}

export function MeuDia({ app }) {
  const projetos = app.dados.projetos.filter((p) => p.ativo)
  const [projetoId, setProjetoId] = useState('')
  const escolhido = projetoId || (projetos[0] ? projetos[0].id : '')
  const abertas = app.m.entregas.filter((e) => e.status !== 'concluido')
  const comigo = abertas.filter((e) => e.comigo)
  const outras = abertas.filter((e) => e.emOutraEtapa)
  const atencao = abertas.filter((e) => e.atrasada || e.responsaveis.length === 0)
  const meusMinutosHoje = app.dados.horas
    .filter((h) => h.pessoa_id === app.eu.id && h.fim && new Date(h.inicio).toDateString() === new Date().toDateString())
    .reduce((a, h) => a + h.minutos, 0)
  return (
    <div className="pilha larga">
      <div>
        <h1>Olá, {D.primeiroNome(app.eu)}</h1>
        <p className="suave">
          {comigo.length === 0 ? 'Nenhuma entrega com você agora' : comigo.length === 1 ? '1 entrega com você agora' : `${comigo.length} entregas com você agora`}. {meusMinutosHoje > 0 ? `Hoje você lançou ${D.fmtMin(meusMinutosHoje)}.` : 'Você ainda não lançou horas hoje.'}
        </p>
      </div>
      <section className="cartao fila fim">
        <div className="cresce">
          <h2>Hora sem tarefa</h2>
          <p className="pequeno suave">Reunião ou atendimento entram direto no projeto, sem criar tarefa só para receber horas.</p>
        </div>
        <label className="campo" htmlFor="solta-projeto">
          <span>Projeto</span>
          <select id="solta-projeto" className="entrada" value={escolhido} onChange={(e) => setProjetoId(e.target.value)}>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo" htmlFor="solta-tipo">
          <span>Tipo de hora</span>
          <SeletorTipo app={app} id="solta-tipo" />
        </label>
        <button
          className="botao primario"
          disabled={!escolhido}
          onClick={() => app.agir('Iniciar timer sem tarefa', () => D.iniciarTimer({ projeto_id: escolhido, entrega_id: null, tipo: app.tipo }, app.m.timer))}
        >
          Iniciar timer
        </button>
      </section>
      <Grupo app={app} titulo="Com você agora" dica="Ligue o timer com um clique e mude o status aqui mesmo." vazio="Nada pendente com você." entregas={comigo} />
      <Grupo app={app} titulo="Em outra etapa" dica="Entregas suas que estão com outra pessoa no momento." vazio="Nenhuma entrega sua parada em outra etapa." entregas={outras} />
      {app.gestor && <Grupo app={app} titulo="Precisa de atenção" dica="Entregas atrasadas ou sem dono em todos os projetos." vazio="Nenhuma entrega atrasada ou sem dono." entregas={atencao} />}
    </div>
  )
}

function resumoProjeto(app, projeto) {
  const entregas = app.m.entregas.filter((e) => e.projeto_id === projeto.id)
  const feitas = entregas.filter((e) => e.status === 'concluido').length
  const atrasadas = entregas.filter((e) => e.atrasada).length
  const pessoas = [...new Set([
    ...(app.m.equipePorProjeto[projeto.id]?.pessoas || []),
    ...entregas.flatMap((e) => e.responsaveis),
  ])]
  const minutos = app.dados.horas.filter((h) => h.projeto_id === projeto.id && h.fim).reduce((a, h) => a + h.minutos, 0)
  return { entregas, feitas, atrasadas, pessoas, minutos, pct: entregas.length ? (feitas / entregas.length) * 100 : 0 }
}

function PastaDrive({ app, projeto }) {
  const link = projeto.pasta_drive || ''
  const temLink = /^https:\/\//.test(link)
  if (!temLink && !app.gestor) return null
  return (
    <section className="cartao pilha curta" aria-labelledby="titulo-drive">
      <h2 id="titulo-drive">Pasta do Drive</h2>
      {temLink && (
        <a href={link} target="_blank" rel="noopener noreferrer">
          Abrir a pasta do projeto no Drive
        </a>
      )}
      {app.gestor && (
        <label className="campo" htmlFor="pasta-drive">
          <span>Link da pasta</span>
          <CampoSalvo
            id="pasta-drive"
            valor={link}
            placeholder="Cole o link da pasta do Google Drive"
            aoSalvar={(v) => app.agir('Salvar pasta do Drive', () => D.salvarPastaDrive(projeto.id, v))}
          />
        </label>
      )}
    </section>
  )
}

export function Projetos({ app }) {
  const projetoVazio = { cliente_id: '', codigo: '', nome: '', linha: '', horas_vendidas: '', equipe_id: '' }
  const [novo, setNovo] = useState(projetoVazio)
  const [criandoProjeto, setCriandoProjeto] = useState(false)
  const equipes = app.dados.cadastroEquipes?.equipes || []
  const clienteEscolhido = novo.cliente_id || (app.dados.clientes[0] ? app.dados.clientes[0].id : '')
  const criarProjeto = async () => {
    if (criandoProjeto) return
    setCriandoProjeto(true)
    const feito = await app.agir(`Criar projeto ${novo.codigo}`, () =>
      D.criarProjeto({ cliente_id: clienteEscolhido, codigo: novo.codigo.trim(), nome: novo.nome.trim(), linha: novo.linha.trim(), horas_vendidas: Number(novo.horas_vendidas) || 0 }, novo.equipe_id),
    )
    setCriandoProjeto(false)
    if (feito !== undefined) setNovo(projetoVazio)
  }
  return (
    <div className="pilha larga">
      <div>
        <h1>Projetos</h1>
        <p className="suave">Organizados por cliente. A linha de serviço é um atributo do projeto.</p>
      </div>
      {app.dados.clientes.length === 0 && <p className="cartao">Nenhum cliente cadastrado ainda.</p>}
      {app.dados.clientes.map((c) => {
        const projetos = app.dados.projetos.filter((p) => p.cliente_id === c.id && p.ativo)
        return (
          <section key={c.id} className="pilha">
            <div className="fila">
              <h2 className="titulo-grupo">{c.nome}</h2>
              <span className="pequeno suave">{projetos.length === 1 ? '1 projeto' : `${projetos.length} projetos`}</span>
            </div>
            <div className="grade cartoes">
              {projetos.map((p) => {
                const r = resumoProjeto(app, p)
                return (
                  <button key={p.id} className="projeto-cartao" onClick={() => app.ir('projeto', p.id)}>
                    <span>
                      <span className="pequeno suave em-bloco">
                        {p.codigo}
                        {p.linha ? `, ${p.linha}` : ''}
                      </span>
                      <strong>{p.nome}</strong>
                    </span>
                    <Barra pct={r.pct} rotulo="concluído" />
                    <span className="fila entre pequeno">
                      <span>
                        {r.feitas} de {r.entregas.length} entregas concluídas
                      </span>
                      <span className={`forte ${r.atrasadas ? 'perigo' : 'bom'}`}>{r.atrasadas ? `${r.atrasadas} atrasada${r.atrasadas > 1 ? 's' : ''}` : 'Em dia'}</span>
                    </span>
                    <span className="fila entre">
                      <Avatares pessoas={r.pessoas} />
                      <span className="pequeno suave">
                        {D.fmtMin(r.minutos)}
                        {Number(p.horas_vendidas) ? ` de ${Number(p.horas_vendidas)}h vendidas` : ' lançadas'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
      {app.gestor && (
        <section className="cartao pilha">
          <h2>Cadastrar projeto</h2>
          <div className="grade">
            <label className="campo" htmlFor="np-cliente">
              <span>Cliente do projeto</span>
              <select id="np-cliente" className="entrada" value={clienteEscolhido} onChange={(e) => setNovo({ ...novo, cliente_id: e.target.value })}>
                {app.dados.clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo" htmlFor="np-codigo">
              <span>Código</span>
              <input id="np-codigo" className="entrada" value={novo.codigo} onChange={(e) => setNovo({ ...novo, codigo: e.target.value })} placeholder="2026_000" />
            </label>
            <label className="campo" htmlFor="np-nome">
              <span>Nome do projeto</span>
              <input id="np-nome" className="entrada" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            </label>
            <label className="campo" htmlFor="np-linha">
              <span>Linha de serviço</span>
              <input id="np-linha" className="entrada" value={novo.linha} onChange={(e) => setNovo({ ...novo, linha: e.target.value })} placeholder="Redes e Mídia" />
            </label>
            <label className="campo" htmlFor="np-horas">
              <span>Horas vendidas</span>
              <input id="np-horas" className="entrada" type="number" min="0" value={novo.horas_vendidas} onChange={(e) => setNovo({ ...novo, horas_vendidas: e.target.value })} />
            </label>
            {equipes.length > 0 && (
              <SeletorEquipe id="np-equipe" equipes={equipes} valor={novo.equipe_id} aoMudar={(equipe_id) => setNovo({ ...novo, equipe_id })} desabilitado={criandoProjeto} />
            )}
          </div>
          <div>
            <button className="botao primario" disabled={criandoProjeto || !clienteEscolhido || !novo.codigo.trim() || !novo.nome.trim()} onClick={criarProjeto}>
              Criar projeto
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function NovaEntrega({ app, projeto, aoFechar }) {
  const [f, setF] = useState({ titulo: '', briefing: '', link_drive: '', prazo: '', horas_estimadas: '', fluxo: 'cda', quem: app.eu.id })
  const montada = useRef(false)
  const [criando, setCriando] = useState(false)
  useEffect(() => {
    montada.current = true
    return () => { montada.current = false }
  }, [])
  const muda = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const criar = async () => {
    if (criando) return
    setCriando(true)
    const entrega = await app.agir(`Criar entrega "${f.titulo}"`, () => D.criarEntrega({ ...f, titulo: f.titulo.trim(), projeto_id: projeto.id, euId: app.eu.id }))
    if (!montada.current) return
    setCriando(false)
    if (entrega) {
      aoFechar()
      app.abrir(entrega.id)
    }
  }
  return (
    <section className="cartao pilha">
      <h2>Nova entrega</h2>
      <label className="campo" htmlFor="ne-titulo">
        <span>O que precisa ser feito</span>
        <input id="ne-titulo" className="entrada" value={f.titulo} onChange={muda('titulo')} placeholder="Ex.: Post de lançamento do produto" />
      </label>
      <label className="campo" htmlFor="ne-briefing">
        <span>Briefing</span>
        <textarea id="ne-briefing" className="entrada" value={f.briefing} onChange={muda('briefing')} />
      </label>
      <div className="grade">
        <label className="campo" htmlFor="ne-fluxo">
          <span>Etapas da entrega</span>
          <select id="ne-fluxo" className="entrada" value={f.fluxo} onChange={muda('fluxo')}>
            {D.FLUXOS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo" htmlFor="ne-quem">
          <span>Quem começa</span>
          <select id="ne-quem" className="entrada" value={f.quem} onChange={muda('quem')}>
            {app.dados.pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo" htmlFor="ne-prazo">
          <span>Para quando</span>
          <input id="ne-prazo" className="entrada" type="date" value={f.prazo} onChange={muda('prazo')} />
        </label>
        <label className="campo" htmlFor="ne-horas">
          <span>Horas estimadas</span>
          <input id="ne-horas" className="entrada" type="number" min="0" value={f.horas_estimadas} onChange={muda('horas_estimadas')} />
        </label>
      </div>
      <label className="campo" htmlFor="ne-link">
        <span>Link dos insumos (Google Drive)</span>
        <input id="ne-link" className="entrada" value={f.link_drive} onChange={muda('link_drive')} placeholder="Cole o link da pasta" />
      </label>
      <div className="fila">
        <button className="botao primario" disabled={!f.titulo.trim() || criando} onClick={criar}>
          Criar entrega
        </button>
        <button className="botao" onClick={aoFechar}>
          Cancelar
        </button>
      </div>
    </section>
  )
}

export function Projeto({ app, projetoId }) {
  const [visao, setVisao] = useState('lista')
  const [criando, setCriando] = useState(false)
  const projeto = app.m.projetoPorId[projetoId]
  if (!projeto) {
    return (
      <div className="cartao pilha">
        <p>Projeto não encontrado.</p>
        <div>
          <button className="botao" onClick={() => app.ir('projetos')}>
            Voltar para projetos
          </button>
        </div>
      </div>
    )
  }
  const cliente = app.m.clientePorId[projeto.cliente_id]
  const r = resumoProjeto(app, projeto)
  const horasProjeto = app.dados.horas.filter((h) => h.projeto_id === projeto.id && h.fim)
  const porTipo = D.TIPOS.map((t) => ({ ...t, minutos: horasProjeto.filter((h) => h.tipo === t.id).reduce((a, h) => a + h.minutos, 0) }))
  const mudarStatus = (e, v) => app.agir(`Mudar status de "${e.titulo}" para ${v}`, () => D.atualizarEntrega(e.id, { status: v }))
  return (
    <div className="pilha larga">
      <div className="pilha">
        <div>
          <button className="botao texto" onClick={() => app.ir('projetos')}>
            Voltar para projetos
          </button>
        </div>
        <div className="fila entre fim">
          <div className="pilha minima">
            <p className="pequeno suave">
              {projeto.codigo}
              {cliente ? `, ${cliente.nome}` : ''}
              {projeto.linha ? `, ${projeto.linha}` : ''}
            </p>
            <h1>{projeto.nome}</h1>
          </div>
          <div className="fila" role="group" aria-label="Visualização das entregas">
            <button className={`botao ${visao === 'lista' ? 'escuro' : ''}`} aria-pressed={visao === 'lista'} onClick={() => setVisao('lista')}>
              Lista
            </button>
            <button className={`botao ${visao === 'quadro' ? 'escuro' : ''}`} aria-pressed={visao === 'quadro'} onClick={() => setVisao('quadro')}>
              Quadro
            </button>
            <button className="botao primario" aria-expanded={criando} onClick={() => setCriando(true)}>
              Nova entrega
            </button>
          </div>
        </div>
        <IndicadoresProjeto resumo={r} vendidas={Number(projeto.horas_vendidas)} porTipo={porTipo} />
        <PastaDrive app={app} projeto={projeto} />
      </div>
      {criando && <NovaEntrega app={app} projeto={projeto} aoFechar={() => setCriando(false)} />}
      <div className="projeto-corpo">
        <div className="projeto-entregas pilha">
          {r.entregas.length === 0 && !criando && <p className="cartao">Nenhuma entrega neste projeto ainda. Use "Nova entrega" para começar.</p>}
          {visao === 'lista' && D.STATUS.map((s) => {
            const lista = r.entregas.filter((e) => e.status === s.id)
            if (!lista.length) return null
            const estimado = lista.reduce((a, e) => a + Number(e.horas_estimadas || 0), 0)
            return (
              <details key={s.id} className="cartao grupo-entregas" open>
                <summary>
                  <Etiqueta status={s.id} />
                  <span className="pequeno suave grupo-total">
                    {lista.length === 1 ? '1 entrega' : `${lista.length} entregas`}, {D.fmtMin(lista.reduce((a, e) => a + e.minutos, 0))} lançadas
                    {estimado ? ` de ${estimado}h` : ''}
                  </span>
                </summary>
                <div className="linha-projeto colunas-entregas pequeno forte suave" aria-hidden="true">
                  <span>Entrega</span><span>Quem</span><span>Prazo</span><span>Status</span>
                </div>
                {lista.map((e) => (
                  <LinhaEntrega key={e.id} app={app} entrega={e} comProjeto={false} />
                ))}
              </details>
            )
          })}
          {visao === 'quadro' && (
            <div className="quadro-rolagem">
              <div className="quadro">
                {D.STATUS.map((s) => {
                  const lista = r.entregas.filter((e) => e.status === s.id)
                  return (
                    <div key={s.id} className="coluna">
                      <div className={`coluna-topo status-${s.id}`}>
                        <span>{s.nome}</span>
                        <span>{lista.length}</span>
                      </div>
                      {lista.map((e) => (
                        <div key={e.id} className={`cartao-quadro${app.entregaId === e.id ? ' entrega-selecionada' : ''}`}>
                          <button className="linha-titulo" aria-expanded={app.entregaId === e.id} onClick={() => app.abrir(e.id)}>
                            <strong>{e.titulo}</strong>
                            <span>{textoEtapa(e, app.m.pessoaPorId)}</span>
                          </button>
                          <div className="fila entre">
                            <Avatares pessoas={e.responsaveis} />
                            <span className={`pequeno ${e.atrasada ? 'perigo forte' : 'suave'}`}>{textoPrazo(e)}</span>
                          </div>
                          <SeletorStatus valor={e.status} aoMudar={(v) => mudarStatus(e, v)} rotulo="Mover entrega para" neutro />
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <PaineisProjeto app={app} projetoId={projeto.id} entregas={r.entregas} horas={horasProjeto} />
      </div>
    </div>
  )
}

export function Equipe({ app }) {
  const [convites, setConvites] = useState([])
  const [relatos, setRelatos] = useState([])
  const [novo, setNovo] = useState({ email: '', nome: '', area: D.AREAS[0], perfil: 'membro' })
  const buscar = async () => {
    try {
      const [c, r] = await Promise.all([D.listarConvites(), D.listarRelatos()])
      setConvites(c)
      setRelatos(r)
    } catch (e) {
      app.avisar(`Não deu para carregar convites e relatos: ${e.message}`, true)
    }
  }
  useEffect(() => {
    buscar()
  }, [])
  const mes = D.hoje().slice(0, 7)
  const convidar = async () => {
    const feito = await app.agir(`Convidar ${novo.email}`, () => D.convidar(novo))
    if (feito !== undefined) {
      setNovo({ email: '', nome: '', area: D.AREAS[0], perfil: 'membro' })
      buscar()
    }
  }
  const entrou = (email) => app.dados.pessoas.some((p) => p.email === email)
  return (
    <div className="pilha larga">
      <div>
        <h1>Equipe e piloto</h1>
        <p className="suave">Quem já entrou, quem está convidado e os relatos enviados pelos testadores.</p>
      </div>
      {app.gestor && <CadastroEquipes app={app} />}
      <section className="cartao">
        <h2>Pessoas e horas do mês</h2>
        {app.dados.pessoas.map((p) => {
          const minutos = app.dados.horas.filter((h) => h.pessoa_id === p.id && h.fim && D.dataLocal(new Date(h.inicio)).slice(0, 7) === mes).reduce((a, h) => a + h.minutos, 0)
          const abertas = app.m.entregas.filter((e) => e.status !== 'concluido' && e.responsaveis.some((x) => x.id === p.id)).length
          return (
            <div key={p.id} className="linha">
              <Avatares pessoas={[p]} />
              <span className="cresce">
                <strong className="nome-linha">{p.nome}</strong>
                <span className="pequeno suave">
                  {p.area}, {(D.PERFIS.find((x) => x.id === p.perfil) || {}).nome}
                </span>
              </span>
              <span className="pequeno suave">{abertas === 1 ? '1 entrega aberta' : `${abertas} entregas abertas`}</span>
              <span className="forte">
                {D.fmtMin(minutos)} de {p.capacidade_mensal}h
              </span>
            </div>
          )
        })}
      </section>
      <section className="cartao pilha">
        <h2>Convites</h2>
        <p className="pequeno suave">Só quem está nesta lista consegue criar a conta. A pessoa usa "Primeiro acesso" na tela de entrada.</p>
        {convites.map((c) => (
          <div key={c.email} className="linha">
            <span className="cresce">
              <strong className="nome-linha">{c.nome}</strong>
              <span className="pequeno suave">
                {c.email}, {c.area}, {(D.PERFIS.find((x) => x.id === c.perfil) || {}).nome}
              </span>
            </span>
            <span className={`pequeno forte ${entrou(c.email) ? 'bom' : 'suave'}`}>{entrou(c.email) ? 'Já entrou' : 'Ainda não entrou'}</span>
            {!entrou(c.email) && (
              <button
                className="botao pequeno"
                onClick={async () => {
                  await app.agir(`Remover convite de ${c.email}`, () => D.removerConvite(c.email))
                  buscar()
                }}
              >
                Remover
              </button>
            )}
          </div>
        ))}
        <div className="grade">
          <label className="campo" htmlFor="cv-email">
            <span>E-mail</span>
            <input id="cv-email" className="entrada" type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          </label>
          <label className="campo" htmlFor="cv-nome">
            <span>Nome</span>
            <input id="cv-nome" className="entrada" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          </label>
          <label className="campo" htmlFor="cv-area">
            <span>Área</span>
            <select id="cv-area" className="entrada" value={novo.area} onChange={(e) => setNovo({ ...novo, area: e.target.value })}>
              {D.AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="campo" htmlFor="cv-perfil">
            <span>Perfil</span>
            <select id="cv-perfil" className="entrada" value={novo.perfil} onChange={(e) => setNovo({ ...novo, perfil: e.target.value })}>
              {D.PERFIS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <button className="botao primario" disabled={!novo.email.includes('@') || !novo.nome.trim()} onClick={convidar}>
            Convidar
          </button>
        </div>
      </section>
      <section className="cartao pilha">
        <div className="fila entre">
          <h2>Relatos dos testadores</h2>
          <button className="botao pequeno" onClick={buscar}>
            Atualizar
          </button>
        </div>
        {relatos.length === 0 && <p className="suave">Nenhum relato enviado ainda.</p>}
        {relatos.map((r) => {
          const autor = app.m.pessoaPorId[r.autor_id]
          return (
            <div key={r.id} className="linha topo-alinhado">
              <div className="cresce pilha minima">
                <span className="pequeno suave">
                  {r.tipo === 'bug' ? 'Bug' : 'Melhoria'}, {autor ? autor.nome : 'alguém'}, {new Date(r.criado_em).toLocaleString('pt-BR')}
                </span>
                <span className="texto-livre">{r.descricao}</span>
                <details>
                  <summary className="pequeno">Ver contexto</summary>
                  <pre className="contexto">{JSON.stringify(r.contexto, null, 2)}</pre>
                </details>
              </div>
              <button
                className="botao pequeno"
                onClick={async () => {
                  await app.agir('Marcar relato', () => D.marcarRelato(r.id, !r.resolvido))
                  buscar()
                }}
              >
                {r.resolvido ? 'Reabrir' : 'Marcar como resolvido'}
              </button>
            </div>
          )
        })}
      </section>
    </div>
  )
}

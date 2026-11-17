import { useEffect, useState } from 'react'
import { fmtData, importarGoogle } from './dados'
import { conectarGoogle, googleConfigurado, listarColecoesGoogle, listarItensGoogle, prepararGoogle } from './google-api'

export default function Google({ app }) {
  const { agir } = app
  const [oauth, setOauth] = useState(null)
  const [sessao, setSessao] = useState(null)
  const [conectando, setConectando] = useState(false)
  const [origem, setOrigem] = useState('agenda')
  const [colecao, setColecao] = useState('')
  const [projeto, setProjeto] = useState('')
  const [sincronizando, setSincronizando] = useState(false)
  const [total, setTotal] = useState(0)
  const [previa, setPrevia] = useState(null)
  const [erro, setErro] = useState('')
  const projetos = app.dados.projetos.filter((p) => p.ativo)

  useEffect(() => {
    if (!googleConfigurado) return undefined
    let ativo = true
    prepararGoogle().then((cliente) => { if (ativo) setOauth(cliente) }).catch((e) => { if (ativo) setErro(e.message) })
    return () => { ativo = false }
  }, [])

  const conectar = async () => {
    if (!oauth) {
      setErro('')
      try { setOauth(await prepararGoogle()) } catch (e) { setErro(e.message) }
      return
    }
    setConectando(true)
    setErro('')
    try {
      const autorizacao = await conectarGoogle(oauth)
      const colecoes = await listarColecoesGoogle(autorizacao.token)
      setSessao({ ...autorizacao, colecoes })
    } catch (e) {
      setErro(e.message)
    } finally {
      setConectando(false)
    }
  }

  useEffect(() => {
    if (!sessao) return undefined
    const timer = setTimeout(() => {
      setSincronizando(false)
      setSessao(null)
      setColecao('')
      setPrevia(null)
      setErro('A conexão com o Google expirou. Conecte a conta novamente.')
    }, Math.max(0, sessao.expiraEm - Date.now()))
    return () => clearTimeout(timer)
  }, [sessao])

  useEffect(() => {
    if (!sessao || !sincronizando) return undefined
    const cancelamento = new AbortController()
    const vistos = new Set()
    let ocupado = false
    const sincronizar = async () => {
      if (ocupado || Date.now() >= sessao.expiraEm) return
      ocupado = true
      const { signal } = cancelamento
      try {
        const itens = await listarItensGoogle(origem, colecao, sessao.token, signal)
        if (signal.aborted) return
        setPrevia(itens)
        const novos = itens.filter(({ id }) => !vistos.has(id))
        let importados = 0
        if (novos.length) {
          const resultado = await agir('Importar entregas do Google', async () => {
            for (let inicio = 0; inicio < novos.length && !signal.aborted; inicio += 100) {
              const lote = novos.slice(inicio, inicio + 100)
              importados += await importarGoogle(projeto, origem, colecao, lote)
              lote.forEach(({ id }) => vistos.add(id))
            }
          })
          if (signal.aborted) return
          setTotal((atual) => atual + importados)
          if (resultado === undefined) throw new Error('Parte da sincronização falhou. Confira o aviso e tente novamente.')
        }
        setErro('')
      } catch (e) {
        if (!signal.aborted) {
          setErro(e.message)
          if (e.expirado) {
            setSincronizando(false)
            setSessao(null)
            setColecao('')
            setPrevia(null)
          }
        }
      } finally {
        ocupado = false
      }
    }
    sincronizar()
    const timer = setInterval(sincronizar, 60000)
    return () => { cancelamento.abort(); clearInterval(timer) }
  }, [agir, colecao, origem, projeto, sessao, sincronizando])

  return (
    <div className="pilha larga">
      <h1>Google Agenda e Tasks</h1>
      {!googleConfigurado ? <p className="cartao">A integração Google ainda precisa ser habilitada neste ambiente.</p> : (
        <section className="cartao pilha">
          <h2>Importar entregas</h2>
          <p className="suave">Selecione um projeto e uma agenda ou lista do Google. Itens com <strong>[Air]</strong> no início do título entram como novas entregas. A sincronização roda a cada minuto enquanto esta tela estiver aberta e a autorização for válida.</p>
          {!sessao ? (
            <div><button type="button" className="botao primario" disabled={conectando || (!oauth && !erro)} onClick={conectar}>{oauth ? 'Conectar conta Google' : erro ? 'Tentar carregar Google' : 'Carregando autorização…'}</button></div>
          ) : (
            <>
              <div className="grade">
                <label className="campo"><span>Projeto de destino</span><select className="entrada" disabled={sincronizando} value={projeto} onChange={(ev) => setProjeto(ev.target.value)}>
                  <option value="">Selecione um projeto</option>
                  {projetos.map((p) => <option value={p.id} key={p.id}>{p.codigo} · {p.nome}</option>)}
                </select></label>
                <label className="campo"><span>Origem</span><select className="entrada" disabled={sincronizando} value={origem} onChange={(ev) => { setOrigem(ev.target.value); setColecao(''); setPrevia(null) }}>
                  <option value="agenda">Google Agenda</option><option value="tasks">Google Tasks</option>
                </select></label>
                <label className="campo"><span>{origem === 'agenda' ? 'Agenda' : 'Lista de tarefas'}</span><select className="entrada" disabled={sincronizando} value={colecao} onChange={(ev) => { setColecao(ev.target.value); setPrevia(null) }}>
                  <option value="">Selecione</option>
                  {sessao.colecoes[origem].map(({ id, nome }) => <option value={id} key={id}>{nome}</option>)}
                </select></label>
              </div>
              <p className="pequeno suave">{origem === 'agenda' ? 'São consultados os próximos 90 dias.' : 'São consultadas as tarefas em aberto da lista.'}</p>
              <div className="fila">
                {sincronizando ? (
                  <button className="botao" onClick={() => setSincronizando(false)}>Parar sincronização</button>
                ) : (
                  <button className="botao primario" disabled={!colecao || !projetos.some((p) => p.id === projeto)} onClick={() => { setTotal(0); setPrevia(null); setSincronizando(true) }}>Iniciar sincronização</button>
                )}
                <button className="botao" onClick={() => { setSincronizando(false); setSessao(null); setColecao(''); setPrevia(null); setErro('') }}>Desconectar Google</button>
              </div>
              {sincronizando && <p role="status">Sincronização ativa. {total} {total === 1 ? 'entrega importada' : 'entregas importadas'} nesta sessão.</p>}
            </>
          )}
          {erro && <p role="alert" className="perigo">{erro}</p>}
          {previa && <p className="pequeno suave">{previa.length ? `${previa.length} itens com [Air] na origem.` : 'Nenhum item elegível na origem selecionada.'}</p>}
          {previa?.length > 0 && <ul className="itens-painel">{previa.slice(0, 8).map((item) => <li key={item.id} className="linha"><strong className="cresce texto-livre">{item.titulo}</strong><span className="pequeno suave">{item.prazo ? fmtData(item.prazo) : 'Sem prazo'}</span></li>)}</ul>}
        </section>
      )}
    </div>
  )
}

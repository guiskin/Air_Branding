import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, configurado, urlRelatos } from './supabase'
import * as D from './dados'
import { relogio } from './pecas'
import { MeuDia, Projetos, Projeto, Equipe } from './telas'
import Painel from './Painel'

const versao = typeof __VERSAO__ === 'string' ? __VERSAO__ : 'local'

class Barreira extends Component {
  state = { erro: null }
  static getDerivedStateFromError(erro) {
    return { erro }
  }
  componentDidCatch(erro) {
    this.props.aoFalhar(`Tela quebrou: ${erro.message}`)
  }
  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="cartao pilha">
        <h2>Esta tela encontrou um erro</h2>
        <p className="suave">O erro já está anotado. Envie um relato para sabermos o que você estava fazendo.</p>
        <div className="fila">
          <button className="botao primario" onClick={this.props.aoRelatar}>
            Reportar o erro
          </button>
          <button className="botao" onClick={() => this.setState({ erro: null })}>
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }
}

function Login() {
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const enviar = async (ev) => {
    ev.preventDefault()
    setMsg('')
    setOcupado(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
        if (error) setMsg(/confirm/i.test(error.message) ? 'Confirme seu e-mail pelo link que enviamos e tente de novo.' : 'E-mail ou senha incorretos.')
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha })
        if (error) {
          setMsg(
            /database error|convidado/i.test(error.message)
              ? 'Este e-mail não está na lista de convidados do piloto. Peça o convite a quem coordena o teste.'
              : /already|registered/i.test(error.message)
                ? 'Este e-mail já tem conta. Use "Já tenho conta".'
                : `Não deu para criar a conta: ${error.message}`,
          )
        } else if (!data.session) {
          setMsg('Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.')
          setModo('entrar')
        }
      }
    } catch (e) {
      setMsg(`Sem conexão com o servidor: ${e.message}`)
    } finally {
      setOcupado(false)
    }
  }
  return (
    <div className="centro">
      <form className="cartao pilha" onSubmit={enviar} style={{ gap: 16 }}>
        <div>
          <div className="marca" style={{ marginBottom: 8 }}><span className="logo">air</span></div>
          <h1 style={{ fontSize: 32 }}>Gestor de Projetos</h1>
          <p className="suave">Piloto de testes. Entre com o e-mail que recebeu o convite.</p>
        </div>
        <label className="campo" htmlFor="lg-email">
          <span>E-mail</span>
          <input id="lg-email" className="entrada" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="campo" htmlFor="lg-senha">
          <span>{modo === 'entrar' ? 'Senha' : 'Crie uma senha (mínimo de 6 caracteres)'}</span>
          <input
            id="lg-senha"
            className="entrada"
            type="password"
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {msg && (
          <p role="alert" className="pequeno forte perigo">
            {msg}
          </p>
        )}
        <button className="botao primario" type="submit" disabled={ocupado}>
          {modo === 'entrar' ? 'Entrar' : 'Criar minha conta'}
        </button>
        <button
          type="button"
          className="botao texto"
          style={{ minHeight: 44 }}
          onClick={() => {
            setModo(modo === 'entrar' ? 'criar' : 'entrar')
            setMsg('')
          }}
        >
          {modo === 'entrar' ? 'Primeiro acesso? Criar minha conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  )
}

function textoRelato(tipo, descricao, contexto) {
  return [
    `${tipo === 'bug' ? 'BUG' : 'MELHORIA'}: ${descricao}`,
    '',
    `Quem: ${contexto.quem} (${contexto.area}, ${contexto.perfil})`,
    `Tela: ${contexto.tela}${contexto.projeto ? `, projeto ${contexto.projeto}` : ''}${contexto.entrega ? `, entrega "${contexto.entrega}"` : ''}`,
    `Último erro: ${contexto.ultimoErro || 'nenhum'}`,
    `Últimos cliques: ${contexto.acoes.join(' > ') || 'nenhum'}`,
    `Quando: ${contexto.quando}`,
    `Navegador: ${contexto.navegador}`,
    `Janela: ${contexto.janela}, versão ${contexto.versao}`,
  ].join('\n')
}

function Relato({ contexto, aoFechar, aoEnviar }) {
  const [tipo, setTipo] = useState(contexto.ultimoErro ? 'bug' : 'melhoria')
  const [descricao, setDescricao] = useState('')
  const [estado, setEstado] = useState('editando')
  const [copiado, setCopiado] = useState(false)
  const texto = textoRelato(tipo, descricao.trim(), contexto)
  const enviar = async () => {
    setEstado('enviando')
    try {
      await aoEnviar({ tipo, descricao: descricao.trim(), contexto })
      setEstado('enviado')
    } catch (e) {
      setEstado('falhou')
    }
  }
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch (e) {
      setCopiado(false)
    }
  }
  return (
    <div className="veu" role="dialog" aria-modal="true" aria-label="Reportar bug ou sugerir melhoria">
      <div className="janela">
        <div className="fila entre">
          <h2>Reportar bug ou sugerir melhoria</h2>
          <button className="botao pequeno" onClick={aoFechar}>
            Fechar
          </button>
        </div>
        {estado === 'enviado' ? (
          <p className="forte bom">Relato enviado. Obrigado por ajudar no teste.</p>
        ) : (
          <>
            <div className="pilulas" role="group" aria-label="Tipo de relato">
              {[
                ['bug', 'Encontrei um erro'],
                ['melhoria', 'Tenho uma sugestão'],
              ].map(([id, nome]) => (
                <button key={id} className={`botao ${tipo === id ? 'escuro' : ''}`} aria-pressed={tipo === id} onClick={() => setTipo(id)}>
                  {nome}
                </button>
              ))}
            </div>
            <label className="campo" htmlFor="rl-descricao">
              <span>{tipo === 'bug' ? 'O que você tentou fazer e o que aconteceu?' : 'O que facilitaria seu dia a dia?'}</span>
              <textarea id="rl-descricao" className="entrada" style={{ minHeight: 120 }} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </label>
            <p className="pequeno suave">Vão junto, automaticamente: a tela em que você está, a entrega aberta, seus últimos cliques, o último erro e o navegador.</p>
            {estado === 'falhou' && (
              <p role="alert" className="pequeno forte perigo">
                Não deu para gravar o relato. Copie o texto abaixo e envie para quem coordena o teste.
              </p>
            )}
            <div className="fila">
              <button className="botao primario" disabled={!descricao.trim() || estado === 'enviando'} onClick={enviar}>
                Enviar relato
              </button>
            </div>
          </>
        )}
        <details>
          <summary className="pequeno">Ver ou copiar o texto do relato</summary>
          <div className="pilha">
            <pre className="contexto">{texto}</pre>
            <div className="fila">
              <button className="botao pequeno" onClick={copiar}>
                {copiado ? 'Copiado' : 'Copiar texto'}
              </button>
              {urlRelatos && (
                <a href={urlRelatos} target="_blank" rel="noopener noreferrer">
                  Abrir o formulário do ClickUp
                </a>
              )}
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

function Sistema({ sessao }) {
  const [dados, setDados] = useState(null)
  const [falha, setFalha] = useState('')
  const [tela, setTela] = useState('dia')
  const [projetoId, setProjetoId] = useState(null)
  const [aberta, setAberta] = useState(null)
  const [tipo, setTipo] = useState('producao')
  const [aviso, setAviso] = useState(null)
  const [relatando, setRelatando] = useState(false)
  const [, setTique] = useState(0)
  const acoes = useRef([])
  const ultimoErro = useRef('')
  const euId = sessao.user.id

  const registrar = useCallback((rotulo) => {
    acoes.current = [...acoes.current, rotulo].slice(-15)
  }, [])

  const avisar = useCallback((texto, erro = false) => {
    if (erro) ultimoErro.current = texto
    setAviso({ texto, erro })
  }, [])

  const recarregar = useCallback(async () => {
    try {
      setDados(await D.carregar())
      setFalha('')
    } catch (e) {
      setFalha(e.message)
    }
  }, [])

  useEffect(() => {
    recarregar()
    let espera = null
    const agendar = () => {
      clearTimeout(espera)
      espera = setTimeout(recarregar, 400)
    }
    const canal = supabase.channel('mudancas').on('postgres_changes', { event: '*', schema: 'public' }, agendar).subscribe()
    const periodico = setInterval(recarregar, 60000)
    return () => {
      clearTimeout(espera)
      clearInterval(periodico)
      supabase.removeChannel(canal)
    }
  }, [recarregar])

  useEffect(() => {
    const aoErro = (ev) => {
      ultimoErro.current = `Erro na página: ${ev.message || (ev.reason && ev.reason.message) || 'desconhecido'}`
      setAviso({ texto: 'Algo deu errado nesta tela.', erro: true })
    }
    window.addEventListener('error', aoErro)
    window.addEventListener('unhandledrejection', aoErro)
    return () => {
      window.removeEventListener('error', aoErro)
      window.removeEventListener('unhandledrejection', aoErro)
    }
  }, [])

  useEffect(() => {
    if (!aviso || aviso.erro) return undefined
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  const m = useMemo(() => (dados ? D.montar(dados, euId) : null), [dados, euId])
  const temTimer = Boolean(m && m.timer)

  useEffect(() => {
    if (!temTimer) return undefined
    const t = setInterval(() => setTique((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [temTimer])

  const agir = useCallback(
    async (rotulo, fn) => {
      registrar(rotulo)
      try {
        const r = await fn()
        await recarregar()
        return r === undefined ? null : r
      } catch (e) {
        avisar(`Não deu certo (${rotulo}): ${e.message}`, true)
        return undefined
      }
    },
    [registrar, recarregar, avisar],
  )

  if (falha && !dados) {
    return (
      <div className="centro">
        <div className="cartao pilha">
          <h2>Não deu para carregar os dados</h2>
          <p className="suave">{falha}</p>
          <div className="fila">
            <button className="botao primario" onClick={recarregar}>
              Tentar de novo
            </button>
            <button className="botao" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (!dados) {
    return (
      <div className="centro">
        <p className="suave">Carregando…</p>
      </div>
    )
  }
  const eu = m.pessoaPorId[euId]
  if (!eu) {
    return (
      <div className="centro">
        <div className="cartao pilha">
          <h2>Seu acesso ainda não foi liberado</h2>
          <p className="suave">A conta {sessao.user.email} não está na lista de pessoas do piloto. Fale com quem coordena o teste.</p>
          <div>
            <button className="botao" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </div>
        </div>
      </div>
    )
  }

  const gestor = eu.perfil === 'admin' || eu.perfil === 'coordenacao'
  const ir = (destino, id = null) => {
    registrar(`Abrir tela ${destino}`)
    setTela(destino)
    if (destino === 'projeto') setProjetoId(id)
  }
  const abrir = (id) => {
    if (id) registrar('Abrir entrega')
    setAberta(id)
  }
  const app = { dados, m, eu, gestor, agir, ir, abrir, tipo, setTipo, avisar }
  const entregaAberta = aberta ? m.entregas.find((e) => e.id === aberta) : null
  const timerEntrega = m.timer && m.timer.entrega_id ? m.entregas.find((e) => e.id === m.timer.entrega_id) : null
  const timerProjeto = m.timer ? m.projetoPorId[m.timer.projeto_id] : null
  const projetoAtual = tela === 'projeto' ? m.projetoPorId[projetoId] : null
  const contexto = {
    quem: eu.nome,
    area: eu.area,
    perfil: eu.perfil,
    tela,
    projeto: projetoAtual ? `${projetoAtual.codigo} ${projetoAtual.nome}` : '',
    entrega: entregaAberta ? entregaAberta.titulo : '',
    acoes: acoes.current,
    ultimoErro: ultimoErro.current,
    quando: new Date().toLocaleString('pt-BR'),
    navegador: navigator.userAgent,
    janela: `${window.innerWidth}x${window.innerHeight}`,
    versao,
  }
  const navs = [
    ['dia', 'Meu dia'],
    ['projetos', 'Projetos'],
  ]
  if (gestor) navs.push(['equipe', 'Equipe e piloto'])

  return (
    <>
      <header className="topo">
        <div className="topo-dentro">
          <div>
            <div className="marca"><span className="logo">air</span>Gestor de Projetos</div>
            <div className="pequeno suave">
              Piloto de testes, {eu.nome}
            </div>
          </div>
          <nav className="nav" aria-label="Navegação principal">
            {navs.map(([id, nome]) => (
              <button key={id} className={`botao nav ${tela === id || (id === 'projetos' && tela === 'projeto') ? 'ativo' : ''}`} onClick={() => ir(id)}>
                {nome}
              </button>
            ))}
            <button className="botao primario" onClick={() => setRelatando(true)}>
              Reportar bug ou ideia
            </button>
            <button className="botao" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </nav>
        </div>
      </header>
      {m.timer && (
        <div className="timer">
          <div className="timer-dentro">
            <div>
              <div className="forte">Timer rodando: {timerEntrega ? timerEntrega.titulo : `hora sem tarefa em ${timerProjeto ? timerProjeto.nome : 'projeto'}`}</div>
              <div className="pequeno suave">Tipo de hora: {D.tipoPorId(m.timer.tipo).nome}</div>
            </div>
            <div className="fila">
              <span className="relogio">{relogio(m.timer.inicio)}</span>
              <button className="botao claro" onClick={() => agir('Parar timer', () => D.pararTimer(m.timer))}>
                Parar e lançar
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="conteudo">
        {falha && (
          <p role="alert" className="cartao pequeno forte perigo" style={{ marginBottom: 20 }}>
            Sem conexão com o servidor no momento. Os dados na tela podem estar desatualizados.
          </p>
        )}
        <div className="colunas">
          <div className="principal">
            <Barreira key={tela + (projetoId || '')} aoFalhar={(t) => (ultimoErro.current = t)} aoRelatar={() => setRelatando(true)}>
              {tela === 'dia' && <MeuDia app={app} />}
              {tela === 'projetos' && <Projetos app={app} />}
              {tela === 'projeto' && <Projeto app={app} projetoId={projetoId} />}
              {tela === 'equipe' && gestor && <Equipe app={app} />}
            </Barreira>
          </div>
          {entregaAberta && (
            <div className="lateral">
              <Barreira key={entregaAberta.id} aoFalhar={(t) => (ultimoErro.current = t)} aoRelatar={() => setRelatando(true)}>
                <Painel app={app} entrega={entregaAberta} />
              </Barreira>
            </div>
          )}
        </div>
      </main>
      {aviso && (
        <div className={`aviso ${aviso.erro ? 'erro' : ''}`} role="status">
          <div>
            <span>{aviso.texto}</span>
            {aviso.erro && (
              <button
                className="botao claro pequeno"
                onClick={() => {
                  setAviso(null)
                  setRelatando(true)
                }}
              >
                Reportar
              </button>
            )}
            <button className="botao claro pequeno" onClick={() => setAviso(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
      {relatando && <Relato contexto={contexto} aoFechar={() => setRelatando(false)} aoEnviar={(r) => D.enviarRelato(r)} />}
    </>
  )
}

export default function App() {
  const [sessao, setSessao] = useState(undefined)
  useEffect(() => {
    if (!configurado) return undefined
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!configurado) {
    return (
      <div className="centro">
        <div className="cartao pilha">
          <h2>Falta configurar o banco</h2>
          <p className="suave">Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente e publique de novo. O passo a passo está no README.</p>
        </div>
      </div>
    )
  }
  if (sessao === undefined) {
    return (
      <div className="centro">
        <p className="suave">Carregando…</p>
      </div>
    )
  }
  if (!sessao) return <Login />
  return <Sistema key={sessao.user.id} sessao={sessao} />
}

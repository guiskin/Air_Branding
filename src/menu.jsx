import { useEffect, useRef, useState } from 'react'
import { Avatar } from './pecas'

export function Icone({ nome }) {
  const desenhos = {
    sol: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    lua: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    seta: <path d="M9 6l6 6-6 6" />,
  }
  return (
    <svg className="icone" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {desenhos[nome]}
    </svg>
  )
}

export function Menu({ app, tela, projetoId, tema, setTema, aberto, fechar, sair }) {
  const { dados, eu, gestor, ir } = app
  const [escolhidos, setEscolhidos] = useState({})
  const no = useRef(null)
  const projetoAtual = tela === 'projeto' ? dados.projetos.find((p) => p.id === projetoId) : null
  const clienteAtual = projetoAtual ? projetoAtual.cliente_id : null
  const expandido = (id) => (id in escolhidos ? escolhidos[id] : id === clienteAtual)
  const itens = [
    ['dia', 'Meu dia'],
    ['projetos', 'Projetos'],
  ]
  if (gestor) itens.push(['equipe', 'Equipe e piloto'])
  const clientes = dados.clientes
    .map((c) => ({ ...c, projetos: dados.projetos.filter((p) => p.cliente_id === c.id && p.ativo) }))
    .filter((c) => c.projetos.length > 0)

  // Gaveta no celular: foco entra no menu, Tab não escapa dele e Esc fecha.
  useEffect(() => {
    if (!aberto) return undefined
    const focaveis = () => [...no.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    const lista = focaveis()
    if (lista.length) lista[0].focus()
    const aoTeclar = (ev) => {
      if (ev.key === 'Escape') {
        fechar(true)
        return
      }
      if (ev.key !== 'Tab') return
      const f = focaveis()
      if (!f.length) return
      const primeiro = f[0]
      const ultimo = f[f.length - 1]
      if (ev.shiftKey && document.activeElement === primeiro) {
        ev.preventDefault()
        ultimo.focus()
      } else if (!ev.shiftKey && document.activeElement === ultimo) {
        ev.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, fechar])

  return (
    <>
      {aberto && <button type="button" className="menu-veu" aria-label="Fechar menu" tabIndex={-1} onClick={() => fechar(true)} />}
      <aside ref={no} id="menu-lateral" className={`menu ${aberto ? 'aberto' : ''}`} aria-label="Menu" role={aberto ? 'dialog' : undefined} aria-modal={aberto ? 'true' : undefined}>
        <div className="menu-marca">
          <img className="logo" src="/logo.jpg" alt="Air" />
          <span>Gestor</span>
        </div>
        <nav aria-label="Navegação principal">
          <ul className="menu-lista">
            {itens.map(([id, nome]) => (
              <li key={id}>
                <button type="button" className={`menu-item ${tela === id ? 'ativo' : ''}`} aria-current={tela === id ? 'page' : undefined} onClick={() => ir(id)}>
                  {nome}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Clientes e projetos">
          <p className="menu-titulo">Clientes</p>
          {clientes.length === 0 && <p className="menu-vazio pequeno suave">Nenhum projeto ativo ainda.</p>}
          <ul className="menu-lista">
            {clientes.map((c) => {
              const aberta = expandido(c.id)
              return (
                <li key={c.id}>
                  <button type="button" className="menu-item cliente" aria-expanded={aberta} onClick={() => setEscolhidos({ ...escolhidos, [c.id]: !aberta })}>
                    <Icone nome="seta" />
                    <span className="menu-nome">{c.nome}</span>
                  </button>
                  {aberta && (
                    <ul className="menu-lista">
                      {c.projetos.map((p) => {
                        const ativo = tela === 'projeto' && projetoId === p.id
                        return (
                          <li key={p.id}>
                            <button type="button" className={`menu-item projeto ${ativo ? 'ativo' : ''}`} aria-current={ativo ? 'page' : undefined} onClick={() => ir('projeto', p.id)}>
                              <span className="menu-nome">{p.nome}</span>
                              <span className="menu-codigo">{p.codigo}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="menu-fim">
          <div className="menu-usuario">
            <Avatar pessoa={eu} />
            <div className="menu-quem">
              <strong>{eu.nome}</strong>
              <span className="pequeno suave">{eu.area}</span>
            </div>
          </div>
          <div className="tema" role="group" aria-label="Aparência do sistema">
            <button type="button" aria-pressed={tema === 'claro'} onClick={() => setTema('claro')}>
              <Icone nome="sol" />
              Claro
            </button>
            <button type="button" aria-pressed={tema === 'escuro'} onClick={() => setTema('escuro')}>
              <Icone nome="lua" />
              Escuro
            </button>
          </div>
          <button type="button" className="botao" onClick={sair}>
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}

export function BarraTopo({ caminho, timer, aoParar, aoReportar, aoAbrirMenu, menuAberto, botaoMenu }) {
  return (
    <header className="barra-topo">
      <button type="button" ref={botaoMenu} className="botao menu-botao" aria-label="Abrir menu" aria-expanded={menuAberto} aria-controls="menu-lateral" onClick={aoAbrirMenu}>
        <Icone nome="menu" />
      </button>
      <nav aria-label="Você está em">
        <ol className="caminho">
          {caminho.map((parte, i) => (
            <li key={i} aria-current={i === caminho.length - 1 ? 'page' : undefined}>
              {parte}
            </li>
          ))}
        </ol>
      </nav>
      <div className="espaco" />
      {timer && (
        <div className="timer-chip">
          <span className="timer-ponto" aria-hidden="true" />
          <span className="timer-texto">
            <strong>{timer.titulo}</strong>
            <span>Timer rodando, {timer.tipo}</span>
          </span>
          <span className="relogio">{timer.relogio}</span>
          <button type="button" className="botao claro pequeno" onClick={aoParar}>
            Parar e lançar
          </button>
        </div>
      )}
      <button type="button" className="botao primario" onClick={aoReportar}>
        Reportar bug ou ideia
      </button>
    </header>
  )
}

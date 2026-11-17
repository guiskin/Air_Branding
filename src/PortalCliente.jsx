import { useEffect, useState } from 'react'
import { concederAcessoCliente, consultarPortal, fmtData, fmtMin, listarAcessosCliente, revogarAcessoCliente } from './dados'
import { Etiqueta } from './pecas'

export default function PortalCliente({ sair }) {
  const [projetos, setProjetos] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    let consultando = false
    const atualizar = async () => {
      if (consultando) return
      consultando = true
      try {
        const resultado = await consultarPortal()
        if (ativo) {
          setProjetos(resultado || [])
          setErro('')
        }
      } catch {
        if (ativo) {
          setProjetos([])
          setErro('Não foi possível carregar os projetos. Recarregue a página para tentar de novo.')
        }
      } finally {
        consultando = false
      }
    }
    atualizar()
    const intervalo = setInterval(atualizar, 30000)
    const aoVoltar = () => { if (!document.hidden) atualizar() }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      ativo = false
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])

  return (
    <main className="portal-cliente pilha larga">
      <header className="fila entre">
        <div className="fila"><img className="logo" src="/logo.jpg" alt="Air" /><h1>Meus projetos</h1></div>
        <button className="botao" onClick={sair}>Sair</button>
      </header>
      {erro && <p role="alert" className="cartao perigo">{erro}</p>}
      {!projetos && <p role="status">Carregando projetos…</p>}
      {projetos?.length === 0 && !erro && <p className="cartao">Nenhum projeto está disponível para esta conta. Confirme seu e-mail e confira o acesso com a equipe do projeto.</p>}
      {projetos?.map((projeto) => (
        <section key={projeto.id} className="cartao pilha" aria-labelledby={`portal-${projeto.id}`}>
          <header>
            <p className="pequeno suave">{projeto.cliente} · {projeto.codigo}</p>
            <h2 id={`portal-${projeto.id}`}>{projeto.nome}</h2>
          </header>
          <p><strong>{fmtMin(Number(projeto.minutos_lancados))}</strong> lançadas{Number(projeto.horas_contratadas) > 0 && ` de ${projeto.horas_contratadas}h contratadas`}</p>
          {projeto.entregas.length === 0 && <p className="suave">Nenhuma entrega publicada.</p>}
          <ul className="itens-painel">
            {projeto.entregas.map((entrega) => (
              <li className="linha" key={entrega.id}>
                <strong className="cresce texto-livre">{entrega.titulo}</strong>
                <Etiqueta status={entrega.status} />
                <span className="pequeno suave">{entrega.prazo ? `Prazo: ${fmtData(entrega.prazo)}` : 'Sem prazo'}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}

export function AcessosCliente({ app, projetoId }) {
  const [aberto, setAberto] = useState(false)
  const [emails, setEmails] = useState([])
  const [email, setEmail] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const atualizar = async () => {
    try {
      setEmails(await listarAcessosCliente(projetoId))
    } catch (e) {
      app.avisar(`Não deu para carregar os acessos: ${e.message}`, true)
    }
  }
  const mudar = async (rotulo, acao) => {
    if (ocupado) return
    setOcupado(true)
    const fez = await app.agir(rotulo, acao)
    if (fez !== undefined) {
      setEmail('')
      await atualizar()
    }
    setOcupado(false)
  }

  return (
    <details className="cartao" onToggle={(ev) => {
      const visivel = ev.currentTarget.open
      setAberto(visivel)
      if (visivel) atualizar()
    }}>
      <summary><strong>Acesso do cliente</strong></summary>
      {aberto && (
        <div className="pilha">
          <p className="pequeno suave">O e-mail autorizado pode fazer o Primeiro acesso e ver as horas do projeto e as entregas publicadas.</p>
          <ul className="itens-painel">
            {emails.map(({ email: cadastrado }) => (
              <li className="linha" key={cadastrado}>
                <span className="cresce texto-livre">{cadastrado}</span>
                <button type="button" className="botao pequeno" disabled={ocupado} aria-label={`Revogar acesso de ${cadastrado}`} onClick={() => mudar('Revogar acesso do cliente', () => revogarAcessoCliente(projetoId, cadastrado))}>Revogar</button>
              </li>
            ))}
          </ul>
          <form className="fila fim" onSubmit={(ev) => {
            ev.preventDefault()
            mudar('Autorizar acesso do cliente', () => concederAcessoCliente(projetoId, email))
          }}>
            <label className="campo cresce"><span>E-mail do cliente</span><input className="entrada" type="email" required maxLength={254} disabled={ocupado} value={email} onChange={(ev) => setEmail(ev.target.value)} /></label>
            <button className="botao pequeno" disabled={ocupado || !email.trim()}>Autorizar</button>
          </form>
        </div>
      )}
    </details>
  )
}

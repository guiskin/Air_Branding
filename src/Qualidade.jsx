import { useState } from 'react'
import { registrarVersao, salvarLimiteVersao } from './dados'

export function AlertasQualidade({ app }) {
  if (!app.gestor || !app.dados.versoes) return null
  const alertas = app.m.entregas.filter((e) => e.projeto?.ativo && e.status !== 'concluido' && e.versao > e.projeto.limite_versao)
  if (!alertas.length) return null
  return (
    <section className="cartao pilha" aria-labelledby="titulo-qualidade">
      <h2 id="titulo-qualidade">Alertas de qualidade</h2>
      <ul className="itens-painel">
        {alertas.map((e) => (
          <li key={e.id} className="linha">
            <button type="button" className="linha-titulo" aria-haspopup="dialog" onClick={() => app.abrir(e.id)}>
              <strong>{e.titulo}</strong><span>{e.projeto.codigo} · {e.projeto.nome}</span>
            </button>
            <span className="pequeno perigo forte">V{e.versao}, limite V{e.projeto.limite_versao}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LimiteQualidade({ app, projeto }) {
  const [valor, setValor] = useState(null)
  const [salvando, setSalvando] = useState(false)
  if (!app.gestor || !app.dados.versoes || projeto.limite_versao == null) return null
  const limite = valor ?? projeto.limite_versao
  return (
    <form className="cartao fila fim" onSubmit={async (ev) => {
      ev.preventDefault()
      if (salvando) return
      setSalvando(true)
      const feito = await app.agir('Salvar limite de versões', () => salvarLimiteVersao(projeto.id, Number(limite)))
      if (feito !== undefined) { setValor(null); app.avisar('Limite de versões salvo.') }
      setSalvando(false)
    }}>
      <label className="campo cresce"><span>Limite de versões para alerta de qualidade</span><input className="entrada" type="number" min="1" max="99" required value={limite} disabled={salvando} onChange={(ev) => setValor(ev.target.value)} /></label>
      <button className="botao pequeno" disabled={salvando || Number(limite) === projeto.limite_versao}>Salvar limite</button>
    </form>
  )
}

export function VersaoEntrega({ app, entrega }) {
  const [salvando, setSalvando] = useState(false)
  if (!app.dados.versoes || entrega.projeto?.limite_versao == null) return null
  const excedeu = entrega.versao > entrega.projeto.limite_versao
  return (
    <div className="fila entre">
      <span className={excedeu ? 'perigo forte' : 'forte'}>Versão V{entrega.versao} · limite V{entrega.projeto.limite_versao}</span>
      {entrega.projeto.ativo && entrega.status !== 'concluido' && (
        <button type="button" className="botao pequeno" disabled={salvando} onClick={async () => {
          if (salvando) return
          setSalvando(true)
          const versao = await app.agir('Registrar nova versão', () => registrarVersao(entrega.id, entrega.versao))
          if (versao !== undefined) app.avisar(`Versão V${versao} registrada.`)
          setSalvando(false)
        }}>Registrar nova versão</button>
      )}
    </div>
  )
}

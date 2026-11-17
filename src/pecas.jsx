import { useEffect, useState } from 'react'
import { STATUS, statusPorId, corPessoa, iniciais, fmtData, primeiroNome } from './dados'

export function Avatar({ pessoa }) {
  const [fotoIndisponivel, setFotoIndisponivel] = useState(null)
  const mostrarFoto = pessoa.foto_url && pessoa.foto_url !== fotoIndisponivel
  return (
    <span className={`avatar cor-${corPessoa(pessoa.id)}`} title={pessoa.nome} role="img" aria-label={pessoa.nome}>
      {mostrarFoto ? (
        <img src={pessoa.foto_url} alt="" onError={() => setFotoIndisponivel(pessoa.foto_url)} />
      ) : (
        iniciais(pessoa.nome)
      )}
    </span>
  )
}

export function Avatares({ pessoas }) {
  if (!pessoas.length) return <span className="pequeno suave">Sem dono</span>
  return (
    <span className="avatares">
      {pessoas.map((p) => (
        <Avatar key={p.id} pessoa={p} />
      ))}
    </span>
  )
}

export function SeletorStatus({ valor, aoMudar, rotulo = 'Status da entrega', neutro = false }) {
  const s = statusPorId(valor)
  return (
    <select
      className={`status-seletor ${neutro ? 'neutro' : `status-${s.id}`}`}
      aria-label={rotulo}
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
    >
      {STATUS.map((x) => (
        <option key={x.id} value={x.id}>
          {x.nome}
        </option>
      ))}
    </select>
  )
}

export function Etiqueta({ status }) {
  const s = statusPorId(status)
  return (
    <span className={`etiqueta status-${s.id}`}>
      {s.nome}
    </span>
  )
}

export function textoPrazo(e) {
  if (!e.prazo) return 'Sem prazo'
  return e.atrasada ? `Atrasada, ${fmtData(e.prazo)}` : `Até ${fmtData(e.prazo)}`
}

export function textoEtapa(e, pessoaPorId) {
  if (!e.etapas.length) return ''
  if (!e.etapaAtual) return 'Todas as etapas concluídas'
  return `Etapa: ${e.etapaAtual.nome}, com ${primeiroNome(pessoaPorId[e.etapaAtual.pessoa_id])}`
}

export function Barra({ pct, rotulo }) {
  const v = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div className="barra" role="img" aria-label={`${v}% ${rotulo}`}>
      <div style={{ width: `${v}%` }} />
    </div>
  )
}

export function CampoSalvo({ valor, aoSalvar, multilinha = false, tipo = 'text', id, classe = '', ...resto }) {
  const [texto, setTexto] = useState(valor ?? '')
  useEffect(() => {
    setTexto(valor ?? '')
  }, [valor])
  const salvar = () => {
    if (String(texto) !== String(valor ?? '')) aoSalvar(texto)
  }
  const Tag = multilinha ? 'textarea' : 'input'
  return <Tag id={id} className={`entrada ${classe}`.trim()} type={multilinha ? undefined : tipo} value={texto} onChange={(e) => setTexto(e.target.value)} onBlur={salvar} {...resto} />
}

export function relogio(inicioIso) {
  const seg = Math.max(0, Math.floor((Date.now() - new Date(inicioIso).getTime()) / 1000))
  const p = (n) => String(n).padStart(2, '0')
  const h = Math.floor(seg / 3600)
  return `${h ? `${p(h)}:` : ''}${p(Math.floor((seg % 3600) / 60))}:${p(seg % 60)}`
}

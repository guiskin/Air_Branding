import { useRef, useState } from 'react'
import * as D from './dados'
import { Avatar } from './pecas'

function DadosPessoais({ app }) {
  const [nome, setNome] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const nomeCompleto = nome ?? app.eu.nome
  const mudou = nomeCompleto.trim() && nomeCompleto.trim() !== app.eu.nome
  const salvar = async (evento) => {
    evento.preventDefault()
    if (!mudou || salvando) return
    setSalvando(true)
    const feito = await app.agir('Salvar nome completo', () => D.alterarMeuNome(nomeCompleto))
    setSalvando(false)
    if (feito === undefined) return
    setNome(null)
    app.avisar('Nome atualizado.')
  }

  return (
    <form className="cartao pilha" onSubmit={salvar}>
      <h2>Dados pessoais</h2>
      <label className="campo" htmlFor="config-nome">
        <span>Nome completo</span>
        <input id="config-nome" className="entrada" autoComplete="name" required maxLength={120} value={nomeCompleto} disabled={salvando} onChange={(ev) => setNome(ev.target.value)} />
      </label>
      <div>
        <button className="botao primario" disabled={!mudou || salvando}>Salvar nome</button>
      </div>
    </form>
  )
}

function FotoPerfil({ app }) {
  const campoArquivo = useRef(null)
  const [arquivo, setArquivo] = useState(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const selecionar = (ev) => {
    const foto = ev.target.files[0] || null
    const invalida = foto ? D.validarFoto(foto) : ''
    if (invalida) ev.target.value = ''
    setArquivo(invalida ? null : foto)
    setErro(invalida)
  }
  const salvar = async (foto) => {
    if (salvando) return
    setSalvando(true)
    const feito = await app.agir(foto ? 'Salvar foto de perfil' : 'Remover foto de perfil', () => D.alterarMinhaFoto(app.eu, foto))
    setSalvando(false)
    if (feito === undefined) return
    if (campoArquivo.current) campoArquivo.current.value = ''
    setArquivo(null)
    setErro('')
    app.avisar(foto ? 'Foto atualizada.' : 'Foto removida.')
  }

  return (
    <form className="cartao pilha" onSubmit={(ev) => {
      ev.preventDefault()
      if (arquivo) salvar(arquivo)
    }}>
      <h2>Foto de perfil</h2>
      <div className="fila">
        <Avatar pessoa={app.eu} />
        <strong>{app.eu.nome}</strong>
      </div>
      <label className="campo" htmlFor="config-foto">
        <span>Escolher foto</span>
        <input ref={campoArquivo} id="config-foto" className="entrada" type="file" accept={D.TIPOS_FOTO} aria-describedby="config-foto-formatos" aria-invalid={Boolean(erro)} disabled={salvando} onChange={selecionar} />
      </label>
      <p id="config-foto-formatos" className="pequeno suave">JPEG, PNG ou WebP de até 2 MB.</p>
      {erro && <p className="pequeno perigo" role="alert">{erro}</p>}
      <div className="fila">
        <button className="botao primario" disabled={salvando || !arquivo}>Salvar foto</button>
        {app.eu.foto_caminho && <button type="button" className="botao" disabled={salvando} onClick={() => salvar(null)}>Remover foto</button>}
      </div>
    </form>
  )
}

function AlterarSenha({ app }) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const alterar = async (evento) => {
    evento.preventDefault()
    if (salvando) return
    if (nova !== confirmacao) {
      setErro('Os dois campos da nova senha precisam coincidir.')
      return
    }
    setErro('')
    setSalvando(true)
    const feito = await app.agir('Alterar senha', () => D.alterarMinhaSenha(atual, nova))
    setAtual('')
    setSalvando(false)
    if (feito === undefined) return
    setNova('')
    setConfirmacao('')
    app.avisar('Senha alterada.')
  }

  return (
    <form className="cartao pilha" onSubmit={alterar} onChange={() => setErro('')}>
      <h2>Alterar senha</h2>
      <label className="campo" htmlFor="config-senha-atual">
        <span>Senha atual</span>
        <input id="config-senha-atual" className="entrada" type="password" autoComplete="current-password" required value={atual} disabled={salvando} onChange={(ev) => setAtual(ev.target.value)} />
      </label>
      <div className="grade">
        <label className="campo" htmlFor="config-nova-senha">
          <span>Nova senha</span>
          <input id="config-nova-senha" className="entrada" type="password" autoComplete="new-password" required minLength={6} value={nova} disabled={salvando} onChange={(ev) => setNova(ev.target.value)} />
        </label>
        <label className="campo" htmlFor="config-confirma-senha">
          <span>Confirmar nova senha</span>
          <input id="config-confirma-senha" className="entrada" type="password" autoComplete="new-password" required minLength={6} value={confirmacao} disabled={salvando} onChange={(ev) => setConfirmacao(ev.target.value)} />
        </label>
      </div>
      {erro && <p className="pequeno perigo" role="alert">{erro}</p>}
      <div>
        <button className="botao primario" disabled={salvando || !atual || !nova || !confirmacao}>Alterar senha</button>
      </div>
    </form>
  )
}

export default function Configuracoes({ app }) {
  return (
    <div className="pilha larga configuracoes">
      <h1>Configurações</h1>
      <DadosPessoais app={app} />
      <FotoPerfil app={app} />
      <AlterarSenha app={app} />
    </div>
  )
}

import { useState } from 'react'
import { aplicarEquipe, excluirEquipe, salvarEquipe } from './dados'

export function SeletorEquipe({ id, equipes, valor, aoMudar, desabilitado }) {
  return (
    <label className="campo" htmlFor={id}>
      <span>Equipe cadastrada</span>
      <select id={id} className="entrada" value={valor} onChange={(ev) => aoMudar(ev.target.value)} disabled={desabilitado}>
        <option value="">Sem equipe cadastrada</option>
        {equipes.map((equipe) => <option key={equipe.id} value={equipe.id}>{equipe.nome}</option>)}
      </select>
    </label>
  )
}

export function CadastroEquipes({ app }) {
  const [edicao, setEdicao] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const { cadastroEquipes } = app.dados
  if (!cadastroEquipes) return null

  const ativas = app.dados.pessoas.filter((pessoa) => pessoa.ativo)
  const membrosAtivos = edicao?.membros.filter((id) => app.m.pessoaPorId[id]?.ativo) || []
  const editar = (equipe) => {
    const membros = equipe.equipe_membros.map(({ pessoa_id }) => pessoa_id)
    setEdicao({ id: equipe.id, nome: equipe.nome, membros: ativas.filter((pessoa) => membros.includes(pessoa.id)).map((pessoa) => pessoa.id) })
  }
  const alternar = (id, marcada) => {
    setEdicao((atual) => ({
      ...atual,
      membros: marcada ? [...atual.membros, id] : atual.membros.filter((membro) => membro !== id),
    }))
  }
  const excluir = async (equipe) => {
    if (salvando || !window.confirm(`Excluir a equipe "${equipe.nome}"? Só é possível se nenhum projeto a usar.`)) return
    setSalvando(true)
    const resultado = await app.agir(`Excluir equipe ${equipe.nome}`, () => excluirEquipe(equipe.id))
    setSalvando(false)
    if (resultado !== undefined) app.avisar('Equipe excluída.')
  }
  const salvar = async (ev) => {
    ev.preventDefault()
    if (salvando || !edicao.nome.trim() || !membrosAtivos.length) return
    setSalvando(true)
    const resultado = await app.agir('Salvar equipe', () => salvarEquipe(edicao.id, edicao.nome, membrosAtivos))
    setSalvando(false)
    if (resultado !== undefined) {
      setEdicao(null)
      app.avisar('Equipe salva.')
    }
  }

  return (
    <section className="cartao pilha" aria-labelledby="titulo-equipes">
      <div className="fila entre">
        <h2 id="titulo-equipes">Equipes cadastradas</h2>
        <button className="botao pequeno" disabled={Boolean(edicao)} onClick={() => setEdicao({ id: null, nome: '', membros: [] })}>
          Nova equipe
        </button>
      </div>
      {!cadastroEquipes.equipes.length && !edicao && <p className="suave">Nenhuma equipe cadastrada.</p>}
      {cadastroEquipes.equipes.map((equipe) => {
        const nomes = equipe.equipe_membros.map(({ pessoa_id }) => app.m.pessoaPorId[pessoa_id]).filter((pessoa) => pessoa?.ativo).map(({ nome }) => nome)
        return (
          <div key={equipe.id} className="linha">
            <div className="cresce">
              <strong className="nome-linha">{equipe.nome}</strong>
              <p className="pequeno suave">{nomes.join(', ') || 'Sem pessoas ativas'}</p>
            </div>
            <button className="botao pequeno" aria-label={`Editar equipe ${equipe.nome}`} disabled={Boolean(edicao)} onClick={() => editar(equipe)}>Editar</button>
            <button className="botao pequeno" aria-label={`Excluir equipe ${equipe.nome}`} disabled={Boolean(edicao) || salvando} onClick={() => excluir(equipe)}>Excluir</button>
          </div>
        )
      })}
      {edicao && (
        <form className="pilha" onSubmit={salvar}>
          <h3>{edicao.id ? 'Editar equipe' : 'Nova equipe'}</h3>
          <label className="campo">
            <span>Nome da equipe</span>
            <input className="entrada" required maxLength={80} value={edicao.nome} disabled={salvando} onChange={(ev) => setEdicao({ ...edicao, nome: ev.target.value })} />
          </label>
          <fieldset className="membros-equipe pilha minima" disabled={salvando}>
            <legend>Integrantes</legend>
            {ativas.map((pessoa) => (
              <label key={pessoa.id} className="fila">
                <input type="checkbox" checked={edicao.membros.includes(pessoa.id)} onChange={(ev) => alternar(pessoa.id, ev.target.checked)} />
                <span>{pessoa.nome}</span>
              </label>
            ))}
          </fieldset>
          <div className="fila">
            <button className="botao primario" disabled={salvando || !edicao.nome.trim() || !membrosAtivos.length}>Salvar equipe</button>
            <button type="button" className="botao" disabled={salvando} onClick={() => setEdicao(null)}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  )
}

export function AtribuirEquipe({ app, projetoId, equipeAtual }) {
  const [selecao, setSelecao] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const equipes = app.dados.cadastroEquipes?.equipes
  if (!app.gestor || !equipes?.length) return null

  const inicial = equipeAtual?.id || ''
  const equipeId = selecao ?? inicial
  const salvar = async (ev) => {
    ev.preventDefault()
    if (salvando || (!equipeId && !inicial)) return
    setSalvando(true)
    const resultado = await app.agir('Atualizar equipe do projeto', () => aplicarEquipe(projetoId, equipeId))
    setSalvando(false)
    if (resultado !== undefined) {
      setSelecao(null)
      app.avisar(equipeId ? 'Equipe aplicada ao projeto.' : 'Equipe removida do projeto.')
    }
  }

  return (
    <form className="pilha curta" onSubmit={salvar}>
      <SeletorEquipe id="equipe-projeto" equipes={equipes} valor={equipeId} aoMudar={setSelecao} desabilitado={salvando} />
      <div>
        <button className="botao pequeno" disabled={salvando || (!equipeId && !inicial)}>
          {!equipeId && inicial ? 'Remover equipe' : equipeId && equipeId === inicial ? 'Reaplicar equipe' : 'Aplicar equipe'}
        </button>
      </div>
    </form>
  )
}

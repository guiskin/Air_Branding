import { supabase } from './supabase'

export const STATUS = [
  { id: 'backlog', nome: 'Backlog' },
  { id: 'aguardando', nome: 'Aguardando material' },
  { id: 'planejado', nome: 'Planejado' },
  { id: 'andamento', nome: 'Em andamento' },
  { id: 'revisao', nome: 'Em revisão' },
  { id: 'aprovacao', nome: 'Em aprovação' },
  { id: 'ajustes', nome: 'Ajustes' },
  { id: 'concluido', nome: 'Concluído' },
]

export const TIPOS = [
  { id: 'producao', nome: 'Produção' },
  { id: 'atendimento', nome: 'Atendimento' },
  { id: 'reuniao', nome: 'Reunião interna' },
]

export const AREAS = ['Atendimento', 'Conteúdo', 'Design', 'Mídia', 'Vídeo', 'Coordenação', 'Diretoria', 'Backoffice', 'Freelancer', 'Tecnologia']

export const PERFIS = [
  { id: 'membro', nome: 'Membro' },
  { id: 'coordenacao', nome: 'Coordenação' },
  { id: 'admin', nome: 'Administrador' },
]

export const FLUXOS = [
  { id: 'cda', nome: 'Conteúdo, design e aprovação do cliente', etapas: ['Conteúdo', 'Design', 'Aprovação do cliente'] },
  { id: 'da', nome: 'Design e aprovação do cliente', etapas: ['Design', 'Aprovação do cliente'] },
  { id: 'unica', nome: 'Etapa única', etapas: [] },
]

export const statusPorId = (id) => STATUS.find((s) => s.id === id) || STATUS[0]
export const tipoPorId = (id) => TIPOS.find((t) => t.id === id) || TIPOS[0]

const BUCKET_FOTOS = 'fotos-perfil'
const EXTENSOES_FOTO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const TIPOS_FOTO = Object.keys(EXTENSOES_FOTO).join(',')
export const LIMITE_FOTO = 2 * 1024 * 1024

async function ok(consulta) {
  const { data, error } = await consulta
  if (error) throw new Error(error.message)
  return data
}

async function assinarFotos(pessoas) {
  const caminhos = [...new Set(pessoas.map((p) => p.foto_caminho).filter(Boolean))]
  if (!caminhos.length) return pessoas
  try {
    const assinaturas = await ok(supabase.storage.from(BUCKET_FOTOS).createSignedUrls(caminhos, 300))
    const urls = Object.fromEntries(assinaturas.map(({ path, signedUrl }) => [path, signedUrl]))
    return pessoas.map((p) => ({ ...p, foto_url: urls[p.foto_caminho] || null }))
  } catch {
    return pessoas
  }
}

async function carregarEquipes() {
  const [equipes, atribuicoes] = await Promise.all([
    supabase.from('equipes').select('id,nome,equipe_membros(pessoa_id)').order('nome'),
    supabase.from('projeto_equipes').select('projeto_id,equipe_id,projeto_equipe_membros(pessoa_id)'),
  ])
  const erros = [equipes.error, atribuicoes.error].filter(Boolean)
  const falha = erros.find(({ code }) => !['42P01', 'PGRST205'].includes(code))
  if (falha) throw new Error(falha.message)
  if (erros.length) return null
  return { equipes: equipes.data, atribuicoes: atribuicoes.data }
}

export async function carregar() {
  const [pessoas, clientes, projetos, entregas, responsaveis, etapas, horas, comentarios, cadastroEquipes] = await Promise.all([
    ok(supabase.from('pessoas').select('*').order('nome')),
    ok(supabase.from('clientes').select('*').order('nome')),
    ok(supabase.from('projetos').select('*').order('codigo')),
    ok(supabase.from('entregas').select('*').order('criado_em')),
    ok(supabase.from('entrega_responsaveis').select('*')),
    ok(supabase.from('etapas').select('*').order('ordem')),
    ok(supabase.from('horas').select('*').order('inicio')),
    ok(supabase.from('comentarios').select('*').order('criado_em')),
    carregarEquipes(),
  ])
  return { pessoas: await assinarFotos(pessoas), clientes, projetos, entregas, responsaveis, etapas, horas, comentarios, cadastroEquipes }
}

export async function alterarMeuNome(nome) {
  const { error } = await supabase.rpc('alterar_meu_nome', { novo_nome: nome.trim() })
  if (error?.code === 'PGRST202') throw new Error('A edição do perfil ainda não está habilitada neste ambiente.')
  if (error) throw new Error(error.message)
}

export function validarFoto(arquivo) {
  if (!Object.hasOwn(EXTENSOES_FOTO, arquivo.type)) return 'Escolha uma imagem JPEG, PNG ou WebP.'
  if (!arquivo.size || arquivo.size > LIMITE_FOTO) return 'Escolha uma imagem de até 2 MB.'
  return ''
}

export async function alterarMinhaFoto(pessoa, arquivo) {
  if (!Object.hasOwn(pessoa, 'foto_caminho')) {
    throw new Error('A foto de perfil ainda não está habilitada neste ambiente.')
  }

  const bucket = supabase.storage.from(BUCKET_FOTOS)
  let caminho = null
  if (arquivo) {
    const invalida = validarFoto(arquivo)
    if (invalida) throw new Error(invalida)
    caminho = `${pessoa.id}/${crypto.randomUUID()}.${EXTENSOES_FOTO[arquivo.type]}`
  }

  async function limparFoto(caminhoAntigo) {
    if (!caminhoAntigo) return
    try {
      await bucket.remove([caminhoAntigo])
    } catch {
      return
    }
  }

  if (caminho) await ok(bucket.upload(caminho, arquivo, { contentType: arquivo.type, upsert: false }))
  const { data: anterior, error } = await supabase.rpc('alterar_minha_foto', { novo_caminho: caminho })
  if (error) {
    if (['P0001', '23514', '42501', 'PGRST202'].includes(error.code)) await limparFoto(caminho)
    if (error.code === 'PGRST202') throw new Error('A foto de perfil ainda não está habilitada neste ambiente.')
    throw new Error(error.message)
  }
  if (anterior !== caminho) await limparFoto(anterior)
}

export async function alterarMinhaSenha(atual, nova) {
  const { error } = await supabase.auth.updateUser({ current_password: atual, password: nova })
  if (!error) return
  if (error.code === 'reauthentication_needed') throw new Error('Entre novamente na sua conta para alterar a senha.')
  if (error.code === 'invalid_credentials') throw new Error('A senha atual está incorreta.')
  if (error.code === 'same_password') throw new Error('A nova senha deve ser diferente da atual.')
  if (error.code === 'weak_password') throw new Error('Escolha uma senha mais forte.')
  throw new Error(error.message)
}

export const hoje = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const fmtData = (iso) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${Number(d)} ${meses[Number(m) - 1]}`
}

export const fmtMin = (min) => {
  const total = Math.max(0, Math.round(min))
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}h${m ? String(m).padStart(2, '0') : ''}`
}

export const primeiroNome = (pessoa) => (pessoa ? pessoa.nome.split(' ')[0] : 'a definir')

export const iniciais = (nome) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

// Índice (0 a 7) da cor do avatar; as cores ficam em estilos.css (.avatar.cor-N).
const NUMERO_DE_CORES = 8
export const corPessoa = (id) => {
  let n = 0
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 997
  return n % NUMERO_DE_CORES
}

export function montar(dados, euId) {
  const pessoaPorId = Object.fromEntries(dados.pessoas.map((p) => [p.id, p]))
  const clientePorId = Object.fromEntries(dados.clientes.map((c) => [c.id, c]))
  const projetoPorId = Object.fromEntries(dados.projetos.map((p) => [p.id, p]))
  const equipePorId = Object.fromEntries((dados.cadastroEquipes?.equipes || []).map((equipe) => [equipe.id, equipe]))
  const equipePorProjeto = Object.fromEntries((dados.cadastroEquipes?.atribuicoes || []).map((atribuicao) => [
    atribuicao.projeto_id,
    {
      equipe: equipePorId[atribuicao.equipe_id],
      pessoas: atribuicao.projeto_equipe_membros.map(({ pessoa_id }) => pessoaPorId[pessoa_id]).filter(Boolean),
    },
  ]))
  const dia = hoje()
  const entregas = dados.entregas.map((e) => {
    const etapas = dados.etapas.filter((x) => x.entrega_id === e.id).sort((a, b) => a.ordem - b.ordem)
    const etapaAtual = etapas.find((x) => !x.concluida) || null
    const responsaveis = dados.responsaveis.filter((r) => r.entrega_id === e.id).map((r) => pessoaPorId[r.pessoa_id]).filter(Boolean)
    const horas = dados.horas.filter((h) => h.entrega_id === e.id && h.fim)
    const projeto = projetoPorId[e.projeto_id]
    const cliente = projeto ? clientePorId[projeto.cliente_id] : null
    const comigo = etapaAtual ? etapaAtual.pessoa_id === euId : responsaveis.some((p) => p.id === euId)
    return {
      ...e,
      etapas,
      etapaAtual,
      responsaveis,
      projeto,
      cliente,
      minutos: horas.reduce((a, h) => a + h.minutos, 0),
      atrasada: Boolean(e.prazo) && e.prazo < dia && e.status !== 'concluido',
      comigo,
      emOutraEtapa: Boolean(etapaAtual) && etapaAtual.pessoa_id !== euId && responsaveis.some((p) => p.id === euId),
      comentarios: dados.comentarios.filter((c) => c.entrega_id === e.id),
    }
  })
  const timer = dados.horas.find((h) => h.pessoa_id === euId && !h.fim) || null
  return { pessoaPorId, clientePorId, projetoPorId, equipePorProjeto, entregas, timer }
}

export const criarCliente = (nome) => ok(supabase.from('clientes').insert({ nome }))

export function criarProjeto(projeto, equipeId) {
  if (!equipeId) return ok(supabase.from('projetos').insert(projeto))
  return ok(supabase.rpc('criar_projeto_com_equipe', {
    cliente: projeto.cliente_id,
    codigo: projeto.codigo,
    nome: projeto.nome,
    linha: projeto.linha,
    horas: projeto.horas_vendidas,
    equipe: equipeId,
  }))
}

export const salvarEquipe = (equipeId, nome, membros) =>
  ok(supabase.rpc('salvar_equipe', { equipe: equipeId, novo_nome: nome.trim(), membros }))

export const aplicarEquipe = (projetoId, equipeId) =>
  ok(supabase.rpc('aplicar_equipe_projeto', { projeto: projetoId, equipe: equipeId || null }))

export async function criarEntrega({ projeto_id, titulo, briefing, link_drive, prazo, horas_estimadas, fluxo, quem, euId }) {
  const [entrega] = await ok(
    supabase
      .from('entregas')
      .insert({ projeto_id, titulo, briefing, link_drive, prazo: prazo || null, inicio: hoje(), horas_estimadas: Number(horas_estimadas) || 0, criado_por: euId })
      .select(),
  )
  if (quem) await ok(supabase.from('entrega_responsaveis').insert({ entrega_id: entrega.id, pessoa_id: quem }))
  const nomes = (FLUXOS.find((f) => f.id === fluxo) || FLUXOS[2]).etapas
  if (nomes.length) {
    await ok(supabase.from('etapas').insert(nomes.map((nome, i) => ({ entrega_id: entrega.id, ordem: i + 1, nome, pessoa_id: i === 0 ? quem || null : null }))))
  }
  return entrega
}

export const atualizarEntrega = (id, mudancas) => ok(supabase.from('entregas').update(mudancas).eq('id', id))

export const alternarResponsavel = (entregaId, pessoaId, incluir) =>
  incluir
    ? ok(supabase.from('entrega_responsaveis').insert({ entrega_id: entregaId, pessoa_id: pessoaId }))
    : ok(supabase.from('entrega_responsaveis').delete().eq('entrega_id', entregaId).eq('pessoa_id', pessoaId))

export const definirPessoaEtapa = (etapaId, pessoaId) => ok(supabase.from('etapas').update({ pessoa_id: pessoaId || null }).eq('id', etapaId))

export async function avancarEtapa(entrega, pessoaPorId) {
  const atual = entrega.etapaAtual
  if (!atual) return
  const proxima = entrega.etapas.find((x) => x.ordem > atual.ordem && !x.concluida) || null
  await ok(supabase.from('etapas').update({ concluida: true, concluida_em: new Date().toISOString() }).eq('id', atual.id))
  if (proxima && proxima.pessoa_id && !entrega.responsaveis.some((p) => p.id === proxima.pessoa_id)) {
    await ok(supabase.from('entrega_responsaveis').insert({ entrega_id: entrega.id, pessoa_id: proxima.pessoa_id }))
  }
  const status = proxima ? (proxima.nome === 'Aprovação do cliente' ? 'aprovacao' : 'andamento') : 'concluido'
  await ok(supabase.from('entregas').update({ status }).eq('id', entrega.id))
  const texto = proxima
    ? `Etapa ${atual.nome} concluída. Agora é com ${primeiroNome(pessoaPorId[proxima.pessoa_id])} (${proxima.nome}).`
    : 'Todas as etapas concluídas.'
  await ok(supabase.from('comentarios').insert({ entrega_id: entrega.id, texto }))
}

export async function pararTimer(timer) {
  if (!timer) return
  const fim = new Date()
  const minutos = Math.max(1, Math.round((fim.getTime() - new Date(timer.inicio).getTime()) / 60000))
  await ok(supabase.from('horas').update({ fim: fim.toISOString(), minutos }).eq('id', timer.id))
}

export async function iniciarTimer({ projeto_id, entrega_id, tipo }, timerAtual) {
  await pararTimer(timerAtual)
  await ok(supabase.from('horas').insert({ projeto_id, entrega_id: entrega_id || null, tipo }))
}

export const lancarManual = ({ projeto_id, entrega_id, tipo, minutos }) => {
  const agora = new Date().toISOString()
  return ok(supabase.from('horas').insert({ projeto_id, entrega_id: entrega_id || null, tipo, inicio: agora, fim: agora, minutos }))
}

export const comentar = (entregaId, texto) => ok(supabase.from('comentarios').insert({ entrega_id: entregaId, texto }))

export const enviarRelato = ({ tipo, descricao, contexto }) => ok(supabase.from('relatos').insert({ tipo, descricao, contexto }))

export const listarRelatos = () => ok(supabase.from('relatos').select('*').order('criado_em', { ascending: false }))

export const marcarRelato = (id, resolvido) => ok(supabase.from('relatos').update({ resolvido }).eq('id', id))

export const listarConvites = () => ok(supabase.from('convites').select('*').order('nome'))

export const convidar = ({ email, nome, area, perfil }) => ok(supabase.from('convites').insert({ email: email.trim().toLowerCase(), nome: nome.trim(), area, perfil }))

export const removerConvite = (email) => ok(supabase.from('convites').delete().eq('email', email))

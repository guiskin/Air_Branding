import { supabase } from './supabase'

export const STATUS = [
  { id: 'backlog', nome: 'Backlog', bg: '#ECEEF1', fg: '#3D4753' },
  { id: 'aguardando', nome: 'Aguardando material', bg: '#F6E7D2', fg: '#7A4A0B' },
  { id: 'planejado', nome: 'Planejado', bg: '#DDE7FB', fg: '#1D439C' },
  { id: 'andamento', nome: 'Em andamento', bg: '#FFE9A8', fg: '#5E4300' },
  { id: 'revisao', nome: 'Em revisão', bg: '#EADCF8', fg: '#5A2A8C' },
  { id: 'aprovacao', nome: 'Em aprovação', bg: '#D6F0F2', fg: '#0D5560' },
  { id: 'ajustes', nome: 'Ajustes', bg: '#FBDDE6', fg: '#8A1C44' },
  { id: 'concluido', nome: 'Concluído', bg: '#D5EFDD', fg: '#14592E' },
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

async function ok(consulta) {
  const { data, error } = await consulta
  if (error) throw new Error(error.message)
  return data
}

export async function carregar() {
  const [pessoas, clientes, projetos, entregas, responsaveis, etapas, horas, comentarios] = await Promise.all([
    ok(supabase.from('pessoas').select('*').order('nome')),
    ok(supabase.from('clientes').select('*').order('nome')),
    ok(supabase.from('projetos').select('*').order('codigo')),
    ok(supabase.from('entregas').select('*').order('criado_em')),
    ok(supabase.from('entrega_responsaveis').select('*')),
    ok(supabase.from('etapas').select('*').order('ordem')),
    ok(supabase.from('horas').select('*').order('inicio')),
    ok(supabase.from('comentarios').select('*').order('criado_em')),
  ])
  return { pessoas, clientes, projetos, entregas, responsaveis, etapas, horas, comentarios }
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

const CORES = ['#1D439C', '#7A2E8E', '#0B6B5D', '#8A4B08', '#A3264F', '#3D4753', '#5A2A8C', '#0D5560']
export const corPessoa = (id) => {
  let n = 0
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 997
  return CORES[n % CORES.length]
}

export function montar(dados, euId) {
  const pessoaPorId = Object.fromEntries(dados.pessoas.map((p) => [p.id, p]))
  const clientePorId = Object.fromEntries(dados.clientes.map((c) => [c.id, c]))
  const projetoPorId = Object.fromEntries(dados.projetos.map((p) => [p.id, p]))
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
  return { pessoaPorId, clientePorId, projetoPorId, entregas, timer }
}

export const criarCliente = (nome) => ok(supabase.from('clientes').insert({ nome }))

export const criarProjeto = (p) => ok(supabase.from('projetos').insert(p))

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

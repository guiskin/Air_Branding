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

async function carregarPaginado(consultar) {
  const tamanho = 1000
  const primeira = await consultar({ count: 'exact' }).range(0, tamanho - 1)
  if (primeira.error) return primeira

  const data = primeira.data.slice()
  let recebidos = data.length
  while (recebidos && (primeira.count == null ? recebidos === tamanho : data.length < primeira.count)) {
    const pagina = await consultar().range(data.length, data.length + tamanho - 1)
    if (pagina.error) return pagina
    recebidos = pagina.data.length
    data.push(...pagina.data)
  }
  return { data, error: null }
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
    carregarPaginado((opcoes) => supabase.from('equipes').select('id,nome,equipe_membros(pessoa_id)', opcoes).order('nome').order('id')),
    carregarPaginado((opcoes) => supabase.from('projeto_equipes').select('projeto_id,equipe_id,projeto_equipe_membros(pessoa_id)', opcoes).order('projeto_id')),
  ])
  const erros = [equipes.error, atribuicoes.error].filter(Boolean)
  const falha = erros.find(({ code }) => !['42P01', 'PGRST205'].includes(code))
  if (falha) throw new Error(falha.message)
  if (erros.length) return null
  return { equipes: equipes.data, atribuicoes: atribuicoes.data }
}

async function opcional(consulta) {
  const { data, error } = await consulta
  if (['42P01', 'PGRST205', 'PGRST202'].includes(error?.code)) return null
  if (error) throw new Error(error.message)
  return data
}

export async function carregar() {
  const [pessoas, clientes, projetos, entregas, responsaveis, etapas, horas, comentarios, cadastroEquipes, versoes, publicadas] = await Promise.all([
    ok(supabase.from('pessoas').select('*').order('nome')),
    ok(carregarPaginado((opcoes) => supabase.from('clientes').select('*', opcoes).order('nome'))),
    ok(carregarPaginado((opcoes) => supabase.from('projetos').select('*', opcoes).order('codigo'))),
    ok(carregarPaginado((opcoes) => supabase.from('entregas').select('*', opcoes).order('criado_em').order('id'))),
    ok(supabase.from('entrega_responsaveis').select('*')),
    ok(supabase.from('etapas').select('*').order('ordem')),
    ok(carregarPaginado((opcoes) => supabase.from('horas').select('*', opcoes).order('inicio').order('id'))),
    ok(supabase.from('comentarios').select('*').order('criado_em')),
    carregarEquipes(),
    opcional(carregarPaginado((opcoes) => supabase.from('entrega_versoes').select('*', opcoes).order('entrega_id'))),
    opcional(carregarPaginado((opcoes) => supabase.from('portal_entregas').select('entrega_id', opcoes).order('entrega_id'))),
  ])
  return { pessoas: await assinarFotos(pessoas), clientes, projetos, entregas, responsaveis, etapas, horas, comentarios, cadastroEquipes, versoes, publicadas }
}

export const consultarPortal = () => opcional(supabase.rpc('painel_do_cliente'))
export const consultarPessoaInterna = (id) => ok(supabase.from('pessoas').select('id').eq('id', id).maybeSingle())
export const listarAcessosCliente = (projeto) => ok(supabase.from('projeto_acessos_cliente').select('email').eq('projeto_id', projeto).order('email'))
export const concederAcessoCliente = (projeto, email) => ok(supabase.from('projeto_acessos_cliente').upsert({ projeto_id: projeto, email: email.trim().toLowerCase() }, { ignoreDuplicates: true }))
export const revogarAcessoCliente = (projeto, email) => ok(supabase.from('projeto_acessos_cliente').delete().eq('projeto_id', projeto).eq('email', email))

export function publicarEntrega(entregaId, publicar) {
  const tabela = supabase.from('portal_entregas')
  return ok(publicar ? tabela.upsert({ entrega_id: entregaId }, { ignoreDuplicates: true }) : tabela.delete().eq('entrega_id', entregaId))
}

export const registrarVersao = (entrega, versao) => ok(supabase.rpc('registrar_versao', { entrega, versao_anterior: versao }))
export const salvarLimiteVersao = (projeto, limite_versao) => ok(supabase.from('projetos').update({ limite_versao }).eq('id', projeto).select('id').single())
export const importarGoogle = (projeto, fonte, colecao_id, itens) => ok(supabase.rpc('importar_entregas_google', { projeto, fonte, colecao_id, itens }))

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

export function dataLocal(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export const hoje = () => dataLocal(new Date())

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
  const versaoPorEntrega = new Map((dados.versoes || []).map((v) => [v.entrega_id, v.versao]))
  const publicadas = new Set((dados.publicadas || []).map((e) => e.entrega_id))
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
      versao: versaoPorEntrega.get(e.id) || 1,
      visivelCliente: publicadas.has(e.id),
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

export async function criarProjeto(projeto, equipeId) {
  const { data, error } = equipeId
    ? await supabase.rpc('criar_projeto_com_equipe', {
        cliente: projeto.cliente_id,
        codigo: projeto.codigo,
        nome: projeto.nome,
        linha: projeto.linha,
        horas: projeto.horas_vendidas,
        equipe: equipeId,
      })
    : await supabase.from('projetos').insert(projeto)
  if (error) {
    if (error.code === '23505') throw new Error('Já existe um projeto com esse código.')
    throw new Error(error.message)
  }
  return data
}

export async function salvarPastaDrive(projetoId, link) {
  const { error } = await supabase.from('projetos').update({ pasta_drive: link.trim() }).eq('id', projetoId)
  if (!error) return
  if (error.code === '23514') throw new Error('Cole um link de pasta do Google Drive (começa com https://drive.google.com/).')
  throw new Error(error.message)
}

export const salvarEquipe = (equipeId, nome, membros) =>
  ok(supabase.rpc('salvar_equipe', { equipe: equipeId, novo_nome: nome.trim(), membros }))

export const excluirEquipe = (equipeId) => ok(supabase.rpc('excluir_equipe', { equipe: equipeId }))

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

export const avancarEtapa = (entrega) => ok(supabase.rpc('avancar_etapa', { entrega: entrega.id }))

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

const idGoogleProducao = '776294575075-kcmlghs9n12euo3o0555iac25iht6mjb.apps.googleusercontent.com'
const origemProducao = 'https://air-branding.pages.dev'
const idGoogle = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || (
  globalThis.location?.origin === origemProducao ? idGoogleProducao : ''
)

export const googleConfigurado = Boolean(idGoogle)

const escopos = [
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
]

let carregamento
export function prepararGoogle() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve(globalThis.google.accounts.oauth2)
  carregamento ||= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      const oauth = globalThis.google?.accounts?.oauth2
      if (oauth) resolve(oauth)
      else {
        carregamento = null
        script.remove()
        reject(new Error('A autorização do Google não está disponível.'))
      }
    }
    script.onerror = () => {
      carregamento = null
      script.remove()
      reject(new Error('Não deu para carregar a autorização do Google.'))
    }
    document.head.append(script)
  })
  return carregamento
}

export function conectarGoogle(oauth) {
  return new Promise((resolve, reject) => {
    oauth.initTokenClient({
      client_id: idGoogle,
      scope: escopos.join(' '),
      include_granted_scopes: false,
      callback: (resposta) => {
        if (!resposta.access_token || !oauth.hasGrantedAllScopes(resposta, ...escopos)) {
          reject(new Error('Autorize a leitura do Google Agenda e do Google Tasks para continuar.'))
          return
        }
        resolve({ token: resposta.access_token, expiraEm: Date.now() + Number(resposta.expires_in) * 1000 })
      },
      error_callback: () => reject(new Error('A janela de autorização do Google foi fechada ou bloqueada.')),
    }).requestAccessToken({ prompt: 'select_account' })
  })
}

async function listarGoogle(url, token, signal) {
  const registros = []
  const paginas = new Set()
  let proxima = ''
  do {
    if (paginas.has(proxima)) throw new Error('O Google repetiu uma página de resultados. Tente novamente.')
    paginas.add(proxima)
    if (proxima) url.searchParams.set('pageToken', proxima)
    const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal })
    if (resposta.status === 401) throw Object.assign(new Error('A conexão com o Google expirou. Conecte a conta novamente.'), { expirado: true })
    if (!resposta.ok) throw new Error(`Não deu para consultar o Google (${resposta.status}). Confira a autorização e as APIs habilitadas.`)
    const dados = await resposta.json()
    registros.push(...(dados.items || []))
    proxima = dados.nextPageToken
  } while (proxima)
  return registros
}

export async function listarColecoesGoogle(token, signal) {
  const [agenda, tasks] = await Promise.all([
    listarGoogle(new URL('https://www.googleapis.com/calendar/v3/users/me/calendarList'), token, signal),
    listarGoogle(new URL('https://tasks.googleapis.com/tasks/v1/users/@me/lists'), token, signal),
  ])
  return {
    agenda: agenda.filter((a) => a.accessRole !== 'freeBusyReader').map((a) => ({ id: a.id, nome: a.summaryOverride || a.summary })),
    tasks: tasks.map((t) => ({ id: t.id, nome: t.title })),
  }
}

export function itemGoogle(origem, item) {
  if (!item.id || item.deleted || ['cancelled', 'completed'].includes(item.status) || ['private', 'confidential'].includes(item.visibility)) return null
  const titulo = (origem === 'agenda' ? item.summary : item.title)?.trim()
  if (!/^\[air\]/i.test(titulo || '')) return null
  const nome = titulo.slice(5).trim()
  if (!nome) return null
  const data = origem === 'agenda' ? item.start?.date || item.start?.dateTime : item.due
  return { id: item.id, titulo: [...nome].slice(0, 250).join(''), prazo: data?.slice(0, 10) || null }
}

export async function listarItensGoogle(origem, colecao, token, signal, hoje = new Date()) {
  const id = encodeURIComponent(colecao)
  const url = new URL(origem === 'agenda'
    ? `https://www.googleapis.com/calendar/v3/calendars/${id}/events`
    : `https://tasks.googleapis.com/tasks/v1/lists/${id}/tasks`)
  if (origem === 'agenda') {
    const minimo = new Date(hoje)
    minimo.setHours(0, 0, 0, 0)
    const maximo = new Date(minimo)
    maximo.setDate(maximo.getDate() + 90)
    url.search = new URLSearchParams({ timeMin: minimo.toISOString(), timeMax: maximo.toISOString(), singleEvents: 'true', showDeleted: 'false' })
  } else {
    url.search = new URLSearchParams({ showCompleted: 'false', showDeleted: 'false', showHidden: 'false', maxResults: '100' })
  }
  return (await listarGoogle(url, token, signal)).map((item) => itemGoogle(origem, item)).filter(Boolean)
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { itemGoogle, listarItensGoogle } from './google-api'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('importação do Google', () => {
  it('usa o cliente público somente na origem publicada e permite sobrescrever por ambiente', async () => {
    const preparar = async (origem, configuracao) => {
      vi.stubGlobal('location', { origin: origem })
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', configuracao)
      vi.resetModules()
      return import('./google-api')
    }
    const producao = await preparar('https://air-branding.pages.dev', '')
    expect(producao.googleConfigurado).toBe(true)
    const local = await preparar('http://localhost:5173', '')
    expect(local.googleConfigurado).toBe(false)
    const sobrescrito = await preparar('https://air-branding.pages.dev', 'cliente-teste')
    const oauth = {
      hasGrantedAllScopes: () => true,
      initTokenClient: vi.fn(({ callback }) => ({
        requestAccessToken: () => callback({ access_token: 'token-fixture', expires_in: 60 }),
      })),
    }
    await sobrescrito.conectarGoogle(oauth)
    expect(oauth.initTokenClient).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'cliente-teste' }))
  })

  it('preserva a data local do compromisso e descarta eventos privados e sem marcação', () => {
    const evento = { id: '1', summary: '[Air] Apresentação', start: { dateTime: '2026-11-17T23:00:00-03:00' } }
    expect(itemGoogle('agenda', evento)).toEqual({ id: '1', titulo: 'Apresentação', prazo: '2026-11-17' })
    expect(itemGoogle('agenda', { ...evento, visibility: 'private' })).toBeNull()
    expect(itemGoogle('agenda', { ...evento, summary: 'Apresentação [Air]' })).toBeNull()
  })

  it('lê todas as páginas e importa apenas tarefas abertas marcadas', async () => {
    const resposta = (dados) => new Response(JSON.stringify(dados))
    const buscar = vi.fn()
      .mockResolvedValueOnce(resposta({ items: [{ id: '1', title: '[Air] A', due: '2026-11-17T00:00:00.000Z' }], nextPageToken: 'pagina2' }))
      .mockResolvedValueOnce(resposta({ items: [{ id: '2', title: '[AIR] B' }, { id: '3', title: '[Air] C', status: 'completed' }] }))
    vi.stubGlobal('fetch', buscar)
    expect(await listarItensGoogle('tasks', 'qa/lista', 'qa')).toEqual([
      { id: '1', titulo: 'A', prazo: '2026-11-17' },
      { id: '2', titulo: 'B', prazo: null },
    ])
    const [url] = buscar.mock.calls[1]
    expect(url.pathname).toContain('qa%2Flista')
    expect(url.searchParams.get('pageToken')).toBe('pagina2')
  })

  it('distingue token expirado para interromper novas consultas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))
    await expect(listarItensGoogle('agenda', 'qa', 'token')).rejects.toMatchObject({ expirado: true })
  })
})

import { describe, expect, it } from 'vitest'
import { corPessoa, dataLocal, fmtData, fmtMin, iniciais, montar, primeiroNome, statusPorId, validarFoto } from './dados'

describe('formatação', () => {
  it('fmtMin mostra horas e minutos', () => {
    expect(fmtMin(0)).toBe('0h')
    expect(fmtMin(60)).toBe('1h')
    expect(fmtMin(65)).toBe('1h05')
    expect(fmtMin(-10)).toBe('0h')
  })

  it('fmtData abrevia o mês e aceita vazio', () => {
    expect(fmtData('2026-11-17')).toBe('17 nov')
    expect(fmtData('')).toBe('')
    expect(fmtData(null)).toBe('')
  })

  it('primeiroNome e iniciais', () => {
    expect(primeiroNome({ nome: 'Guilherme Dantas Ueno' })).toBe('Guilherme')
    expect(primeiroNome(undefined)).toBe('a definir')
    expect(iniciais('Guilherme Dantas Ueno')).toBe('GD')
    expect(iniciais('  ana ')).toBe('A')
  })

  it('corPessoa devolve sempre um índice de 0 a 7 e é estável', () => {
    const cor = corPessoa('9d922b72-0bb1-4396-b33a-e3cc1b37f06d')
    expect(cor).toBeGreaterThanOrEqual(0)
    expect(cor).toBeLessThan(8)
    expect(corPessoa('9d922b72-0bb1-4396-b33a-e3cc1b37f06d')).toBe(cor)
  })

  it('statusPorId cai em Backlog para status desconhecido', () => {
    expect(statusPorId('concluido').nome).toBe('Concluído')
    expect(statusPorId('nao-existe').id).toBe('backlog')
  })
})

describe('dataLocal', () => {
  it('usa o dia local, não o UTC (23h do último dia do mês continua no mês)', () => {
    expect(dataLocal(new Date(2026, 10, 30, 23, 30))).toBe('2026-11-30')
    expect(dataLocal(new Date(2027, 0, 1, 0, 5))).toBe('2027-01-01')
  })
})

describe('validarFoto', () => {
  it('aceita imagem pequena e recusa formato ou tamanho inválidos', () => {
    expect(validarFoto({ type: 'image/png', size: 1000 })).toBe('')
    expect(validarFoto({ type: 'application/pdf', size: 1000 })).toMatch(/JPEG, PNG ou WebP/)
    expect(validarFoto({ type: 'image/jpeg', size: 3 * 1024 * 1024 })).toMatch(/2 MB/)
    expect(validarFoto({ type: 'image/jpeg', size: 0 })).toMatch(/2 MB/)
  })
})

describe('montar', () => {
  const base = {
    pessoas: [
      { id: 'p1', nome: 'Ana Souza' },
      { id: 'p2', nome: 'Bruno Lima' },
    ],
    clientes: [{ id: 'c1', nome: 'Cliente' }],
    projetos: [{ id: 'j1', cliente_id: 'c1', codigo: '2026_001', nome: 'Projeto', ativo: true }],
    entregas: [{ id: 'e1', projeto_id: 'j1', titulo: 'Entrega', status: 'andamento', prazo: '2000-01-01' }],
    etapas: [
      { id: 'x2', entrega_id: 'e1', ordem: 2, nome: 'Design', concluida: false, pessoa_id: 'p2' },
      { id: 'x1', entrega_id: 'e1', ordem: 1, nome: 'Conteúdo', concluida: true, pessoa_id: 'p1' },
    ],
    responsaveis: [{ entrega_id: 'e1', pessoa_id: 'p1' }],
    horas: [
      { entrega_id: 'e1', pessoa_id: 'p1', fim: '2026-11-17T10:00:00Z', minutos: 30 },
      { entrega_id: 'e1', pessoa_id: 'p1', fim: null, minutos: 0 },
    ],
    comentarios: [],
  }

  it('ordena etapas e acha a etapa atual', () => {
    const { entregas } = montar(base, 'p2')
    expect(entregas[0].etapas.map((e) => e.nome)).toEqual(['Conteúdo', 'Design'])
    expect(entregas[0].etapaAtual.nome).toBe('Design')
    expect(entregas[0].comigo).toBe(true)
  })

  it('soma só horas fechadas e marca atraso', () => {
    const { entregas } = montar(base, 'p1')
    expect(entregas[0].minutos).toBe(30)
    expect(entregas[0].atrasada).toBe(true)
    expect(entregas[0].emOutraEtapa).toBe(true)
  })

  it('entrega concluída não conta como atrasada e o timer aberto aparece', () => {
    const dados = { ...base, entregas: [{ ...base.entregas[0], status: 'concluido' }] }
    const m = montar(dados, 'p1')
    expect(m.entregas[0].atrasada).toBe(false)
    expect(m.timer).toMatchObject({ pessoa_id: 'p1', fim: null })
  })
})

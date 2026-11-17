import { dataLocal } from './dados'

export function montarPainel({ projetos, entregas, horas, equipePorProjeto }, filtros, diaAtual) {
  const { clienteId, projetoId, equipeId, de, ate } = filtros
  const projetosNoPainel = new Set(projetos.filter((projeto) =>
    (!clienteId || projeto.cliente_id === clienteId) &&
    (!projetoId || projeto.id === projetoId) &&
    (!equipeId || equipePorProjeto[projeto.id]?.equipe?.id === equipeId),
  ).map(({ id }) => id))

  const noPeriodo = (dia) => (!de && !ate) || Boolean(dia && (!de || dia >= de) && (!ate || dia <= ate))
  const porStatus = new Map()
  const atrasadas = []
  let total = 0
  let minutosEstimados = 0

  for (const entrega of entregas) {
    if (!projetosNoPainel.has(entrega.projeto_id) || !noPeriodo(entrega.prazo)) continue
    total += 1
    minutosEstimados += Number(entrega.horas_estimadas || 0) * 60
    porStatus.set(entrega.status, (porStatus.get(entrega.status) || 0) + 1)
    if (entrega.prazo && entrega.prazo < diaAtual && entrega.status !== 'concluido') atrasadas.push(entrega)
  }

  let minutosLancados = 0
  for (const hora of horas) {
    if (!hora.fim || !projetosNoPainel.has(hora.projeto_id)) continue
    if ((!de && !ate) || noPeriodo(dataLocal(new Date(hora.inicio)))) minutosLancados += hora.minutos
  }

  atrasadas.sort((a, b) => a.prazo.localeCompare(b.prazo) || a.titulo.localeCompare(b.titulo))
  return { total, porStatus, atrasadas, minutosEstimados, minutosLancados }
}

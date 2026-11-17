// Tema claro ou escuro. A escolha fica só neste navegador (localStorage) e o CSS reage ao atributo data-tema.
const CHAVE = 'air-tema'

export function lerTema() {
  try {
    return localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro'
  } catch (e) {
    return 'claro'
  }
}

export function aplicarTema(tema) {
  const escolhido = tema === 'escuro' ? 'escuro' : 'claro'
  document.documentElement.setAttribute('data-tema', escolhido)
  try {
    localStorage.setItem(CHAVE, escolhido)
  } catch (e) {
    // Navegador sem armazenamento (modo privado): o tema vale só até recarregar.
  }
}

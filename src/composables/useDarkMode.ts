import { ref, watch } from 'vue'

const STORAGE_KEY = 'core-tanga:color-mode'
type Mode = 'light' | 'dark' | 'system'

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function computeIsDark(mode: Mode): boolean {
  return mode === 'dark' || (mode === 'system' && systemPrefersDark())
}

const stored = (typeof window !== 'undefined'
  ? (window.localStorage.getItem(STORAGE_KEY) as Mode | null)
  : null) ?? 'system'

const mode = ref<Mode>(stored)
// Etat sombre reactif (consomme par l'UI ET par le theme des graphiques echarts).
const isDark = ref<boolean>(computeIsDark(stored))

function apply(m: Mode) {
  const dark = computeIsDark(m)
  document.documentElement.classList.toggle('dark', dark)
  isDark.value = dark
}

apply(mode.value)

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (mode.value === 'system') apply('system')
  })
}

watch(mode, (m) => {
  try { window.localStorage.setItem(STORAGE_KEY, m) } catch { /* ignore */ }
  apply(m)
})

export function useDarkMode() {
  function setMode(m: Mode) { mode.value = m }
  function toggle() { mode.value = isDark.value ? 'light' : 'dark' }
  return { mode, setMode, toggle, isDark }
}

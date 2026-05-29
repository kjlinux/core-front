import { ref, watch } from 'vue'

const STORAGE_KEY = 'core-tanga:color-mode'
type Mode = 'light' | 'dark' | 'system'

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function apply(mode: Mode) {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
}

const stored = (typeof window !== 'undefined'
  ? (window.localStorage.getItem(STORAGE_KEY) as Mode | null)
  : null) ?? 'system'

const mode = ref<Mode>(stored)
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
  function toggle() {
    const isDark = document.documentElement.classList.contains('dark')
    mode.value = isDark ? 'light' : 'dark'
  }
  const isDark = () => document.documentElement.classList.contains('dark')
  return { mode, setMode, toggle, isDark }
}

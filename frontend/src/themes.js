// Theme template: add a look by adding one entry to THEMES (and its name to locales `theme.<id>`).
// - dark:    toggles PrimeVue dark mode (class `app-dark` on <html>)
// - shift:   (optional) darkens the primary palette by n steps for contrast on light looks
// - primary / surface: PrimeVue palette names used for components (primary-50..950, surface-0..950)
// - vars:    app-level CSS variables used by our own CSS (see App.vue)
import { ref } from 'vue'

export const THEMES = {
  daylight: {
    dark: false, primary: 'teal', shift: 1, surface: 'zinc',
    vars: { bg: '#f6f7f8', panel: '#ffffff', text: '#1f2933', muted: '#6b7280', border: '#d9dde1', accent: '#0f766e', danger: '#b00020', warn: '#fff8e1', stage: '#222a30' },
  },
  parchment: {
    dark: false, primary: 'amber', shift: 2, surface: 'stone',
    vars: { bg: '#efe4cc', panel: '#f8f0dd', text: '#3b2a1a', muted: '#7a6650', border: '#cdb98f', accent: '#8a4b0f', danger: '#9b1c1c', warn: '#f3dfa6', stage: '#3b2a1a' },
  },
  midnight: {
    dark: true, primary: 'indigo', surface: 'slate',
    vars: { bg: '#0f1420', panel: '#1a2133', text: '#e4e8f1', muted: '#9aa5bd', border: '#2d3750', accent: '#8ea2ff', danger: '#ff8a8a', warn: '#3a3320', stage: '#05070d' },
  },
  dungeon: {
    dark: true, primary: 'orange', surface: 'neutral',
    vars: { bg: '#141210', panel: '#211d19', text: '#eadfd0', muted: '#a89a88', border: '#3a322a', accent: '#f08a3c', danger: '#ff7b6b', warn: '#3d2e17', stage: '#070605' },
  },
  forest: {
    dark: true, primary: 'emerald', surface: 'zinc',
    vars: { bg: '#10170f', panel: '#1a241a', text: '#e2ecdc', muted: '#9bb092', border: '#2c3d2a', accent: '#5fd08c', danger: '#ff8f8f', warn: '#33351a', stage: '#060906' },
  },
}
export const THEME_IDS = ['auto', ...Object.keys(THEMES)]

const KEY = 'ttrpg.theme'
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const read = () => { try { return localStorage.getItem(KEY) } catch { return null } }
export const themeChoice = ref(THEME_IDS.includes(read()) ? read() : 'auto')

const prefersDark = () => globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
const resolve = (id) => (id === 'auto' ? (prefersDark() ? 'midnight' : 'daylight') : id)

export function applyTheme(id = themeChoice.value) {
  const t = THEMES[resolve(id)]
  const root = document.documentElement
  root.classList.toggle('app-dark', t.dark)
  root.style.colorScheme = t.dark ? 'dark' : 'light'
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(`--app-${k}`, v)
  SHADES.forEach((s, i) => {
    const ps = SHADES[Math.min(i + (t.shift ?? 0), SHADES.length - 1)]
    root.style.setProperty(`--p-primary-${s}`, `var(--p-${t.primary}-${ps})`)
    root.style.setProperty(`--p-surface-${s}`, `var(--p-${t.surface}-${s})`)
  })
  root.style.setProperty('--p-surface-0', '#ffffff')
}

export function setTheme(id) {
  themeChoice.value = id
  try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
  applyTheme(id)
}

export function initTheme() {
  applyTheme()
  globalThis.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => themeChoice.value === 'auto' && applyTheme())
}

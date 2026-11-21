// Theme template: add a look by adding one entry to THEMES (and its name to locales `theme.<id>`).
// - dark:    toggles PrimeVue dark mode (class `app-dark` on <html>)
// - shift:   (optional) darkens the primary palette by n steps for contrast on light looks
// - primary / surface: PrimeVue palette names used for components (primary-50..950, surface-0..950)
// - vars:    app-level CSS variables used by our own CSS (see App.vue)
import { ref } from 'vue'

// Palettes target WCAG AAA-ish text contrast (>=7:1 body, >=4.5:1 muted) and >=3:1 for borders/UI.
// Accents are blue/orange/yellow (colour-blind safe); red is only ever used together with a text label.
export const THEMES = {
  daylight: {
    dark: false, primary: 'blue', shift: 2, surface: 'slate', bw: '1px',
    vars: { bg: '#dfe5ec', panel: '#ffffff', text: '#0a0f1a', muted: '#3a4556', border: '#5f6b7c', accent: '#0b4fa8', danger: '#a8001a', warn: '#ffe9a8', stage: '#1a2028' },
  },
  parchment: {
    dark: false, primary: 'orange', shift: 3, surface: 'stone', bw: '1px',
    vars: { bg: '#dcc89a', panel: '#fbf5e4', text: '#24160a', muted: '#54402a', border: '#7a5f38', accent: '#7a3a00', danger: '#9d1010', warn: '#f0d27a', stage: '#2a1c0e' },
  },
  midnight: {
    dark: true, primary: 'indigo', surface: 'slate', bw: '1px',
    vars: { bg: '#04070f', panel: '#16203a', text: '#f4f7ff', muted: '#b9c4de', border: '#7081ab', accent: '#a9bbff', danger: '#ff9a9a', warn: '#4a3d12', stage: '#000000' },
  },
  dungeon: {
    dark: true, primary: 'orange', surface: 'neutral', bw: '1px',
    vars: { bg: '#080605', panel: '#211a14', text: '#fbf2e6', muted: '#d2c2aa', border: '#947a58', accent: '#ffa24d', danger: '#ff9b8a', warn: '#4a3411', stage: '#000000' },
  },
  contrastLight: {
    dark: false, primary: 'blue', shift: 3, surface: 'neutral', bw: '2px',
    vars: { bg: '#ffffff', panel: '#ffffff', text: '#000000', muted: '#1a1a1a', border: '#000000', accent: '#0033cc', danger: '#b00000', warn: '#ffec99', stage: '#000000' },
  },
  contrastDark: {
    dark: true, primary: 'yellow', surface: 'neutral', bw: '2px',
    vars: { bg: '#000000', panel: '#000000', text: '#ffffff', muted: '#ececec', border: '#ffffff', accent: '#ffe14d', danger: '#ff8f8f', warn: '#3a3300', stage: '#000000' },
  },
}
export const THEME_IDS = ['auto', ...Object.keys(THEMES)]

const KEY = 'ttrpg.theme'
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const read = () => { try { return localStorage.getItem(KEY) } catch { return null } }
export const themeChoice = ref(THEME_IDS.includes(read()) ? read() : 'auto')

const prefersDark = () => globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
const prefersMore = () => globalThis.matchMedia?.('(prefers-contrast: more)').matches
const resolve = (id) => {
  if (id !== 'auto') return id
  if (prefersMore()) return prefersDark() ? 'contrastDark' : 'contrastLight'
  return prefersDark() ? 'midnight' : 'daylight'
}

export function applyTheme(id = themeChoice.value) {
  const t = THEMES[resolve(id)]
  const root = document.documentElement
  root.classList.toggle('app-dark', t.dark)
  root.style.setProperty('--app-bw', t.bw)
  root.style.colorScheme = t.dark ? 'dark' : 'light'
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(`--app-${k}`, v)
  SHADES.forEach((s, i) => {
    const ps = SHADES[Math.min(i + (t.shift ?? 0), SHADES.length - 1)]
    root.style.setProperty(`--p-primary-${s}`, `var(--p-${t.primary}-${ps})`)
    root.style.setProperty(`--p-surface-${s}`, `var(--p-${t.surface}-${s})`)
  })
  root.style.setProperty('--p-surface-0', '#ffffff')
  // form fields / danger text must meet 3:1 (borders) and 4.5:1 (text) in every look
  for (const f of ['inputtext', 'select', 'textarea']) {
    root.style.setProperty(`--p-${f}-border-color`, t.vars.border)
    root.style.setProperty(`--p-${f}-hover-border-color`, t.vars.accent)
    root.style.setProperty(`--p-${f}-placeholder-color`, t.vars.muted)
  }
  root.style.setProperty('--p-button-text-danger-color', t.vars.danger)
}

export function setTheme(id) {
  themeChoice.value = id
  try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
  applyTheme(id)
}

export function initTheme() {
  applyTheme()
  for (const q of ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'])
    globalThis.matchMedia?.(q).addEventListener?.('change', () => themeChoice.value === 'auto' && applyTheme())
}

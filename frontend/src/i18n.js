import { createI18n } from 'vue-i18n'
import en from './locales/en.json'

// Add a language: create src/locales/<code>.json (copy en.json) and register it in `messages`.
export default createI18n({
  legacy: false,
  locale: (() => { try { return localStorage.getItem('ttrpg.lang') } catch { return null } })() || 'en',
  fallbackLocale: 'en',
  messages: { en },
})

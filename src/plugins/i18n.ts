import { createI18n } from 'vue-i18n'
import fr from '@/locales/fr'
import en from '@/locales/en'

const savedLocale = (localStorage.getItem('app_locale') as 'fr' | 'en') ?? 'fr'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'fr',
  messages: { fr, en },
})

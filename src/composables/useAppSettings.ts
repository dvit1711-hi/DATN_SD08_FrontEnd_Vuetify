import { ref, computed } from 'vue'
import i18n from '@/i18n'

export type AppLanguage = 'vi' | 'en'
export type AppTheme = 'light' | 'dark'

const savedLanguage = localStorage.getItem('language')
const savedTheme = localStorage.getItem('appTheme')

const language = ref<AppLanguage>(savedLanguage === 'en' ? 'en' : 'vi')
const appTheme = ref<AppTheme>(savedTheme === 'dark' ? 'dark' : 'light')

const setLanguage = (lang: AppLanguage) => {
  language.value = lang
  localStorage.setItem('language', lang)
  i18n.global.locale.value = lang
}

const setAppTheme = (theme: AppTheme) => {
  appTheme.value = theme
  localStorage.setItem('appTheme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

const toggleTheme = () => {
  setAppTheme(appTheme.value === 'light' ? 'dark' : 'light')
}

const currentLanguageLabel = computed(() => {
  return language.value === 'vi' ? 'Tiếng Việt' : 'English'
})

const currentThemeLabel = computed(() => {
  return appTheme.value === 'light' ? 'Sáng' : 'Tối'
})

setLanguage(language.value)
setAppTheme(appTheme.value)

export function useAppSettings() {
  return {
    language,
    appTheme,
    currentLanguageLabel,
    currentThemeLabel,
    setLanguage,
    setAppTheme,
    toggleTheme,
  }
}
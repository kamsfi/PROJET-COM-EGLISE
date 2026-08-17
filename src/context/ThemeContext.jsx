import { createContext, useCallback, useContext, useState } from 'react'

const ThemeContext = createContext(null)

export const THEME_STORAGE_KEY = 'comhub_theme'

// Lit/applique le thème AVANT le premier rendu React (voir l'appel
// identique dans main.jsx) — évite un flash de l'autre thème à l'affichage.
export function applyStoredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  const theme = stored === 'light' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme
  return theme
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => document.documentElement.dataset.theme || 'dark')

  const setTheme = useCallback((next) => {
    document.documentElement.dataset.theme = next
    localStorage.setItem(THEME_STORAGE_KEY, next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

'use client'

import { useState, useEffect } from 'react'

const KEY = 'cgpt_theme'

export function useCGPTTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    if (stored === 'light' || stored === 'dark') setThemeState(stored)
  }, [])

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t)
    localStorage.setItem(KEY, t)
  }

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, toggle, isDark: theme === 'dark' }
}

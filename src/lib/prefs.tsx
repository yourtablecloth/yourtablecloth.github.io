import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Locale } from '../content/site'
import { persistLocale, readLocale } from './locale'

export type Theme = 'dark' | 'light'

type Prefs = {
  locale: Locale
  theme: Theme
  setLocale: (locale: Locale) => void
  setTheme: (theme: Theme) => void
}

const PrefsContext = createContext<Prefs | null>(null)

const THEME_KEY = 'tc.theme'

/**
 * Runs before first paint (injected into <head>) so the document never flashes
 * the wrong theme. Theme is safe to resolve client-side because it only toggles
 * a class on <html> — no rendered text depends on it. Locale cannot use this
 * trick: it changes the markup, and patching prerendered markup before React
 * hydrates it is a mismatch, so it waits for the effect below instead.
 *
 * Dark is the default: the hero is a red cloth on a dark table, and the whole
 * page is composed around that surface. Light — a clean linen tabletop — is a
 * first-class toggle. `.light` is the opt-in class so the default markup and
 * the prerendered output stay byte-identical.
 */
/*
 * `tc-undecided` is the permission slip for the scroll-driven uncover.
 *
 * It says the reader has never expressed a theme preference, which is the
 * only condition under which the cloth is allowed to move the document's
 * surface (see app.css). It has to be resolved here, in the same pre-paint
 * script as the theme itself, because localStorage is the only place that
 * distinguishes "defaulted to dark" from "chose dark" — by the time CSS sees
 * the page, both are just the absence of `.light`.
 */
export const THEME_BOOTSTRAP = `(()=>{try{
var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});
if(t==='light')document.documentElement.classList.add('light');
if(t!=='light'&&t!=='dark')document.documentElement.classList.add('tc-undecided');
}catch(_){}})()`

export function PrefsProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  // SSR renders the dark default; THEME_BOOTSTRAP has already applied any stored
  // preference to <html> before paint, and the effect below syncs React's copy
  // without ever changing rendered text.
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') setThemeState(stored)
  }, [])

  /*
   * Locale cannot be resolved before paint the way theme can.
   *
   * Theme is a class on <html>, so a pre-paint script settles it and no
   * rendered text ever changes. Locale changes the markup itself, and the
   * markup is prerendered — one file for every reader — so the document
   * always starts in the default locale and a reader who chose the other one
   * sees it swap on the commit after hydration. Applying it any earlier would
   * mean patching text the server already rendered, which is the hydration
   * mismatch this deliberately avoids.
   */
  useEffect(() => {
    const stored = readLocale()
    if (stored === initialLocale) return
    setLocaleState(stored)
    document.documentElement.lang = stored
  }, [initialLocale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    document.documentElement.lang = next
    persistLocale(next)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.classList.toggle('light', next === 'light')
    // The reader has now said which surface they want, so the cloth loses its
    // permission to say otherwise — in either direction, and for good.
    document.documentElement.classList.remove('tc-undecided')
    document.documentElement.removeAttribute('data-surface')
    localStorage.setItem(THEME_KEY, next)
  }, [])

  const value = useMemo(
    () => ({ locale, theme, setLocale, setTheme }),
    [locale, theme, setLocale, setTheme],
  )

  return <PrefsContext value={value}>{children}</PrefsContext>
}

export function usePrefs() {
  const prefs = use(PrefsContext)
  if (!prefs) throw new Error('usePrefs must be used inside <PrefsProvider>')
  return prefs
}

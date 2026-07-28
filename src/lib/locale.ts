import { LOCALES, type Locale } from '../content/site'

export const LOCALE_COOKIE = 'tc_locale'
/** Korean is the project's own language; English is the opt-in. */
export const DEFAULT_LOCALE: Locale = 'ko'
/** One year; the preference is trivial and non-personal. */
const MAX_AGE = 60 * 60 * 24 * 365

/**
 * The reader's language preference, or the default when they have no opinion.
 *
 * This used to be resolved from a cookie on the server so the first byte of
 * HTML already carried the right `lang` and the right copy. A static host
 * cannot do that: every visitor gets the same prerendered file, so the markup
 * is always the default locale and the preference can only be applied once
 * the document is running. `PrefsProvider` does exactly that, one commit after
 * hydration — see lib/prefs.tsx for what that costs and why it is still a
 * cookie rather than localStorage.
 *
 * Returns the default off-document (prerender, and any client navigation is
 * still a document) rather than throwing, so route `beforeLoad` can call it
 * from either side without branching.
 */
export function readLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const match = document.cookie.match(/(?:^|;\s*)tc_locale=([^;]*)/)
  const value = match?.[1]
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : DEFAULT_LOCALE
}

export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${MAX_AGE};samesite=lax`
}

/**
 * Which browser the reader did not choose.
 *
 * A link pasted into KakaoTalk, Instagram or Naver opens in that app's own
 * WebView, never in the browser the reader configured. For a page of static
 * text that is a detail; for a page that runs a cloth simulation it is the
 * difference between the site working and the site being reported as broken —
 * the first phone recording of this page came from KakaoTalk's WebView and
 * measured about 20fps with a 1.35-second stall.
 *
 * Detection is by user agent, which is the only signal these apps give. That
 * is normally a bad idea and it is the right one here: the question is not
 * "what engine is this" (feature detection answers that) but "did a specific
 * app put a WebView in front of my page", and the app's own token in the UA
 * string is the literal answer.
 *
 * The list is deliberately short. Every entry is an app whose share of Korean
 * link traffic is large enough to matter, and each is matched on the token the
 * app actually appends rather than on a guess.
 */

/** Apps that wrap links in their own WebView, by the token each appends. */
const IN_APP = [
  /KAKAOTALK/i,
  /NAVER\(inapp/i,
  /\bDaumApps\b/i,
  /Instagram/i,
  /\bFBAN\b|\bFBAV\b|\bFB_IAB\b/i,
  /\bLine\//i,
  /\bKAKAOSTORY\b/i,
  /\bwhale\b.*\binapp\b/i,
  /\bEveryTimeApp\b/i,
]

export type InAppKind = 'kakao' | 'android' | 'ios' | null

/**
 * `null` for a real browser. Otherwise which escape route exists:
 *
 *   kakao    KakaoTalk on Android — it publishes a scheme that hands the URL
 *            to the system browser, which is the cleanest exit available.
 *   android  any other in-app WebView on Android — `intent://` can name a
 *            browser package directly.
 *   ios      iOS has no equivalent call. Every scheme that claims to do this
 *            either silently fails or is a private one Apple rejects, so the
 *            only honest answer there is to tell the reader which menu item
 *            to press and to make the URL easy to copy.
 */
export function detectInApp(userAgent: string): InAppKind {
  if (!IN_APP.some((pattern) => pattern.test(userAgent))) return null
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  if (/KAKAOTALK/i.test(userAgent)) return 'kakao'
  return 'android'
}

/**
 * Hands the current URL to a real browser, where the platform allows it.
 *
 * Returns false when there is nothing to try, so the caller can fall back to
 * telling the reader what to press instead of firing a navigation that does
 * nothing and looks like a broken button.
 */
export function escapeInApp(kind: InAppKind): boolean {
  if (typeof window === 'undefined') return false
  const url = window.location.href

  if (kind === 'kakao') {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
    return true
  }

  if (kind === 'android') {
    // `intent://` needs the URL without its scheme, and carries the scheme as
    // a parameter instead. `S.browser_fallback_url` is what keeps a device
    // with no Chrome from landing on an empty screen.
    const stripped = url.replace(/^https?:\/\//, '')
    const scheme = window.location.protocol.replace(':', '')
    window.location.href =
      `intent://${stripped}#Intent;scheme=${scheme};package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`
    return true
  }

  return false
}

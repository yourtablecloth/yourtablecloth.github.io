import { isValidElement, type ReactNode } from 'react'

/**
 * Markdown rendering support.
 *
 * Doc bodies render through react-markdown + remark-gfm (tables, nested lists,
 * autolinks — everything a hand-rolled parser would risk mangling). rehype-raw
 * is deliberately never wired in, so raw HTML from the source Bootstrap markup
 * never reaches the DOM as real elements; `skipHtml` on the renderer drops
 * whatever slips past the transforms below as inert text is never shown.
 *
 * What lives here are the source-string-level transforms that run *before*
 * react-markdown ever sees the text: pulling the `# Title` line out for the
 * page's own <h1>, turning the source docs' few inline HTML anchors/emphasis
 * into real markdown, dropping HTML comments, and excising the two multi-line
 * Bootstrap card/button blocks (install.md, sponsor.md) whose content is
 * re-authored as real components in docs.$slug.tsx rather than salvaged
 * generically — they nest deep enough that unwrapping them in place would trip
 * CommonMark's 4-space indented-code-block rule.
 */

/** Pulls the leading `# Title` line out of a doc; it becomes the page's own <h1>. */
export function extractTitle(source: string): { title: string; body: string } {
  const normalized = source.replace(/\r\n/g, '\n')
  const match = normalized.match(/^#[ \t]+(.+)\n+/)
  if (!match) return { title: '', body: normalized }
  return { title: match[1].trim(), body: normalized.slice(match[0].length) }
}

/**
 * Safe, whole-document cleanup: drops HTML comments, turns the handful of
 * inline `<a>`/`<strong>` tags the source docs use into real markdown, and
 * unwraps `<small>`/`<span>`/`<em>`/`<b>`/`<i>` pairs down to their text
 * (wherever they sit — including inside a GFM table cell). None of this
 * touches legitimate markdown list or code-fence indentation: every rule only
 * ever matches a literal `<…>` sequence.
 *
 * The link destination is wrapped in `<>` because at least one source anchor
 * (a mailto with an unencoded `?subject=` query) contains raw spaces, which
 * CommonMark's bare `(destination)` form can't carry.
 */
export function preprocessDocBody(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<a\s+(?:[^>]*?\s)?href=(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/a>/gi, '[$3](<$2>)')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<(small|span|em|b|i)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Cuts a known multi-line HTML block (found by a literal marker substring)
 * out of `source`, returning the markdown immediately before and after it.
 * Used only for the two docs whose Bootstrap card/button blocks get a
 * hand-authored replacement — everywhere else `preprocessDocBody` alone is
 * enough. Falls back to treating the whole source as `after` if the marker
 * is ever missing, so a stale marker degrades to "cards render in the wrong
 * place" rather than silently deleting content.
 */
export function splitAroundHtmlBlock(source: string, marker: string): { before: string; after: string } {
  const start = source.indexOf(marker)
  if (start === -1) return { before: '', after: source }
  const blankAt = source.indexOf('\n\n', start)
  const end = blankAt === -1 ? source.length : blankAt
  return {
    before: source.slice(0, start).trimEnd(),
    after: source.slice(end).trimStart(),
  }
}

/** Extracts the target slug from a cross-doc `.md` href, or null if it isn't one. */
export function mdLinkSlug(href: string): string | null {
  const cleaned = href.replace(/^\.\//, '')
  const match = cleaned.match(/^([\w-]+)\.md$/i)
  return match ? match[1] : null
}

/**
 * Resolves an image source in a doc body against where this site serves it.
 *
 * The markdown is the project's own, and writes `images/Step1.png` relative to
 * the docs directory it lives in. Those files ship in public/docs/images, so
 * the same relative name resolves to a real file at the same URL the project's
 * docs have always used — which is also what the absolute link to
 * yourtablecloth.app that used to be here resolved to, except that one made
 * every local build and every preview load its screenshots from production.
 */
export function resolveAssetSrc(src: string): string {
  if (/^https?:\/\//i.test(src)) return src
  return `/docs/${src.replace(/^\.?\//, '')}`
}

/** Slugifies heading text for anchor ids. Korean passes through untouched; emoji and
 *  punctuation are treated as separators; an empty result falls back to a positional id. */
export function slugifyHeading(text: string, index: number): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `h-${index}`
}

/** Flattens a rendered node tree back to plain text — used to derive heading ids. */
export function childrenToText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(childrenToText).join('')
  if (isValidElement<{ children?: ReactNode }>(children)) return childrenToText(children.props.children)
  return ''
}

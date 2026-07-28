import { Link, createFileRoute } from '@tanstack/react-router'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { findDoc } from '../content/docs'
import { COPY } from '../content/site'
import { SPONSORS } from '../data/sponsors'
import { usePrefs } from '../lib/prefs'
import {
  childrenToText,
  extractTitle,
  mdLinkSlug,
  preprocessDocBody,
  resolveAssetSrc,
  slugifyHeading,
  splitAroundHtmlBlock,
} from '../lib/markdown'
import styles from '../components/docs/Docs.module.css'

export const Route = createFileRoute('/docs/$slug')({
  head: ({ match, params }) => {
    const locale = match.context.locale
    const doc = findDoc(params.slug)
    return {
      meta: [
        { title: `${doc ? doc.title[locale] : COPY.docs.notFoundTitle[locale]} — ${locale === 'ko' ? '식탁보®' : 'TableCloth®'}` },
        { name: 'description', content: doc ? doc.summary[locale] : COPY.docs.notFoundBody[locale] },
      ],
    }
  },
  component: DocSlugPage,
})

/**
 * The two doc bodies whose source carries a Bootstrap card/button block
 * instead of plain markdown. Their content is re-authored as real components
 * below (InstallChoices, SponsorCtas) rather than salvaged generically — see
 * lib/markdown.ts for why. Markers are literal substrings from the actual
 * source files, used only to cut the block out of the flow at the right spot.
 */
const INSTALL_CARDS_MARKER = '<div class="row g-4 my-2">'
const SPONSOR_BUTTONS_MARKER = '<p style="display: flex; gap: 12px; flex-wrap: wrap; margin: 24px 0;">'
const SPONSOR_NOTE_MARKER = '<small style="color: #6c757d;">버튼을 누르면'
/*
 * The pair of empty HTML comments at the end of sponsor.md. The deploy
 * workflow fills the gap between them with generated avatar markup; we cut the
 * whole thing out and render the same data ourselves (SponsorWall), because
 * this renderer drops raw HTML and because the list is already typed data by
 * the time it reaches here.
 */
const SPONSOR_LIST_MARKER = '<!-- sponsors -->'

function DocSlugPage() {
  const { slug } = Route.useParams()
  const { locale } = usePrefs()
  const doc = findDoc(slug)

  if (!doc) {
    return (
      <div className={styles.notFound}>
        <h1>{COPY.docs.notFoundTitle[locale]}</h1>
        <p>{COPY.docs.notFoundBody[locale]}</p>
        <Link className={styles.backLink} to="/docs">
          {COPY.docs.backToIndex[locale]}
        </Link>
      </div>
    )
  }

  const { title, body } = extractTitle(doc.source)

  return (
    <article className={styles.prose}>
      <h1>{title}</h1>
      <DocBody slug={doc.slug} body={body} />
    </article>
  )
}

function DocBody({ slug, body }: { slug: string; body: string }) {
  let headingIndex = 0
  const components: Components = {
    h2: ({ children }) => {
      const id = slugifyHeading(childrenToText(children), headingIndex++)
      return (
        <h2 id={id} className={styles.h2}>
          {children}
        </h2>
      )
    },
    h3: ({ children }) => {
      const id = slugifyHeading(childrenToText(children), headingIndex++)
      return (
        <h3 id={id} className={styles.h3}>
          {children}
        </h3>
      )
    },
    p: ({ children }) => <p className={styles.p}>{children}</p>,
    ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
    ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
    li: ({ children }) => <li className={styles.li}>{children}</li>,
    blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
    code: ({ children }) => <code className={styles.code}>{children}</code>,
    pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
    hr: () => <hr className={styles.hr} />,
    table: ({ children }) => (
      <div className={styles.tableWrap}>
        <table className={styles.table}>{children}</table>
      </div>
    ),
    tr: ({ children }) => <tr className={styles.tr}>{children}</tr>,
    th: ({ children }) => <th className={styles.th}>{children}</th>,
    td: ({ children }) => <td className={styles.td}>{children}</td>,
    img: ({ src, alt }) => (
      <img
        className={styles.img}
        src={typeof src === 'string' ? resolveAssetSrc(src) : src}
        alt={alt ?? ''}
        loading="lazy"
        decoding="async"
      />
    ),
    a: ({ href, children }) => {
      const url = href ?? ''
      if (url.startsWith('mailto:') || url.startsWith('tel:')) {
        return (
          <a className={styles.link} href={url}>
            {children}
          </a>
        )
      }
      const slugParam = mdLinkSlug(url)
      if (slugParam) {
        return (
          <Link className={styles.link} to="/docs/$slug" params={{ slug: slugParam }}>
            {children}
          </Link>
        )
      }
      return (
        <a className={styles.link} href={url} target="_blank" rel="noopener">
          {children}
        </a>
      )
    },
  }

  if (slug === 'install') {
    const { before, after } = splitAroundHtmlBlock(body, INSTALL_CARDS_MARKER)
    return (
      <>
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
          {preprocessDocBody(before)}
        </ReactMarkdown>
        <InstallChoices />
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
          {preprocessDocBody(after)}
        </ReactMarkdown>
      </>
    )
  }

  if (slug === 'sponsor') {
    const step1 = splitAroundHtmlBlock(body, SPONSOR_BUTTONS_MARKER)
    const step2 = splitAroundHtmlBlock(step1.after, SPONSOR_NOTE_MARKER)
    const step3 = splitAroundHtmlBlock(step2.after, SPONSOR_LIST_MARKER)
    return (
      <>
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
          {preprocessDocBody(step1.before)}
        </ReactMarkdown>
        <SponsorCtas />
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
          {preprocessDocBody(step3.before)}
        </ReactMarkdown>
        <SponsorWall />
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
          {preprocessDocBody(step3.after)}
        </ReactMarkdown>
      </>
    )
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
      {preprocessDocBody(body)}
    </ReactMarkdown>
  )
}

/**
 * install.md's two-card OS chooser, re-authored from the Bootstrap markup it
 * replaces. Text is copied verbatim from the source (including the emphasis
 * and the "NEW" badge, exactly as the doc itself writes it) — only the markup
 * changed.
 */
function InstallChoices() {
  return (
    <div className={styles.choices}>
      <div className={styles.choiceCard}>
        <div className={styles.choiceEmoji} aria-hidden="true">
          🪟
        </div>
        <p className={styles.choiceHeading}>Windows</p>
        <p className={styles.choiceDescription}>
          Windows 11 Pro / Enterprise / Education에 내장된 <strong>Windows 샌드박스</strong>를 사용합니다. 기능만
          켜면 무료로 바로 시작할 수 있어요.
        </p>
        <Link className={styles.choiceCta} to="/docs/$slug" params={{ slug: 'install-windows' }}>
          🪟 Windows 설치 가이드
        </Link>
      </div>
      <div className={styles.choiceCard}>
        <div className={styles.choiceEmoji} aria-hidden="true">
          🍎
        </div>
        <p className={styles.choiceHeading}>
          macOS <span className={styles.sidebarBadge}>NEW</span>
        </p>
        <p className={styles.choiceDescription}>
          Windows 샌드박스를 macOS로 포팅한 <strong>macSandbox</strong>를 사용합니다. Apple Silicon 기반 맥에서 사용할
          수 있어요. (인텔 맥 미지원)
        </p>
        <Link className={styles.choiceCta} to="/docs/$slug" params={{ slug: 'install-macos' }}>
          🍎 macOS 설치 가이드
        </Link>
      </div>
    </div>
  )
}

/**
 * sponsor.md's donation buttons plus their caption, re-authored the same way.
 * URLs and labels are copied verbatim from the source.
 */
function SponsorCtas() {
  return (
    <div className={styles.sponsorCtas}>
      <div className={styles.sponsorButtons}>
        <a
          className={`${styles.sponsorButton} ${styles.sponsorButtonPrimary}`}
          href="https://github.com/sponsors/yourtablecloth?frequency=recurring&sponsor=yourtablecloth"
          target="_blank"
          rel="noopener"
        >
          월 후원 (지속 유지 지원)
        </a>
        <a
          className={`${styles.sponsorButton} ${styles.sponsorButtonOutline}`}
          href="https://github.com/sponsors/yourtablecloth?frequency=one-time&sponsor=yourtablecloth"
          target="_blank"
          rel="noopener"
        >
          1회 후원 (이번 시즌 사용 분담)
        </a>
      </div>
      <p className={styles.sponsorNote}>
        버튼을 누르면 GitHub Sponsors 페이지로 이동합니다. 이동 후 원하시는 금액을 선택하여 후원하실 수 있습니다.
        결제는 GitHub에서 안전하게 처리됩니다.
      </p>
    </div>
  )
}

/**
 * The sponsor list, where sponsor.md's `<!-- sponsors -->` markers sit.
 *
 * Same data and same treatment as the home page's Support section — avatars
 * that link to the profile GitHub already lists publicly, and a count for
 * everyone who chose privacy. Nothing is fetched here: the list is generated
 * into public/sponsors.json at deploy time and imported (src/data/sponsors.ts).
 *
 * Renders nothing at all when the file is empty, which is what the deploy
 * workflow writes if the API call fails and it has no last-deployed copy to
 * fall back to. An empty avatar strip would read as "nobody sponsors this".
 */
function SponsorWall() {
  const { locale } = usePrefs()

  if (SPONSORS.people.length === 0 && SPONSORS.anonymousCount === 0) return null

  return (
    <div className={styles.sponsorWall}>
      <ul className={styles.sponsorAvatars}>
        {SPONSORS.people.map((person) => (
          <li key={person.login}>
            <a
              className={styles.sponsorAvatarLink}
              href={person.profileUrl}
              target="_blank"
              rel="noopener"
              title={`${person.login} · ${COPY.support.sinceLabel[locale]} ${person.since}`}
            >
              <img
                className={styles.sponsorAvatar}
                src={person.avatarUrl}
                alt={person.login}
                width={48}
                height={48}
                loading="lazy"
              />
            </a>
          </li>
        ))}
        {SPONSORS.anonymousCount > 0 && (
          <li>
            <span
              className={styles.sponsorAnonymous}
              role="img"
              aria-label={`+${SPONSORS.anonymousCount} ${COPY.support.anonymousLabel[locale]}`}
            >
              +{SPONSORS.anonymousCount}
            </span>
          </li>
        )}
      </ul>
      <p className={styles.sponsorAsOf}>
        {COPY.project.asOf[locale]} {SPONSORS.asOf}
      </p>
    </div>
  )
}

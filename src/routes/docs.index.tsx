import { Link, createFileRoute } from '@tanstack/react-router'

import { COPY, type Locale } from '../content/site'
import { DOCS, type DocEntry } from '../content/docs'
import { usePrefs } from '../lib/prefs'
import styles from '../components/docs/Docs.module.css'

export const Route = createFileRoute('/docs/')({
  head: ({ match }) => {
    const locale = match.context.locale
    return {
      meta: [
        { title: `${COPY.docs.title[locale]} — ${locale === 'ko' ? '식탁보®' : 'TableCloth®'}` },
        { name: 'description', content: COPY.docs.description[locale] },
      ],
    }
  },
  component: DocsIndex,
})

function DocsIndex() {
  const { locale } = usePrefs()

  return (
    <article>
      <h1 className={styles.indexTitle}>{COPY.docs.title[locale]}</h1>
      <p className={styles.indexIntro}>{COPY.docs.description[locale]}</p>
      <div className={styles.indexGrid}>
        {DOCS.map((doc) => (
          <DocsIndexCard key={doc.slug} doc={doc} locale={locale} />
        ))}
      </div>
    </article>
  )
}

function DocsIndexCard({ doc, locale }: { doc: DocEntry; locale: Locale }) {
  const badge = doc.badge?.[locale]

  return (
    <Link className={styles.indexCard} to="/docs/$slug" params={{ slug: doc.slug }}>
      <p className={styles.indexCardHeading}>
        {badge ? <span className={styles.sidebarBadge}>{badge}</span> : null}
        {doc.title[locale]}
      </p>
      <p className={styles.indexCardSummary}>{doc.summary[locale]}</p>
    </Link>
  )
}

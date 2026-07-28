import sponsorsFile from '../../public/sponsors.json'

/**
 * Who is sponsoring the project, read at build time from the file the deploy
 * workflow generates.
 *
 * `public/sponsors.json` is written from the GitHub Sponsors GraphQL API by
 * .github/workflows/deploy.yml — on every deploy and again every Sunday — and
 * then copied to the site root, so it is both this module's input and the
 * published https://yourtablecloth.app/sponsors.json that has always been
 * there. Importing it means the list is baked into the HTML: no token reaches
 * the browser, no request is made to render the page, and the committed file
 * is what a local build shows.
 *
 * Sponsors who chose privacy never appear here. GitHub reports them, the
 * workflow counts them into `anonymousCount` and drops everything else, and
 * the page shows the count — which is the whole point of sponsoring
 * anonymously.
 */
export interface Sponsor {
  login: string
  avatarUrl: string
  profileUrl: string
  /** Calendar date the sponsorship started, `YYYY-MM-DD`. */
  since: string
}

/**
 * The two count fields are optional because the workflow's own fallback file —
 * the one it writes when the API call fails — carries only `totalCount`.
 */
interface SponsorsFile {
  generatedAt: string
  totalCount: number
  publicCount?: number
  anonymousCount?: number
  sponsors: ReadonlyArray<{ login: string; avatarUrl: string; profileUrl: string; since: string }>
}

const file = sponsorsFile as SponsorsFile

/*
 * Oldest first, so the order is a fact about the sponsorships rather than
 * whatever order the API answered in — which would otherwise reshuffle the
 * rendered HTML on a deploy where nothing actually changed.
 */
const people: ReadonlyArray<Sponsor> = file.sponsors
  .map(({ login, avatarUrl, profileUrl, since }) => ({
    login,
    avatarUrl,
    profileUrl,
    since: since.slice(0, 10),
  }))
  .sort((a, b) => a.since.localeCompare(b.since))

export const SPONSORS = {
  /** When the list was generated. The page says this rather than implying it is live. */
  asOf: file.generatedAt.slice(0, 10),
  total: file.totalCount,
  publicCount: file.publicCount ?? people.length,
  anonymousCount: file.anonymousCount ?? Math.max(0, file.totalCount - people.length),
  people,
}

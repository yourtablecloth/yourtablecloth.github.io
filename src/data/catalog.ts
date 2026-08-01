/**
 * Grounded snapshot of the TableCloth project.
 *
 * DELIBERATELY ANONYMOUS.
 *
 * The upstream TableClothCatalog names every supported site and every vendor
 * product it fetches. None of that ships here. Publishing a list of named
 * institutions and named commercial security products under a critical
 * headline is a defamation and trademark problem, and it is not needed to make
 * the point: the argument is about the *shape* of the burden, which aggregate
 * numbers and generic program classes carry perfectly well.
 *
 * The rule for this module: counts and classes, never names.
 *
 * Derivation — every figure below is measured, not asserted:
 *   - Site and program-class figures are computed from the real catalog
 *     (github.com/yourtablecloth/TableClothCatalog, docs/Catalog.xml) by
 *     classifying each entry into a generic class and counting DISTINCT SITES
 *     per class. Vendor strings are consumed during classification and
 *     discarded; none reaches this file.
 *   - Repository figures are from github.com/yourtablecloth/TableCloth,
 *     read on the date in `asOf`. They drift, so the page states the date.
 *   - Legal figures are from that repository's README (법적 고지).
 */

import type { Locale } from '../content/site'

type Bilingual = Record<Locale, string>

/**
 * A generic class of client security software — never a product, never a
 * vendor. `sites` is how many catalogued sites require at least one program of
 * this class.
 */
export interface ProgramType {
  key: string
  label: Bilingual
  /**
   * What this class of program does on the machine, in one phrase.
   *
   * Descriptive, not evaluative. Several of these overlap something the
   * operating system or the browser has done for years, and where that is
   * true the phrase says so plainly ("overlaps what HTTPS provides") — that
   * observation is the reason this project exists and it stays.
   *
   * What these lines must not do is sneer. An earlier pass wrote them as
   * jabs ("wedges into the driver", "installs the other ones"), and a jab
   * aimed at a class of software lands on the engineers who wrote it and the
   * institutions that chose it — neither of whom this page has any quarrel
   * with. See `under.lead` in src/content/site.ts, which frames the whole
   * section as a trade-off with legitimate costs on both sides, and the
   * naming policy in the file header above.
   */
  role: Bilingual
  sites: number
}

/** One bar of the programs-per-site histogram. */
export interface BurdenBucket {
  /** Number of separate programs a single site requires. */
  programs: number
  /** How many sites sit at that number. */
  sites: number
}

export interface CatalogTotals {
  /** Sites catalogued in total. */
  sites: number
  /** Of those, the ones requiring at least one client security program. */
  sitesWithPrograms: number
  /** Distinct programs the catalog knows how to fetch (count only). */
  programs: number
  /** Mean programs per site, among `sitesWithPrograms`. */
  avgPrograms: number
  /** Worst single site in the catalog. */
  maxPrograms: number
}

export interface RepoStats {
  stars: number
  forks: number
}

export interface CatalogSnapshot {
  /** ISO date the GitHub figures were read. */
  asOf: string
  totals: CatalogTotals
  repo: RepoStats
  /** What the cloth covers, by class of program. */
  programTypes: ReadonlyArray<ProgramType>
  /** Distribution of programs-per-site — pure shape, nobody named. */
  burden: ReadonlyArray<BurdenBucket>
}

export const catalog: CatalogSnapshot = {
  asOf: '2026-07-27',

  totals: {
    sites: 272,
    sitesWithPrograms: 269,
    programs: 135,
    avgPrograms: 3.1,
    maxPrograms: 10,
  },

  repo: { stars: 1095, forks: 60 },

  // Ordered by how many sites require them. These are the tiles the cloth covers.
  programTypes: [
    {
      key: 'agent',
      label: { ko: '상주 감시 에이전트', en: 'Resident agent' },
      role: { ko: '항상 실행 상태로 남습니다', en: 'Stays running at all times' },
      sites: 197,
    },
    {
      key: 'cert',
      label: { ko: '인증서 처리 모듈', en: 'Certificate handler' },
      role: { ko: '운영체제의 인증서 기능과 겹칩니다', en: 'Overlaps the OS certificate store' },
      sites: 158,
    },
    {
      key: 'installer',
      label: { ko: '통합 설치 관리자', en: 'Install orchestrator' },
      role: { ko: '나머지 프로그램을 함께 설치합니다', en: 'Installs the remaining programs' },
      sites: 141,
    },
    {
      key: 'keyboard',
      label: { ko: '키 입력 가로채기', en: 'Keystroke interception' },
      role: { ko: '키보드 드라이버 계층에서 동작합니다', en: 'Operates at the keyboard driver layer' },
      sites: 91,
    },
    {
      key: 'bespoke',
      label: { ko: '한 곳 전용 모듈', en: 'One-site module' },
      role: { ko: '한 사이트에서만 쓰입니다', en: 'Used at a single site' },
      sites: 55,
    },
    {
      key: 'tracker',
      label: { ko: '접속 정보 수집', en: 'Session tracker' },
      role: { ko: '기기 정보를 전송합니다', en: 'Sends device information' },
      sites: 42,
    },
    {
      key: 'drm',
      label: { ko: '화면·출력 제어', en: 'Screen and print control' },
      role: { ko: '화면 캡처와 출력을 제한합니다', en: 'Restricts screen capture and printing' },
      sites: 31,
    },
    {
      key: 'transport',
      label: { ko: '구간 암호화', en: 'Transport encryption' },
      role: { ko: 'HTTPS의 역할과 겹칩니다', en: 'Overlaps what HTTPS provides' },
      sites: 23,
    },
  ],

  burden: [
    { programs: 1, sites: 55 },
    { programs: 2, sites: 37 },
    { programs: 3, sites: 97 },
    { programs: 4, sites: 33 },
    { programs: 5, sites: 22 },
    { programs: 6, sites: 13 },
    { programs: 7, sites: 5 },
    { programs: 8, sites: 4 },
    { programs: 9, sites: 2 },
    { programs: 10, sites: 1 },
  ],
} as const

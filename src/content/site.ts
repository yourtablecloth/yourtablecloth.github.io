/**
 * All page copy, in both locales.
 *
 * MINIMAL BY POLICY. This page shows rather than tells: the cloth, the tiles it
 * covers, and the counts carry the argument. Prose exists only where a number
 * would be ambiguous without it. If a sentence can be deleted without losing
 * meaning, it has been.
 *
 * Numbers are NOT written here — they come from src/data/catalog.ts, generated
 * from the real catalog, so nothing on the page can drift from the source.
 *
 * Naming policy: no institution and no commercial security product is named
 * anywhere in this file. The page argues about a class of software, never about
 * a company. See the header of src/data/catalog.ts.
 */

export const LOCALES = ['ko', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export type Localized<T> = Record<Locale, T>

export const LINKS = {
  github: 'https://github.com/yourtablecloth/TableCloth',
  releases: 'https://github.com/yourtablecloth/TableCloth/releases',
  catalog: 'https://github.com/yourtablecloth/TableClothCatalog',
  discord: 'https://discord.gg/eT2UnUXyTV',
  sponsor: 'https://github.com/sponsors/yourtablecloth',
  homepage: 'https://yourtablecloth.app',
  lite: 'https://lite.yourtablecloth.app/',
  /** The project's own published catalog browser — link out only, never mirror its contents (see file header). */
  catalogBrowser: 'https://yourtablecloth.app/TableClothCatalog/',
} as const

/** The one command that installs it. */
export const INSTALL_COMMAND = 'winget install TableClothProject.TableCloth'

export const HOW_STEPS = [
  {
    key: 'isolate',
    index: '01',
    title: { ko: '격리', en: 'Isolate' },
    body: {
      ko: '윈도우에 이미 들어 있는 샌드박스를 띄웁니다.',
      en: 'Starts the sandbox Windows already ships with.',
    },
  },
  {
    key: 'use',
    index: '02',
    title: { ko: '사용', en: 'Use' },
    body: {
      ko: '보안 프로그램은 그 안에서만 설치됩니다.',
      en: 'The security software installs only in there.',
    },
  },
  {
    key: 'discard',
    index: '03',
    title: { ko: '폐기', en: 'Discard' },
    body: {
      ko: '창을 닫으면 그 안의 변경 사항이 사라집니다.',
      en: 'Close the window and those changes are gone.',
    },
  },
] as const

type EcosystemEntry = {
  key: string
  name: Localized<string>
  kind: Localized<string>
  body: Localized<string>
  requires: Localized<string>
  href: string
  external: boolean
  badge?: Localized<string>
}

/**
 * The rest of the family, beyond the Windows desktop app above. One clause
 * per body — this section shows what exists, it does not sell it.
 */
export const ECOSYSTEM: EcosystemEntry[] = [
  {
    key: 'desktop',
    name: { ko: '식탁보', en: 'TableCloth' },
    kind: { ko: '데스크톱 앱', en: 'Desktop app' },
    body: {
      ko: '샌드박스 실행과 관리를 하나의 앱으로.',
      en: 'Launch and manage the sandbox from one app.',
    },
    requires: { ko: 'Windows 11 + Windows 샌드박스', en: 'Windows 11 + Windows Sandbox' },
    href: LINKS.releases,
    external: true,
  },
  {
    key: 'express',
    name: { ko: '무설치 실행', en: 'No-install launcher' },
    kind: { ko: '~5MB 런처', en: '~5MB launcher' },
    body: {
      ko: '설치 없이 파일 하나로 바로 엽니다.',
      en: 'One file opens it. Nothing installed.',
    },
    requires: { ko: 'Windows 샌드박스만', en: 'Just Windows Sandbox' },
    href: LINKS.releases,
    external: true,
  },
  {
    key: 'lite',
    name: { ko: '식탁보 라이트', en: 'TableCloth Lite' },
    kind: { ko: 'PWA', en: 'PWA' },
    body: {
      ko: 'AI 챗봇과 샌드박스 설정을 브라우저에서.',
      en: 'AI chatbot and sandbox settings, in the browser.',
    },
    requires: { ko: '브라우저만', en: 'Just a browser' },
    href: LINKS.lite,
    external: true,
  },
  {
    key: 'mac',
    name: { ko: 'macSandbox', en: 'macSandbox' },
    kind: { ko: 'macOS 포트', en: 'macOS port' },
    body: {
      ko: '같은 .wsb를 Apple Silicon에서 그대로.',
      en: 'The same .wsb, running on Apple Silicon.',
    },
    requires: {
      ko: 'macOS 26+, 자체 Windows 11 ARM64 라이선스, 24GB',
      en: 'macOS 26+, your own Windows 11 ARM64 licence, 24GB',
    },
    href: '/docs/install-macos',
    external: false,
    badge: { ko: 'NEW', en: 'NEW' },
  },
] as const

export const PROJECT_FACTS = [
  {
    key: 'license',
    label: { ko: '라이선스', en: 'License' },
    value: { ko: 'AGPL-3.0 / 상용', en: 'AGPL-3.0 / commercial' },
  },
  {
    key: 'maintainer',
    label: { ko: '메인테이너', en: 'Maintainer' },
    value: { ko: '남정현 (rkttu)', en: 'Jung Hyun Nam (rkttu)' },
  },
  {
    key: 'since',
    label: { ko: '기간', en: 'Since' },
    value: { ko: '2021~2026', en: '2021–2026' },
  },
  {
    key: 'platform',
    label: { ko: '필요 환경', en: 'Requires' },
    value: { ko: 'Windows 11 Pro / Edu / Ent.', en: 'Windows 11 Pro / Edu / Ent.' },
  },
] as const

export const COPY = {
  meta: {
    title: {
      ko: '식탁보®: 언제나 안전하고 깨끗하게',
      en: 'TableCloth: always safe, always clean',
    },
    description: {
      ko: '인터넷뱅킹과 전자정부 서비스가 요구하는 보안 프로그램을 윈도우 샌드박스 안에 가두는 오픈소스.',
      en: 'Open source that confines the client security software demanded by Korean internet banking and e-government to a Windows Sandbox.',
    },
  },

  nav: {
    skip: { ko: '본문으로', en: 'Skip to content' },
    label: { ko: '주요 내비게이션', en: 'Primary navigation' },
    home: { ko: '식탁보 홈', en: 'TableCloth home' },
    sections: {
      under: { ko: '현황', en: 'Installs' },
      how: { ko: '작동', en: 'How' },
      ecosystem: { ko: '생태계', en: 'Ecosystem' },
      project: { ko: '프로젝트', en: 'Project' },
      faq: { ko: '질문', en: 'FAQ' },
      support: { ko: '후원', en: 'Support' },
    },
    lang: { ko: 'EN', en: 'KO' },
    langAria: { ko: 'Switch to English', en: '한국어로 전환' },
    theme: { ko: '밝은 화면으로', en: 'Light surface' },
    themeDark: { ko: '어두운 화면으로', en: 'Dark surface' },
    docs: { ko: '문서', en: 'Docs' },
  },

  /*
   * The header's one line of running commentary — the same section-tracking
   * state that underlines the nav item (see NAV_SECTIONS in Chrome.tsx),
   * read out as a sentence instead of a label. `top` covers everything
   * before the reader reaches the first tracked section (the hero and the
   * reveal); `project`, the last section tracked, stays current for
   * everything after it too, because nothing further ever updates it.
   */
  headerCaption: {
    /*
     * Short enough to set on one line at 12px mono in a fifth of the bar.
     * The first pass wrote full sentences and every one of them ellipsised —
     * a running commentary that trails off mid-word reads as a layout bug,
     * not as a voice. These are noun phrases: the state the page is in, named.
     */
    top: { ko: '아직 덮어둔 상태', en: 'Still covered' },
    under: { ko: '한 사이트당 평균 3.1개', en: '3.1 installs per site' },
    how: { ko: '샌드박스 안에서만', en: 'Only inside the sandbox' },
    project: { ko: '오픈소스, 무료', en: 'Open source, free' },
  },

  hero: {
    eyebrow: { ko: '식탁보®', en: 'TableCloth®' },
    /*
     * Release-note pill on the very first screen. macSandbox is the newest
     * capability and the one most likely to change a reader's mind ("this is
     * Windows-only" is the default assumption), so it is stated before the
     * headline rather than waiting for the how-it-works section.
     */
    badge: { ko: 'NEW', en: 'NEW' },
    badgeText: { ko: 'macOS에서도 실행됩니다', en: 'Now runs on macOS' },
    title: {
      ko: ['안전하고', '깨끗하게'],
      en: ['Safe and', 'clean'],
    },
    lede: {
      ko: '인터넷뱅킹과 전자정부를 위한 제로 트러스트 컴퓨팅.',
      en: 'Zero-trust computing for Korean internet banking and e-government.',
    },
    hint: { ko: '식탁보를 들춰보세요', en: 'Lift the cloth' },
    hintTouch: { ko: '식탁보를 쓸어보세요', en: 'Swipe the cloth' },
    /** Describes the canvas for screen readers and no-JS readers. */
    alt: {
      ko: '탁자에 식탁보를 폅니다. 보안 프로그램은 그 위에 놓입니다. 식탁보를 걷어내면 함께 사라지고, 탁자는 처음 그대로입니다.',
      en: 'A cloth spread over a table. The security programs sit on top of it. Lift the cloth away and they go with it, leaving the table just as it was.',
    },
    /** Splash line, echoing the app's own startup screen. */
    booting: { ko: '식탁보를 펴는 중', en: 'Spreading the cloth' },
    install: { ko: '설치', en: 'Install' },
    source: { ko: '소스', en: 'Source' },
  },

  /*
   * The three lines the cloth's own removal is narrated with.
   *
   * They are the alt text above, split into its three clauses, because that
   * text was already the tightest statement of the metaphor this page has —
   * and because a caption that says exactly what the reader is watching is
   * worth more than a fourth way of phrasing it. `from`/`to` are positions in
   * the peel, not seconds: the copy is paced by how far the reader has pulled
   * the sheet, so it can never run ahead of what is on screen.
   *
   * The windows do not touch. They used to overlap by 0.02 at each handover,
   * and because all three captions share one grid cell (see Hero.module.css)
   * an overlap is not a crossfade — it is two sentences printed on top of
   * each other. The 0.04 of clear peel between them is the gap where one has
   * finished fading before the next begins, which is also the beat that lets
   * the reader register that a new line arrived rather than that a line
   * changed. `--tc-edge` (0.06) is spent inside each window on the fade at
   * either end, so a window of 0.25 holds at full strength for 0.13.
   */
  reveal: [
    {
      key: 'on',
      from: 0.1,
      to: 0.35,
      text: { ko: '보안 프로그램은 식탁보 위에 놓입니다', en: 'The programs sit on the cloth' },
    },
    {
      key: 'away',
      from: 0.39,
      to: 0.68,
      text: { ko: '식탁보를 걷어내면 함께 사라집니다', en: 'Lift the cloth away and they go with it' },
    },
    {
      /* Runs past 1 on purpose: the peel caps at 1 and this line is the one
         the reader should still be holding when the fabric is gone. */
      key: 'clean',
      from: 0.72,
      to: 1.2,
      text: { ko: '탁자는 처음 그대로입니다', en: 'The table underneath is just as it was' },
    },
  ],

  /*
   * The one section allowed to have a temper.
   *
   * Everywhere else this page states and lets the reader draw the conclusion.
   * Here the conclusion IS the measurement — a site you have no choice about
   * using makes you install software you did not ask for, three times over on
   * average — and a neutral label under it ("3.1 per site") let the number be
   * read as trivia. Naming the imposition is not editorialising; it is what
   * the figure means. Still no institution and no product named: the anger is
   * at a practice, never at a company (see src/data/catalog.ts).
   */
  under: {
    eyebrow: { ko: '요구 목록', en: 'The demands' },
    title: {
      ko: '들어가려면 평균 3.1개를 깔아야 합니다',
      en: 'Getting in costs you 3.1 installs',
    },
    sitesLabel: { ko: '요구하는 사이트', en: 'sites require it' },
    burdenTitle: { ko: '한 사이트가 요구하는 개수', en: 'Programs required per site' },
    /** Renders as "269곳. <note>" / "269 sites. <note>" — see Underneath.tsx. */
    sitesUnit: { ko: '곳', en: ' sites' },
    note: {
      ko: '개별 사이트와 제품 이름은 싣지 않습니다. 종류와 집계만.',
      en: 'No site or product named. Classes and counts only.',
    },
  },

  how: {
    eyebrow: { ko: '작동 방식', en: 'How it works' },
    title: { ko: '격리, 사용, 폐기', en: 'Isolate, use, discard' },
    diagram: {
      host: { ko: '호스트', en: 'Host' },
      sandbox: { ko: '샌드박스', en: 'Sandbox' },
    },
    expressTitle: { ko: '설치 없이', en: 'Without installing' },
    expressBody: {
      ko: 'Windows 샌드박스만 켜져 있으면 됩니다. 내려받은 .wsb 파일을 실행하면 설치 과정 없이 바로 열립니다.',
      en: 'Windows Sandbox just has to be enabled. Run the downloaded .wsb and it opens right away, with no install step.',
    },
    expressBadge: { ko: 'NEW', en: 'NEW' },
    expressMac: {
      ko: 'Apple Silicon 맥이라면 macSandbox로 같은 .wsb 파일을 그대로 실행할 수 있습니다.',
      en: 'On Apple Silicon, macSandbox runs the very same .wsb file.',
    },
    expressMacLink: { ko: 'macOS 설치 가이드', en: 'macOS install guide' },
  },

  ecosystem: {
    eyebrow: { ko: '패밀리', en: 'The family' },
    title: { ko: '한 천, 네 개의 탁자', en: 'One cloth, four tables' },
    requiresLabel: { ko: '필요 환경', en: 'Requires' },
    openLabel: { ko: '열기', en: 'Open' },
    guideLabel: { ko: '가이드 보기', en: 'View guide' },
    contributeLabel: { ko: '카탈로그 기여', en: 'Contribute to catalog' },
    catalogTitle: { ko: '지원 목록은 커뮤니티가 관리합니다', en: 'The support list is community-run' },
    catalogBody: {
      ko: '어떤 사이트가 무엇을 요구하는지는 카탈로그에서 확인하세요.',
      en: 'See which site needs what in the catalog.',
    },
  },

  project: {
    eyebrow: { ko: '프로젝트', en: 'The project' },
    title: { ko: '오픈소스, 무료', en: 'Open source, free' },
    installTitle: { ko: '한 줄로 설치', en: 'One line' },
    copy: { ko: '복사', en: 'Copy' },
    copied: { ko: '복사됨', en: 'Copied' },
    /* Shown when the browser refuses the clipboard write; the command has
       been selected for the reader at that point. */
    copyManual: { ko: '직접 복사', en: 'Select' },
    stars: { ko: '스타', en: 'Stars' },
    forks: { ko: '포크', en: 'Forks' },
    sites: { ko: '지원 사이트', en: 'Sites' },
    programs: { ko: '대상 프로그램', en: 'Programs' },
    /** GitHub counts drift; the page says when it looked. */
    asOf: { ko: '기준', en: 'as of' },
    catalogLink: { ko: '카탈로그 저장소', en: 'Catalog repository' },
  },

  faq: {
    eyebrow: { ko: '질문', en: 'FAQ' },
    title: { ko: '자주 묻는 질문', en: 'Frequently asked' },
  },

  support: {
    eyebrow: { ko: '커뮤니티', en: 'Community' },
    title: { ko: '함께 만듭니다', en: 'Built together' },
    sponsorsLabel: { ko: '후원자', en: 'Sponsors' },
    anonymousLabel: { ko: '비공개 후원', en: 'anonymous' },
    becomeSponsor: { ko: '후원하기', en: 'Sponsor' },
    coverageLabel: { ko: '보도', en: 'Coverage' },
    linksLabel: { ko: '바로가기', en: 'Links' },
    sinceLabel: { ko: '후원 시작', en: 'Sponsoring since' },
    releasesLink: { ko: '릴리스', en: 'Releases' },
  },

  docs: {
    eyebrow: { ko: '문서', en: 'Docs' },
    title: { ko: '문서', en: 'Documentation' },
    description: {
      ko: '식탁보의 설치 안내, FAQ, 문제 해결, 개인정보처리방침, 후원 안내를 한곳에 모았습니다.',
      en: 'Install guides, FAQ, troubleshooting, privacy policy, and sponsorship info for TableCloth, all in one place.',
    },
    pagesLabel: { ko: '문서', en: 'Pages' },
    elsewhereLabel: { ko: '바로가기', en: 'Elsewhere' },
    lite: { ko: '식탁보 라이트', en: 'TableCloth Lite' },
    /** lite.yourtablecloth.app is the "식탁보 AI" PWA — an AI chatbot plus a Windows
     *  Sandbox settings manager. Named/described distinctly from the desktop app. */
    liteDescription: {
      ko: 'AI 챗봇과 Windows 샌드박스 설정 관리를 함께 제공하는 PWA(웹 앱)입니다.',
      en: 'A PWA — an AI chatbot plus a Windows Sandbox settings manager.',
    },
    catalogLink: { ko: '카탈로그', en: 'Catalog' },
    backHome: { ko: '식탁보 홈으로', en: 'Back to TableCloth' },
    backToIndex: { ko: '문서 목록으로', en: 'All docs' },
    notFoundTitle: { ko: '문서를 찾을 수 없습니다', en: 'Page not found' },
    notFoundBody: {
      ko: '요청하신 문서가 존재하지 않습니다. 문서 목록에서 다시 찾아보세요.',
      en: 'The page you requested does not exist. Try the docs list instead.',
    },
  },

  /*
   * The closing beat — see Cover.tsx.
   *
   * The hero narrates the cloth coming off in three clauses; this is the one
   * clause it never got to say, and the reason the page has a second half at
   * all. Deliberately the same register as `reveal` above: what the reader is
   * watching, stated plainly, and nothing else.
   */
  cover: {
    eyebrow: { ko: '그리고 다시', en: 'And again' },
    title: { ko: '쓰고 나면, 덮어둡니다', en: 'Use it, then cover it back up' },
    body: {
      ko: '창을 닫으면 그 안의 것은 사라집니다. 다음에 필요할 때 식탁보를 다시 펴면 됩니다.',
      en: 'Close the window and what was inside is gone. Spread the cloth again the next time you need it.',
    },
  },

  /*
   * Reproduced from the project's own warning, not written by us. It is the one
   * place on this page where the copy must not be trimmed for elegance: it is
   * the liability notice, and softening it would misrepresent the project.
   */
  disclaimer: {
    eyebrow: { ko: '주의', en: 'Caution' },
    title: { ko: '중요한 일은 실제 PC에서', en: 'Do the important things on the real PC' },
    body: {
      ko: '식탁보 사용 중 발생하는 개인·기업·기관의 금전손실, 세금신고 누락 등 어떠한 장애나 손해에 대해서도 사용자 본인에게 책임이 있습니다.',
      en: 'Any loss or damage arising from use of TableCloth, whether financial loss, a missed tax filing, or anything else, is the user’s own responsibility.',
    },
  },

  footer: {
    tagline: { ko: '언제나 안전하고 깨끗하게', en: 'Always safe, always clean' },
    copyright: { ko: '© 2021–2026 rkttu.com', en: '© 2021–2026 rkttu.com' },
    legal: {
      ko: '저작권 C-2025-051228, 상표 출원 4020240205929',
      en: 'Copyright reg. C-2025-051228, TM app. 4020240205929',
    },
    unofficial: {
      ko: '식탁보 프로젝트를 소개하는 비공식 재해석 페이지입니다.',
      en: 'An unofficial reinterpretation of the TableCloth project.',
    },
  },

  /*
   * The page that is not there.
   *
   * Same voice as the rest: state what happened, then hand back the one thing
   * the reader wanted. The line is the site's own metaphor turned on itself —
   * a cloth over an empty place setting — because a 404 that breaks character
   * is a seam, and this is the one screen a reader only ever reaches by
   * accident.
   */
  notFound: {
    eyebrow: { ko: '404', en: '404' },
    title: { ko: '이 자리에는 아무것도 없습니다', en: 'Nothing is set at this place' },
    body: {
      ko: '주소가 바뀌었거나, 처음부터 없던 페이지입니다. 식탁보는 그대로 있으니 식탁으로 돌아가세요.',
      en: 'The address moved, or it never existed. The cloth is still where you left it, so head back to the table.',
    },
    home: { ko: '홈으로', en: 'Back home' },
    docs: { ko: '문서 보기', en: 'Read the docs' },
    /** aria-label for the 404 page's hover/focus corner-lift button (see NotFound.tsx). */
    peek: { ko: '식탁보 모서리 들어보기', en: 'Lift the corner of the cloth' },
  },

  /*
   * The message for readers who never chose this browser.
   *
   * A link shared in KakaoTalk opens in KakaoTalk's own WebView, and that is
   * where the first real phone report of this page came from: the scene
   * stuttered badly and the reader could not tell what they were looking at.
   * A recording of that session measured 21% of frames updating over nine
   * seconds — roughly 20fps against a 120Hz panel, with one 1.35-second stall.
   *
   * So this says the true thing and offers the one action that fixes it. It
   * does not redirect on its own: a page that throws you into another app
   * unasked is worse than a slow page, and a reader who is only skimming
   * should be allowed to skim. Android can hand the URL straight to the real
   * browser; iOS has no such call, so there the copy names the menu item.
   */
  inApp: {
    title: { ko: '앱 안에서 보고 계십니다', en: 'You are inside an app’s browser' },
    body: {
      ko: '이 페이지는 3D를 그립니다. 인앱 브라우저에서는 느리게 움직일 수 있어요.',
      en: 'This page draws in 3D. An in-app browser can run it slowly.',
    },
    open: { ko: '브라우저로 열기', en: 'Open in browser' },
    manual: {
      ko: '오른쪽 아래 ⋯ 를 눌러 다른 브라우저로 열어주세요.',
      en: 'Tap ⋯ at the bottom right and choose your browser.',
    },
    copy: { ko: '주소 복사', en: 'Copy link' },
    copied: { ko: '복사했습니다', en: 'Copied' },
    dismiss: { ko: '닫기', en: 'Dismiss' },
  },

  tally: {
    kicker: { ko: '집계', en: 'Tally' },
    caption: {
      ko: '카탈로그가 내려받을 줄 아는 개별 프로그램의 수.',
      en: 'Distinct programs the catalog knows how to fetch.',
    },
  },
} as const

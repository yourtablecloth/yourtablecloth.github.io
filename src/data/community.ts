/**
 * Community snapshot: sponsors, questions people actually ask, and coverage.
 *
 * All three come from the project's own published sources, copied here at
 * author time rather than fetched at runtime:
 *
 *   - Sponsors: yourtablecloth.app/sponsors.json, which the official site
 *     generates from GitHub Sponsors. Only the sponsors GitHub already lists
 *     publicly appear below; the anonymous one is counted and left unnamed,
 *     which is the whole point of sponsoring anonymously. No token is involved
 *     and nothing is fetched in the browser.
 *   - FAQ: yourtablecloth.app/docs/faq.md, condensed. Answers are the
 *     project's, not ours — this page must not invent support advice.
 *   - Press and awards: the official site's own listing.
 *
 * `asOf` is when these were read. Sponsor counts move; the page says when it
 * looked rather than implying it is live.
 */

import type { Locale } from '../content/site'

type Bilingual = Record<Locale, string>

export interface Sponsor {
  login: string
  avatarUrl: string
  profileUrl: string
  /** ISO date the sponsorship started. */
  since: string
}

export interface Question {
  key: string
  question: Bilingual
  answer: Bilingual
}

export interface Coverage {
  key: string
  outlet: string
  title: Bilingual
  url: string
  year: string
}

export interface CommunitySnapshot {
  asOf: string
  sponsors: {
    /** Everyone supporting the project, including those who chose privacy. */
    total: number
    /** Those GitHub lists publicly — the only ones named below. */
    publicCount: number
    anonymousCount: number
    people: ReadonlyArray<Sponsor>
  }
  faq: ReadonlyArray<Question>
  coverage: ReadonlyArray<Coverage>
}

export const community: CommunitySnapshot = {
  asOf: '2026-07-12',

  sponsors: {
    total: 4,
    publicCount: 3,
    anonymousCount: 1,
    people: [
      {
        login: 'Jukebox85',
        avatarUrl: 'https://avatars.githubusercontent.com/u/85714996?v=4',
        profileUrl: 'https://github.com/Jukebox85',
        since: '2024-10-18',
      },
      {
        login: 'qb20nh',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1734074?v=4',
        profileUrl: 'https://github.com/qb20nh',
        since: '2025-12-04',
      },
      {
        login: 'x2605',
        avatarUrl: 'https://avatars.githubusercontent.com/u/69812394?v=4',
        profileUrl: 'https://github.com/x2605',
        since: '2026-01-08',
      },
    ],
  },

  faq: [
    {
      key: 'safe',
      question: { ko: '안전한가요?', en: 'Is it safe?' },
      answer: {
        ko: '윈도우의 공식 기능인 Windows Sandbox를 그대로 사용합니다.',
        en: "It uses Windows Sandbox, a feature Windows itself ships.",
      },
    },
    {
      key: 'leftover',
      question: {
        ko: '샌드박스에 설치한 프로그램은 어떻게 되나요?',
        en: 'What happens to what gets installed?',
      },
      answer: {
        ko: '샌드박스를 닫으면 그 안의 모든 내용이 삭제됩니다.',
        en: 'Close the sandbox and everything inside it is deleted.',
      },
    },
    {
      key: 'coverage',
      question: {
        ko: '모든 사이트를 지원하나요?',
        en: 'Does it support every site?',
      },
      answer: {
        ko: '주요 사이트 대부분을 지원하고, 카탈로그로 계속 업데이트됩니다.',
        en: 'Most major ones, and the catalog is updated continuously.',
      },
    },
    {
      key: 'perf',
      question: { ko: '성능에 영향을 주나요?', en: 'Does it slow the PC down?' },
      answer: {
        ko: '샌드박스는 가상머신보다 가벼워 영향이 크지 않습니다.',
        en: 'The sandbox is lighter than a VM, so the impact is small.',
      },
    },
    {
      key: 'cost',
      question: { ko: '돈을 내야 하나요?', en: 'Does it cost anything?' },
      answer: {
        ko: '무료입니다. 결제나 본인인증을 요구하면 사칭입니다.',
        en: 'It is free. Anything asking you to pay or verify ID is a fake.',
      },
    },
    {
      key: 'home',
      question: {
        ko: 'Windows Home에서도 되나요?',
        en: 'Does it work on Windows Home?',
      },
      answer: {
        ko: 'Windows Sandbox가 제공되는 Pro 이상에서만 안정적으로 동작합니다.',
        en: 'Only on Pro and above, where Windows Sandbox exists.',
      },
    },
    {
      key: 'mac',
      question: { ko: '맥에서도 되나요?', en: 'What about a Mac?' },
      answer: {
        ko: 'Apple Silicon 맥이라면 macSandbox로 무설치 버전을 실행할 수 있습니다.',
        en: 'On Apple Silicon, macSandbox runs the no-install build.',
      },
    },
  ],

  coverage: [
    {
      key: 'etnews',
      outlet: '전자신문',
      title: {
        ko: "PC 성능저하 주범 '인터넷뱅킹 플러그인' 해법 나왔다",
        en: 'A fix for the plugins that slow Korean PCs down',
      },
      url: 'https://www.etnews.com/20231013000164',
      year: '2023',
    },
    {
      key: 'disquiet',
      outlet: 'Disquiet',
      title: { ko: '이 주의 프로덕트', en: 'Product of the Week' },
      url: 'https://disquiet.io/product/%EC%8B%9D%ED%83%81%EB%B3%B4',
      year: '2024',
    },
  ],
} as const

import faqSource from './faq.md?raw'
import installSource from './install.md?raw'
import installMacosSource from './install-macos.md?raw'
import installWindowsSource from './install-windows.md?raw'
import privacySource from './privacy.md?raw'
import sponsorSource from './sponsor.md?raw'
import troubleshootSource from './troubleshoot.md?raw'
import type { Locale } from '../site'

/**
 * The docs section's table of contents.
 *
 * Titles and summaries are chrome — written here, in both locales, for the
 * sidebar and index card. The `source` markdown itself is Korean-only project
 * text and is rendered as-is (see routes/docs.$slug.tsx); nothing here
 * translates or edits it.
 */
export type DocSlug =
  | 'install'
  | 'install-windows'
  | 'install-macos'
  | 'faq'
  | 'troubleshoot'
  | 'privacy'
  | 'sponsor'

export type DocEntry = {
  slug: DocSlug
  title: Record<Locale, string>
  summary: Record<Locale, string>
  source: string
  /** A small pill next to the link, reserved for a genuinely new capability. */
  badge?: Record<Locale, string>
}

export const DOCS: DocEntry[] = [
  {
    slug: 'install',
    title: { ko: '설치하기', en: 'Installation' },
    summary: {
      ko: 'Windows와 macOS에서 식탁보를 설치하는 방법을 안내합니다.',
      en: 'How to install TableCloth on Windows and macOS.',
    },
    source: installSource,
  },
  {
    slug: 'install-windows',
    title: { ko: 'Windows 설치 가이드', en: 'Windows install guide' },
    summary: {
      ko: 'Windows 샌드박스를 켜고 식탁보를 내려받아 실행하는 절차입니다.',
      en: 'Enable Windows Sandbox, then download and run TableCloth.',
    },
    source: installWindowsSource,
  },
  {
    slug: 'install-macos',
    title: { ko: 'macOS 설치 가이드', en: 'macOS install guide' },
    summary: {
      ko: 'macSandbox로 Apple Silicon 맥에서 식탁보를 실행하는 절차입니다.',
      en: 'Run TableCloth on Apple Silicon Macs through macSandbox.',
    },
    source: installMacosSource,
    badge: { ko: '신규', en: 'New' },
  },
  {
    slug: 'faq',
    title: { ko: '자주 묻는 질문', en: 'FAQ' },
    summary: {
      ko: '지원 범위, 안전성, 비용 등 자주 묻는 질문에 답합니다.',
      en: 'Answers on coverage, safety, cost, and more.',
    },
    source: faqSource,
  },
  {
    slug: 'troubleshoot',
    title: { ko: '문제 해결', en: 'Troubleshooting' },
    summary: {
      ko: 'Windows 샌드박스 오류와 자주 발생하는 문제의 해결 방법입니다.',
      en: 'Fixes for common Windows Sandbox errors and issues.',
    },
    source: troubleshootSource,
  },
  {
    slug: 'privacy',
    title: { ko: '개인정보처리방침', en: 'Privacy policy' },
    summary: {
      ko: '식탁보가 수집하고 사용하는 정보에 대한 방침입니다.',
      en: 'How TableCloth collects and uses information.',
    },
    source: privacySource,
  },
  {
    slug: 'sponsor',
    title: { ko: '후원 안내', en: 'Sponsor' },
    summary: {
      ko: '식탁보 유지에 필요한 항목과 후원 방법을 안내합니다.',
      en: 'What sponsorship funds, and how to contribute.',
    },
    source: sponsorSource,
  },
]

export function findDoc(slug: string): DocEntry | undefined {
  return DOCS.find((doc) => doc.slug === slug)
}

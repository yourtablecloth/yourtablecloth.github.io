/**
 * Where the previous yourtablecloth.app sent people.
 *
 * That site was one document with hash routes — `/#install`, `/#faq` — and
 * those URLs are in the wild: the desktop app's menus, forum posts, search
 * results. This site puts each doc on a real path, so without a translation
 * every one of those links lands on the home page and silently does nothing.
 *
 * The list is frozen by definition. It describes a site that no longer changes,
 * so it does not track src/content/docs: a doc renamed here keeps its old hash
 * pointing at the old name, which is exactly what a redirect is for. Anything
 * not listed is left where it is: `#index` was that site's home page and this
 * one already is the home page, and `#main`, `#how` and friends are this
 * page's own sections, which must keep behaving like fragments.
 */
export const LEGACY_ROUTES: Record<string, string> = {
  install: '/docs/install',
  'install-windows': '/docs/install-windows',
  'install-macos': '/docs/install-macos',
  faq: '/docs/faq',
  troubleshoot: '/docs/troubleshoot',
  privacy: '/docs/privacy',
  sponsor: '/docs/sponsor',
}

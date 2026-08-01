/**
 * Where the previous yourtablecloth.app sent people.
 *
 * That site was one document with hash routes (`/#install`, `/#faq`), and those
 * URLs are in the wild: the desktop app's menus, forum posts, search results.
 * This site puts each doc on a real path, so without a translation every one of
 * those links lands on the home page and silently does nothing.
 *
 * The inventory is not guesswork. Every version of that page resolved a hash
 * the same way — `fetch('docs/' + hash + '.md')` — so the set of URLs it ever
 * served is exactly the set of markdown basenames ever committed under the
 * published docs folder, which `git log --all --name-only` enumerates. Four
 * eras show up, and the keys below are the union of all four:
 *
 *   2022  #howto_install_sandbox, #need_to_know, #troubleshoot, #privacy
 *   2025  the install guide splits: #install, #install-windows, #install-macos
 *         and #faq replace the two 2022 pages
 *   2025  sponsorship arrives as #sponsors, renamed to #sponsor a commit later
 *   PR 10 this site, where each of them is a path
 *
 * The list is frozen by definition. It describes a site that no longer changes,
 * so it does not track src/content/docs: a doc renamed here keeps its old hash
 * pointing at the old name, which is exactly what a redirect is for. The two
 * retired pages resolve to whichever page inherited their subject rather than
 * to the docs index, because a reader who followed `#howto_install_sandbox`
 * wanted the sandbox turned on, and that is step 2 of the Windows guide.
 *
 * Keys are lowercase and looked up lowercased. The old page fetched a
 * case-sensitive path, so `#Sponsors` 404'd there even while `docs/Sponsors.md`
 * sat in the repo — which is precisely why a link written that way is dead
 * today and worth catching. Nothing on this page is at risk from the wider
 * match: of its own fragments (`main`, `under`, `how`, `ecosystem`, `project`,
 * `faq`, `support`) only `faq` appears here at all, and it is a redirect by
 * intent — on the old site `#faq` meant the FAQ document, so that is where it
 * still goes.
 *
 * Anything not listed is left where it is. `#index` was that site's home page
 * and this one already is the home page, and the section fragments above must
 * keep behaving like fragments.
 */
const LEGACY_ROUTES: Record<string, string> = {
  install: '/docs/install',
  'install-windows': '/docs/install-windows',
  'install-macos': '/docs/install-macos',
  faq: '/docs/faq',
  troubleshoot: '/docs/troubleshoot',
  privacy: '/docs/privacy',
  sponsor: '/docs/sponsor',
  /* Retired names, kept pointing at whatever absorbed them. */
  sponsors: '/docs/sponsor',
  howto_install_sandbox: '/docs/install-windows',
  need_to_know: '/docs/faq',
}

/**
 * The old site's other spelling of its own home page.
 *
 * Pages served that site straight out of a folder, so `/index.html#install`
 * addressed exactly the same document as `/#install` and both are in the wild.
 * Pages still serves the file under both names, but the router matches on
 * pathname: `/index.html` matches no route, so the reader got a blank document
 * and the fragment handler above never ran at all.
 *
 * Rewriting the URL is enough to fix it, because the file Pages just served
 * under that name IS the home page's prerendered document — the router only
 * had to be told which route it is looking at. That has to happen before the
 * router reads `location`, which is why this is an inline `<head>` script
 * (see THEME_BOOTSTRAP in lib/prefs.tsx for the same technique) rather than an
 * effect: by the time a component could run, hydration has already failed.
 *
 * `replaceState` rather than a redirect, so the reader's back button still
 * leaves the site the way it came in, and the fragment rides along untouched
 * for `resolveLegacyHash` to pick up a moment later.
 */
export const LEGACY_PATH_BOOTSTRAP = `(()=>{try{
if(location.pathname==='/index.html')
history.replaceState(history.state,'','/'+location.search+location.hash);
}catch(_){}})()`

/**
 * The path a pre-PR-10 fragment should land on, or `undefined` to leave the
 * fragment alone. Takes the raw `location.hash`, leading `#` and all, so
 * callers never have to remember to strip it.
 */
export function resolveLegacyHash(hash: string): string | undefined {
  const raw = hash.replace(/^#/, '')
  let name = raw
  try {
    // A hand-edited or truncated link can carry a stray `%`, and decoding one
    // throws. A fragment that malformed is not in this list under either
    // spelling, so fall back to the raw text rather than take down the page.
    name = decodeURIComponent(raw)
  } catch {
    /* keep `raw` */
  }
  return LEGACY_ROUTES[name.toLowerCase()]
}

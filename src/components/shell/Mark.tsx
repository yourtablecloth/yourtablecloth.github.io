/**
 * The project's own mark, served as a static asset.
 *
 * This is TableCloth's real logo (docs/images/TableCloth_NewLogo.svg in the
 * project repository, the same file yourtablecloth.app serves) — used here to
 * identify the project, unmodified, with credit kept in the footer. It is
 * referenced as an <img> rather than inlined because the source is a 105KB
 * Inkscape trace; inlining would put all of it in the document on every render,
 * whereas an asset is fetched once and cached.
 *
 * Always decorative: every place it appears sits next to the wordmark, so
 * announcing it again would just make a screen reader say the name twice.
 */
export function Mark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/tablecloth.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      decoding="async"
    />
  )
}

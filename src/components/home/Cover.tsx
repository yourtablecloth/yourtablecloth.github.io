import { COPY, type Locale } from '../../content/site'
import styles from './Cover.module.css'

/**
 * The closing beat: the cloth comes back.
 *
 * The page opens by taking the cloth off a table and spends the rest of its
 * length arguing about what was under it. That argument has an ending the
 * document never performed — you cover it again — and stating it in a
 * paragraph would have been the one place this page told rather than showed.
 *
 * So it is the hero's instrument, run backwards, at the other end of the
 * document. No second scene and no new physics: `data-cloth-recover-track`
 * marks this block's scroll range, ClothScene reads it, and inside that range
 * the peel and the camera drift both run home. The name carries the `-track`
 * suffix because ClothScene also puts a boolean `data-cloth-recover` on
 * <html> while the recovery is live; sharing one name meant <html> won
 * document order and this section stopped being measurable.
 * That attribute has picked up a second job: ClothScene now writes
 * `--tc-recover`'s numeric value onto this same element instead of onto
 * `<html>`, for the same reason `--tc-peel` moved to the hero — the
 * property used to force a full-document style recalc on every scroll frame
 * (2,061ms of 4,622ms total task time over 5s of throttled scrolling), and
 * this section is the smallest subtree that reads it. Two jobs, one name;
 * it must not be split or renamed.
 * The tiles come back with the sheet, which is the sentence below in three
 * dimensions — the programs are
 * not destroyed, they are put away until the next time.
 *
 * Un-scrimmed on purpose, like Tally and for the same reason: the reader has
 * to be able to see the table this is happening to. The copy's own arrival is
 * keyed to `--tc-recover`, the same trick the hero uses with `--tc-peel`, so
 * the words and the fabric cannot disagree — and with no JS the property is
 * never set, the fallback is 1, and the block is simply legible.
 */
export function Cover({ locale }: { locale: Locale }) {
  return (
    <section
      className={styles.root}
      aria-labelledby="cover-title"
      data-cloth-recover-track
    >
      <div className={styles.pin}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{COPY.cover.eyebrow[locale]}</p>
          <h2 id="cover-title" className={styles.title}>
            {COPY.cover.title[locale]}
          </h2>
          <p className={styles.body}>{COPY.cover.body[locale]}</p>
        </div>
      </div>
    </section>
  )
}

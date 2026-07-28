import { useEffect, useRef } from 'react'

import type * as ThreeTypes from 'three'

import { ClothSim, PEEL_DWELL, PEEL_VIEWPORTS, type HeightField } from '../../lib/cloth'
import { catalog } from '../../data/catalog'
import type { Locale } from '../../content/site'
import type { Theme } from '../../lib/prefs'

/**
 * The cloth. Full-bleed, fixed behind the whole document.
 *
 * This is not a hero widget — it is the page. Three things drive it:
 *
 *   1. LOAD. A red cloth falls from above onto a table and settles over the
 *      tiles. This is faithful to the product: TableCloth's own splash screen
 *      slides a red tablecloth in from the top (TranslateTransform.Y -700 -> 0,
 *      1.2s, CubicEaseOut) and fades the title in once the cloth is 40% down
 *      (SplashScreen.axaml, issue #296). Here the fall is simulated rather than
 *      tweened, so it lands with folds, but the beat is the same.
 *
 *   2. SCROLL. Reading the page takes the cloth off the table. The near edge
 *      is drawn up and back, gathering the sheet into a roll that throws the
 *      tiles standing on it clear as it arrives, and then the whole bundle
 *      goes over the far edge and out of frame. Scroll position IS how far
 *      that has got — the document's spine, not decoration. Every position is
 *      a pure function of it, so scrolling back genuinely puts it all back.
 *
 *   3. POINTER. While the cloth is still on the table, pressing and dragging
 *      lifts it locally. Pull gently and things slide down the fold; pull
 *      hard and the fabric leaves from under them and they are thrown.
 *
 * Cost control: DPR capped at 2, the loop suspends when the tab is hidden, and
 * under `prefers-reduced-motion` the sheet is pre-settled and drawn on demand
 * rather than animated.
 */

export interface ClothSceneProps {
  theme: Theme
  locale: Locale
  reduced: boolean
  /** First frame is on screen — the cloth has begun to fall. */
  onReady: () => void
  /** The opening fall has finished. */
  onSettled: () => void
}

/**
 * One tile's state.
 *
 * While `supported` it has no life of its own: every frame its transform is
 * posed on the cloth from the four corners of its footprint, and (u, v)
 * drifts downhill under the tangential pull of gravity there — but only
 * while the sheet is being disturbed. Once that drift carries it outside
 * [0, 1], or the fabric folds out from under it, the tile becomes a free
 * body: it leaves with the velocity the cloth was carrying it at, tumbles,
 * bounces on the table, and stays there until the cloth comes home and
 * walks it back to its place.
 */
interface TileBody {
  /*
   * `Object3D`, not `Mesh`, and that is load-bearing: the mug rides the cloth
   * on exactly this machinery and it is a Group of four parts. Nothing below
   * touches anything narrower than position, quaternion and visibility.
   */
  mesh: ThreeTypes.Object3D
  /** Lid and case, kept together only so the whole solid can be addressed at once. */
  materials: ThreeTypes.MeshStandardMaterial[]
  /**
   * How far this body's own origin sits above the fabric it is standing on.
   * A tile's origin is its centre, so it is half a case plus the clearance; a
   * mug is modelled from its base, so it is the clearance alone.
   */
  rideHeight: number
  /**
   * How hard the peel's roll throws this body, as a multiple of a tile's.
   *
   * A tile is a flat plastic case and goes flying; a stoneware mug full of
   * coffee does not. It is also the frontmost thing on the cloth, so the roll
   * reaches it first and at full strength — at a tile's launch it cleared the
   * table's back edge every time, parked below the world, and was never seen
   * again, which is both wrong about mugs and the reason the closing beat
   * brought eight tiles home and no coffee.
   */
  throwScale: number
  /** Fixed rotation about the tile's own face normal — how squarely it was put down. */
  yaw: number
  /** Parameter-space coordinate this tile is restored to on reset. */
  homeU: number
  homeV: number
  /** Live parameter-space coordinate while riding the cloth. */
  u: number
  v: number
  /** Parameter-space slide velocity, in (u, v) units per second. */
  du: number
  dv: number
  /** Riding the cloth surface at (u, v)? False once it has slid off the edge. */
  supported: boolean
  /** Free body at rest on the table — frozen until the next recall. */
  landed: boolean
  /** Seconds spent off the cloth since it last was supported. */
  unsupportedSeconds: number
  /** World-space linear and angular velocity while a free body. */
  velocity: ThreeTypes.Vector3
  angularVelocity: ThreeTypes.Vector3
  /**
   * Where the tile was last frame and how fast that makes it. Measured, not
   * derived: while supported this is the cloth's own velocity under the
   * tile, and it is exactly what gets handed over at the moment of release,
   * so a whipped-off cloth throws its cargo instead of dropping it.
   */
  lastPosition: ThreeTypes.Vector3
  carried: ThreeTypes.Vector3
  /** Seconds into the glide home, or null when not returning. */
  returnElapsed: number | null
  returnFrom: ThreeTypes.Vector3
  returnFromQuaternion: ThreeTypes.Quaternion
}

const CLOTH = { width: 9.6, depth: 6.8, dropHeight: 4.2 }
const GRID = { desktop: { cols: 44, rows: 32 }, mobile: { cols: 28, rows: 20 } }
/**
 * A tile is a solid case, not a printed panel.
 *
 * `height` is the whole point. A zero-thickness plane laid tangent to the
 * cloth is a decal: it has no silhouette against the fabric, casts no shadow
 * anyone can see (the caster is coplanar with the receiver), and reads as
 * pattern printed into the sheet rather than as an object put down on it.
 * With real thickness the same slab gets an edge that catches the key light,
 * a shadow that pools on the side away from it, and a visible gap underneath.
 *
 * `lift` is the clearance between the cloth and the case's underside; the mesh
 * centre rides `height / 2` above that, since a box is centred on its own
 * middle.
 */
const TILE = { width: 1.72, depth: 1.02, height: 0.13, lift: 0.02, gapX: 2.16, gapZ: 1.62 }
/**
 * Half-extents the sheet may never leave. Wide enough now that the peel can
 * carry it over the table's back edge and out of frame — the walls exist only
 * so a grab cannot drag the fabric to infinity, not to keep it on the table.
 */
const BOUNDS = { x: 8, z: 9 }
/**
 * Height the settled cloth rests at above the table: its own thickness plus
 * the sim's contact skin. Must track `SKIN` in lib/cloth.ts — duplicated here
 * only because the renderer has no other reason to reach into the sim's
 * internals for one number.
 */
const CLOTH_SURFACE_Y = 0.08
/**
 * The table itself: a finite slab whose top surface sits at y = 0 by
 * construction (its mesh is centred half its height below that). Free tiles
 * test their fall against these same half-extents, so "landing on the
 * table" means exactly what the box mesh shows on screen.
 */
const TABLE = { width: 15, height: 0.6, depth: 10.5 }
/**
 * The "floor" beyond the tabletop's half-extents — far enough down that
 * anything that leaves the slab is out of frame long before it gets there,
 * and finite only so the sim's clamp always has a number to work with.
 */
const OFF_TABLE_Y = -40
/**
 * Render layer the cloth alone occupies, so a light can be aimed at the
 * fabric without also washing the tabletop it is lying on.
 */
const CLOTH_LAYER = 1
/**
 * Tiles rest ON the cloth rather than binding to a vertex: each carries a
 * (u, v) over the grid and slides downhill under the component of gravity
 * tangential to the sampled surface there.
 *
 *   - `accel` turns that tangential pull into a (u, v) acceleration. Tuned
 *     so a hand-lifted dome sheds a tile near its slope within roughly a
 *     second — not instantly, not glacially.
 *   - `damping` is the fraction of slide velocity kept each physics step
 *     (`TILE_STEP`). Low enough that a tile carries real momentum: the
 *     sheet is a discrete particle grid, so its resting shape is faceted
 *     rather than a smooth curve, and a tile crossing a locally-flat facet
 *     between two sloped ones needs enough carry-through to reach the next
 *     slope instead of arresting on the flat spot it happens to be crossing.
 *   - `staticSlope`/`staticSpeed` are the static-friction cutoff: below this
 *     slope AND this speed, velocity is zeroed outright, so the inevitable
 *     numerical noise of a "flat" resting sheet never reads as creep.
 *
 * None of it runs on an undisturbed sheet. A settled drape is faceted, and
 * any threshold low enough to let a real lift shed a tile is also low enough
 * for those facets to walk the whole set out of formation while the reader
 * is still reading the hero — the tiles scattered themselves before anyone
 * touched anything. Sliding is therefore gated on the cloth actually being
 * disturbed: a hand on it, or a scroll peeling it. Nothing moves on its own.
 */
const SLIDE = { accel: 15, damping: 0.96, staticSlope: 0.02, staticSpeed: 0.015 }
/**
 * How upright the sampled patch under a tile must stay — `tileNormal.y`
 * below this and a tile detaches outright, independent of (u, v) bounds.
 * A folded sheet can turn a patch past vertical, or over completely,
 * entirely inside [0, 1]; real fabric folding out from under a resting
 * object drops it on the spot rather than carrying it around the fold.
 */
const UPRIGHT_MIN = 0.4
/**
 * Free-body flight, from the moment the cloth stops carrying a tile.
 *
 * The launch velocity is not invented here — it is the tile's own measured
 * world velocity from the frame before, which while it was riding the sheet
 * IS the sheet's velocity underneath it. That is the whole trick: whip the
 * cloth off and the fabric's speed is already in the tile, so it is thrown
 * rather than dropped, and how hard depends on how hard the reader pulled.
 *
 *   - `shakeSpeed` is the whole interaction. Nothing about sliding downhill
 *     ever throws anything: a tile eases down the side of a lifted dome and
 *     stops. But fabric yanked out from under a solid does not carry it
 *     along — past some speed the contact simply cannot hold, and what was
 *     resting on the cloth leaves with the cloth's speed. Pull gently and
 *     the tiles slither; whip the sheet off and they are thrown across the
 *     table. This threshold is where one becomes the other.
 *   - `maxLaunch` caps that measured speed. A scroll wheel can move the peel
 *     a long way in one frame, and without a ceiling a single notch fires a
 *     tile clean out of the frame.
 *   - `restitution` is the bounce off the tabletop, `bounceCutoff` the
 *     vertical speed below which bouncing stops and the tile settles.
 *   - `tableFriction` is horizontal speed kept per bounce, so a thrown tile
 *     skids to a stop instead of sliding forever.
 *   - `scoopBack`/`scoopLift` are the roll: while the peel is driving, the
 *     gathered fabric arriving under a tile throws it up and over the far
 *     edge rather than sliding out from beneath it. Without them the sheet
 *     left the whole set standing on the tabletop, which is precisely the
 *     claim this page exists to contradict.
 *   - a tile thrown clear of the tabletop is NOT caught: it goes over the
 *     edge and parks at `PARK_Y`, out of frame, because the whole claim is
 *     that taking the cloth away takes its cargo with it.
 */
const FREE = {
  gravity: -9.8,
  tumbleRate: 0.8,
  tumbleBase: 1.4,
  shakeSpeed: 3.2,
  maxLaunch: 7,
  restitution: 0.34,
  bounceCutoff: 0.8,
  tableFriction: 0.72,
  scoopBack: 5.6,
  scoopLift: 4.4,
}
/** Depth below the tabletop at which a tile thrown clear of it stops and waits. */
const PARK_Y = -9
/** How long a tile takes to glide back to its place once the cloth is home. */
const RETURN_SECONDS = 0.85
/** How high the glide home arcs, so a tile is lifted back rather than dragged. */
const RETURN_ARC = 0.45
/**
 * An off-cloth tile must be off it for at least this long before it is
 * eligible to be recalled home, so letting go of a drag — or a scroll that
 * merely brushes the rest position — cannot yank a tile back mid-tumble.
 */
const RESET_GRACE = 0.45
/** How close to fully unpeeled counts as "at rest" for a recall. */
const RESET_PEEL_EPS = 0.01
/** Tile physics' own fixed step, for the frame-rate independence the cloth sim gives itself. */
const TILE_STEP = 1 / 60
/**
 * How much of a slow interactive frame the cloth sim may try to catch up
 * on, in one call to `sim.update()` inside `renderFrame`.
 *
 * `ClothSim.update()` accumulates elapsed time and burns it off in fixed
 * 1/60s steps, capped internally at `MAX_STEPS_PER_FRAME = 5` — a ceiling
 * sized for a backgrounded tab coming back, not for a frame that merely ran
 * long. Before this cap existed, `renderFrame` fed `sim.update()` the same
 * delta every other system got, clamped only at 0.05s: three solver steps'
 * worth. On a throttled phone that clamp WAS the failure mode. Real Chrome,
 * 6x CPU throttle, 390x844, 6s of scrolling: 22 long tasks totalling
 * 1,251ms — roughly every fourth frame at ~57ms instead of 17ms, longest
 * 76ms. A monotonic scroll and a bounce that re-crosses the palette
 * threshold repeatedly produce almost the same count (22 vs 23), which
 * rules out the palette flip as the cause; a benchmark of the mobile grid
 * (28x20, 4 iterations) gives 0.399ms/step unthrottled, ~2.4ms/step at 6x,
 * so three steps cost ~7.2ms on top of `syncGeometry`, `computeVertexNormals`
 * and the render itself — enough to make the next frame late, which asks
 * for three more steps, which makes the frame after that late too.
 *
 * One step of catch-up per interactive frame breaks that feedback loop: a
 * slow frame lets the cloth fall a little behind wall-clock time instead of
 * trying to buy the whole gap back at once. `MAX_STEPS_PER_FRAME` itself is
 * untouched — the tab-resume case it exists for goes through `sim.settle()`
 * instead, which this cap never sees.
 */
const SIM_CATCHUP_CAP = 1 / 60
/**
 * Grab tuning.
 *
 * `liftPerPixel` is the point of the whole thing: the pointer is raycast onto a
 * HORIZONTAL plane, so vertical mouse travel moves the grab in depth, not in
 * height. With a fixed lift the cloth rose to one constant height and stopped
 * dead no matter how far you pulled — "들춰지다 말아". Height now comes from how
 * far the pointer has travelled up the screen since the press, which is what
 * lifting something actually feels like.
 *
 * `radius` does double duty: how close the pointer must be to the sheet to
 * start a grab at all, and the size of the weighted cluster `grabCluster`
 * gathers — so it is also, roughly, how wide a dome a lift raises.
 */
const GRAB = { radius: 1.6, liftPerPixel: 0.011, maxLift: 2.6, ramp: 9 }
/**
 * How much a fast pull amplifies a hand-driven throw, on top of
 * `FREE.shakeSpeed`'s gate — see `releaseTile`.
 *
 * `shakeSpeed` only answers whether a tile lets go; once it does,
 * `tile.carried` at that exact frame is a poor stand-in for how hard the
 * whole gesture was, because release fires the instant the threshold
 * crosses — a careful lift that barely tips it over and a violent yank that
 * blows straight past it both trigger at roughly the same measured speed.
 * `dragLiftSpeed` is a live reading of the drag itself instead, the same
 * idea hirotos.com uses to size its own scramble off the pointer's drag
 * velocity rather than off a single crossed threshold.
 *
 * `reference` is roughly what a deliberate lift to `GRAB.maxLift` produces
 * over half a second (2.6 / 0.5 ≈ 5); a flick covering that same distance in
 * a fraction of that time saturates the range well past it.
 */
const DRAG_THROW = { reference: 5, min: 0.55, max: 2.2 }
/** Matches the app's 1.2s splash beat. */
const DRAPE_SECONDS = 1.2
/**
 * Where the sheet dissolves, as peel progress. Starts late — the bundle is
 * already tipping over the table's back edge by then — and finishes just shy
 * of 1 so the last frame of the peel is a bare table, not a sheet caught
 * mid-fade. See the note in `readScroll` for why a flight alone is not
 * enough on a tall viewport.
 */
const CLOTH_FADE = { from: 0.88, to: 0.985 }

/**
 * The coffee.
 *
 * On the cloth, with the tiles — not on the table under it. Under the cloth it
 * was a lump the sheet draped over and the answer to "what happens when the
 * cloth covers your coffee" was "it gets covered", which is neither what a
 * tablecloth does nor what anyone wants to watch. On the cloth it is a rider
 * like everything else: it sits there while the sheet is flat, tips when the
 * fabric tilts under it, and is carried off with the peel.
 *
 * Modelled from its base rather than its middle — see `TileBody.rideHeight`.
 * Sized against a tile, which is 1.72 across: a mug two fifths of that reads
 * as a mug beside a laptop rather than as a bucket.
 */
const CUP = { x: 2.9, z: 2.3, radius: 0.34, height: 0.44 }
/**
 * The steam wisp above the brew — the one thing on the table that moves
 * without a reader's hand on it, so the scene reads as alive between a
 * scroll and a drag rather than dead until the next one. `size`/`spread`
 * are world units sized off the mug's own scale (`CUP.height` = 0.44);
 * `rise` is how far a wisp travels before it loops, `speed` how fast, and
 * `peakOpacity` how strong it gets at the loop's midpoint — always faint,
 * since a loud plume would compete with the reveal captions the peel is
 * about to bring in over this same patch of frame.
 */
const STEAM = { size: 0.16, spread: 0.07, rise: 0.5, speed: 0.14, peakOpacity: 0.4 }

/**
 * The peel, in world units.
 *
 *   - `travel` is how far past the far edge the near edge is dragged, and
 *     `arc` how high it rises on the way — together they are the gather.
 *   - `gather` narrows the near edge slightly at the top of the arc, so the
 *     sheet bunches toward its middle instead of staying a rigid ruled line.
 *   - `releaseAt` is where the second stage begins: up to here the sheet is
 *     being gathered across a table it is still lying on, and after it the
 *     whole thing leaves over the back. Late, because the gather is the part
 *     worth watching and the exit only has to be believable.
 *   - `liftOff` is what makes that exit read at all. Dragging both edges back
 *     while they stayed at table height just laid the sheet out flat again —
 *     six metres of fabric between two lines a hand's width apart has to go
 *     somewhere, and with no self-collision it spreads. Lifting the far edge
 *     too takes the whole sheet off the surface first, so it leaves as one
 *     hanging bundle instead of re-covering the table on its way out.
 *   - `clear` is how far back that bundle travels, `fall` how far it drops.
 *     Cubed, so it tips over the edge before it plummets.
 */
const PEEL = {
  travel: 1.5,
  arc: 3.0,
  gather: 0.1,
  releaseAt: 0.72,
  liftOff: 1.5,
  clear: 3.4,
  fall: 10,
}

/**
 * Half-extents the camera must keep in frame.
 *
 * Only the cloth, plus a hand's width. It used to reserve room for the whole
 * peel as well, which meant the opening — the shot the page is judged on —
 * was framed for geometry that does not exist yet: the table sat in the
 * middle third with dead ground above and below it. The peel is allowed to
 * leave the frame now; that is what taking a cloth off a table looks like.
 *
 * `portraitHalfWidth` is the same admission carried to its conclusion on a
 * phone. The sheet is 9.6 wide and 6.8 deep, so on a 390x844 viewport the
 * width is what the fit is solved for, and solving it put the lens 34 units
 * back against 13 on a desktop — two and a half times further from the only
 * thing on screen. The result was a letterboxed strip of tabletop in the
 * middle of a tall dark frame with unreadable labels on it, which is exactly
 * what the first person to open this on a phone reported: no idea what they
 * were meant to be looking at.
 *
 * A tablecloth running off both sides of a phone screen is not a cropped
 * photograph of a tablecloth; it is what a tablecloth looks like when you are
 * standing at the table. Fitting less of the width buys the whole difference,
 * and it bottoms out on its own — below about 2.0 the depth fit takes over
 * and pulling in further stops moving the camera at all.
 */
const FRAME = {
  halfWidth: CLOTH.width / 2 + 0.35,
  portraitHalfWidth: 2.9,
  halfDepth: CLOTH.depth / 2 + 0.95,
}
/**
 * Camera direction from the origin, and the exposure it is graded at.
 *
 * Lower than it was (0.56 -> 0.42). A high three-quarter view flattens the
 * table into a plan drawing and hides the one thing worth looking at — the
 * silhouette of the folds against the light. Dropping the eye puts the cloth
 * between the camera and the key, so folds read as relief instead of pattern.
 */
const VIEW = { y: 0.5, z: 0.86, fov: 38 }

/**
 * How much light is in the room, per surface.
 *
 * One rig, two rooms. The key is not in here on purpose: it is the light that
 * carves the folds, and a fold that reads differently in the two themes is two
 * different cloths. What changes between them is the amount of light around
 * the subject — the ambient, the warm rim, and the exposure the whole frame is
 * graded at. Shape stays put; only the room's brightness moves.
 *
 * The dark numbers exist because the rig used to be shared outright. Graded
 * for linen and then pointed at a near-black page, the hero drove the panel to
 * a mean sRGB of 47 against 24 for this page's own body sections, and 17% of
 * the frame came back above OKLab L 0.35 at chroma 0.06 — a large, saturated,
 * warm mass in a mode whose whole promise is that the screen stays dark.
 * Pulling exposure and fencing the rim back keeps the sheet's lit edge, which
 * is the thing the rim is for, and drops the glow around it, which is not.
 *
 * Light runs the other way for the same reason. On linen the shared rig left
 * the tabletop at L 0.084 under a 0.76 page — a heavy slab on a clean surface,
 * the opposite of what the theme claims. It gets more ambient so the wood sits
 * in daylight, and almost no rim, because a warm edge on a bright ground is
 * invisible anyway and only muddies the red.
 */
const GRADE = {
  dark: { exposure: 0.88, hemi: 0.17, rim: 1.3 },
  lit: { exposure: 1.34, hemi: 0.58, rim: 0.85 },
}

/** Seconds for the grade to cross between rooms. */
const GRADE_EASE = 4.5

function readToken(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || '#000000'
}

/**
 * The weave, as a grayscale height field for a bump map.
 *
 * A check pattern would be the obvious joke and the wrong call: it turns the
 * sheet into a picnic prop and lays a hard graphic grid over the very folds the
 * simulation exists to show. The product's own splash uses a plain red cloth.
 *
 * So no colour is painted here at all. The albedo stays one flat red and this
 * map supplies only relief — warp and weft threads at alternating heights, mid
 * grey being "flat". Anything tonal painted into the colour instead would read
 * as staining on a solid field; as relief it reads as cloth, because it only
 * ever appears where the light rakes across it.
 */
function paintWeave(): HTMLCanvasElement {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)

  // Warp then weft, one thread proud and the next recessed, so the surface has
  // a direction and catches the key light differently across a fold.
  for (let i = 0; i < size; i += 2) {
    ctx.fillStyle = i % 4 === 0 ? '#a8a8a8' : '#585858'
    ctx.fillRect(i, 0, 1, size)
  }
  ctx.globalAlpha = 0.55
  for (let i = 0; i < size; i += 2) {
    ctx.fillStyle = i % 4 === 0 ? '#b4b4b4' : '#4c4c4c'
    ctx.fillRect(0, i, size, 1)
  }
  ctx.globalAlpha = 1

  return canvas
}

/** One tile lid: the class of program, what it does, and how many sites want it. */
function paintTile(
  label: string,
  role: string,
  sites: number,
  colors: { plate: string; ink: string; accent: string; faint: string },
): HTMLCanvasElement {
  const width = 512
  const height = 304
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = colors.plate
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = colors.faint
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, width - 4, height - 4)

  ctx.fillStyle = colors.ink
  ctx.font = '600 42px Pretendard, system-ui, sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText(label, 34, 40, width - 68)

  ctx.fillStyle = colors.faint
  ctx.font = '400 27px Pretendard, system-ui, sans-serif'
  ctx.fillText(role, 34, 100, width - 68)

  ctx.fillStyle = colors.accent
  ctx.font = '700 92px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText(String(sites), 34, 162)

  return canvas
}

/**
 * The steam wisp's shape: a soft white radial falloff, the same
 * canvas-gradient technique `paintWeave`'s relief map uses. No colour is
 * baked in here — the plane's material tints this from a token in
 * `applyPalette`, like every other body on the table.
 */
function paintSteam(): HTMLCanvasElement {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  return canvas
}

export default function ClothScene({
  theme,
  locale,
  reduced,
  onReady,
  onSettled,
}: ClothSceneProps) {
  const host = useRef<HTMLDivElement>(null)
  // Kept in a ref so a theme flip repaints the live scene instead of tearing it
  // down and replaying the opening fall.
  const repaint = useRef<(() => void) | null>(null)
  const ready = useRef(onReady)
  const settled = useRef(onSettled)
  ready.current = onReady
  settled.current = onSettled

  useEffect(() => {
    const mount = host.current
    if (!mount) return

    let disposed = false
    let cleanup: (() => void) | undefined

    void (async () => {
      // Dynamic by necessity, not preference: three is ~600KB and this scene is
      // the only thing that needs it. A static import would put the renderer on
      // the initial bundle's critical path and sink LCP, when the hero copy must
      // paint long before any WebGL context exists.
      const THREE = await import('three')
      if (disposed) return

      // ---- tiles: one per class of program, laid out on the table ----
      const types = catalog.programTypes
      const columns = 4
      const rowCount = Math.ceil(types.length / columns)
      const placements = types.map((type, index) => ({
        type,
        x: ((index % columns) - (columns - 1) / 2) * TILE.gapX,
        z: (Math.floor(index / columns) - (rowCount - 1) / 2) * TILE.gapZ,
      }))

      const isMobile = window.matchMedia('(max-width: 47.99rem)').matches
      const { cols, rows } = isMobile ? GRID.mobile : GRID.desktop

      /**
       * The table is bare — everything this page puts on it, the programs and
       * the reader's coffee alike, sits ON the cloth — so the sheet's only
       * floor is the tabletop.
       *
       * And only the tabletop. An infinite plane at y = 0 was the version
       * that made the finished peel a lie: the sheet could be dragged to the
       * back of the table but never off it, so the last thing the reader saw
       * was the cloth lying flat over the table it was supposed to have been
       * taken off. Past the slab's own half-extents the floor drops away and
       * the cloth goes with it.
       */
      const heightField: HeightField = (x, z) =>
        Math.abs(x) <= TABLE.width / 2 && Math.abs(z) <= TABLE.depth / 2 ? 0 : OFF_TABLE_Y

      const sim = new ClothSim({
        cols,
        rows,
        width: CLOTH.width,
        depth: CLOTH.depth,
        dropHeight: CLOTH.dropHeight,
        heightField,
        boundsX: BOUNDS.x,
        boundsZ: BOUNDS.z,
        /*
         * Four passes on a phone, six on a desktop.
         *
         * `solveLinks` measured as the single hottest function on the page
         * during the opening scroll — more main-thread time than the renderer
         * — and it scales linearly with this number. The two passes being
         * given up are the ones that carry a hand-lift outward through the
         * weave in the same frame, and a phone has no hover and a much
         * coarser drag; the drape and the peel, which is what the scroll is
         * actually showing, are indistinguishable at four.
         */
        iterations: isMobile ? 4 : 6,
      })

      /*
       * ---- peel: two pinned edges ----
       *
       * The near edge is what scroll drags up and back over the sheet; the far
       * edge is anchored while that happens, so the fabric is always stretched
       * out from a fixed side and scrolling back up genuinely re-covers the
       * table. Pinning the near edge alone let the whole sheet migrate to
       * wherever it had been dragged and it came back bunched at the front.
       *
       * Both edges are driven, though, because an anchor that never lets go
       * leaves the cloth "off the table" with one side still nailed to it. So
       * past `releaseAt` the far edge follows the near one over the back edge
       * and down, and the sheet leaves entirely. Every position is a pure
       * function of progress, so the whole thing runs exactly as well
       * backwards — which is what makes scrolling up put the cloth back.
       */
      const edgeCount = cols * 2
      const peelIndices = new Int32Array(edgeCount)
      const peelTargets = new Float32Array(edgeCount * 3)
      const peelRestX = new Float32Array(cols)
      /** Table top plus the sheet's own thickness — see `CLOTH_SURFACE_Y`. */
      const restY = CLOTH_SURFACE_Y

      for (let c = 0; c < cols; c++) {
        const x = -CLOTH.width / 2 + (c * CLOTH.width) / (cols - 1)
        peelRestX[c] = x
        // Far edge first, then near edge.
        peelIndices[c] = c
        peelIndices[cols + c] = (rows - 1) * cols + c
        const t = c * 3
        peelTargets[t] = x
        peelTargets[t + 1] = restY
        peelTargets[t + 2] = -CLOTH.depth / 2
      }

      const writePeelTargets = (progress: number) => {
        const arc = Math.sin(Math.PI * Math.min(1, progress))
        // Fraction of the way through the final stage, where the gathered
        // sheet stops travelling across the table and leaves over its back
        // edge instead.
        const off = Math.max(0, (progress - PEEL.releaseAt) / (1 - PEEL.releaseAt))
        // Up off the surface first, then away: the bundle has to be clear of
        // the tabletop before it drops, or it just unfolds across it again.
        const exit = PEEL.liftOff * off * (1 - off) * 4 - PEEL.fall * off * off * off
        const back = off * PEEL.clear

        const nearZ = CLOTH.depth / 2 - progress * (CLOTH.depth + PEEL.travel) - back
        const nearY = restY + arc * PEEL.arc + exit
        const farZ = -CLOTH.depth / 2 - back
        const farY = restY + exit

        for (let c = 0; c < cols; c++) {
          const far = c * 3
          peelTargets[far] = peelRestX[c]!
          peelTargets[far + 1] = farY
          peelTargets[far + 2] = farZ

          const near = (cols + c) * 3
          peelTargets[near] = peelRestX[c]! * (1 - PEEL.gather * arc)
          peelTargets[near + 1] = nearY
          peelTargets[near + 2] = nearZ
        }
      }

      /*
       * ---- renderer ----
       *
       * Tone mapping is the difference between a render and a photograph, and
       * its absence was the single thing most wrong with this scene. Untone-
       * mapped, any light strong enough to put a real highlight on the fabric
       * clips the red channel to a flat sheet; so the key had been dialled
       * down until nothing clipped, and the result was a page whose brightest
       * pixel sat a quarter of the way up the scale while the sites it wants
       * to stand beside carry four times its luminance spread. Rolling the
       * top end off instead of clipping it is what buys the room to light
       * this properly at all.
       *
       * Khronos PBR Neutral rather than ACES, and the difference is not
       * subtle here: ACES pushes saturated reds toward orange as they
       * brighten, and with it the cloth stopped being the project's crimson
       * and became salmon — a tone map that changes the one colour the brand
       * owns is the wrong tone map. Neutral exists precisely to hold hue
       * while compressing highlights.
       */
      /*
       * Fragment budget, not a quality dial.
       *
       * A phone reports devicePixelRatio 3, and this scene is a full-viewport
       * MeshPhysical surface — sheen lobe, bump map, shadow pass — so at the
       * old cap of 2 it shaded ~1.3M pixels per frame while the reader was
       * also scrolling a backdrop-filtered document over the top of it. That
       * is the stutter people hit on the opening scroll, where the sim is
       * running flat out as well. 1.5 still resolves the folds after the
       * downscale; MSAA goes with it, because above dPR 1 it is buying almost
       * nothing the downscale is not already doing.
       */
      const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true })
      /*
       * 1.25, down from 1.5.
       *
       * The phone now frames far more sheet than it used to (see FRAME), which
       * means the expensive material covers most of the viewport instead of a
       * strip of it — the fill saved by the tighter shot has to come back out
       * of resolution. 1.25 on a dPR-3 panel is a 2.4x downscale, which the
       * folds survive easily; what it buys is a third of the fragments gone.
       */
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2))
      renderer.toneMapping = THREE.NeutralToneMapping
      renderer.toneMappingExposure = GRADE.dark.exposure
      /*
       * `PCFSoft` is five taps per fragment. It is worth it on a desktop, where
       * the soft pool under the sheet is a large part of why the cloth looks
       * like it is lying on something; on a phone the whole shadow is a few
       * hundred pixels across and the extra taps resolve nothing a single tap
       * does not, so the cheap filter goes on the device that needs the frame.
       */
      renderer.shadowMap.enabled = !reduced
      renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap
      mount.appendChild(renderer.domElement)
      renderer.domElement.style.display = 'block'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(VIEW.fov, 1, 0.1, 100)

      /*
       * ---- lights ----
       *
       * Three lights doing three separate jobs, none of them "make it
       * brighter". The ambient is deliberately weak: lifting everything
       * uniformly is what produced the flat band in the first place.
       *
       * The hemisphere and the rim are also the two the grade moves between
       * themes (see `GRADE`); they are declared at the dark values and the
       * first `applyPalette` snaps them to whichever room the page opened in.
       */
      const hemi = new THREE.HemisphereLight(0xfff1e0, 0x0a0410, GRADE.dark.hemi)
      scene.add(hemi)

      // Key. Low and to the side, and strong: an overhead key flattens a
      // sheet into a slab, and a timid one leaves it without a lit side at
      // all. Folds only read when the light rakes across them hard enough to
      // put one flank in highlight and the other in shadow.
      // Near-neutral, not the warm bulb it was: the tabletop is a large flat
      // near-black plane and takes a colour cast far more readily than the
      // fabric, so a warm key turned the whole table amber the moment the
      // cloth left it. Warmth belongs on the rim, which only the cloth sees.
      const key = new THREE.DirectionalLight(0xfffaf2, 2.2)
      key.position.set(6.5, 4.4, 4.2)
      key.castShadow = !reduced
      // A 2048² soft-shadow pass is a second full render every frame. The
      // phone gets a sixteenth of it: the only shadow that reads at that size
      // is the soft pool under the sheet, and at 512 it is still a soft pool.
      key.shadow.mapSize.setScalar(isMobile ? 512 : 2048)
      key.shadow.camera.near = 1
      key.shadow.camera.far = 26
      key.shadow.camera.left = -9
      key.shadow.camera.right = 9
      key.shadow.camera.top = 9
      key.shadow.camera.bottom = -9
      key.shadow.bias = -0.0012
      key.shadow.normalBias = 0.02
      scene.add(key)

      // A cool counter-light so the folds have a readable shadow side rather
      // than going to black — the shadow side is still part of the shape.
      const fill = new THREE.DirectionalLight(0x9fb6ff, 0.5)
      fill.position.set(-6, 3.5, -4)
      scene.add(fill)

      /*
       * Rim, from behind and below the far edge. This is the one that makes
       * the cloth an object: it catches the crest of every fold from the far
       * side, so the sheet has a bright edge against the dark table instead of
       * dissolving into it.
       *
       * It lights the cloth and nothing else, and that is enforced rather than
       * hoped for. On layer 0 with everything else, a warm light this strong
       * washed the whole tabletop amber — the table is a big flat plane and a
       * near-black aubergine, so it takes a warm tint far more readily than
       * the cloth does, and the scene turned into a brown field the moment
       * the sheet came off it. `CLOTH_LAYER` is the whole fix: the light and
       * the mesh share a layer nothing else is on.
       *
       * Note what is NOT here either: an overhead pool light on the table. It
       * was tried and it is the wrong tool on a saturated surface — flooding
       * a pure red from above saturates the red channel long before green and
       * blue, so the cloth desaturates to salmon and stops being the
       * project's colour. Highlights on this sheet come from grazing light
       * and from `sheen`, never from raw intensity; the falloff the pool was
       * meant to give the tabletop is a CSS vignette instead, where it costs
       * nothing and cannot touch the hue.
       */
      const rim = new THREE.DirectionalLight(0xffd9b0, GRADE.dark.rim)
      rim.position.set(-3.2, 2.2, -7.5)
      rim.layers.set(CLOTH_LAYER)
      scene.add(rim)

      /*
       * ---- table ----
       *
       * A finite slab, not an infinite plane. The earlier version was a 40x30
       * ground plane in almost the page's own background colour, so the cloth
       * appeared to float in a void with nothing under it — which undoes the
       * entire metaphor. Giving the table real edges and a little thickness
       * means the sheet is unmistakably lying ON something.
       */
      const tableMaterial = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 })
      const table = new THREE.Mesh(new THREE.BoxGeometry(TABLE.width, TABLE.height, TABLE.depth), tableMaterial)
      table.position.y = -TABLE.height / 2
      table.receiveShadow = !reduced
      scene.add(table)

      /*
       * ---- the coffee ----
       *
       * A rider on the cloth, built here and handed to the tile physics below
       * (see `TileBody.mesh`, which is an `Object3D` precisely so this Group
       * can be one). Modelled from its base, so `rideHeight` is the bare
       * clearance rather than half a body.
       *
       * Double-sided, which is the whole difference between a mug and the
       * broken shape this was on the first attempt. The wall is an open-ended
       * cylinder — that is what gives it a rim to look over instead of a
       * painted-on lid — and an open cylinder rendered single-sided has no far
       * wall at all: you look straight through the back of the cup and the
       * coffee ends in mid-air. There is no cheaper way to get wall thickness
       * at this size than to let the inside be drawn.
       *
       * Left on layer 0 only: the rim light belongs to the cloth alone, and a
       * warm 2.1-intensity light raking a pale ceramic from behind would blow
       * it out and steal the sheet's own bright edge.
       */
      const cupMaterial = new THREE.MeshStandardMaterial({
        roughness: 0.42,
        metalness: 0,
        side: THREE.DoubleSide,
      })
      const brewMaterial = new THREE.MeshStandardMaterial({ roughness: 0.18, metalness: 0 })

      const cup = new THREE.Group()

      // Narrower at the base, the way a mug actually is — a true cylinder
      // reads as a tin can.
      const cupWall = new THREE.Mesh(
        new THREE.CylinderGeometry(CUP.radius, CUP.radius * 0.84, CUP.height, 28, 1, true),
        cupMaterial,
      )
      cupWall.position.y = CUP.height / 2
      cup.add(cupWall)

      const cupBase = new THREE.Mesh(new THREE.CircleGeometry(CUP.radius * 0.84, 28), cupMaterial)
      cupBase.rotation.x = -Math.PI / 2
      cup.add(cupBase)

      // Held below the rim, so the wall stands proud of it and the cup reads
      // as full rather than as a brown disc balanced on a tube.
      const brew = new THREE.Mesh(new THREE.CircleGeometry(CUP.radius * 0.94, 28), brewMaterial)
      brew.rotation.x = -Math.PI / 2
      brew.position.y = CUP.height * 0.86
      cup.add(brew)

      /*
       * The handle: a C joined to the wall at both ends, not a ring parked
       * beside the cup.
       *
       * A torus already lies in the XY plane with its ring axis down Z, which
       * is exactly a handle's plane on the +X side of a mug — so it needs no
       * rotation to stand up, only one about Z to aim it. A partial torus
       * sweeps counter-clockwise from +X, so its arc is centred at half the
       * sweep; rolling back by that much points the arc outward and leaves the
       * gap against the cup, which is where a handle joins.
       *
       * Just over half a turn, and that is the whole correction. At 1.3 turns
       * the arc closed so far around that it read as a doughnut stuck to the
       * side, and its two ends came back around to meet the wall at a glancing
       * angle where the join showed. Slightly past π the ends instead point
       * back INTO the cup and finish buried inside the wall, so there is no
       * join to see at any angle — and the silhouette left outside is the
       * plain C a mug handle actually is.
       *
       * The ring centre sits just inside the wall for the same reason.
       */
      const handleSweep = Math.PI * 1.15
      const handleRadius = CUP.radius * 0.5
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(handleRadius, CUP.radius * 0.13, 12, 24, handleSweep),
        cupMaterial,
      )
      handle.position.set(CUP.radius * 0.88, CUP.height * 0.5, 0)
      handle.rotation.z = -handleSweep / 2
      cup.add(handle)

      for (const part of cup.children) {
        part.castShadow = !reduced
        part.receiveShadow = !reduced
      }
      scene.add(cup)

      /*
       * ---- tiles: one solid case per program class, resting on the cloth ----
       *
       * A box, not a plane, and lit rather than unlit. Both matter for the
       * same reason: an object put down on a tablecloth is separated from it
       * by an edge, a shadow, and its own shading, and a flat unlit quad laid
       * tangent to the fabric has none of the three — it reads as a pattern
       * printed into the sheet. The lid carries the label; the case around it
       * is what makes the lid an object.
       */
      const tileGeometry = new THREE.BoxGeometry(TILE.width, TILE.height, TILE.depth)

      const tileTextures: Array<ThreeTypes.CanvasTexture> = []
      const tileMaterials: Array<ThreeTypes.MeshStandardMaterial> = []

      /**
       * Tiles rest on the cloth rather than bind to one of its vertices: a
       * rest (x, z) maps straight onto a (u, v) fraction of the grid's own
       * extent, which is what `sampleSurface` reads back continuously below
       * — that is what lets a tile slide smoothly across the weave instead
       * of hopping from particle to particle as the sheet deforms.
       */
      const tiles: TileBody[] = placements.map(({ x, z }, index) => {
        const texture = new THREE.CanvasTexture(document.createElement('canvas'))
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        // Matte, so the lid never mirrors the key light into a hotspot over
        // its own type; the edge highlight is the only specular a case gets.
        //
        // The emissive term is the same canvas at a fraction of its strength.
        // A lit lid is the point — it has to shade as the sheet tilts it — but
        // these are dark plates on a dark table under one raking key, and pure
        // reflectance drops the labels out of legibility the moment a tile
        // turns away from the light. This floors them without flattening the
        // shading that does the actual work.
        const lid = new THREE.MeshStandardMaterial({
          map: texture,
          emissive: 0xffffff,
          emissiveMap: texture,
          emissiveIntensity: 0.34,
          roughness: 0.62,
          metalness: 0,
          transparent: true,
        })
        const shell = new THREE.MeshStandardMaterial({
          roughness: 0.5,
          metalness: 0,
          transparent: true,
        })
        // BoxGeometry's groups run +x, -x, +y, -y, +z, -z; only +y is the lid.
        const materials = [shell, shell, lid, shell, shell, shell]
        const mesh = new THREE.Mesh(tileGeometry, materials)
        mesh.position.set(x, CLOTH_SURFACE_Y + TILE.lift + TILE.height / 2, z)
        // The case shadows the cloth it stands on — the contact shadow is what
        // finally says "on top of" rather than "part of".
        mesh.castShadow = !reduced
        mesh.receiveShadow = !reduced
        scene.add(mesh)

        tileTextures.push(texture)
        tileMaterials.push(lid, shell)

        const homeU = Math.min(1, Math.max(0, (x + CLOTH.width / 2) / CLOTH.width))
        const homeV = Math.min(1, Math.max(0, (z + CLOTH.depth / 2) / CLOTH.depth))

        return {
          mesh,
          rideHeight: TILE.lift + TILE.height / 2,
          throwScale: 1,
          materials: [lid, shell],
          // Nothing is ever put down perfectly square. A few degrees of
          // deterministic yaw per tile is the difference between eight objects
          // someone set on a table and eight cells of a rendered grid.
          yaw: (((index * 2.399963) % 1) - 0.5) * 0.17,
          homeU,
          homeV,
          u: homeU,
          v: homeV,
          du: 0,
          dv: 0,
          supported: true,
          landed: false,
          unsupportedSeconds: 0,
          velocity: new THREE.Vector3(),
          angularVelocity: new THREE.Vector3(),
          lastPosition: mesh.position.clone(),
          carried: new THREE.Vector3(),
          returnElapsed: null,
          returnFrom: new THREE.Vector3(),
          returnFromQuaternion: new THREE.Quaternion(),
        }
      })

      /*
       * The mug joins the riders.
       *
       * Same list, same physics, same recall — it slides when the fabric
       * tilts, is thrown when the sheet is whipped out from under it, and is
       * walked home when the cloth comes back. Appended after the tiles rather
       * than mapped with them because it has no label to paint and no shell
       * colour to re-read: `applyPalette` walks `placements`, which is the
       * eight program classes and not this.
       */
      const cupHomeU = Math.min(1, Math.max(0, (CUP.x + CLOTH.width / 2) / CLOTH.width))
      const cupHomeV = Math.min(1, Math.max(0, (CUP.z + CLOTH.depth / 2) / CLOTH.depth))
      cup.position.set(CUP.x, CLOTH_SURFACE_Y + TILE.lift, CUP.z)
      tiles.push({
        mesh: cup,
        materials: [cupMaterial, brewMaterial],
        rideHeight: TILE.lift,
        throwScale: 0.4,
        yaw: -0.34,
        homeU: cupHomeU,
        homeV: cupHomeV,
        u: cupHomeU,
        v: cupHomeV,
        du: 0,
        dv: 0,
        supported: true,
        landed: false,
        unsupportedSeconds: 0,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        lastPosition: cup.position.clone(),
        carried: new THREE.Vector3(),
        returnElapsed: null,
        returnFrom: new THREE.Vector3(),
        returnFromQuaternion: new THREE.Quaternion(),
      })

      /** The mug's own tile entry — steam rides its resting state below. */
      const cupTile = tiles[tiles.length - 1]!

      /*
       * A wisp of steam over the brew.
       *
       * Everything else in this scene only moves because a reader acts on
       * it — scroll drives the peel, a press drives the drag — and between
       * those inputs it sits completely still. SOTD winners keep one thing
       * idling on its own regardless (hirotos.com's traffic light cycles
       * unprompted; Lacoste's suspended necklace sways and reacts at rest),
       * and the mug is the one prop already sitting in frame waiting for it.
       *
       * Billboard planes rather than a particle system or a shader: two or
       * three camera-facing quads with a soft radial alpha, rising and
       * fading on a loop, read as vapour at this scale for a fraction of
       * either alternative's cost. Additive blending lets a faint wisp glow
       * against the dim table instead of just occluding it — closer to how a
       * lit particle of real steam actually reads — and stays legible at low
       * opacity, which matters: the plume has to stay quiet enough not to
       * fight the reveal captions arriving over this same patch of frame.
       *
       * Parented to `cup` so it rides the mug's own position, but not its
       * rotation: `cup` tilts to match whatever footprint it is standing on
       * (see `poseTile`), and a steam plane that tilted with it would stop
       * facing the camera the moment the cloth wrinkled underneath. Each
       * plane's own quaternion is instead set every frame in `advanceSteam`
       * to cancel the parent's rotation and re-apply the camera's.
       *
       * Skipped entirely under reduced motion — there is no loop to animate
       * it on — and halved on mobile: at a phone's viewing distance two
       * overlapped wisps read the same as one, and it is one fewer draw call
       * on hardware that is already the tightest part of the frame budget.
       */
      const steamMaterials: ThreeTypes.MeshBasicMaterial[] = []
      const steamMeshes: ThreeTypes.Mesh[] = []
      const steamPhase: number[] = []
      let steamGeometry: ThreeTypes.PlaneGeometry | null = null
      let steamTexture: ThreeTypes.CanvasTexture | null = null
      if (!reduced) {
        steamGeometry = new THREE.PlaneGeometry(1, 1)
        steamTexture = new THREE.CanvasTexture(paintSteam())
        const steamCount = isMobile ? 1 : 2
        for (let i = 0; i < steamCount; i++) {
          const material = new THREE.MeshBasicMaterial({
            map: steamTexture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            opacity: 0,
          })
          const mesh = new THREE.Mesh(steamGeometry, material)
          mesh.position.set((i - (steamCount - 1) / 2) * STEAM.spread, CUP.height * 0.86, 0)
          cup.add(mesh)
          steamMaterials.push(material)
          steamMeshes.push(mesh)
          // Staggered rather than synchronised, so the wisps read as one
          // continuous plume instead of a single shape pulsing in place.
          steamPhase.push(i / steamCount)
        }
      }

      // ---- cloth mesh ----
      // PlaneGeometry supplies the index buffer and UVs for a (cols x rows) grid
      // in exactly the row-major order the sim uses; only positions are ours.
      const geometry = new THREE.PlaneGeometry(CLOTH.width, CLOTH.depth, cols - 1, rows - 1)
      const positionAttribute = geometry.getAttribute('position') as ThreeTypes.BufferAttribute
      // The albedo stays a flat solid colour — the cloth is one red, and any
      // pattern painted into it would fight the folds. Surface detail is a
      // grayscale weave promoted to a bump map, so the threads only ever show
      // up as lighting, never as blotches in the colour.
      const weaveTexture = new THREE.CanvasTexture(paintWeave())
      weaveTexture.wrapS = THREE.RepeatWrapping
      weaveTexture.wrapT = THREE.RepeatWrapping
      weaveTexture.repeat.set(28, 20)
      weaveTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      /*
       * Physical rather than standard, for one property: `sheen`.
       *
       * Cloth is not a dull plastic surface. Its brightness is dominated by
       * light grazing the fibres at a shallow angle, which is exactly the
       * retroreflective lobe `sheen` models and a plain roughness parameter
       * cannot express at all. Without it the sheet had no bright side under
       * any light — turning the key up just raised the whole thing evenly and
       * washed the red out. With it, the crest of every fold catches the key
       * and the rim, and the fabric finally has a highlight to look at.
       */
      const clothMaterial = new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
        roughness: 0.74,
        metalness: 0,
        // Restrained on purpose. At full strength the sheen lobe is wide
        // enough to catch the whole broad top of the sheet, not just the fold
        // crests, and a red that bright everywhere is a salmon one. Narrow it
        // and it only fires where the light actually grazes.
        sheen: 0.55,
        sheenRoughness: 0.62,
        bumpMap: weaveTexture,
        // Barely there. The big folds are real mesh normals; this is only the
        // grain on top of them, and anything higher turns cloth into corrugation.
        bumpScale: 0.05,
        /*
         * Declared transparent up front and left that way, rather than
         * flipped on when the fade starts: `transparent` is part of the
         * shader's cache key, so toggling it recompiles the program mid-peel.
         * `depthWrite` stays on, which is what keeps a folded double-sided
         * sheet fading as one silhouette instead of blending against itself.
         */
        transparent: true,
        depthWrite: true,
      })
      const cloth = new THREE.Mesh(geometry, clothMaterial)
      // Stays on layer 0 with everything else and additionally joins the rim's
      // layer, so the rim reaches it and nothing else.
      cloth.layers.enable(CLOTH_LAYER)
      cloth.castShadow = !reduced
      cloth.receiveShadow = !reduced
      scene.add(cloth)

      /*
       * ---- grade ----
       *
       * Which room the render is lit for, and the crossing between them.
       *
       * Two ways the surface moves and both have to land here: the reader
       * presses the theme control, or — for a reader who has never pressed it
       * — the peel uncovers the linen. Both already funnel through
       * `applyPalette`, so the grade reads the same signal the palette does
       * rather than inventing a second source of truth: `.light` is the
       * chosen surface, `data-surface="lit"` the uncovered one.
       *
       * Eased in the frame loop rather than set on the spot. Albedo can snap
       * — it lands on objects, and an object changing colour mid-crossfade is
       * hidden by the crossfade. Exposure is every pixel at once, and cutting
       * it while a full-frame tabletop is on screen reads as the render
       * flickering. `GRADE_EASE` is slower than the palette's own 1.1s
       * dissolve on purpose: the light in the room should arrive after the
       * cloth is off, not race it.
       */
      const grade = { exposure: GRADE.dark.exposure, hemi: GRADE.dark.hemi, rim: GRADE.dark.rim }
      let gradeTo = GRADE.dark
      /** The opening frame is graded, not faded into: only later flips cross. */
      let gradeSnapped = false

      const writeGrade = () => {
        renderer.toneMappingExposure = grade.exposure
        hemi.intensity = grade.hemi
        rim.intensity = grade.rim
      }

      /** `delta` of 0 snaps; anything else walks a frame's worth toward the target. */
      const easeGrade = (delta: number) => {
        const k = delta > 0 ? Math.min(1, delta * GRADE_EASE) : 1
        grade.exposure += (gradeTo.exposure - grade.exposure) * k
        grade.hemi += (gradeTo.hemi - grade.hemi) * k
        grade.rim += (gradeTo.rim - grade.rim) * k
        writeGrade()
      }

      // ---- palette ----
      const applyPalette = () => {
        const inkToken = readToken('--tc-ink')
        const accent = readToken('--tc-accent')
        const plate = readToken('--tc-surface-raised')
        const faint = readToken('--tc-ink-faint')

        /*
         * The table is furniture, so it is the colour of furniture.
         *
         * Straight `--tc-surface-sunk` made it a near-black aubergine slab —
         * the page's darkest surface wearing a table's shape, which read as a
         * void the cloth was floating over rather than as something the cloth
         * was lying on. Pulled toward walnut it is a dining table in both
         * worlds: dark stained wood under the dark palette, warm oak under the
         * linen one. Same lerp-from-a-token trick as the cloth's sheen and the
         * coffee, so each theme still tints it and no fourth colour is
         * declared.
         *
         * Safe now in a way it would not have been before: the key used to be
         * a warm bulb and a large flat plane takes a colour cast far more
         * readily than folded fabric does, so a warm table plus a warm key
         * turned the whole scene amber. The key is near-neutral today and the
         * rim is fenced onto the cloth's own layer, so the wood is lit rather
         * than washed.
         */
        tableMaterial.color.set(readToken('--tc-surface-sunk')).lerp(new THREE.Color(0x6b4429), 0.75)

        /*
         * Ceramic is ink, and the brew is derived rather than declared.
         *
         * The page's palette is two colours and one accent by policy, and a
         * mug is not worth a fourth. Ink gives a cream mug on the dark table
         * and a dark stoneware one on the linen — both read as a real cup, and
         * neither invents a hue. Coffee is the sunk surface pulled most of the
         * way toward espresso, the same lerp-from-a-token trick the cloth's
         * sheen already uses, so it lands brown in either world instead of
         * going tan when the tabletop does.
         */
        cupMaterial.color.set(readToken('--tc-ink'))
        brewMaterial.color.set(readToken('--tc-surface-sunk')).lerp(new THREE.Color(0x3f200d), 0.8)

        // Steam is the palette's one always-pale swatch: `--tc-ink` flips
        // dark in the light room (see cupMaterial above), which would turn
        // the wisp to smoke. `--tc-accent-fg` is the foreground-on-accent
        // tone and is defined identically in both themes for exactly that
        // reason, so the wisp stays a pale vapour regardless of which room
        // it is rising through.
        for (const material of steamMaterials) material.color.set(readToken('--tc-accent-fg'))

        clothMaterial.color.set(accent)
        // Sheen is a separate lobe with its own colour. Left white it frosts
        // the fold crests grey; warmed toward the cloth's own red it reads as
        // light coming off dyed fibre, which is the only way a red sheet gets
        // a bright edge without turning pink.
        clothMaterial.sheenColor.set(accent).lerp(new THREE.Color(0xffe2c4), 0.55)

        // The case is a shade under the lid, so the edge reads as a side wall
        // in shadow rather than as a second colour.
        const shellColor = readToken('--tc-surface-sunk')

        placements.forEach(({ type }, index) => {
          tileTextures[index]!.image = paintTile(
            type.label[locale],
            type.role[locale],
            type.sites,
            { plate, ink: inkToken, accent, faint },
          )
          tileTextures[index]!.needsUpdate = true
          tiles[index]!.materials[1]!.color.set(shellColor)
        })

        /*
         * Target only — the loop walks to it. Two exceptions snap instead:
         * the very first call, because the page has to open already lit for
         * the surface it opened on rather than fading up to it, and reduced
         * motion, where no loop runs between events to do the walking.
         */
        gradeTo =
          document.documentElement.classList.contains('light') ||
          document.documentElement.dataset.surface === 'lit'
            ? GRADE.lit
            : GRADE.dark
        if (reduced || !gradeSnapped) {
          gradeSnapped = true
          easeGrade(0)
        }

        renderer.render(scene, camera)
      }

      /*
       * ---- camera ----
       *
       * Split in two on purpose. `resize` works out how far back the lens has
       * to be for the table to fit this viewport, which only changes when the
       * viewport does; `poseCamera` places the eye along that distance, and it
       * runs every frame because after the cloth is gone the camera is the
       * only thing still moving.
       */
      let frameDistance = 0
      let frameAspect = 1
      /** 0 while the cloth is still on the table, 1 at the foot of the page. */
      let driftProgress = 0

      const poseCamera = () => {
        if (!frameDistance) return
        /*
         * Past the peel the scene had nothing left to do: the sheet was gone,
         * the table was bare, and eight more viewports of document scrolled
         * over a completely frozen frame — the most expensive asset on the
         * page, idle for most of the page. So the eye keeps moving. It sinks
         * toward the tabletop and pushes in, slowly, driven by the reader's
         * own scrolling rather than by a clock, so it reads as the room
         * settling rather than as an animation playing at them.
         */
        const t = driftProgress * driftProgress * (3 - 2 * driftProgress)
        const y = VIEW.y + (VIEW.y * 0.72 - VIEW.y) * t
        const z = VIEW.z + (VIEW.z * 0.88 - VIEW.z) * t
        // A little sideways travel too. Pure dolly reads as a zoom; the
        // parallax of the table's own edges moving against each other is what
        // says the camera is in a room rather than on a rail.
        const x = frameAspect > 1 ? t * frameDistance * 0.14 : 0

        camera.position.set(x, y * frameDistance, z * frameDistance)
        /*
         * Aimed below and to the left of the table's centre, which throws the
         * table up and to the right in frame. The display headline sets in the
         * lower left, and at its size it was printing straight across the two
         * nearest tiles — the tiles being the actual content the headline is
         * introducing. Composing the shot around the type costs nothing and is
         * what the aim is for; shrinking the type to dodge them would have
         * cost the whole point of enlarging it. The offset relaxes as the
         * camera drifts, since by then the headline has long gone.
         *
         * A phone gets the same trick on the other axis and for a different
         * reason. With the shot pulled in it no longer needs room made for the
         * copy — the headline sits over the fabric there, as it does on a
         * desktop — but aiming at the table's centre left the top third of the
         * frame as empty background above the far edge, with the "lift the
         * cloth" pill stranded in it. Dropping the aim tilts the lens down,
         * which raises the table in frame and closes that band; the sideways
         * offset stays off, because at this distance it would push the sheet
         * straight off the side of a 360px screen.
         */
        const wide = frameAspect > 1
        camera.lookAt(
          wide ? -1.1 * (1 - t * 0.7) : 0,
          (wide ? -0.75 : -1.15) * (1 - t * 0.6),
          0,
        )
      }

      /*
       * The closing beat's scroll range — see Cover.tsx.
       *
       * Measured off the marked block rather than derived from the document's
       * end, because a disclaimer and a footer come after it and the cloth has
       * to be home before either. Cached rather than read per frame: a rect
       * read taken after the root custom properties have been rewritten is a
       * forced style recalc, and `readScroll` runs on every scroll frame.
       *
       * A page with no such block — /docs — simply never re-covers.
       */
      let recoverStart = Number.POSITIVE_INFINITY
      let recoverSpan = 1
      /**
       * Also `--tc-recover`'s publish target. The block below is already the
       * smallest element every consumer of that property sits inside — see
       * the batch-wide rescope this reuses rather than a second query purely
       * for the host lookup.
       */
      let recoverHost: HTMLElement | null = null
      const measureRecover = () => {
        const block = document.querySelector<HTMLElement>('[data-cloth-recover-track]')
        recoverHost = block
        if (!block) {
          recoverStart = Number.POSITIVE_INFINITY
          return
        }
        const rect = block.getBoundingClientRect()
        recoverStart = rect.top + window.scrollY
        // The block is a tall track holding a viewport-tall sticky pane; what
        // is left over after the pane is exactly the travel it offers.
        recoverSpan = Math.max(1, rect.height - window.innerHeight)
      }

      const resize = () => {
        const { clientWidth, clientHeight } = mount
        if (!clientWidth || !clientHeight) return
        renderer.setSize(clientWidth, clientHeight, false)

        frameAspect = clientWidth / clientHeight
        camera.aspect = frameAspect
        // Pull back far enough that both axes fit — a tall phone viewport needs
        // much more distance than a wide desktop one, so this cannot be a
        // constant camera position.
        const halfFov = (VIEW.fov * Math.PI) / 360
        const forDepth = FRAME.halfDepth / Math.tan(halfFov)
        // A portrait viewport fits far less of the sheet's width on purpose —
        // see FRAME. Anything wider than square keeps the whole cloth.
        const halfWidth = frameAspect < 1 ? FRAME.portraitHalfWidth : FRAME.halfWidth
        const forWidth = halfWidth / (Math.tan(halfFov) * frameAspect)
        frameDistance = Math.max(forDepth, forWidth) * 1.06
        poseCamera()
        measureRecover()
        camera.updateProjectionMatrix()
      }

      repaint.current = applyPalette
      resize()
      applyPalette()
      // Korean glyphs go into the tile canvases; if the webfont lands after
      // first paint the labels would stay in the fallback face.
      void document.fonts.ready.then(() => {
        if (!disposed) applyPalette()
      })

      // ---- scroll -> peel progress ----
      let peelProgress = 0
      /** False once the cloth is off the table; nothing may be grabbed then. */
      let clothVisible = true
      /*
       * Last values actually published.
       *
       * `--tc-peel` and `--tc-drift` are inherited custom properties, so
       * writing one invalidates computed style for every element inside
       * whichever element currently hosts it — and both spend most of the
       * page pinned at their end value while the reader keeps scrolling.
       * Re-publishing an identical string bought nothing and cost a style
       * recalc across that subtree per scroll frame; comparing first makes
       * the whole lower page free.
       */
      let publishedPeel = ''
      let publishedDrift = ''
      let publishedRecover = ''
      let publishedDwell = ''
      /*
       * Where the four properties above actually attach.
       *
       * They used to all land on `<html>`, which every element in the
       * document inherits from, so a scroll frame that touched four of them
       * forced a full-document style recalc no matter how few elements
       * actually read any given one. Measured over five seconds of throttled
       * scrolling via CDP `Performance`: RecalcStyleDuration was 2,061ms of a
       * 4,622ms total task time (45%). Pointing each write at the smallest
       * subtree that still contains every consumer of that property cut it
       * to 947ms — peel and drift, the two priciest, gave back roughly
       * 400ms each on their own. `inherits: true` is unchanged (a
       * pseudo-element off the hero or the stage still has to see these);
       * only where they are written moved.
       *
       * A route with no hero or stage (`/docs`) simply finds nothing here
       * and never publishes that property. Every consumer already falls
       * back through `var(--tc-x, 0)`, so a missing host degrades to the
       * resting value instead of breaking.
       */
      let peelHost: HTMLElement | null = null
      let driftHost: HTMLElement | null = null
      let dwellHost: HTMLElement | null = null
      const resolveHosts = () => {
        peelHost = document.querySelector<HTMLElement>('[data-tc-peel]')
        driftHost = document.querySelector<HTMLElement>('[data-tc-drift]')
        dwellHost = document.querySelector<HTMLElement>('[data-tc-dwell]')
      }
      resolveHosts()
      /*
       * Debounces the one repaint the palette flip needs. The scene samples
       * its colours from the CSS tokens, so it has to re-read AFTER they have
       * finished tweening, not while they are moving — and never twice for a
       * reader who scrubs back and forth across the threshold.
       */
      let surfaceTimer = 0
      /*
       * The document's height, observed rather than polled.
       *
       * This used to be `document.documentElement.scrollHeight`, read at the
       * top of every scroll frame. That single expression was the most
       * expensive line in the file: the frame before it had just written
       * `--tc-peel` and `--tc-drift`, so asking for a layout-derived
       * number forced Chrome to flush a full-document style recalc and layout
       * synchronously before it could answer. Measured on a throttled phone
       * profile over five seconds of scrolling: 2,098ms of style recalc and
       * 219 layouts against 1,071ms of actual script — the page was spending
       * twice as long being asked how tall it was as it spent simulating a
       * cloth.
       *
       * A ResizeObserver on the document element answers the same question
       * without asking: it fires when the height actually changes — fonts
       * landing, images decoding, a reveal animation adding a section — which
       * is the only time the answer is different. The scroll frame now reads a
       * plain number and never touches layout.
       */
      let measuredHeight = document.documentElement.scrollHeight
      const readScroll = () => {
        const dwell = window.innerHeight * PEEL_DWELL
        const span = window.innerHeight * PEEL_VIEWPORTS

        /*
         * The ending the hero never performed — see Cover.tsx.
         *
         * Everything below is written against a single number that runs 0 to 1
         * across the closing block, and both of the scene's scroll-driven
         * quantities are simply scaled by its complement. Reversing the peel
         * rather than staging a second animation is the whole idea: the sheet
         * comes back over the table by exactly the route it left, the tiles
         * ride home on it because that is what the sim already does when the
         * cloth returns, and the camera walks back to the opening shot. Two
         * multiplications, and the page closes the way it opened.
         */
        const recover = Math.min(
          1,
          Math.max(0, (window.scrollY - recoverStart) / recoverSpan),
        )
        const home = 1 - recover

        peelProgress = Math.min(1, Math.max(0, (window.scrollY - dwell) / span)) * home

        /*
         * How far the reader is through the document AFTER the peel is done.
         * The hero's own run is excluded deliberately: the opening frame is
         * composed, and nudging it while the cloth is still coming off would
         * fight the one shot on the page that is already right.
         */
        const peelEnd = dwell + span
        const rest = Math.max(1, measuredHeight - window.innerHeight - peelEnd)
        /*
         * Reaches its end well before the document does — a drift that keeps
         * going all the way to the footer pushes the camera through the table
         * and leaves the last several sections over nothing at all. It has a
         * move to make, it makes it, and then it holds.
         */
        driftProgress =
          Math.min(1, Math.max(0, (window.scrollY - peelEnd) / (rest * 0.45))) * home
        /*
         * The veil the vignette thickens with — see ClothStage.module.css.
         * The lower page is body copy, and a bare tabletop cutting a hard
         * diagonal through a paragraph is worse than no scene at all. The
         * render stays live, it just recedes behind the reading.
         */
        const drift = driftProgress.toFixed(3)
        if (drift !== publishedDrift) {
          publishedDrift = drift
          driftHost?.style.setProperty('--tc-drift', drift)
        }

        /*
         * How far through the dwell the reader is — the run BEFORE the sheet
         * starts to move, which is 0.7 of a viewport of scrolling in which
         * nothing visibly happens.
         *
         * That silence is by design (see PEEL_DWELL) and it is also the one
         * place the page can look broken: press the cloth's own invitation and
         * for two seconds the document scrolls while the fabric sits perfectly
         * still. The hint pill wears this as a fill, so the wait reads as a
         * countdown to the cloth rather than as nothing happening. It reaches
         * 1 exactly as the peel leaves 0 and the pill hands over to the sheet.
         *
         * Pinned at 1 for the rest of the document, so like the others it
         * costs a style invalidation only while it is actually moving.
         */
        const dwelt = Math.min(1, Math.max(0, window.scrollY / dwell)).toFixed(3)
        if (dwelt !== publishedDwell) {
          publishedDwell = dwelt
          dwellHost?.style.setProperty('--tc-dwell', dwelt)
        }

        /*
         * Publish the peel as a plain number on its host.
         *
         * The hero's copy has to hand over to the reveal captions in exact
         * step with the sheet coming off, and the only honest clock for that
         * is the sheet's own progress — not a second ScrollTrigger with its
         * own start/end that would drift out of sync the moment either is
         * retuned. One writer here, read by CSS `calc()` on the other side,
         * so there is no per-frame JS on the copy at all.
         */
        const root = document.documentElement
        const peel = peelProgress.toFixed(4)
        if (peel !== publishedPeel) {
          publishedPeel = peel
          peelHost?.style.setProperty('--tc-peel', peel)
        }
        // Past this the intro is invisible; it must also stop swallowing
        // clicks aimed at the table behind it.
        if (peelProgress > 0.2) root.dataset.clothReveal = ''
        else delete root.dataset.clothReveal

        // Retire the hint the moment the cloth actually starts to move: an
        // instruction that is no longer actionable is just clutter.
        if (peelProgress > 0.01) document.documentElement.dataset.clothPeeling = ''
        else delete document.documentElement.dataset.clothPeeling

        /*
         * The page's own surface, uncovered.
         *
         * A threshold flip, not a per-frame mix: the palette drives every
         * colour on the document and this scene re-samples those tokens
         * through `getComputedStyle` to light itself, so a value that moved
         * every frame would mean a forced style read every frame. One flip,
         * CSS tweens the tokens, and the scene re-reads once at the far end.
         *
         * The two thresholds are not a typo. A single one sits on the exact
         * scroll position where an ordinary wheel jitters, and the whole page
         * would strobe between palettes while the reader sat still. It has to
         * be pulled to 0.86 to light and let back to 0.72 to darken, so the
         * dead band is wider than any hand is.
         *
         * `.tc-undecided` is the gate; app.css ignores this attribute without
         * it. Written unconditionally anyway, because the attribute is also
         * how the scene itself knows which world it is lighting.
         */
        const lit = root.dataset.surface === 'lit'
        const nextLit = peelProgress > (lit ? 0.72 : 0.86)
        if (nextLit !== lit) {
          root.dataset.surface = nextLit ? 'lit' : 'dark'
          window.clearTimeout(surfaceTimer)
          surfaceTimer = window.setTimeout(() => repaint.current?.(), 1200)
        }

        /*
         * The closing beat, published for its copy to key off — the same
         * contract `--tc-peel` has with the hero's captions, so the sentence
         * and the sheet share one clock. The attribute is what lets CSS hold
         * back the hero's "lift the cloth" hint, which would otherwise come
         * straight back the moment the peel unwound past its threshold.
         */
        const recovered = recover.toFixed(4)
        if (recovered !== publishedRecover) {
          publishedRecover = recovered
          recoverHost?.style.setProperty('--tc-recover', recovered)
        }
        if (recover > 0) root.dataset.clothRecover = ''
        else delete root.dataset.clothRecover

        /*
         * The tail of the peel is a dissolve as well as a flight.
         *
         * The exit is choreographed to carry the bundle over the table's back
         * edge and out of frame, and on a wide viewport that is exactly what
         * happens. A tall phone frame is the counter-example: `resize` has to
         * pull the lens back far enough to fit the table's DEPTH across a
         * narrow width, and the vertical field that buys swallows the whole
         * exit — so the peel ended with the sheet parked in view, hanging off
         * the near edge under the reveal captions, which is where the fabric
         * stops reading as leaving and starts reading as stuck.
         *
         * Fading it over the last of its travel costs nothing on the frames
         * where it had already left, and is the whole fix on the ones where
         * it had not. Symmetric, so scrolling back up brings it home again.
         */
        const gone = Math.min(
          1,
          Math.max(0, (peelProgress - CLOTH_FADE.from) / (CLOTH_FADE.to - CLOTH_FADE.from)),
        )
        clothMaterial.opacity = 1 - gone
        // Skip the draw entirely once there is nothing left of it — and with
        // it the shadow, which the depth pass would otherwise keep casting at
        // full strength from an invisible sheet.
        cloth.visible = gone < 1

        // The canvas is never faded. It stayed at full strength on purpose:
        // the table is the surface the whole document sits on, and dimming it
        // under the lower sections made the page look like it had quietly
        // swapped to a flat background. Readability is handled where it should
        // be — by the sections' own scrim and blur — not by hiding the scene.

        // Once the sheet is off the table there is nothing left to pick up, so
        // the grab affordance retires even though the canvas is still shown.
        clothVisible = peelProgress < CLOTH_FADE.from
        if (clothVisible) document.documentElement.dataset.clothActive = ''
        else delete document.documentElement.dataset.clothActive
      }
      readScroll()

      /*
       * Reframe AND re-read, in that order, whenever the viewport changes.
       *
       * Zooming is the case that exposed this. Browser zoom changes the CSS
       * viewport, so `resize` fired and the camera was reframed — but every
       * scroll-derived quantity on this scene is measured in viewport heights
       * (`PEEL_DWELL`, `PEEL_VIEWPORTS`, the drift's remaining-document span,
       * the closing beat's range) and `readScroll` only ran on `scroll`. Zoom
       * does not necessarily fire one. So the reader zoomed halfway down the
       * page and got a camera posed for the new frame driving a sheet still
       * pinned to targets computed for the old one: the cloth jumped to a peel
       * state that had nothing to do with where the page actually was, and
       * stayed wrong until the next wheel notch.
       *
       * Registered after the first `readScroll` above so the callback can
       * never observe either function before its initialiser has run.
       */
      const observer = new ResizeObserver(() => {
        resize()
        readScroll()
      })
      observer.observe(mount)

      /*
       * The document's own height, watched separately from the canvas.
       *
       * The canvas is `position: fixed` and therefore never changes size when
       * the document grows, so the observer above cannot see a late reflow —
       * a webfont landing, a reveal animation adding height, an image
       * decoding. This one does, and it is the only thing that now writes
       * `measuredHeight` or re-measures the closing beat's range.
       */
      const docObserver = new ResizeObserver(() => {
        measuredHeight = document.documentElement.scrollHeight
        measureRecover()
        // A late-mounting hero or stage — this scene persists across a route
        // transition that swaps the page under it without remounting — needs
        // these re-found the same way a height change does.
        resolveHosts()
        readScroll()
      })
      docObserver.observe(document.documentElement)

      // ---- pointer -> table coordinates ----
      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CLOTH_SURFACE_Y)
      const hit = new THREE.Vector3()
      let pressing = false
      let liftFactor = 0
      /** Screen Y where the current drag began, and the height it has earned. */
      let dragStartY = 0
      let dragLift = 0
      /**
       * Live lift speed the current drag is producing, in the same world
       * m/s `tile.carried`/`FREE.shakeSpeed` are measured in — see
       * `releaseTile` and `DRAG_THROW`.
       */
      let dragLiftSpeed = 0
      let lastDragLift = 0
      let lastDragMoveTime = 0
      /** World XZ where the current grab cluster started; grabCluster/moveCluster work in deltas from here. */
      let grabOriginX = 0
      let grabOriginZ = 0

      const updatePointer = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        return raycaster.ray.intersectPlane(tablePlane, hit) !== null
      }

      // ---- frame ----
      const syncGeometry = () => {
        positionAttribute.array.set(sim.positions)
        positionAttribute.needsUpdate = true
        geometry.computeVertexNormals()
      }

      // ---- tiles: resting on the cloth, not bound to it ----
      const UP = new THREE.Vector3(0, 1, 0)
      const tilePoint = new THREE.Vector3()
      const tileDCol = new THREE.Vector3()
      const tileDRow = new THREE.Vector3()
      const tileNormal = new THREE.Vector3()
      const gravityTangent = new THREE.Vector3()

      /*
       * ---- the tile's own footprint ----
       *
       * A tile is rigid and the cloth is not. Posing it from a single sample
       * — one point, one normal, taken at its centre — is what made it look
       * glued: the slab inherited the exact curvature under its middle, so it
       * bent with every wrinkle it crossed and sank into every trough.
       *
       * A real case bridges. So the pose comes from the four corners of its
       * actual footprint instead: the plane fitted through them is the tilt,
       * and the highest of those contacts is what it rests on. Bridge a fold
       * and the tile sits proud of it on one edge, exactly like something set
       * down on rumpled fabric — which is the whole read the page needs.
       */
      const FOOT_U = TILE.width / (2 * CLOTH.width)
      const FOOT_V = TILE.depth / (2 * CLOTH.depth)
      const CORNER_U = [-1, 1, 1, -1]
      const CORNER_V = [-1, -1, 1, 1]
      const corners = [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]
      const cornerDCol = new THREE.Vector3()
      const cornerDRow = new THREE.Vector3()
      const footCentre = new THREE.Vector3()
      const footNormal = new THREE.Vector3()
      const footDiagA = new THREE.Vector3()
      const footDiagB = new THREE.Vector3()

      /** Signed height of `point` above the plane through `footCentre` with `footNormal`. */
      const overPlane = (point: ThreeTypes.Vector3) =>
        (point.x - footCentre.x) * footNormal.x +
        (point.y - footCentre.y) * footNormal.y +
        (point.z - footCentre.z) * footNormal.z

      const yawQuaternion = new THREE.Quaternion()

      /**
       * Poses the slab on whatever its footprint is actually touching: tilt
       * from the plane through the four corners, height from the highest
       * contact among them (and the centre), so no part of a rigid case ever
       * dips below the fabric it is standing on.
       */
      const poseTile = (tile: TileBody) => {
        footCentre.set(0, 0, 0)
        for (let k = 0; k < 4; k++) {
          const cu = Math.min(1, Math.max(0, tile.u + CORNER_U[k]! * FOOT_U))
          const cv = Math.min(1, Math.max(0, tile.v + CORNER_V[k]! * FOOT_V))
          sim.sampleSurface(cu * (cols - 1), cv * (rows - 1), corners[k]!, cornerDCol, cornerDRow)
          footCentre.add(corners[k]!)
        }
        footCentre.multiplyScalar(0.25)

        // Cross of the footprint's diagonals: the least-squares plane through
        // four points, for the price of one cross product.
        footDiagA.subVectors(corners[3]!, corners[1]!)
        footDiagB.subVectors(corners[2]!, corners[0]!)
        footNormal.crossVectors(footDiagA, footDiagB)
        if (footNormal.lengthSq() < 1e-10) footNormal.copy(tileNormal)
        else footNormal.normalize()
        // A footprint folded in half can invert the fit; the centre sample is
        // the tie-breaker for which way is up.
        if (footNormal.dot(tileNormal) < 0) footNormal.negate()

        let rise = overPlane(tilePoint)
        for (let k = 0; k < 4; k++) rise = Math.max(rise, overPlane(corners[k]!))

        tile.mesh.position
          .copy(footCentre)
          .addScaledVector(footNormal, Math.max(0, rise) + tile.rideHeight)
        // Tilt first, then spin in the tile's own plane: after the swing to the
        // footprint normal the mesh's local +Y is that normal, so a post-
        // multiplied Y rotation is a yaw across the fabric, not a world twist.
        tile.mesh.quaternion
          .setFromUnitVectors(UP, footNormal)
          .multiply(yawQuaternion.setFromAxisAngle(UP, tile.yaw))
      }

      let introDone = false

      /**
       * Hands a tile over to free flight with whatever the cloth was already
       * doing to it. `carried` is measured, not modelled: it is the tile's own
       * world displacement over the last step, which while it rode the sheet
       * is the sheet's velocity underneath it. Whip the cloth away and that
       * speed is already in the tile — so it is thrown, and how far depends
       * on how hard the reader pulled.
       *
       * `scooped` is the peel. A tablecloth taken off a table is not a flat
       * sheet sliding out: it gathers into a roll, and that roll arrives
       * under whatever is standing in its path and throws it up and back over
       * the far edge. Without that impulse the sheet simply slid away and
       * left the whole set sitting on the tabletop — the exact opposite of
       * what this page claims happens, and the reason the reveal never
       * landed. Measured velocity alone cannot supply it: at reading speed
       * the fabric is barely moving, yet the roll is still a solid thing
       * moving through where it used to be.
       */
      const releaseTile = (tile: TileBody, scooped: boolean) => {
        tile.velocity.copy(tile.carried).multiplyScalar(tile.throwScale)
        /*
         * How hard, not just whether. `carried` alone answers whether a
         * tile lets go — it is the exact measured speed at the frame the
         * threshold crossed, barely over `FREE.shakeSpeed` by definition,
         * whether the gesture was a careful nudge or a violent yank. Only
         * during an actual hand drag does `dragLiftSpeed` — a live reading
         * of the pull itself, not a single trigger-frame sample — scale the
         * launch on top of that: the same trick hirotos.com uses, reading
         * drag velocity to size its own scramble rather than firing it at a
         * fixed strength once a threshold is crossed.
         */
        if (pressing && sim.isGrabbing) {
          const pull = Math.min(1, dragLiftSpeed / DRAG_THROW.reference)
          tile.velocity.multiplyScalar(DRAG_THROW.min + pull * (DRAG_THROW.max - DRAG_THROW.min))
        }
        const speed = tile.velocity.length()
        if (speed > FREE.maxLaunch) tile.velocity.multiplyScalar(FREE.maxLaunch / speed)
        if (scooped) {
          tile.velocity.z -= FREE.scoopBack * tile.throwScale
          tile.velocity.y += FREE.scoopLift * tile.throwScale
        }
        // Tumble across the throw, with a floor so even a gentle slide turns
        // the case over rather than sliding it off like a coaster.
        tile.angularVelocity.set(
          -tile.velocity.z * FREE.tumbleRate - FREE.tumbleBase,
          (tile.velocity.x - tile.velocity.z) * FREE.tumbleRate * 0.5,
          tile.velocity.x * FREE.tumbleRate + FREE.tumbleBase,
        )
        tile.supported = false
        tile.landed = false
        tile.unsupportedSeconds = 0
      }

      /**
       * A supported tile has no life of its own: every frame the cloth is
       * sampled at its centre and `poseTile` sets the transform from the four
       * corners of its footprint. Sliding — (u, v) drifting downhill under
       * gravity's tangential pull — only happens while the sheet is actually
       * being disturbed; an untouched drape holds its arrangement. It leaves
       * the cloth three ways: torn off by a fast pull, tipped off by fabric
       * folding past upright, or slid clean over an edge.
       */
      const advanceSupportedTile = (tile: TileBody, dt: number) => {
        sim.sampleSurface(tile.u * (cols - 1), tile.v * (rows - 1), tilePoint, tileDCol, tileDRow)
        tileNormal.crossVectors(tileDRow, tileDCol).normalize()

        poseTile(tile)

        const peeling = peelProgress > RESET_PEEL_EPS

        // Fabric whipped out from under a solid does not take it along. Past
        // `shakeSpeed` the contact cannot hold and the tile leaves with
        // whatever the cloth was doing — see `FREE`.
        if (introDone && tile.carried.lengthSq() > FREE.shakeSpeed * FREE.shakeSpeed) {
          releaseTile(tile, peeling)
          return
        }

        // A patch can fold past vertical, or over completely, entirely inside
        // [0, 1]: the fabric has folded out from under the tile. Under a hand
        // that drops it where it stood; under the peel it is the roll arriving,
        // which throws it clear instead.
        if (introDone && tileNormal.y < UPRIGHT_MIN) {
          releaseTile(tile, peeling)
          return
        }

        // Nothing slides on a sheet nobody is touching — see `SLIDE`.
        const disturbed = introDone && (sim.isGrabbing || peeling)
        if (!disturbed) {
          tile.du = 0
          tile.dv = 0
          return
        }

        // Tangential component of gravity: g - (g . n)n, g = (0, -1, 0).
        // Its length is sin(tilt) — zero on a flat patch, growing with slope.
        const gDotN = -tileNormal.y
        gravityTangent.set(0, -1, 0).addScaledVector(tileNormal, -gDotN)
        const slope = gravityTangent.length()

        if (slope > SLIDE.staticSlope) {
          const colLength = tileDCol.length()
          const rowLength = tileDRow.length()
          // Downhill, projected onto each grid axis: the tangent dotted
          // against that axis's own derivative, normalised by its length.
          if (colLength > 1e-6) {
            tile.du += (gravityTangent.dot(tileDCol) / colLength) * SLIDE.accel * dt
          }
          if (rowLength > 1e-6) {
            tile.dv += (gravityTangent.dot(tileDRow) / rowLength) * SLIDE.accel * dt
          }
        }

        tile.du *= SLIDE.damping
        tile.dv *= SLIDE.damping
        // Static friction: below this slope AND this speed, stop outright
        // so a tile on the (never perfectly flat) resting sheet never creeps.
        if (slope < SLIDE.staticSlope && Math.hypot(tile.du, tile.dv) < SLIDE.staticSpeed) {
          tile.du = 0
          tile.dv = 0
        }

        const nextU = tile.u + tile.du * dt
        const nextV = tile.v + tile.dv * dt
        if (nextU >= 0 && nextU <= 1 && nextV >= 0 && nextV <= 1) {
          tile.u = nextU
          tile.v = nextV
          return
        }

        // Slid clean off the sheet's edge.
        releaseTile(tile, peeling)
      }

      /**
       * Ballistics, a tumble, and the tabletop.
       *
       * There is no invisible wall around the table. If a sweep throws a tile
       * clear of the edge it goes over the edge, because that is the argument
       * the page is making: the cloth comes off and what was on it goes with
       * it, leaving the table as it was. A tile that leaves simply parks below
       * the frame and waits — put the cloth back and it comes back.
       *
       * A tile that does land keeps whatever angle the tumble left it at, so
       * no two throws leave the same arrangement.
       */
      const advanceFreeTile = (tile: TileBody, dt: number) => {
        tile.velocity.y += FREE.gravity * dt
        const { position, rotation } = tile.mesh
        position.addScaledVector(tile.velocity, dt)
        rotation.set(
          rotation.x + tile.angularVelocity.x * dt,
          rotation.y + tile.angularVelocity.y * dt,
          rotation.z + tile.angularVelocity.z * dt,
        )

        // Well below the tabletop. Parking rather than integrating forever
        // keeps a swept-away tile cheap and recallable — and it is hidden
        // outright, because a tall viewport pushes the camera far enough back
        // that "below the table" is still inside the frustum, and a row of
        // stalled cards hanging under the tabletop is not what "taken away"
        // is supposed to look like.
        if (position.y < PARK_Y) {
          position.y = PARK_Y
          tile.velocity.set(0, 0, 0)
          tile.angularVelocity.set(0, 0, 0)
          tile.mesh.visible = false
          tile.landed = true
          return
        }

        // Table top is y = 0 by construction; a case lands on its own
        // underside, so its centre stops half a thickness above that plus the
        // same clearance a supported tile keeps above the cloth.
        const landingY = tile.rideHeight
        if (position.y > landingY || tile.velocity.y > 0) return
        const overTable =
          Math.abs(position.x) <= TABLE.width / 2 && Math.abs(position.z) <= TABLE.depth / 2
        if (!overTable) return
        position.y = landingY

        if (-tile.velocity.y > FREE.bounceCutoff) {
          tile.velocity.y *= -FREE.restitution
          tile.velocity.x *= FREE.tableFriction
          tile.velocity.z *= FREE.tableFriction
          tile.angularVelocity.multiplyScalar(FREE.tableFriction)
          return
        }

        tile.velocity.set(0, 0, 0)
        tile.angularVelocity.set(0, 0, 0)
        rotation.set(0, rotation.y, 0)
        tile.landed = true
      }

      /**
       * Starts the glide home. Nothing fades and nothing teleports: the tile
       * lifts off the table and walks back to its place on the re-covered
       * cloth, because a page that makes you knock things over should also
       * show you putting them back.
       */
      const startReturn = (tile: TileBody) => {
        tile.mesh.visible = true
        tile.returnFrom.copy(tile.mesh.position)
        tile.returnFromQuaternion.copy(tile.mesh.quaternion)
        tile.returnElapsed = 0
        tile.u = tile.homeU
        tile.v = tile.homeV
        tile.du = 0
        tile.dv = 0
        tile.velocity.set(0, 0, 0)
        tile.angularVelocity.set(0, 0, 0)
      }

      const returnTarget = new THREE.Vector3()
      const returnQuaternion = new THREE.Quaternion()

      /** Returns true while it owns the tile's transform this step. */
      const advanceReturn = (tile: TileBody, dt: number) => {
        if (tile.returnElapsed === null) return false
        tile.returnElapsed += dt
        const t = Math.min(1, tile.returnElapsed / RETURN_SECONDS)

        // Home is wherever the cloth puts it right now — the sheet is usually
        // still relaxing while the tiles are on their way back.
        sim.sampleSurface(
          tile.homeU * (cols - 1),
          tile.homeV * (rows - 1),
          tilePoint,
          tileDCol,
          tileDRow,
        )
        tileNormal.crossVectors(tileDRow, tileDCol).normalize()
        poseTile(tile)
        returnTarget.copy(tile.mesh.position)
        returnQuaternion.copy(tile.mesh.quaternion)

        const eased = 1 - (1 - t) ** 3
        tile.mesh.position.lerpVectors(tile.returnFrom, returnTarget, eased)
        tile.mesh.quaternion.slerpQuaternions(tile.returnFromQuaternion, returnQuaternion, eased)
        // A shallow arc, so it is lifted back rather than dragged across.
        tile.mesh.position.y += Math.sin(Math.PI * t) * RETURN_ARC

        if (t >= 1) {
          tile.returnElapsed = null
          tile.supported = true
          tile.landed = false
          tile.unsupportedSeconds = 0
          tile.lastPosition.copy(tile.mesh.position)
          tile.carried.set(0, 0, 0)
        }
        return true
      }

      const advanceTile = (tile: TileBody, dt: number) => {
        if (advanceReturn(tile, dt)) return

        if (tile.supported) {
          advanceSupportedTile(tile, dt)
          return
        }

        tile.unsupportedSeconds += dt
        if (tile.landed) return
        advanceFreeTile(tile, dt)
      }

      /**
       * Advances every tile by `seconds`, in the same fixed steps the cloth
       * sim itself uses, so behaviour holds regardless of whether the
       * caller is a real animation frame or a reduced-motion jump straight
       * to a resting shape.
       */
      const advanceTiles = (seconds: number) => {
        if (seconds <= 0) return

        // Nothing is recalled mid-flight: a thrown tile gets to finish its
        // arc, bounce, and come to rest before it is walked home. The grace
        // period on top of that is what stops a scroll that merely brushes
        // the rest position from snatching one back the instant it settles.
        const atRest = peelProgress < RESET_PEEL_EPS && !sim.isGrabbing
        for (const tile of tiles) {
          if (!atRest || tile.supported || tile.returnElapsed !== null) continue
          if (tile.landed && tile.unsupportedSeconds > RESET_GRACE) startReturn(tile)
        }

        /*
         * The exit sweeps the tabletop clear.
         *
         * A tile knocked loose early — by a hand, or by a scroll fast enough
         * to throw it before the roll reached it — can be lying on the table
         * when the bundle finally leaves, and one or two survivors sitting
         * there is exactly the picture the last caption says is impossible.
         * The departing fabric drags over them on its way off the edge, so
         * they go too. `carried` is stale for a body that has been at rest,
         * hence the reset: the throw here is the bundle's, not a memory of
         * whatever the cloth was doing when it dropped them.
         */
        if (peelProgress > PEEL.releaseAt) {
          for (const tile of tiles) {
            if (tile.supported || tile.returnElapsed !== null || !tile.landed) continue
            if (tile.mesh.position.y < PARK_Y + 1) continue
            tile.carried.set(0, 0, 0)
            releaseTile(tile, true)
          }
        }

        const steps = Math.max(1, Math.round(seconds / TILE_STEP))
        const stepDt = seconds / steps
        for (let s = 0; s < steps; s++) {
          for (const tile of tiles) advanceTile(tile, stepDt)
        }

        /*
         * How fast the cloth is carrying each tile, measured over the whole
         * frame rather than per substep.
         *
         * The sim advances once per frame, so all of a tile's cloth-driven
         * displacement lands in the first substep; dividing that by a substep
         * would report several times the real speed and fire the release
         * threshold on a gentle pull. Measured here it is the honest velocity,
         * one frame behind — which is exactly the frame `releaseTile` wants,
         * since by the time a tile lets go the cloth has already left.
         */
        for (const tile of tiles) {
          if (!tile.supported) continue
          tile.carried.subVectors(tile.mesh.position, tile.lastPosition).divideScalar(seconds)
          tile.lastPosition.copy(tile.mesh.position)
        }
      }

      const billboardQuaternion = new THREE.Quaternion()

      /**
       * Rises and fades the steam on a loop, and cuts it the instant the mug
       * stops resting — thrown, mid-flight home, anything but settled on the
       * cloth. A wisp still rising off a mug tumbling across the floor reads
       * as broken physics, not atmosphere.
       */
      const advanceSteam = (delta: number) => {
        if (!steamMeshes.length) return
        const resting = cupTile.supported && cupTile.returnElapsed === null
        if (!resting) {
          for (const material of steamMaterials) material.opacity = 0
          return
        }
        // `cup` tilts to the footprint it is standing on; cancelling that
        // rotation before applying the camera's own is what keeps a plane
        // parented to it billboarded regardless of how the cloth is folded
        // underneath — see the construction comment above.
        billboardQuaternion.copy(cup.quaternion).invert().multiply(camera.quaternion)
        for (let i = 0; i < steamMeshes.length; i++) {
          const mesh = steamMeshes[i]!
          const material = steamMaterials[i]!
          steamPhase[i] = (steamPhase[i]! + delta * STEAM.speed) % 1
          const phase = steamPhase[i]!
          mesh.quaternion.copy(billboardQuaternion)
          mesh.position.y = CUP.height * 0.86 + phase * STEAM.rise
          // Eased in and out rather than popping at the loop's seam — a sine
          // over one full cycle is zero at both ends and peaks at the
          // midpoint, which is also roughly where real steam is thickest
          // before it disperses.
          const shape = Math.sin(Math.PI * phase)
          material.opacity = shape * STEAM.peakOpacity
          mesh.scale.setScalar(STEAM.size * (0.7 + phase * 0.6))
        }
      }

      const applyPeel = () => {
        // Only the opening fall is unpinned; holding the near edge in mid-air
        // during the drop would stop the sheet ever draping.
        if (!introDone) {
          sim.setPins(null, null)
          return
        }
        /*
         * Both edges are held at every scroll position, including zero.
         *
         * That is what makes the interaction reversible: with the far edge
         * anchored and the near edge driven, letting go of a lift — or
         * scrolling back to the top — genuinely pulls the sheet home over the
         * tiles. Pinning only the far edge let the whole cloth migrate to
         * wherever it had been dragged and never come back.
         *
         * The slack in `writePeelTargets` is what stops that becoming a drum
         * skin: the near edge rests slightly inboard of the sheet's natural
         * span, so there is always spare fabric to fold over the tiles.
         */
        writePeelTargets(peelProgress)
        sim.setPins(peelIndices, peelTargets)
      }

      const renderFrame = (delta: number) => {
        applyPeel()
        /*
         * Clamped tighter than `delta` itself — see `SIM_CATCHUP_CAP`. Only
         * the sim's own catch-up is capped here; `delta` unclamped beyond
         * that still reaches everything below (tiles, camera, the grab
         * ramp), since none of those compound the way a fixed-step solver
         * chasing a backlog does.
         */
        if (delta > 0) sim.update(Math.min(delta, SIM_CATCHUP_CAP))

        if (pressing && sim.isGrabbing) {
          liftFactor += (1 - liftFactor) * Math.min(1, delta * GRAB.ramp)
          sim.moveCluster(hit.x - grabOriginX, dragLift * liftFactor, hit.z - grabOriginZ)
        } else {
          liftFactor = 0
          if (sim.isGrabbing) sim.release()
        }

        syncGeometry()
        advanceTiles(delta)
        poseCamera()
        advanceSteam(delta)
        easeGrade(delta)
        renderer.render(scene, camera)
      }

      /**
       * Under reduced motion no loop runs, so an event has to advance the sim
       * itself. Stepping straight to the new resting shape keeps the reveal
       * reachable while nothing animates on its own.
       */
      const stepAndDraw = (seconds: number) => {
        applyPeel()
        sim.settle(seconds)
        syncGeometry()
        advanceTiles(seconds)
        poseCamera()
        renderer.render(scene, camera)
      }

      /**
       * Lifting requires a deliberate press.
       *
       * An earlier version lifted on hover, and it was awful: the sheet chased
       * the cursor everywhere, so simply moving to a link dragged the cloth
       * across the table and the reveal happened constantly by accident. A
       * tablecloth is picked up on purpose. Drag to lift, let go to drop.
       */
      const onPointerMove = (event: PointerEvent) => {
        if (!pressing) return
        if (!updatePointer(event)) return
        // Height earned by pulling up the screen, floored at zero so pushing
        // down just lays the cloth back rather than driving it through the table.
        dragLift = Math.min(
          GRAB.maxLift,
          Math.max(0, (dragStartY - event.clientY) * GRAB.liftPerPixel),
        )
        // How fast the pull itself is moving, not just how far it has come
        // — see `releaseTile`. An EMA over the gap between input events
        // rather than a raw per-event derivative, the same shape `liftFactor`
        // eases with in `renderFrame`, so one jittery low-latency sample
        // cannot spike the reading.
        if (lastDragMoveTime > 0) {
          const moveDt = (event.timeStamp - lastDragMoveTime) / 1000
          if (moveDt > 0) {
            const instant = Math.abs(dragLift - lastDragLift) / moveDt
            dragLiftSpeed += (instant - dragLiftSpeed) * Math.min(1, moveDt * GRAB.ramp)
          }
        }
        lastDragLift = dragLift
        lastDragMoveTime = event.timeStamp
        if (!sim.isGrabbing && sim.grabCluster(hit.x, hit.y, hit.z, GRAB.radius)) {
          grabOriginX = hit.x
          grabOriginZ = hit.z
        }
        if (!reduced || !sim.isGrabbing) return
        liftFactor = 1
        sim.moveCluster(hit.x - grabOriginX, dragLift, hit.z - grabOriginZ)
        stepAndDraw(0.18)
      }

      const releasePointer = () => {
        pressing = false
        if (!sim.isGrabbing) return
        sim.release()
        liftFactor = 0
        dragLift = 0
        dragLiftSpeed = 0
        lastDragMoveTime = 0
        if (reduced) stepAndDraw(1.4)
      }

      /** Controls the reader might be pressing instead of the cloth. */
      const INTERACTIVE = 'a, button, input, select, textarea, summary, label, [tabindex]'

      const onPointerDown = (event: PointerEvent) => {
        // Left button only; a right-click or a scroll-wheel press is not a grab.
        if (event.button !== 0) return
        dragStartY = event.clientY
        dragLift = 0
        dragLiftSpeed = 0
        lastDragLift = 0
        lastDragMoveTime = 0
        // Past the peel there is no sheet left on the table to pick up, so a
        // press in empty space must not silently start a drag on geometry the
        // reader can no longer meaningfully see.
        if (!clothVisible) return
        // The canvas is behind the content and never receives events itself, so
        // this listener sees every press on the page — including ones aimed at
        // a link. Without this guard, clicking "Install" would also yank the
        // tablecloth out from under the page.
        const target = event.target
        if (target instanceof Element && target.closest(INTERACTIVE)) return
        pressing = true
        onPointerMove(event)
      }

      /*
       * One read per frame, not one per event.
       *
       * A phone's touch digitiser outruns the display: several scroll events
       * land between two frames, and each one re-ran the peel arithmetic and
       * re-published the root custom properties nothing had drawn yet. The
       * frame the reader actually sees is the only one worth computing.
       */
      let scrollRaf = 0
      const onScroll = () => {
        if (scrollRaf) return
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0
          readScroll()
          if (reduced) stepAndDraw(0.2)
        })
      }

      // The canvas sits behind the content and must never eat scroll or clicks;
      // it listens on the window instead and maps coordinates itself.
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerdown', onPointerDown, { passive: true })
      window.addEventListener('pointerup', releasePointer, { passive: true })
      window.addEventListener('pointercancel', releasePointer)
      // A drag interrupted by an alt-tab never sends pointerup, and the sheet
      // would stay held open until the next click.
      window.addEventListener('blur', releasePointer)
      window.addEventListener('scroll', onScroll, { passive: true })

      let raf = 0
      let last = performance.now()
      let elapsed = 0
      let announcedReady = false

      const loop = () => {
        raf = requestAnimationFrame(loop)
        const now = performance.now()
        const delta = Math.min((now - last) / 1000, 0.05)
        last = now

        renderFrame(delta)

        if (!announcedReady) {
          announcedReady = true
          ready.current()
        }
        if (!introDone) {
          elapsed += delta
          if (elapsed >= DRAPE_SECONDS) {
            introDone = true
            settled.current()
          }
        }
      }

      if (reduced) {
        // Mirrors the animated intro's own two phases: the sheet falls and
        // relaxes unpinned first (same span as the real drape), and only
        // then are the edges pinned to their rest shape. Pinning from the
        // very first step, while the sheet is still up at its bulged drop
        // height, fights the fall instead of following it and can leave the
        // relaxed shape with a stray inverted patch — nothing a real drape
        // does, and exactly what a resting tile's upright check would (and
        // correctly should) read as having folded out from under it.
        sim.setPins(null, null)
        sim.settle(DRAPE_SECONDS)
        introDone = true
        applyPeel()
        sim.settle(2.4 - DRAPE_SECONDS)
        syncGeometry()
        advanceTiles(2.4)
        renderer.render(scene, camera)
        ready.current()
        settled.current()
      } else {
        raf = requestAnimationFrame(loop)
      }

      // A hidden tab should not be simulating cloth.
      const onVisibility = () => {
        if (reduced) return
        cancelAnimationFrame(raf)
        if (!document.hidden) {
          last = performance.now()
          raf = requestAnimationFrame(loop)
        }
      }
      document.addEventListener('visibilitychange', onVisibility)

      cleanup = () => {
        cancelAnimationFrame(raf)
        // A scroll read queued for the next frame would otherwise run against
        // a disposed scene and re-add the root properties this teardown is
        // about to remove.
        cancelAnimationFrame(scrollRaf)
        observer.disconnect()
        docObserver.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('pointerup', releasePointer)
        window.removeEventListener('pointercancel', releasePointer)
        window.removeEventListener('blur', releasePointer)
        window.removeEventListener('scroll', onScroll)

        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) object.geometry.dispose()
        })
        for (const texture of tileTextures) texture.dispose()
        for (const material of tileMaterials) material.dispose()
        weaveTexture.dispose()
        for (const material of steamMaterials) material.dispose()
        steamTexture?.dispose()
        clothMaterial.dispose()
        tableMaterial.dispose()
        cupMaterial.dispose()
        brewMaterial.dispose()
        renderer.dispose()
        renderer.domElement.remove()
        delete document.documentElement.dataset.clothActive
        delete document.documentElement.dataset.clothPeeling
        delete document.documentElement.dataset.clothReveal
        delete document.documentElement.dataset.clothRecover
        // Back to the covered state rather than removed: `dark` is a value the
        // stylesheet answers, absence is one it has to guess at.
        document.documentElement.dataset.surface = 'dark'
        window.clearTimeout(surfaceTimer)
        peelHost?.style.removeProperty('--tc-peel')
        driftHost?.style.removeProperty('--tc-drift')
        recoverHost?.style.removeProperty('--tc-recover')
        dwellHost?.style.removeProperty('--tc-dwell')
        repaint.current = null
      }
    })()

    return () => {
      disposed = true
      cleanup?.()
    }
    // Locale and reduced-motion rebuild the scene; theme is handled live by the
    // effect below so a switch never replays the opening fall.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, reduced])

  useEffect(() => {
    repaint.current?.()
  }, [theme])

  return <div ref={host} className="app-canvas" aria-hidden="true" />
}

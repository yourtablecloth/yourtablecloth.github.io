/**
 * Cloth simulation — Verlet particles on a grid, solved with distance
 * constraints. No rendering, no Three.js: this module owns the physics and
 * nothing else, so it can be reasoned about (and stepped) on its own.
 *
 * The metaphor is literal and the physics has to honour it: the cloth is
 * spread OVER the table, and everything this page argues about — the
 * security programs — sits ON the cloth, not hidden under it. Therefore:
 *
 *   - gravity pulls every particle down onto the table;
 *   - a height field stops particles passing through the table — that is the
 *     sheet's only floor, and it is the caller's to define: the renderer
 *     hands in a field that returns the tabletop over the slab's own extents
 *     and drops away past them, so a sheet dragged over the edge falls off
 *     it. What rides on top of the sheet is the renderer's concern too; this
 *     module only has to report where the surface is (`sampleSurface`);
 *   - contact with the table applies friction, so the sheet stays put
 *     instead of sliding off when one corner is pulled;
 *   - releasing a hold simply unpins, and gravity settles the sheet back
 *     onto the table.
 *
 * Two things can hold the sheet, and they compose:
 *
 *   cluster — a weighted group of particles around a point follows it,
 *             fading out with distance from the centre, so a lift raises a
 *             soft dome instead of yanking a single spike and dragging the
 *             whole sheet along with it.
 *   pins    — an arbitrary set of particles driven to arbitrary targets. The
 *             page uses this to peel the whole near edge back as the reader
 *             scrolls, which is the document's spine: scroll position IS how
 *             far the cloth — and the tiles riding on it — has come off the
 *             table.
 *
 * Positions are flat Float32Arrays (3 floats per particle) so the renderer can
 * copy them straight into a BufferAttribute without a per-frame allocation.
 */

/** Returns the table's surface height at (x, z) — the sheet's only floor. */
export type HeightField = (x: number, z: number) => number

/*
 * The peel's scroll contract, in viewport heights.
 *
 * Here rather than in the renderer because two things that never import
 * Three.js need it: ClothStage, whose hint offers to play the reveal and has
 * to know how far that is, and Hero.module.css, whose pinned track has to
 * outlast dwell + span (that one is arithmetic in a comment, not an import,
 * but it is the same pair of numbers). A constant that two modules derive
 * independently is a constant that drifts.
 */

/**
 * Scroll the reader gets BEFORE the cloth starts coming off. Without it the
 * peel began on the first wheel notch, so "천을 들춰보세요" was advice you
 * could never take — the sheet was already leaving by the time you reached
 * for it. This is the dwell where the hint is true.
 */
export const PEEL_DWELL = 0.7

/**
 * Scroll distance over which the cloth comes off.
 *
 * Dwell plus span has to finish while the hero's copy pane is still pinned,
 * because that pane is where the reveal captions live — run the peel longer
 * than the pin and the last caption is scrolled off the top before its own
 * moment arrives. Hero.module.css `.root { min-height }` is the other half of
 * that arithmetic; the two are a pair and neither can be retuned alone.
 *
 * 2.1 rather than 1.5 because the captions are windows on this span, not
 * durations: at 1.5 the three sentences each held their full opacity for
 * roughly 250-320px of scroll, which is under a second of ordinary wheel
 * travel for a line the reader is meant to actually finish. Widening the
 * span is the only lever that buys reading time without decoupling the words
 * from the fabric, which is the one thing this mechanism exists to prevent.
 */
export const PEEL_VIEWPORTS = 2.1

/**
 * A plain `{ x, y, z }` sink `sampleSurface` writes into — deliberately not
 * a Three.js `Vector3`, so this module can stay renderer-agnostic while
 * still writing straight into one when the caller passes one.
 */
export interface Vec3Like {
  x: number
  y: number
  z: number
}

export interface ClothOptions {
  /** Particles across (x) and along (z). */
  cols: number
  rows: number
  /** World-space extent of the sheet. */
  width: number
  depth: number
  /** Where the sheet starts before it falls. */
  dropHeight: number
  heightField: HeightField
  /** Half-extents the sheet may never leave, so it cannot slide off-screen. */
  boundsX: number
  boundsZ: number
  /**
   * Constraint relaxation passes per fixed step. Defaults to
   * `DEFAULT_ITERATIONS`; the caller lowers it where the frame budget is
   * tighter than the extra fidelity is worth.
   */
  iterations?: number
}

const GRAVITY = -9.8
/** Velocity retained per step; the loss stands in for air drag. */
const DAMPING = 0.985
/**
 * Horizontal velocity retained while touching the table.
 *
 * Localising a lift used to be friction's job, and it fought the grab: high
 * enough to keep a resting sheet from creeping, it also gripped the table so
 * hard that a lift stalled partway up instead of drawing in a handful of
 * fabric. Now that `grabCluster`'s per-particle weight is what confines a
 * lift to its radius, friction is free to sit wherever a resting sheet looks
 * right without also having to referee a grab.
 */
const FRICTION = 0.88
/**
 * Constraint relaxation passes. Six rather than four: the extra passes are what
 * carry a grab outward through the weave, so a lift reaches its neighbours in
 * the same frame instead of trailing several behind.
 *
 * It is also, measured, the hottest loop in the whole page — `solveLinks` was
 * a tenth of all main-thread time during the opening scroll — which is why it
 * is a default rather than a law. See `ClothOptions.iterations`.
 */
const DEFAULT_ITERATIONS = 6
/** Fixed physics step. Decoupled from rAF so behaviour is frame-rate free. */
const FIXED_DT = 1 / 60
/** Clamp on catch-up work after a tab has been backgrounded. */
const MAX_STEPS_PER_FRAME = 5
/**
 * Cloth thickness: the clearance the sheet keeps above the table so it reads
 * as fabric with real depth, not a decal painted on the tabletop.
 */
const SKIN = 0.08

/**
 * Deterministic value noise in [-1, 1]. A real sheet never falls as a perfect
 * dome; without this the opening drape lands with machine symmetry and reads
 * as a mesh, not as fabric. Deterministic rather than Math.random so a given
 * grid always produces the same drape — debuggable, and identical between the
 * animated and pre-settled paths.
 */
function jitter(seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453
  return (s - Math.floor(s)) * 2 - 1
}

/**
 * Classic Hermite smoothstep: 0 at/below `edge0`, 1 at/above `edge1`, eased
 * between. Used for a grab cluster's falloff weight — 1 at the centre of the
 * grab radius, 0 at the rim.
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export class ClothSim {
  readonly cols: number
  readonly rows: number
  readonly count: number
  /** Current positions, xyz interleaved. The renderer reads this directly. */
  readonly positions: Float32Array
  private readonly previous: Float32Array
  /** Constraint endpoints, two particle indices per constraint. */
  private readonly links: Int32Array
  private readonly restLengths: Float32Array
  private readonly heightField: HeightField
  private readonly boundsX: number
  private readonly boundsZ: number
  private readonly iterations: number

  /** Cluster grab: held particle indices, their position when grabbed, and their falloff weight. */
  private clusterIndices: Int32Array | null = null
  private clusterRest: Float32Array | null = null
  private clusterWeights: Float32Array | null = null
  /** Delta from the grab origin, applied to every held particle scaled by its weight. */
  private readonly clusterDelta = new Float32Array(3)
  /** Scroll-driven pins: particle indices and their xyz targets. */
  private pinIndices: Int32Array | null = null
  private pinTargets: Float32Array | null = null
  private accumulator = 0

  constructor(options: ClothOptions) {
    const {
      cols,
      rows,
      width,
      depth,
      dropHeight,
      heightField,
      boundsX,
      boundsZ,
      iterations = DEFAULT_ITERATIONS,
    } = options

    this.cols = cols
    this.rows = rows
    this.count = cols * rows
    this.heightField = heightField
    this.boundsX = boundsX
    this.boundsZ = boundsZ
    this.iterations = iterations

    this.positions = new Float32Array(this.count * 3)
    this.previous = new Float32Array(this.count * 3)

    const dx = width / (cols - 1)
    const dz = depth / (rows - 1)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const p = row * cols + col
        const i = p * 3
        const x = -width / 2 + col * dx
        const z = -depth / 2 + row * dz
        // A shallow dome, so the sheet lands centre-first and the edges flare
        // outward instead of every particle touching down on the same frame.
        const bulge =
          Math.cos((col / (cols - 1) - 0.5) * Math.PI) *
          Math.cos((row / (rows - 1) - 0.5) * Math.PI)
        const y = dropHeight + bulge * dropHeight * 0.35 + jitter(p) * 0.04

        this.positions[i] = x
        this.positions[i + 1] = y
        this.positions[i + 2] = z
        // `previous` offset from `position` IS the initial velocity. A small
        // swirl makes the sheet catch air on the way down and land with folds
        // instead of dropping like a flat lid.
        this.previous[i] = x - jitter(p + 11) * 0.014
        this.previous[i + 1] = y
        this.previous[i + 2] = z - jitter(p + 23) * 0.014
      }
    }

    // Structural links hold the weave; bend links (span two) stop the sheet
    // folding into hard creases and keep the drape readable.
    const pairs: Array<[number, number]> = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const a = row * cols + col
        if (col + 1 < cols) pairs.push([a, a + 1])
        if (row + 1 < rows) pairs.push([a, a + cols])
        if (col + 2 < cols) pairs.push([a, a + 2])
        if (row + 2 < rows) pairs.push([a, a + cols * 2])
      }
    }

    this.links = new Int32Array(pairs.length * 2)
    this.restLengths = new Float32Array(pairs.length)
    for (let k = 0; k < pairs.length; k++) {
      const [a, b] = pairs[k]!
      this.links[k * 2] = a
      this.links[k * 2 + 1] = b
      const ia = a * 3
      const ib = b * 3
      this.restLengths[k] = Math.hypot(
        this.positions[ia]! - this.positions[ib]!,
        this.positions[ia + 1]! - this.positions[ib + 1]!,
        this.positions[ia + 2]! - this.positions[ib + 2]!,
      )
    }
  }

  /**
   * Gathers every particle within `radius` of a world-space point into a
   * weighted cluster — 1 at the centre, fading to 0 at the rim — and remembers
   * each one's position at the moment of the grab. Returns false, grabbing
   * nothing, if the point is not near the sheet at all.
   */
  grabCluster(x: number, y: number, z: number, radius: number): boolean {
    const indices: number[] = []
    const rest: number[] = []
    const weights: number[] = []
    const radiusSq = radius * radius

    for (let p = 0; p < this.count; p++) {
      const i = p * 3
      const dx = this.positions[i]! - x
      const dy = this.positions[i + 1]! - y
      const dz = this.positions[i + 2]! - z
      const distanceSq = dx * dx + dy * dy + dz * dz
      if (distanceSq > radiusSq) continue

      indices.push(p)
      rest.push(this.positions[i]!, this.positions[i + 1]!, this.positions[i + 2]!)
      weights.push(1 - smoothstep(0, radius, Math.sqrt(distanceSq)))
    }

    if (indices.length === 0) return false

    this.clusterIndices = Int32Array.from(indices)
    this.clusterRest = Float32Array.from(rest)
    this.clusterWeights = Float32Array.from(weights)
    this.clusterDelta.fill(0)
    return true
  }

  /**
   * Moves the held cluster by `(dx, dy, dz)` relative to where `grabCluster`
   * found it — a delta, not an absolute target. Each particle is driven
   * toward `rest + delta * weight`, so the centre tracks the delta fully and
   * the rim barely moves.
   */
  moveCluster(dx: number, dy: number, dz: number) {
    if (!this.clusterIndices) return
    this.clusterDelta[0] = dx
    this.clusterDelta[1] = dy
    this.clusterDelta[2] = dz
  }

  release() {
    this.clusterIndices = null
    this.clusterRest = null
    this.clusterWeights = null
  }

  get isGrabbing(): boolean {
    return this.clusterIndices !== null
  }

  /**
   * Drives a set of particles to explicit targets. Pass `null` to let them go.
   * `targets` is xyz-interleaved and parallel to `indices`; both are retained
   * by reference so the caller can rewrite the targets each frame without
   * reallocating.
   */
  setPins(indices: Int32Array | null, targets: Float32Array | null) {
    this.pinIndices = indices
    this.pinTargets = targets
  }

  /**
   * Bilinearly samples the sheet at fractional grid coordinates — `fx` in
   * [0, cols - 1], `fy` in [0, rows - 1] — writing the interpolated point
   * into `outPoint` and the (unnormalised) partial derivatives of that
   * point with respect to each grid axis into `outDCol`/`outDRow`. Crossing
   * the two derivatives gives the surface normal there.
   *
   * Used by anything that rests ON the sheet rather than being one of its
   * own particles — the tiles — so it can track the sheet in continuous
   * grid space instead of snapping to whichever particle is nearest, which
   * is what would make a resting body visibly hop as the sheet deforms.
   */
  sampleSurface(fx: number, fy: number, outPoint: Vec3Like, outDCol: Vec3Like, outDRow: Vec3Like) {
    const col = Math.min(this.cols - 2, Math.max(0, Math.floor(fx)))
    const row = Math.min(this.rows - 2, Math.max(0, Math.floor(fy)))
    const tx = Math.min(1, Math.max(0, fx - col))
    const ty = Math.min(1, Math.max(0, fy - row))

    const i00 = (row * this.cols + col) * 3
    const i10 = i00 + 3
    const i01 = i00 + this.cols * 3
    const i11 = i01 + 3
    const p = this.positions

    const x00 = p[i00]!
    const y00 = p[i00 + 1]!
    const z00 = p[i00 + 2]!
    const x10 = p[i10]!
    const y10 = p[i10 + 1]!
    const z10 = p[i10 + 2]!
    const x01 = p[i01]!
    const y01 = p[i01 + 1]!
    const z01 = p[i01 + 2]!
    const x11 = p[i11]!
    const y11 = p[i11 + 1]!
    const z11 = p[i11 + 2]!

    const xTop = x00 + (x10 - x00) * tx
    const yTop = y00 + (y10 - y00) * tx
    const zTop = z00 + (z10 - z00) * tx
    const xBot = x01 + (x11 - x01) * tx
    const yBot = y01 + (y11 - y01) * tx
    const zBot = z01 + (z11 - z01) * tx

    outPoint.x = xTop + (xBot - xTop) * ty
    outPoint.y = yTop + (yBot - yTop) * ty
    outPoint.z = zTop + (zBot - zTop) * ty

    outDCol.x = x10 - x00 + (x11 - x01 - (x10 - x00)) * ty
    outDCol.y = y10 - y00 + (y11 - y01 - (y10 - y00)) * ty
    outDCol.z = z10 - z00 + (z11 - z01 - (z10 - z00)) * ty

    outDRow.x = xBot - xTop
    outDRow.y = yBot - yTop
    outDRow.z = zBot - zTop
  }

  /** Advances by real elapsed seconds, in fixed steps. */
  update(elapsed: number) {
    this.accumulator += Math.min(elapsed, MAX_STEPS_PER_FRAME * FIXED_DT)
    let steps = 0
    while (this.accumulator >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      this.step(FIXED_DT)
      this.accumulator -= FIXED_DT
      steps++
    }
  }

  /** Runs the sim forward without rendering — used for the static fallback. */
  settle(seconds: number) {
    const steps = Math.round(seconds / FIXED_DT)
    for (let s = 0; s < steps; s++) this.step(FIXED_DT)
  }

  private step(dt: number) {
    this.integrate(dt)
    for (let k = 0; k < this.iterations; k++) {
      this.solveLinks()
      this.applyHolds()
      this.collide()
    }
  }

  private integrate(dt: number) {
    const gravityStep = GRAVITY * dt * dt

    for (let p = 0; p < this.count; p++) {
      const i = p * 3
      const x = this.positions[i]!
      const y = this.positions[i + 1]!
      const z = this.positions[i + 2]!

      // Contact friction: only damp the horizontal components, and only while
      // the particle is resting on something. Without this the sheet skates.
      const ground = this.heightField(x, z) + SKIN
      const damping = y <= ground + 0.02 ? FRICTION : DAMPING

      this.positions[i] = x + (x - this.previous[i]!) * damping
      this.positions[i + 1] = y + (y - this.previous[i + 1]!) * DAMPING + gravityStep
      this.positions[i + 2] = z + (z - this.previous[i + 2]!) * damping

      this.previous[i] = x
      this.previous[i + 1] = y
      this.previous[i + 2] = z
    }
  }

  private solveLinks() {
    const linkCount = this.restLengths.length

    for (let k = 0; k < linkCount; k++) {
      const a = this.links[k * 2]! * 3
      const b = this.links[k * 2 + 1]! * 3

      const dx = this.positions[b]! - this.positions[a]!
      const dy = this.positions[b + 1]! - this.positions[a + 1]!
      const dz = this.positions[b + 2]! - this.positions[a + 2]!

      const current = Math.hypot(dx, dy, dz)
      if (current === 0) continue

      // Half the error to each end — both particles have equal mass.
      const correction = ((current - this.restLengths[k]!) / current) * 0.5
      const cx = dx * correction
      const cy = dy * correction
      const cz = dz * correction

      this.positions[a]! += cx
      this.positions[a + 1]! += cy
      this.positions[a + 2]! += cz
      this.positions[b]! -= cx
      this.positions[b + 1]! -= cy
      this.positions[b + 2]! -= cz
    }
  }

  /**
   * Cluster grab and scroll pins, both hard-held.
   *
   * `previous` is written alongside `position`, not left behind. In Verlet the
   * velocity IS `position - previous`, so moving only the position would bank
   * every pixel of pointer or scroll travel as stored velocity and fling the
   * sheet on release. Held at zero velocity, letting go simply hands the
   * particle back to gravity — which is what dropping a cloth does.
   */
  private applyHolds() {
    const { pinIndices, pinTargets } = this
    if (pinIndices && pinTargets) {
      for (let k = 0; k < pinIndices.length; k++) {
        const i = pinIndices[k]! * 3
        const t = k * 3
        this.positions[i] = pinTargets[t]!
        this.positions[i + 1] = pinTargets[t + 1]!
        this.positions[i + 2] = pinTargets[t + 2]!
        this.previous[i] = pinTargets[t]!
        this.previous[i + 1] = pinTargets[t + 1]!
        this.previous[i + 2] = pinTargets[t + 2]!
      }
    }

    const { clusterIndices, clusterRest, clusterWeights, clusterDelta } = this
    if (!clusterIndices || !clusterRest || !clusterWeights) return

    for (let k = 0; k < clusterIndices.length; k++) {
      const i = clusterIndices[k]! * 3
      const r = k * 3
      const w = clusterWeights[k]!
      const tx = clusterRest[r]! + clusterDelta[0]! * w
      const ty = clusterRest[r + 1]! + clusterDelta[1]! * w
      const tz = clusterRest[r + 2]! + clusterDelta[2]! * w
      this.positions[i] = tx
      this.positions[i + 1] = ty
      this.positions[i + 2] = tz
      this.previous[i] = tx
      this.previous[i + 1] = ty
      this.previous[i + 2] = tz
    }
  }

  /** The table, and the walls that keep the sheet from sliding off screen. */
  private collide() {
    for (let p = 0; p < this.count; p++) {
      const i = p * 3

      const x = Math.min(this.boundsX, Math.max(-this.boundsX, this.positions[i]!))
      const z = Math.min(this.boundsZ, Math.max(-this.boundsZ, this.positions[i + 2]!))
      this.positions[i] = x
      this.positions[i + 2] = z

      const floor = this.heightField(x, z) + SKIN
      if (this.positions[i + 1]! < floor) this.positions[i + 1] = floor
    }
  }
}

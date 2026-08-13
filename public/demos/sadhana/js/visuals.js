/**
 * visuals.js — Particle Art & Sacred Geometry
 * ─────────────────────────────────────────────────────────────────────────
 * 50,000 grains of sand. Each one carries two positions: where it lies
 * scattered on the ground (Position_A) and where it belongs in the chedi
 * (Position_B). The vertex shader interpolates between them by `cohesion`
 * and blows the result apart with simplex noise scaled by `1 - cohesion`.
 *
 * All animation lives on the GPU. The CPU touches four uniforms per frame
 * and nothing else — that is what keeps 50k points at 60fps while Tone.js
 * is running a dozen oscillators on the same thread.
 *
 * This module receives ONLY scalars from app.js. It never sees a Tone node.
 */

import * as THREE from 'three';

/**
 * Grain count. 50,000 on a desktop GPU, as specified.
 *
 * A phone is a different machine: 50k additive points at DPR 3 is ~450k
 * fragment-blend operations per overlapping pixel region, and mobile tilers
 * spend the whole frame on that overdraw. The chedi's silhouette survives a
 * smaller field perfectly well — grain size compensates — so coarse-pointer
 * devices get 22k and a playable frame rate instead of 50k and a slideshow.
 */
// Capability, not window width: a desktop browser in a narrow window is
// still a desktop GPU, and testing innerWidth quietly halved the field
// whenever the preview pane was docked.
const IS_TOUCH =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(pointer: coarse)').matches &&
  matchMedia('(hover: none)').matches;
const COUNT = IS_TOUCH ? 22000 : 50000;

const H_TOTAL = 2.55; // world height of the finished chedi

const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ═════════════════════════════════════════════════════════════════════════
// THAI CHEDI (เจดีย์) — parametric profile
// ═════════════════════════════════════════════════════════════════════════
/**
 * The whole form is a surface of revolution, defined by one radius function
 * over normalised height t ∈ [0,1], plus an angular modulation that turns
 * the lower sections from circles into redented squares.
 *
 * Sections, bottom → top — these are the canonical parts of a Thai chedi:
 *
 *   BASE      three stepped plinths, square with indented corners
 *   TERRACE   three receding circular terraces (the "throat" of the base)
 *   BELL      the anda — the bell. The signature Thai curve.
 *   HARMIKA   the square throne where the spire is seated
 *   RINGS     bua klum — a stack of lotus rings tapering to the needle
 *   NEEDLE    the spire proper
 *   FINIAL    the closing jewel-bud, gilded first in life and in this piece
 */
const SEC = {
  BASE:    [0.000, 0.160],
  TERRACE: [0.160, 0.300],
  BELL:    [0.300, 0.560],
  HARMIKA: [0.560, 0.608],
  RINGS:   [0.608, 0.850],
  NEEDLE:  [0.850, 0.955],
  FINIAL:  [0.955, 1.000],
};

/**
 * Share of the 50k particles per section. Must sum to 1.
 *
 * NOT proportional to surface area: the base has roughly 20× the area of
 * the ring stack and 100× the needle, so true area weighting leaves the
 * spire invisible and the plinths solid. But the reverse — an even split —
 * leaves the base as fog, because the same grain count is spread over a
 * far larger surface. These are area-weighted with a heavy compression
 * toward the top, tuned by eye until every section reads at 5.6 units.
 */
const WEIGHT = {
  BASE: 0.30, TERRACE: 0.20, BELL: 0.23, HARMIKA: 0.035,
  RINGS: 0.15, NEEDLE: 0.06, FINIAL: 0.025,
};

/**
 * Stepped radii, outermost first. Explicit tables rather than a lerp: real
 * plinths are discrete courses of masonry, and reading the numbers off a
 * table is how the silhouette stays crisp.
 */
const BASE_TIERS = [0.94, 0.87, 0.80];
const TERRACE_TIERS = [0.70, 0.60, 0.50];

const R_BELL_BASE = 0.44;  // < TERRACE_TIERS[2], so the bell sits on a ledge
const R_BELL_NECK = 0.155;
const R_HARMIKA = 0.175;
const R_RING_LO = 0.150;
const R_RING_HI = 0.034;
const R_NEEDLE_LO = 0.030;
const R_NEEDLE_HI = 0.007;
const RING_COUNT = 12;

/**
 * @returns {{r:number, square:number}}
 *   r      — radius at height t, world units
 *   square — 0 = circular cross-section, 1 = fully redented square
 */
function chediProfile(t) {
  // ── BASE: three stepped plinths. Height runs continuously but radius
  //    steps, which is what produces the wedding-cake silhouette.
  if (t < SEC.BASE[1]) {
    const u = (t - SEC.BASE[0]) / (SEC.BASE[1] - SEC.BASE[0]);
    const tier = Math.min(2, Math.floor(u * 3));
    return { r: BASE_TIERS[tier], square: 1 };
  }

  // ── TERRACE: three more steps, squareness dissolving into the round.
  if (t < SEC.TERRACE[1]) {
    const u = (t - SEC.TERRACE[0]) / (SEC.TERRACE[1] - SEC.TERRACE[0]);
    const tier = Math.min(2, Math.floor(u * 3));
    return { r: TERRACE_TIERS[tier], square: 0.8 * (1 - u) };
  }

  // ── BELL (anda):
  //        r(u) = r_neck + (r_base − r_neck) · cos(uπ/2)^p
  //
  //    The exponent is everything. p = 1 gives a plain cosine dome (Sri
  //    Lankan, hemispherical). p = 2 gives a needle. p = 0.62 holds the
  //    radius out wide through the lower half and then lets it fall away
  //    quickly — the broad shoulder and high waist of a Thai bell.
  if (t < SEC.BELL[1]) {
    const u = (t - SEC.BELL[0]) / (SEC.BELL[1] - SEC.BELL[0]);
    const r = R_BELL_NECK + (R_BELL_BASE - R_BELL_NECK) * Math.pow(Math.cos((u * Math.PI) / 2), 0.62);
    return { r, square: 0 };
  }

  // ── HARMIKA: the square throne. Squareness returns for one short band,
  //    which is what visually separates bell from spire.
  if (t < SEC.HARMIKA[1]) {
    return { r: R_HARMIKA, square: 1 };
  }

  // ── RINGS (bua klum): a cone of discrete lotus rings. Each ring is given
  //    a torus bulge, sin(πf) across its own band, so the stack reads as
  //    stacked rings rather than a smooth cone.
  if (t < SEC.RINGS[1]) {
    const u = (t - SEC.RINGS[0]) / (SEC.RINGS[1] - SEC.RINGS[0]);
    const k = Math.min(RING_COUNT - 1, Math.floor(u * RING_COUNT));
    const f = u * RING_COUNT - k;
    const ku = k / (RING_COUNT - 1);
    const rc = lerp(R_RING_LO, R_RING_HI, Math.pow(ku, 0.9));
    const bulge = 0.030 * Math.sin(Math.PI * f) * (1 - 0.45 * ku);
    return { r: rc + bulge, square: 0 };
  }

  // ── NEEDLE: tapering spire with three small beads along its length.
  if (t < SEC.NEEDLE[1]) {
    const u = (t - SEC.NEEDLE[0]) / (SEC.NEEDLE[1] - SEC.NEEDLE[0]);
    let r = lerp(R_NEEDLE_LO, R_NEEDLE_HI, Math.pow(u, 0.75));
    r += 0.010 * Math.pow(Math.sin(Math.PI * ((u * 3) % 1)), 3);
    return { r, square: 0 };
  }

  // ── FINIAL: the jewel-bud. Swells, then closes to an exact point.
  const u = (t - SEC.FINIAL[0]) / (SEC.FINIAL[1] - SEC.FINIAL[0]);
  const r = lerp(R_NEEDLE_HI, 0, u) + 0.026 * Math.sin(Math.PI * Math.pow(u, 0.6));
  return { r, square: 0 };
}

/**
 * Angular modulation: circle → redented square.
 *
 * The superellipse |cosθ|^k + |sinθ|^k = 1 gives a square with softened
 * corners as k grows. The cos(12θ) term then carves twelve re-entrant
 * corners into it — ย่อมุมไม้สิบสอง, the "twelve-cornered" indented base
 * that is the single most recognisable feature of a Thai chedi plinth.
 *
 * Divided by 1.13 because the superellipse pushes corners ~26% past the
 * circumscribed radius, and the base would otherwise outgrow BASE_TIERS[0].
 */
function cornerFactor(theta, square) {
  if (square <= 0.001) return 1;
  const k = 8.0;
  const se =
    1 / Math.pow(
      Math.pow(Math.abs(Math.cos(theta)), k) + Math.pow(Math.abs(Math.sin(theta)), k),
      1 / k
    ) / 1.16;
  const redent = 1 + 0.055 * Math.cos(12 * theta);
  return lerp(1, se * redent, square);
}

/**
 * Sampling a stepped section.
 *
 * Scattering uniformly over height and reading the radius off the profile
 * gives only the vertical WALLS of each course; seen from any raised angle
 * the plinths then dissolve into a smooth cone. Masonry has horizontal
 * surfaces too, so a share of each tier's grains go on its top annulus —
 * that annulus is what actually draws the step.
 *
 * @param {number[]} tiers   radii, outermost first
 * @param {number}   rAbove  radius of whatever sits on top of this section
 */
function sampleStepped(t0, t1, tiers, rAbove) {
  const n = tiers.length;
  const span = t1 - t0;
  const tier = Math.min(n - 1, Math.floor(Math.random() * n));
  const rOuter = tiers[tier];
  const rInner = tier + 1 < n ? tiers[tier + 1] : rAbove;
  const yLo = t0 + (span * tier) / n;
  const yHi = t0 + (span * (tier + 1)) / n;

  if (Math.random() < 0.42) {
    // Top face. sqrt() keeps the annulus evenly dense by area rather than
    // piling grains against the inner edge.
    return { t: yHi, r: lerp(rInner, rOuter, Math.sqrt(Math.random())) };
  }
  return { t: lerp(yLo, yHi, Math.random()), r: rOuter };
}

/** Triangular distribution on [0,1], peaked at 0.5. */
function centred() {
  return (Math.random() + Math.random() + Math.random()) / 3;
}

/**
 * One grain of Position_B. Returns normalised height `t`, radius `r` and
 * cross-section squareness for a randomly chosen section.
 */
function sampleChedi(key) {
  const [t0, t1] = SEC[key];

  if (key === 'BASE') {
    const s = sampleStepped(t0, t1, BASE_TIERS, TERRACE_TIERS[0]);
    return { ...s, square: 1 };
  }
  if (key === 'TERRACE') {
    const s = sampleStepped(t0, t1, TERRACE_TIERS, R_BELL_BASE);
    const u = (s.t - t0) / (t1 - t0);
    return { ...s, square: 0.8 * (1 - u) };
  }
  if (key === 'RINGS') {
    // Pick the ring first, then a position within it biased to its centre,
    // so the stack reads as separate discs instead of a smooth taper.
    const k = Math.floor(Math.random() * RING_COUNT);
    const f = clamp(centred(), 0.05, 0.95);
    const t = t0 + ((k + f) / RING_COUNT) * (t1 - t0);
    return { t, ...chediProfile(t) };
  }

  const t = lerp(t0, t1, Math.random());
  return { t, ...chediProfile(t) };
}

/** Gentle dune undulation so the scattered state is not a dead flat disc. */
function duneHeight(x, z) {
  return 0.05 * Math.sin(x * 0.7) * Math.cos(z * 0.55)
       + 0.028 * Math.sin(x * 1.9 + z * 1.3);
}

// ═════════════════════════════════════════════════════════════════════════
// GLSL
// ═════════════════════════════════════════════════════════════════════════

/** Simplex noise 3D — Ian McEwan / Ashima Arts, MIT licensed. */
const SIMPLEX_GLSL = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const VERT = /* glsl */ `
attribute vec3  aPosB;   // Position_B — this grain's seat in the chedi
attribute vec3  aSeed;   // three uncorrelated randoms, fixed per grain
attribute float aSize;

uniform float uCohesion;
uniform float uGold;
uniform float uChaos;    // edaNorm — scales storm violence
uniform float uBreath;   // respWave, -1..1
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

varying float vGold;
varying float vSeed;
varying float vSettled;

${SIMPLEX_GLSL}

void main() {
  // ── Staggered gathering ────────────────────────────────────────────
  // If every grain flew home on the same schedule the transition would
  // read as a single mechanical snap. Each grain instead has its own
  // threshold, so the pagoda assembles as a wave from the ground up.
  float stagger = aSeed.x * 0.28;
  float c = clamp((uCohesion - stagger) / max(1.0 - stagger, 1e-4), 0.0, 1.0);
  c = c * c * (3.0 - 2.0 * c);            // smoothstep ease
  c = pow(c, 0.85);                       // …biased slightly toward arrival

  // ── Position_A → Position_B ────────────────────────────────────────
  vec3 p = mix(position, aPosB, c);

  // ── The storm ──────────────────────────────────────────────────────
  // Noise displacement scaled by (1 - cohesion): a scattered mind
  // physically blows the sand apart; a gathered one lets it fall still.
  float t = uTime * 0.12;
  vec3 np = p * 0.55 + aSeed * 3.0;
  vec3 n = vec3(
    snoise(np + vec3( 0.0,  t,      0.0)),
    snoise(np + vec3(31.4,  t*0.7, 11.2)),
    snoise(np + vec3( 7.1,  t*0.9, 51.3))
  );

  // Storm strength falls off FASTER than cohesion rises. With a linear
  // (1 - cohesion) the displacement at half-cohesion still swamped the
  // chedi's 0.05–0.15-unit detail, so the form stayed a shapeless cloud
  // until ~0.8 and the visitor got no feedback for most of the sitting.
  // The 1.5 exponent keeps the storm violent while genuinely scattered but
  // lets the silhouette start to show through around 0.55.
  float chaos = pow(1.0 - uCohesion, 1.5);
  p += n * chaos * (0.45 + 0.8 * uChaos) * (0.35 + 0.65 * aSeed.y);

  // Updraft: sand does not just jitter, it lifts and spirals.
  float ang = chaos * 0.9 * (0.4 + aSeed.z) * snoise(vec3(p.xz * 0.4, t));
  float ca = cos(ang), sa = sin(ang);
  p.xz = mat2(ca, -sa, sa, ca) * p.xz;
  p.y += chaos * 0.55 * (n.y * 0.5 + 0.5) * aSeed.z;

  // Even fully gathered, the pagoda is still made of sand and still
  // breathing — a micro-shimmer that never quite resolves into stone.
  p += n * 0.007 * c;
  p.y += uBreath * 0.012 * c;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aSize * uPixelRatio * (1.0 + 0.55 * uGold)
               * (260.0 / max(-mv.z, 0.1));

  // ── Gilding ────────────────────────────────────────────────────────
  // Gold does not arrive everywhere at once. It descends from the finial,
  // the way a chedi is actually leafed — spire first, base last. So the
  // first reward for a settling nervous system is a bright point in the
  // sky, and full gilding takes real autonomic depth.
  float hN = clamp(aPosB.y / ${H_TOTAL.toFixed(2)}, 0.0, 1.0);
  float front = 1.0 - uGold * 1.15;
  float gild = smoothstep(front - 0.06, front + 0.10, hN);
  vGold = clamp(gild * uGold * c, 0.0, 1.0);

  vSeed = aSeed.y;
  vSettled = c;
}
`;

const FRAG = /* glsl */ `
precision highp float;

varying float vGold;
varying float vSeed;
varying float vSettled;

uniform float uCohesion;

// Sand → jade → gold. Jade appears only in transit: a patina the sand
// passes through on its way to becoming gold, never a destination.
const vec3 SAND     = vec3(0.40, 0.31, 0.20);
const vec3 SAND_LIT = vec3(0.74, 0.59, 0.38);
const vec3 JADE     = vec3(0.36, 0.78, 0.60);
const vec3 GOLD     = vec3(1.00, 0.76, 0.30);
const vec3 GOLD_HOT = vec3(1.00, 0.95, 0.74);

void main() {
  // Soft round grain. No texture fetch — cheaper and crisper at 50k.
  float d = length(gl_PointCoord - vec2(0.5));
  float core = smoothstep(0.5, 0.0, d);
  if (core < 0.01) discard;
  float alpha = pow(core, 1.6);

  vec3 col = mix(SAND, SAND_LIT, vSeed);

  // Peaks at vGold = 0.5 and vanishes at both ends.
  col = mix(col, JADE, vGold * (1.0 - vGold) * 0.7);
  col = mix(col, GOLD, vGold);

  // Emissive core — only the gilded grains actually glow.
  col += GOLD_HOT * pow(core, 6.0) * vGold * 0.9;

  // Additive blending across 50k overlapping points will blow out the
  // silhouette once they converge, so pull exposure back as they gather.
  col *= mix(1.0, 0.48, uCohesion);

  gl_FragColor = vec4(col, alpha * mix(0.55, 0.85, vSettled));
}
`;

// ═════════════════════════════════════════════════════════════════════════
// The engine
// ═════════════════════════════════════════════════════════════════════════

export class VisualEngine {
  constructor(canvas) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: true, powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

    // Orbit state — hand-rolled rather than pulling in OrbitControls, both
    // to avoid the extra module fetch and because this needs a very
    // specific slow drift that OrbitControls' damping does not give.
    this.orbit = { theta: 0.5, phi: 1.46, dist: 5.6, autoSpeed: 0.035 };
    this.target = new THREE.Vector3(0, 1.05, 0);
    this._ptrs = new Map();  // active pointers, by pointerId
    this._pinch = 0;         // last two-finger span, px
    this._idle = 0;

    this._buildPoints();
    this._bindPointer();
    this.resize();
  }

  // ── Geometry ─────────────────────────────────────────────────────────

  _buildPoints() {
    const posA = new Float32Array(COUNT * 3);
    const posB = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT * 3);
    const size = new Float32Array(COUNT);

    // Cumulative section weights, for weighted section picking.
    const keys = Object.keys(WEIGHT);
    const cum = [];
    let acc = 0;
    for (const k of keys) { acc += WEIGHT[k]; cum.push(acc); }

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // ── Position_A — scattered sand ──────────────────────────────
      // Folded normal radius: dense where the chedi will stand, thinning
      // toward the horizon, so the gathering starts from a plausible field
      // rather than from a uniform disc.
      const rad = Math.min(0.35 + Math.abs(gaussian()) * 1.5, 4.4);
      const th = Math.random() * Math.PI * 2;
      const ax = Math.cos(th) * rad;
      const az = Math.sin(th) * rad;
      posA[i3] = ax;
      posA[i3 + 1] = duneHeight(ax, az) + Math.random() * 0.02;
      posA[i3 + 2] = az;

      // ── Position_B — the chedi ───────────────────────────────────
      const pick = Math.random() * acc;
      let si = 0;
      while (si < cum.length - 1 && pick > cum[si]) si++;
      const sample = sampleChedi(keys[si]);
      const { t, square } = sample;
      let r = sample.r;
      const theta = Math.random() * Math.PI * 2;

      r *= cornerFactor(theta, square);

      // A thin shell with a little inward scatter. This used to pull 30%
      // inward for depth, which filled the interior and — under additive
      // blending — blew out into a solid mass that swallowed every edge.
      // The silhouette matters more than the volume.
      r *= 1 - 0.14 * Math.pow(Math.random(), 3);
      r += (Math.random() - 0.5) * 0.008;

      posB[i3] = Math.cos(theta) * r;
      posB[i3 + 1] = t * H_TOTAL + (Math.random() - 0.5) * 0.004;
      posB[i3 + 2] = Math.sin(theta) * r;

      seed[i3] = Math.random();
      seed[i3 + 1] = Math.random();
      seed[i3 + 2] = Math.random();

      // Mostly fine grains with a few bright coarse ones, which is what
      // stops a uniform point cloud from looking like static.
      size[i] = 0.55 + Math.pow(Math.random(), 3) * 1.15;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posA, 3));
    geo.setAttribute('aPosB', new THREE.BufferAttribute(posB, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 8);

    this.uniforms = {
      uCohesion:   { value: 0 },
      uGold:       { value: 0 },
      uChaos:      { value: 0.5 },
      uBreath:     { value: 0 },
      uTime:       { value: 0 },
      // Tuned so an average grain is ~1.6 CSS px at the default 5.6-unit
      // camera distance: fine enough to read as sand, large enough to see.
      // Scaled by 1/sqrt(density) so a thinned mobile field keeps the same
      // apparent coverage rather than looking like a dusting.
      uSize:       { value: 0.046 * Math.sqrt(50000 / COUNT) },
      uPixelRatio: { value: this.renderer.getPixelRatio() },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,          // points must not occlude each other
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  // ── Camera interaction ───────────────────────────────────────────────

  /** Distance between the two active pointers, or 0 if there are not two. */
  _pinchSpan() {
    if (this._ptrs.size < 2) return 0;
    const [a, b] = [...this._ptrs.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  _bindPointer() {
    const c = this.canvas;

    // Pointer Events unify mouse and touch, so one drag path serves both;
    // the only thing touch adds is a second finger, which orbits nothing and
    // instead pinches the camera distance.
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      this._ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this._pinch = this._pinchSpan();
      this._idle = 0;
    });

    c.addEventListener('pointermove', (e) => {
      const p = this._ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      this._idle = 0;

      if (this._ptrs.size === 1) {
        this.orbit.theta -= dx * 0.005;
        this.orbit.phi = clamp(this.orbit.phi - dy * 0.004, 0.42, 1.62);
      } else if (this._ptrs.size === 2) {
        // Ratio, not difference: a pinch should feel the same whether the
        // fingers start 40px or 400px apart.
        const span = this._pinchSpan();
        if (this._pinch > 8 && span > 8) {
          this.orbit.dist = clamp(this.orbit.dist * (this._pinch / span), 2.4, 11);
        }
        this._pinch = span;
      }
    });

    const end = (e) => {
      this._ptrs.delete(e.pointerId);
      // Re-baseline, so lifting one finger of a pinch does not jump the view.
      this._pinch = this._pinchSpan();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('lostpointercapture', end);

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.orbit.dist = clamp(this.orbit.dist + e.deltaY * 0.0022, 2.4, 11);
      this._idle = 0;
    }, { passive: false });
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /**
   * @param {number} dt seconds
   * @param {object} m  { cohesion, goldIndex, edaNorm, respWave } — scalars only
   */
  update(dt, m) {
    const u = this.uniforms;
    u.uTime.value += dt;

    // The shader is fed already-smoothed values from sensor.js, but ease
    // once more here so a dropped frame never shows as a jolt.
    u.uCohesion.value = lerp(u.uCohesion.value, m.cohesion, 1 - Math.exp(-dt / 0.55));
    u.uGold.value = lerp(u.uGold.value, m.goldIndex, 1 - Math.exp(-dt / 0.7));
    u.uChaos.value = lerp(u.uChaos.value, m.edaNorm, 1 - Math.exp(-dt / 1.1));
    u.uBreath.value = lerp(u.uBreath.value, m.respWave, 1 - Math.exp(-dt / 0.25));

    // Resume the slow drift a few seconds after the visitor lets go.
    this._idle += dt;
    if (this._ptrs.size === 0 && this._idle > 3) {
      this.orbit.theta += dt * this.orbit.autoSpeed;
    }

    // The camera lifts its gaze as the chedi rises. Framed on the pagoda's
    // mid-height throughout, the opening state — a flat sand field — sits in
    // the bottom third under an empty sky. So the look-at point tracks the
    // form: the ground while there is only ground, the spire once there is
    // a spire. Pull back a little too, to keep the finial in frame.
    const o = this.orbit;
    this.target.y = lerp(this.target.y, lerp(0.30, 1.10, u.uCohesion.value), 1 - Math.exp(-dt / 1.2));
    const wantDist = o.dist * lerp(1.02, 1.06, u.uCohesion.value);
    this.camera.position.set(
      this.target.x + wantDist * Math.sin(o.phi) * Math.cos(o.theta),
      this.target.y + wantDist * Math.cos(o.phi),
      this.target.z + wantDist * Math.sin(o.phi) * Math.sin(o.theta)
    );
    this.camera.lookAt(this.target);

    this.renderer.render(this.scene, this.camera);
  }

  get particleCount() { return COUNT; }
}

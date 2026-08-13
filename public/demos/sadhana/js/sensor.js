/**
 * sensor.js — Physiological Data Engine
 * ─────────────────────────────────────────────────────────────────────────
 * Owns EVERY physiological number in the installation. Knows nothing about
 * WebGL, nothing about Web Audio. It exposes one plain state object
 * (`SensorData`) plus two normalised drive metrics (`cohesion`, `goldIndex`)
 * that app.js hands onward to the graphics and audio engines.
 *
 * The engine runs a small cardiorespiratory model rather than just echoing
 * slider values, because the piece depends on one real physiological fact:
 *
 *     Slow, deep breathing near ~5.5 breaths/min drives respiratory sinus
 *     arrhythmia (RSA) into resonance with the baroreflex loop, which
 *     inflates beat-to-beat variability — i.e. RMSSD — dramatically.
 *
 * So the "HRV" slider sets the sitter's *capacity*, and their breathing
 * decides how much of that capacity is actually expressed. Breathe fast and
 * shallow with the HRV slider at max and the pagoda still will not gild.
 * That coupling is the whole meditation.
 *
 * Swapping in real hardware later means replacing `mockUpdate()` with a BLE
 * ingest that writes `hr` / `rr` / `eda` and calling `pushBeat()` per R-peak;
 * everything downstream is unchanged.
 */

// ─── Math helpers ────────────────────────────────────────────────────────
// (JS has no Math.lerp; these are the smoothing primitives used throughout.)

export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a));

/**
 * Frame-rate independent smoothing coefficient.
 * `tau` is the time constant in seconds: after `tau` the value has closed
 * ~63% of the gap. Using this instead of a bare `lerp(a,b,0.1)` keeps the
 * feel identical at 30fps and 144fps.
 */
export const smoothK = (dt, tau) => 1 - Math.exp(-dt / Math.max(tau, 1e-5));

/** Box–Muller standard normal, used for beat-to-beat jitter. */
function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── Signal ranges (used for every normalisation in the file) ────────────

export const RANGE = {
  hr:         { min: 45,  max: 110 },  // BPM
  rmssd:      { min: 0,   max: 100 },  // ms — HRV proxy
  eda:        { min: 0,   max: 10  },  // µS-ish stress index
  breathRate: { min: 3.5, max: 20  },  // breaths per minute
};

/**
 * Cardiorespiratory resonance frequency. Around 6 breaths/min (0.1 Hz) the
 * baroreflex delay and the respiratory drive fall into phase and RSA peaks.
 * 5.5 is the commonly cited sweet spot for adults.
 */
const RESONANCE_BPM = 5.5;

/**
 * Peak RSA amplitude in ms (half the peak-to-peak RR swing) at full capacity.
 *
 * This constant sets the ceiling of the whole piece. RMSSD comes out at
 * roughly  A · 2π·f_breath · RR₀ / √2,  so at resonance (f = 0.092 Hz) with
 * RR₀ ≈ 1.03 s a value of 250 yields RMSSD ≈ 88 ms — i.e. goldIndex ≈ 0.88,
 * just past the 0.8 where the temple chimes begin.
 *
 * 190 was the first guess and capped goldIndex at 0.67, which silently made
 * the chimes unreachable. 250 is also the more honest number: trained
 * meditators doing resonance-frequency breathing routinely log RMSSD well
 * above 90 ms.
 */
const RSA_AMP_MAX = 250;

/** Inhale occupies this fraction of the breath cycle; the longer exhale is
 *  the parasympathetic half, so 40/60 rather than 50/50. */
const INHALE_FRACTION = 0.4;

/** Below this effective depth the breath reads as shallow → respPhase = 0. */
const SHALLOW_THRESHOLD = 0.26;

/** Signal sources. */
export const SOURCE = { MOCK: 'mock', LIVE: 'live' };

/** Seconds without an R-peak before a live strap counts as lost. */
const STALE_AFTER = 5;

// ─── Ring buffer for the debug panel's rolling graphs ───────────────────

export class Ring {
  constructor(n) {
    this.buf = new Float32Array(n);
    this.n = n;
    this.i = 0;
    this.count = 0;
  }
  push(v) {
    this.buf[this.i] = v;
    this.i = (this.i + 1) % this.n;
    if (this.count < this.n) this.count++;
  }
  /** Walks oldest → newest. */
  forEach(fn) {
    for (let k = 0; k < this.count; k++) {
      const idx = (this.i - this.count + k + this.n * 2) % this.n;
      fn(this.buf[idx], k);
    }
  }
}

// ─── The state object ───────────────────────────────────────────────────

/**
 * Single source of truth. app.js reads this; nothing else writes to it.
 */
export const SensorData = {
  // --- raw signals -----------------------------------------------------
  hr: 72,          // Heart Rate, BPM
  rmssd: 22,       // HRV proxy, 0..100 ms
  eda: 5.0,        // Electrodermal Activity / stress, 0..10
  respPhase: 0,    // 1 = inhale, -1 = exhale, 0 = erratic / shallow

  // --- derived respiration ---------------------------------------------
  respWave: 0,     // continuous -1..1 breath curve (for the graph + visuals)
  respRate: 12,    // breaths per minute, measured
  respDepth: 0.5,  // effective 0..1 amplitude after stress disruption

  // --- normalised drive metrics (0..1) ---------------------------------
  cohesion: 0,     // steadiness of mind  → drives sand → pagoda
  goldIndex: 0,    // vagal relaxation    → drives sand → gold

  // --- component scores, exposed for the debug readout ------------------
  edaNorm: 0.5,
  rmssdNorm: 0.22,
  respDepthScore: 0.4,
  beats: 0,        // total beats seen, for a heartbeat blink in the HUD

  // --- provenance --------------------------------------------------------
  source: 'mock',  // 'mock' | 'live'
  stale: false,    // live source connected but silent
  warmup: false,   // live source still characterising the breath
};

// ─── The engine ─────────────────────────────────────────────────────────

export class SensorEngine {
  constructor() {
    /**
     * Slider-driven targets. `mockUpdate()` writes these; the model reads
     * them and eases toward them so nothing in the render loop ever jumps.
     */
    this.targets = {
      hr: 72,            // resting BPM the heart is drawn toward
      hrvCapacity: 0.3,  // 0..1 — how much RSA this sitter *can* produce
      eda: 5.0,          // 0..10 stress
      breathRate: 12,    // breaths/min
      breathDepth: 0.5,  // 0..1
    };

    // Slowly-eased internal state (never read the targets directly).
    this._hrBase = 72;
    this._eda = 5.0;
    this._breathRate = 12;
    this._breathDepth = 0.5;

    // Breath oscillator.
    this._phase = 0;       // 0..1 through one breath cycle
    this._rateWobble = 0;  // stress-driven irregularity in breath timing

    // Heartbeat generation.
    this._beatTimer = 0;   // seconds until the next R-peak
    this._lastRR = 1000;   // previous RR interval, ms
    this._msd = 400;       // exponentially-weighted mean of ΔRR², ms²

    /**
     * Effective length of the RMSSD estimator, in beats. The clinical
     * standard is a 5-minute window, which is useless for an installation —
     * nobody will stand still for five minutes to see the sand move. An
     * exponentially-weighted mean of squared successive differences is the
     * accepted real-time compromise; ~12 beats ≈ 12 s at 60 bpm, which is
     * roughly one slow breath cycle.
     */
    this.rmssdBeats = 12;

    // Respiration stability tracker: falls when the breath goes erratic.
    this._stability = 0.5;

    // Smoothed outputs.
    this._cohesion = 0;
    this._goldIndex = 0;

    // History for the debug graphs (~15 Hz × 240 = 16 s visible).
    this.history = {
      hr: new Ring(240),
      rmssd: new Ring(240),
      resp: new Ring(240),
    };
    this._histTimer = 0;

    /**
     * Where the numbers come from. MOCK runs the internal cardiorespiratory
     * model off the sliders; LIVE takes R-peaks from a real chest strap via
     * ble.js and derives everything it can from the RR series.
     */
    this.source = SOURCE.MOCK;

    this.live = {
      lastBeatAt: 0,      // performance.now() of the last ingested R-peak
      rrSlow: 900,        // slow RR baseline, ms — the tachogram's trend
      respAmp: 20,        // adaptive RSA amplitude, ms
      respRaw: 0,         // -1..1 breath estimate at the last beat
      respWave: 0,        // eased, so a 1 Hz beat stream still reads smooth
      periods: [],        // recent breath periods, seconds
      lastCrossAt: 0,
      armed: false,       // Schmitt-trigger state for breath-onset detection
      edaAt: 0,           // last time a real EDA sample arrived
      stale: false,       // no beat for STALE_AFTER seconds
    };
  }

  /** Switch between the internal model and real hardware. */
  setSource(mode) {
    if (mode === this.source) return;
    this.source = mode;
    const L = this.live;
    L.lastBeatAt = 0;
    L.periods.length = 0;
    L.lastCrossAt = 0;
    L.armed = false;
    L.stale = false;
    // Keep _msd: a strap that reconnects should not have to re-earn its gold.
  }

  /**
   * Optional external electrodermal sample, 0..10. Nothing in the standard
   * GATT catalogue carries EDA, so this arrives over a generic serial
   * characteristic if the sitter has a GSR rig; otherwise the panel slider
   * keeps supplying it and `edaAt` stays 0.
   */
  pushEda(value) {
    this.targets.eda = clamp(value, RANGE.eda.min, RANGE.eda.max);
    this.live.edaAt = performance.now();
  }

  /**
   * Phase 1.3 — map the HTML calibration sliders onto the model.
   * `sliders` is a plain object of 0..1 normalised values so the UI can be
   * rearranged without touching this file.
   *
   *   calm    — inverse stress; drives EDA down and HRV capacity up
   *   breath  — breaths per minute
   *   depth   — breath amplitude
   *   hrv     — the sitter's autonomic capacity
   *   hr      — resting heart rate
   */
  mockUpdate(sliders = {}) {
    const t = this.targets;
    if (sliders.eda !== undefined)
      t.eda = lerp(RANGE.eda.min, RANGE.eda.max, clamp(sliders.eda));
    if (sliders.hrv !== undefined) t.hrvCapacity = clamp(sliders.hrv);
    if (sliders.hr !== undefined)
      t.hr = lerp(RANGE.hr.min, RANGE.hr.max, clamp(sliders.hr));
    if (sliders.breath !== undefined)
      t.breathRate = lerp(RANGE.breathRate.max, RANGE.breathRate.min, clamp(sliders.breath));
    if (sliders.depth !== undefined) t.breathDepth = clamp(sliders.depth);
  }

  /**
   * Hardware hook. Call once per detected R-peak with the interval since the
   * previous one, in ms. Keeps the same RMSSD estimator the mock path uses.
   */
  /**
   * @param {number} rrMs  interval since the previous R-peak
   * @param {number} [atMs] when that beat occurred, on the performance.now()
   *   clock. A single BLE notification can carry several intervals, and they
   *   did NOT all happen at the moment the packet arrived — dating them all
   *   "now" collapses the breath waveform this method feeds.
   */
  pushBeat(rrMs, atMs = performance.now()) {
    const d = rrMs - this._lastRR;
    const w = 1 - Math.exp(-1 / this.rmssdBeats);
    this._msd = lerp(this._msd, d * d, w);
    this._lastRR = rrMs;
    SensorData.beats++;

    if (this.source === SOURCE.LIVE) this._deriveRespiration(rrMs, atMs);
  }

  /**
   * RSA-derived respiration (an "ECG-derived respiration" estimate).
   *
   * A chest strap reports only R-peaks — it cannot see the ribcage. But the
   * breath is written into the RR series anyway: inhalation shortens RR,
   * exhalation lengthens it. Detrending the tachogram and normalising by its
   * own recent swing recovers the breathing waveform without any extra
   * hardware.
   *
   * Sampling is one point per beat (~1 Hz), so this resolves breathing up to
   * ~30/min — far beyond anything relevant here — but the wave is coarse and
   * gets eased in `_updateLive`.
   */
  _deriveRespiration(rrMs, now) {
    const L = this.live;

    // Seed the baseline from the first beat instead of easing toward it from
    // a guess. A hard-coded starting RR biases `resid` by however far the
    // sitter's true RR sits from it, and until the EMA catches up (tens of
    // seconds) that offset can exceed the entire RSA swing — pinning the
    // wave to one side of zero, so no breath onset is ever detected and the
    // opening minute of a live session reads as "erratic".
    if (!L.lastBeatAt) {
      L.rrSlow = rrMs;
      L.lastBeatAt = now;
      return;
    }

    const beatDt = (now - L.lastBeatAt) / 1000;
    L.lastBeatAt = now;

    // Detrend: a ~15 s baseline removes posture and slow HR drift, leaving
    // the respiratory oscillation.
    L.rrSlow += (rrMs - L.rrSlow) * smoothK(beatDt, 15);
    const resid = rrMs - L.rrSlow;

    // Adaptive gain, so shallow and deep breathers both map onto -1..1.
    L.respAmp += (Math.abs(resid) * 1.6 - L.respAmp) * smoothK(beatDt, 10);

    // Sign flip: RR *shortens* on inhale, but respWave must be +1 at peak
    // inhalation to match the mock path and the drone's filter mapping.
    const wave = clamp(-resid / Math.max(L.respAmp, 5), -1, 1);
    L.respRaw = wave;

    // Breath onset detection — a Schmitt trigger, not a zero-crossing.
    //
    // A plain crossing test chatters. RSA amplitude shrinks as breathing
    // speeds up (~150 ms at 5.5/min, ~45 ms at 12/min) while sensor noise
    // does not, so near the zero the wave crosses several times per breath.
    // Every spurious crossing reset the period reference, so the sub-3 s
    // "periods" were all rejected and the rate estimate never populated at
    // all above ~6 breaths/min. Requiring the wave to commit to −H before a
    // crossing at +H counts removes the chatter outright.
    const H = 0.25;
    if (wave < -H) {
      L.armed = true;
    } else if (L.armed && wave > H) {
      L.armed = false;
      if (L.lastCrossAt) {
        const period = (now - L.lastCrossAt) / 1000;
        // 3–20 s is 3–20 breaths/min, the instrument's stated range.
        if (period > 3 && period < 20) {
          L.periods.push(period);
          if (L.periods.length > 6) L.periods.shift();
        }
      }
      L.lastCrossAt = now;
    }
  }

  // ─── Main step ────────────────────────────────────────────────────────

  update(dt) {
    dt = Math.min(dt, 0.1); // guard against tab-switch time jumps
    if (this.source === SOURCE.LIVE) return this._updateLive(dt);
    const t = this.targets;

    // 1 ── Ease the slow-moving physiology toward the slider targets.
    //      Stress moves fastest, heart rate slowest.
    this._eda += (t.eda - this._eda) * smoothK(dt, 1.6);
    this._hrBase += (t.hr - this._hrBase) * smoothK(dt, 4.0);
    this._breathRate += (t.breathRate - this._breathRate) * smoothK(dt, 2.2);
    this._breathDepth += (t.breathDepth - this._breathDepth) * smoothK(dt, 2.0);

    const edaNorm = invLerp(RANGE.eda.min, RANGE.eda.max, this._eda);

    // Tonic drift + phasic bumps, so EDA never looks like a straight line.
    const eda =
      clamp(this._eda + Math.sin(performance.now() * 0.00021) * 0.22 * edaNorm +
        gaussian() * 0.05 * edaNorm, RANGE.eda.min, RANGE.eda.max);

    // 2 ── Breath oscillator.
    //      Stress destabilises both the rate and the depth of the breath.
    this._rateWobble += (gaussian() * edaNorm * 0.9 - this._rateWobble) * smoothK(dt, 0.9);
    const rateNow = clamp(
      this._breathRate + this._rateWobble,
      RANGE.breathRate.min, RANGE.breathRate.max
    );
    const depthNow = clamp(this._breathDepth * (1 - 0.45 * edaNorm * Math.random() ** 0.5));

    this._phase = (this._phase + dt * (rateNow / 60)) % 1;

    // Asymmetric wave: rises over INHALE_FRACTION, falls over the rest.
    // Written as raised cosines so velocity is zero at both turning points —
    // the visuals and the drone filter follow this curve directly, and a kink
    // here would be audible.
    let w;
    if (this._phase < INHALE_FRACTION) {
      w = -Math.cos((Math.PI * this._phase) / INHALE_FRACTION);
    } else {
      const u = (this._phase - INHALE_FRACTION) / (1 - INHALE_FRACTION);
      w = Math.cos(Math.PI * u);
    }
    const respWave = w * depthNow;

    // 3 ── respPhase: 1 inhale / -1 exhale / 0 erratic-or-shallow.
    const shallow = depthNow < SHALLOW_THRESHOLD || rateNow > 17;
    const erratic = Math.abs(this._rateWobble) > 1.6;
    const phase = shallow || erratic ? 0 : this._phase < INHALE_FRACTION ? 1 : -1;

    // Stability EMA — how much of the last while was actual, legible breathing.
    this._stability += ((phase === 0 ? 0 : 1) - this._stability) * smoothK(dt, 3.0);

    // 4 ── Heartbeat generation with respiratory sinus arrhythmia.
    //      RSA amplitude peaks at resonance and rolls off as a Lorentzian:
    //          gain(f) = 1 / (1 + ((f - 5.5)/3.2)²)
    //      …so 5.5 br/min → 1.00, 12 br/min → 0.20. Vagal withdrawal under
    //      stress scales it down further.
    const resonanceGain = 1 / (1 + ((rateNow - RESONANCE_BPM) / 3.2) ** 2);
    const rsaAmp =
      RSA_AMP_MAX * resonanceGain * t.hrvCapacity * depthNow * (1 - 0.7 * edaNorm);

    this._beatTimer -= dt;
    if (this._beatTimer <= 0) {
      // Instantaneous RR: baseline modulated by the breath (inhale shortens
      // RR / speeds the heart, exhale lengthens it) plus vagal noise.
      const rr0 = 60000 / this._hrBase;
      const noise = gaussian() * lerp(4, 16, t.hrvCapacity) * (1 - 0.4 * edaNorm);
      const rr = clamp(rr0 - rsaAmp * respWave + noise, 380, 1500);

      this.pushBeat(rr);
      this._beatTimer += rr / 1000;
    }

    // 5 ── Read out the estimator. `Math.sqrt` of the EW mean of ΔRR².
    const rmssd = clamp(Math.sqrt(this._msd), RANGE.rmssd.min, RANGE.rmssd.max);

    // Reported HR follows the smoothed baseline plus the visible RSA swing.
    const hr = clamp(
      60000 / (60000 / this._hrBase - rsaAmp * respWave),
      RANGE.hr.min, RANGE.hr.max
    );

    // 6 ── Normalised drive metrics.
    const rmssdNorm = invLerp(RANGE.rmssd.min, RANGE.rmssd.max, rmssd);

    /**
     * resp_depth_score — geometric mean of amplitude and rate quality, so
     * BOTH must be good. A deep but fast breath and a slow but shallow one
     * both score poorly; only slow *and* full scores near 1.
     */
    const rateScore = clamp(1 - Math.abs(rateNow - RESONANCE_BPM) / 8);
    const respDepthScore = Math.sqrt(depthNow * rateScore) * lerp(0.55, 1, this._stability);

    return this._publish(dt, {
      hr, rmssd, rmssdNorm, eda, edaNorm,
      phase, respWave, rateNow, depthNow, respDepthScore,
    });
  }

  // ─── Live step ────────────────────────────────────────────────────────

  /**
   * Hardware path. Everything here comes from the RR series; nothing is
   * simulated. What a chest strap genuinely cannot tell you:
   *
   *   - breath DEPTH. It sees R-peaks, not a ribcage. Using RSA amplitude as
   *     a depth proxy would be circular — RSA amplitude is what RMSSD already
   *     measures, so cohesion would collapse into goldIndex and the two bars
   *     would move as one. Instead the depth term is replaced by breathing
   *     REGULARITY, which the tachogram does show honestly.
   *   - EDA. No standard GATT service carries it, so it stays on the panel
   *     slider unless a GSR rig is feeding `pushEda()`.
   */
  _updateLive(dt) {
    const L = this.live;
    const now = performance.now();

    // Watchdog. A strap that stops reporting must not leave the pagoda
    // frozen mid-air looking like it is still reading someone.
    const sinceBeat = L.lastBeatAt ? (now - L.lastBeatAt) / 1000 : 999;
    L.stale = sinceBeat > STALE_AFTER;

    // Ease the coarse ~1 Hz breath estimate into a continuous wave.
    const prevEased = L.respWave;
    L.respWave += (L.respRaw - L.respWave) * smoothK(dt, 0.7);
    if (L.stale) L.respWave *= 1 - smoothK(dt, 2); // let it fall still
    const respWave = L.respWave;
    const slope = respWave - prevEased;

    // Breath rate and regularity from the last few periods.
    //
    // One period already gives a rate; regularity needs at least two, since
    // it is a statement about variation. Waiting for two before reporting
    // anything doubled the warm-up to ~34 s at 5.5 breaths/min — most of a
    // minute of a live sitting spent showing nothing.
    const P = L.periods;
    const warmup = P.length < 2;
    let rateNow = 12, regularity = 0;
    if (P.length >= 1) {
      const mean = P.reduce((a, b) => a + b, 0) / P.length;
      rateNow = clamp(60 / mean, RANGE.breathRate.min, RANGE.breathRate.max);
      if (P.length >= 2) {
        const varr = P.reduce((a, b) => a + (b - mean) ** 2, 0) / P.length;
        // Coefficient of variation: 0 = metronomic, >0.35 = ragged.
        regularity = clamp(1 - Math.sqrt(varr) / mean / 0.35);
      }
    }

    // respPhase from the slope of the recovered wave: rising = inhale.
    // The slope is tiny per frame, so compare against a threshold scaled by
    // dt rather than plain zero, or frame-rate jitter alone decides the phase.
    // The wave itself is enough to say inhale or exhale — that does not have
    // to wait on a period estimate.
    const moving = Math.abs(slope) > 1e-4 * (dt * 60);
    const tooFlat = Math.abs(respWave) < 0.10 && !moving;
    const phase = L.stale || tooFlat || !L.lastBeatAt ? 0 : slope >= 0 ? 1 : -1;

    this._stability += ((phase === 0 ? 0 : 1) - this._stability) * smoothK(dt, 3.0);

    // EDA: real sample if one arrived in the last 5 s, otherwise the slider.
    const edaLive = now - L.edaAt < 5000;
    this._eda += (this.targets.eda - this._eda) * smoothK(dt, edaLive ? 0.8 : 1.6);
    const eda = clamp(this._eda, RANGE.eda.min, RANGE.eda.max);
    const edaNorm = invLerp(RANGE.eda.min, RANGE.eda.max, eda);

    const rmssd = L.stale ? 0 : clamp(Math.sqrt(this._msd), RANGE.rmssd.min, RANGE.rmssd.max);
    const rmssdNorm = invLerp(RANGE.rmssd.min, RANGE.rmssd.max, rmssd);
    const hr = clamp(60000 / Math.max(L.rrSlow, 1), RANGE.hr.min, RANGE.hr.max);

    // Same geometric-mean shape as the mock path, with regularity standing in
    // for amplitude.
    const rateScore = clamp(1 - Math.abs(rateNow - RESONANCE_BPM) / 8);
    const respDepthScore = L.stale
      ? 0
      : Math.sqrt(regularity * rateScore) * lerp(0.55, 1, this._stability);

    return this._publish(dt, {
      hr, rmssd, rmssdNorm, eda, edaNorm,
      phase, respWave, rateNow, depthNow: regularity, respDepthScore,
      warmup: warmup && !L.stale,
    });
  }

  // ─── Shared tail: metrics, easing, publication, graph history ─────────

  _publish(dt, r) {
    // Spec formula, verbatim.
    const cohesionRaw = (1 - r.edaNorm) * 0.6 + r.respDepthScore * 0.4;

    // Slow easing so a twitchy sensor never snaps the pagoda apart. Gathering
    // is deliberately lazier than scattering: it should feel earned.
    const rising = cohesionRaw > this._cohesion;
    this._cohesion += (cohesionRaw - this._cohesion) * smoothK(dt, rising ? 2.6 : 1.4);
    this._goldIndex += (r.rmssdNorm - this._goldIndex) * smoothK(dt, 3.2);

    Object.assign(SensorData, {
      hr: r.hr,
      rmssd: r.rmssd,
      eda: r.eda,
      respPhase: r.phase,
      respWave: r.respWave,
      respRate: r.rateNow,
      respDepth: r.depthNow,
      cohesion: clamp(this._cohesion),
      goldIndex: clamp(this._goldIndex),
      edaNorm: r.edaNorm,
      rmssdNorm: r.rmssdNorm,
      respDepthScore: r.respDepthScore,
      source: this.source,
      stale: this.source === SOURCE.LIVE && this.live.stale,
      warmup: !!r.warmup,
    });

    // Feed the debug graphs at a fixed 15 Hz.
    this._histTimer += dt;
    if (this._histTimer >= 1 / 15) {
      this._histTimer = 0;
      this.history.hr.push(r.hr);
      this.history.rmssd.push(r.rmssd);
      this.history.resp.push(r.respWave);
    }

    return SensorData;
  }
}

/**
 * audio.js — Buddhist & Thai Spiritual Audio Architecture
 * ─────────────────────────────────────────────────────────────────────────
 * Three voices, no samples — everything is synthesised so it can respond
 * continuously to the body instead of crossfading loops:
 *
 *   1. MANTRA DRONE (梵音)  — monastic throat-chant; breathes with respPhase
 *   2. SINGING BOWL (颂钵)  — additive, non-harmonic; struck on deep calm
 *   3. TEMPLE CHIMES (风铃) — Thai-tuned brass; scattered on high HRV
 *   + TURBULENCE RESPONSE  — high stress thins the mix without adding noise
 *
 * This module receives ONLY scalars from app.js. It never sees a matrix, a
 * vector or a Three.js object.
 *
 * Signal topology
 *   voice → dry gain ─────────────┐
 *         → send gain → reverb ───┴→ master → limiter → destination
 */

const Tone = window.Tone;

const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

// ─────────────────────────────────────────────────────────────────────────
// Tuning tables
// ─────────────────────────────────────────────────────────────────────────

/**
 * SINGING BOWL PARTIALS
 *
 * A struck bowl is a thin axisymmetric shell, not a string, so its modes do
 * NOT fall on the harmonic series 1:2:3:4. Shell modes scale roughly with
 * m(m+1) for circumferential mode number m, and measured Himalayan bowls
 * land close to:
 *
 *      f0 · 1.00    (m=2)  the hum, what you hear as "the note"
 *      f0 · 1.40    (m=3)  the sour, floating second partial
 *      f0 · 2.70    (m=4)
 *      f0 · 4.20    (m=5)
 *
 * That 1.4 ratio is the whole character: it is ~590 cents, a hair under a
 * tritone, which is why a bowl never resolves into a chord and never sounds
 * like a synth pad.
 *
 * `release` per partial: higher shell modes radiate energy faster, so they
 * must die sooner. Scaling as 1/ratio^0.75 makes the strike start bright and
 * metallic and settle into a pure hum — that decay envelope is most of what
 * the ear reads as "metal".
 *
 * `lfoRate/lfoDepth`: a mallet rubbed round the rim re-excites each mode at a
 * slightly different rate, producing the slow beating "singing". Rates are
 * mutually irrational so the pattern never audibly repeats.
 */
export const BOWL_PARTIALS = [
  { ratio: 1.00, gain: 1.00, lfoRate: 0.21, lfoDepth: 0.10 },
  { ratio: 1.40, gain: 0.50, lfoRate: 0.33, lfoDepth: 0.32 },
  { ratio: 2.70, gain: 0.24, lfoRate: 0.47, lfoDepth: 0.46 },
  { ratio: 4.20, gain: 0.11, lfoRate: 0.61, lfoDepth: 0.58 },
];
const BOWL_RELEASE_BASE = 16; // seconds for the fundamental

/** Bowl fundamentals, low → high. Deeper bowls are reserved for deeper calm. */
const BOWL_NOTES = [146.83, 174.61, 196.0, 220.0, 261.63]; // D3 F3 G3 A3 C4

/**
 * THAI TEMPLE CHIME TUNING
 *
 * Thai classical tuning divides the octave into SEVEN EQUAL steps of
 * 1200/7 ≈ 171.43 cents, not the Western twelve. Nothing in it coincides
 * with equal temperament except the octave, which is exactly why a Thai
 * ensemble sounds "off" against a piano and correct against itself.
 * Building the chimes from this grid — rather than from a Western
 * pentatonic — is what keeps them sounding like a wat and not a wind-chime
 * app.
 *
 * Steps [0,1,3,4,6] are the pentatonic subset most often heard in ranat and
 * temple-bell figures.
 */
const THAI_STEP = Math.pow(2, 1 / 7);
const CHIME_BASE = 1046.5; // C6
const CHIME_SCALE = [];
for (let oct = 0; oct < 2; oct++) {
  for (const s of [0, 1, 3, 4, 6]) {
    CHIME_SCALE.push(CHIME_BASE * Math.pow(2, oct) * Math.pow(THAI_STEP, s));
  }
}

/**
 * Draw a pitch, biased toward the bottom of the range. A real rack of eave
 * bells is mostly mid-sized with a few small bright ones; picking uniformly
 * across two octaves puts too much weight near 3.8 kHz, which reads as
 * shrill rather than devotional.
 */
function pickChime() {
  return CHIME_SCALE[Math.floor(Math.pow(Math.random(), 1.7) * CHIME_SCALE.length)];
}

/**
 * Silence between chime events, in seconds. Deep relaxation makes the
 * breeze more frequent, never continuous: ~11 bells/min at the 0.8
 * threshold, ~22/min at full gold.
 */
function restInterval(intensity) {
  return lerp(24.0, 12.0, intensity) * (0.7 + Math.random() * 0.6);
}

/** Pure mapping policy, kept testable without constructing a Web Audio graph. */
export function selectSoundState({ cohesion, goldIndex, edaNorm, respPhase }) {
  const turbulence = edaNorm > 0.6;
  return {
    turbulence,
    bowl: !turbulence && respPhase !== 0 && cohesion > 0.68,
    chime: !turbulence && goldIndex > 0.92 && cohesion < 0.68 && edaNorm < 0.55,
  };
}

/**
 * Continuous breath guide derived from the -1..1 respiration wave.
 * Inhale rises from dark/close to bright/focused; exhale returns to a wider,
 * softer room. The smoothstep curve makes both turning points unhurried.
 */
export function breathGuideTargets(respWave, respPhase, cohesion) {
  if (respPhase === 0) {
    return { filter: 340, gain: 0.32, chorusWet: 0.36, width: 0.58 };
  }
  const x = clamp(respWave * 0.5 + 0.5);
  const open = x * x * (3 - 2 * x);
  return {
    filter: lerp(240, lerp(1120, 1480, cohesion), open),
    gain: lerp(0.4, lerp(0.62, 0.7, cohesion), open),
    chorusWet: lerp(0.58, 0.18, open),
    width: lerp(0.9, 0.34, open),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// One singing-bowl voice: four sines, four envelopes, four LFOs
// ─────────────────────────────────────────────────────────────────────────

class BowlVoice {
  constructor(dest) {
    this.busy = 0; // Tone time at which this voice frees up
    this.parts = BOWL_PARTIALS.map((p) => {
      const osc = new Tone.Oscillator({ frequency: 220 * p.ratio, type: 'sine' }).start();

      // Friction shimmer. The Gain's own value stays at 0 and the LFO's
      // output is *summed* into the param, so the LFO alone sets the level.
      const shimmer = new Tone.Gain(0);
      const lfo = new Tone.LFO({
        frequency: p.lfoRate,
        min: 1 - p.lfoDepth,
        max: 1,
        type: 'sine',
      }).start();
      lfo.connect(shimmer.gain);

      const env = new Tone.AmplitudeEnvelope({
        attack: 0.85,               // slow bloom, as if the mallet leans in
        attackCurve: 'sine',
        decay: 0.5,
        sustain: 1,
        release: BOWL_RELEASE_BASE / Math.pow(p.ratio, 0.75),
        releaseCurve: 'exponential', // exponential = metallic; linear = pad
      });

      const lvl = new Tone.Gain(p.gain);
      osc.chain(shimmer, env, lvl, dest);
      return { osc, env, lvl, lfo, spec: p };
    });
  }

  strike(freq, velocity, time) {
    for (const part of this.parts) {
      part.osc.frequency.setValueAtTime(freq * part.spec.ratio, time);
      part.lvl.gain.setValueAtTime(part.spec.gain * velocity, time);
      // Hold for the length of the attack, then let the long release run.
      part.env.triggerAttackRelease(0.9, time);
    }
    this.busy = time + BOWL_RELEASE_BASE * 0.55;
  }

  dispose() {
    for (const p of this.parts) {
      p.osc.dispose(); p.env.dispose(); p.lvl.dispose(); p.lfo.dispose();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// The engine
// ─────────────────────────────────────────────────────────────────────────

export class AudioEngine {
  constructor() {
    this.ready = false;
    this.muted = false;

    // Bowl trigger state (hysteresis + spacing).
    this._bowlArmed = true;
    this._bowlNext = 0;
    this._bowlIdx = 3;
    this._calmDwell = 0;
    this._bowlStrikes = 0;

    // Chime scheduling state.
    this._chimeTimer = 12;
    this._gustLeft = 0;
    this._gustGap = 0;
    this._chimeStrikes = 0;

    // Continuous params are sampled at 4 Hz and only scheduled when the
    // target has materially changed. Replacing an unfinished multi-second
    // ramp 12 times a second caused automation churn and audible drop-outs
    // on consumer laptops while the 50k-particle shader was busy.
    this._paramT = 0;
    this._paramTargets = Object.create(null);
    this._automationWrites = 0;
    this._lastPhase = 999;
    this._chaosOn = false;
  }

  /** Must be called from inside a real user gesture. */
  async start() {
    if (this.ready) return;
    await Tone.start();

    // This installation values continuity over instrument-style latency.
    // A slightly larger Web Audio look-ahead keeps scheduled envelopes on
    // time even if the visual thread briefly misses a frame.
    const context = Tone.getContext();
    context.lookAhead = Math.max(context.lookAhead || 0, 0.16);
    context.updateInterval = 0.05;

    // ── master ────────────────────────────────────────────────────────
    // A little more headroom than the original graph. Additive bowl voices
    // can overlap for 15+ seconds; keeping their summed peak below the hard
    // ceiling avoids the short digital ticks that otherwise sound like an
    // intermittent electrical fault.
    this.limiter = new Tone.Limiter(-2.5).toDestination();
    this.master = new Tone.Gain(0.0).connect(this.limiter);

    // ── temple reverb send ────────────────────────────────────────────
    // Long, dark tail: a stone-and-gold hall, not a plate.
    // 6.5 s preserves the stone-hall bloom while using a substantially
    // shorter convolution kernel than the old 9.5 s room.
    this.reverb = new Tone.Reverb({ decay: 6.5, preDelay: 0.05, wet: 1 });
    await this.reverb.generate();
    this.reverbReturn = new Tone.Gain(0.68).connect(this.master);
    this.reverb.connect(this.reverbReturn);
    this.send = new Tone.Gain(1).connect(this.reverb);

    this._buildDrone();
    this._buildBowls();
    this._buildChimes();
    this._buildChaos();

    // Fade the room up over 4 s rather than snapping on.
    this.master.gain.rampTo(0.78, 4);
    this.ready = true;
  }

  /** Schedule a smooth change only when the destination actually moved. */
  _smooth(key, param, target, seconds, epsilon = 0.012) {
    const previous = this._paramTargets[key];
    if (previous !== undefined && Math.abs(previous - target) < epsilon) return;
    this._paramTargets[key] = target;
    param.rampTo(target, seconds);
    this._automationWrites++;
  }

  // ── 1. THE MANTRA DRONE (梵音) ───────────────────────────────────────
  /**
   * Deep monastic chant. Built from clean, band-limited additive voices at
   * A1 plus a fifth. Their richer but finite overtone set restores the clear
   * inhale/exhale bloom of version one without restoring broadband saw edges,
   * with a softly modulated FM voice for the edge of throat singing, then coloured
   * by a parallel formant bank so it reads as a human "Om" rather than a
   * synth bass.
   */
  _buildDrone() {
    this.droneSum = new Tone.Gain(0.21);

    // A1 = 55 Hz fundamental, one voice detuned ±7 cents for chorus beating,
    // plus E2 (55 × 1.5) — the open fifth that Gyuto chant sits on.
    const chantPartials = [1, 0.42, 0.24, 0.15, 0.1, 0.065, 0.04, 0.025];
    this.droneOscs = [
      // A finite additive spectrum gives the low-pass filter audible colour
      // to open and close, while remaining free of sawtooth broadband fizz.
      new Tone.Oscillator({ frequency: 55.0, type: 'custom', partials: chantPartials, detune: -7 }),
      new Tone.Oscillator({ frequency: 55.0, type: 'custom', partials: chantPartials, detune: +7 }),
      new Tone.Oscillator({ frequency: 82.5, type: 'custom', partials: chantPartials.slice(0, 6), detune: +3 }),
      new Tone.Oscillator({ frequency: 110.0, type: 'sine' }), // octave, steadies the pitch
    ];
    this.droneOscs.forEach((o) => { o.connect(this.droneSum); o.start(); });

    // The FM voice supplies a soft throat edge. The previous square-wave
    // modulator produced discontinuities rich in upper partials; on small
    // transducers those partials sounded exactly like electrical crackle.
    this.droneFM = new Tone.FMOscillator({
      frequency: 55, type: 'sine', modulationType: 'sine',
      harmonicity: 1.503, modulationIndex: 0.85,
    }).start();
    this.droneFMGain = new Tone.Gain(0.065).connect(this.droneSum);
    this.droneFM.connect(this.droneFMGain);

    // The breath valve.
    this.droneFilter = new Tone.Filter({
      type: 'lowpass', frequency: 260, rolloff: -24, Q: 1.4,
    });
    this.droneSum.connect(this.droneFilter);

    // Parallel formant bank ≈ the vowel of "Oṃ" (a rounded back vowel:
    // F1 ~320 Hz, F2 ~860 Hz, plus a singer's-formant band at 2.3 kHz).
    this.formantMix = new Tone.Gain(0.5);
    this.formants = [[320, 7, 0.9], [860, 9, 0.45], [2300, 11, 0.16]].map(([f, q, g]) => {
      const bp = new Tone.Filter({ type: 'bandpass', frequency: f, Q: q });
      const gn = new Tone.Gain(g);
      this.droneFilter.connect(bp); bp.connect(gn); gn.connect(this.formantMix);
      return { bp, gn };
    });

    this.droneDirect = new Tone.Gain(0.85);
    this.droneFilter.connect(this.droneDirect);

    this.chorus = new Tone.Chorus({
      frequency: 0.32, delayTime: 6.5, depth: 0.72, spread: 180, wet: 0.28,
    }).start();
    this.widener = new Tone.StereoWidener(0.35);

    this.droneOut = new Tone.Gain(0.0);
    this.droneDirect.connect(this.chorus);
    this.formantMix.connect(this.chorus);
    this.chorus.chain(this.widener, this.droneOut);
    this.droneOut.connect(this.master);
    this.droneSend = new Tone.Gain(0.45).connect(this.send);
    this.droneOut.connect(this.droneSend);

    this.droneOut.gain.rampTo(0.55, 6);
  }

  // ── 2. SINGING BOWLS (颂钵) ──────────────────────────────────────────
  _buildBowls() {
    // The first-version bowl is deliberately the foreground calm reward.
    // Its exact 1 / 1.4 / 2.7 / 4.2 partial model remains unchanged above.
    this.bowlBus = new Tone.Gain(0.68).connect(this.master);
    this.bowlSend = new Tone.Gain(0.8).connect(this.send);
    this.bowlBus.connect(this.bowlSend);
    // Three voices: enough for one bowl to still be ringing under the next.
    this.bowls = [0, 1, 2].map(() => new BowlVoice(this.bowlBus));
  }

  _strikeBowl(freq, velocity) {
    const now = Tone.now() + 0.1;
    // Steal the voice that has been ringing longest.
    let voice = this.bowls[0];
    for (const v of this.bowls) if (v.busy < voice.busy) voice = v;
    voice.strike(freq, velocity, now);
    this._bowlStrikes++;
    console.info(`[audio] singing bowl ${freq.toFixed(2)} Hz`);
  }

  // ── 3. THAI TEMPLE CHIMES (泰式风铃) ─────────────────────────────────
  _buildChimes() {
    this.chimeBus = new Tone.Gain(0.0).connect(this.master);
    // Short slap delay: the eaves of a wat are a few metres apart, so each
    // bell answers itself once or twice before the hall tail takes over.
    this.chimeDelay = new Tone.FeedbackDelay({
      delayTime: 0.42, feedback: 0.34, wet: 0.32,
    }).connect(this.send);
    this.chimeBus.connect(this.chimeDelay);
    this.chimeBus.connect(this.send);

    // Four independent voices, each on its own pan position, so a gust
    // genuinely travels across the stereo field instead of pulsing in place.
    this.chimes = [0, 1, 2, 3].map(() => {
      const pan = new Tone.Panner(0).connect(this.chimeBus);
      // MetalSynth can generate a brittle ultrasonic skirt. The low-pass is
      // deliberately per voice, before panning and feedback, so the delay
      // cannot accumulate that skirt into a fizzy electrical tail.
      const polish = new Tone.Filter({ type: 'lowpass', frequency: 6200, rolloff: -24, Q: 0.5 });
      const synth = new Tone.MetalSynth({
        envelope: { attack: 0.004, decay: 1.5, release: 0.25 },
        harmonicity: 8.5,      // wide, inharmonic — small struck brass
        modulationIndex: 18,
        resonance: 4200,
        octaves: 0.85,  // higher values push partials past 10 kHz and glare
        volume: -23,
      }).chain(polish, pan);
      return { synth, polish, pan };
    });
    this._chimeIdx = 0;
  }

  _triggerChime(freq, velocity) {
    const v = this.chimes[this._chimeIdx++ % this.chimes.length];
    const t = Tone.now() + 0.02;
    v.pan.pan.setValueAtTime((Math.random() * 2 - 1) * 0.85, t);
    // Set frequency explicitly as well as passing it — MetalSynth's note
    // argument has moved around between Tone versions and this is cheap.
    v.synth.frequency.setValueAtTime(freq, t);
    v.synth.triggerAttackRelease(freq, 0.5, t, velocity);
    this._chimeStrikes++;
    console.info(`[audio] temple chime ${freq.toFixed(2)} Hz`);
  }

  // ── 4. TURBULENCE RESPONSE ──────────────────────────────────────────
  /**
   * Stress is communicated by thinning the drone and withholding the bowl.
   * It intentionally creates no additional oscillator or noise source: the
   * former wind layer, even after being made tonal, was heard as an
   * electrical hum and competed with meditation.
   */
  _buildChaos() {
    this.chaosBus = new Tone.Gain(0).connect(this.master);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Per-frame update. `m` carries only scalars.
  // ─────────────────────────────────────────────────────────────────────

  /**
   * @param {object} m
   *   cohesion, goldIndex, edaNorm — 0..1
   *   respPhase                    — 1 inhale / -1 exhale / 0 erratic
   *   respWave                     — continuous -1..1 breath guide curve
   *   dt                           — seconds since last frame
   */
  update(m) {
    if (!this.ready || this.muted) return;
    const { cohesion, goldIndex, edaNorm, respPhase, respWave = 0, dt } = m;
    const soundState = selectSoundState({ cohesion, goldIndex, edaNorm, respPhase });

    // ── Throttled continuous params ───────────────────────────────────
    this._paramT += dt;
    if (this._paramT > 1 / 4) {
      this._paramT = 0;

      // Version-one breathing behaviour, now driven by the full waveform
      // instead of only changing at phase boundaries. This makes the sound
      // itself a regular practice cue: brighten and gather on inhale, darken
      // and widen on the longer exhale.
      const guide = breathGuideTargets(respWave, respPhase, cohesion);
      this._smooth('drone-filter', this.droneFilter.frequency, guide.filter, 0.42, 24);
      this._smooth('chorus-wet', this.chorus.wet, guide.chorusWet, 0.48, 0.025);
      this._smooth('stereo-width', this.widener.width, guide.width, 0.48, 0.025);
      this._smooth('drone-out', this.droneOut.gain, guide.gain, 0.42, 0.018);

      // Chaos crossfade. `edaNorm > 0.6` per spec — normalised, i.e. EDA 6/10.
      const chaosWanted = soundState.turbulence;

      if (chaosWanted !== this._chaosOn) {
        this._chaosOn = chaosWanted;
        // Mute the pure bowls under turbulence — a clean bowl would read as
        // resolution, and nothing has resolved.
        this._smooth('bowl-bus', this.bowlBus.gain, chaosWanted ? 0.0 : 0.68, 3.0);
      }

      // The drone thins out as the mind scatters.
      this._smooth('drone-fm', this.droneFMGain.gain, lerp(0.018, 0.06, cohesion), 2);
      this._smooth('chime-bus', this.chimeBus.gain, lerp(0.1, 0.28, goldIndex), 2);
    }

    // ── Singing bowl: the primary reward for stable breath ────────────
    // Require two seconds of coherent breathing, then strike the exact
    // additive bowl from version one. Hysteresis stops threshold chatter.
    const now = Tone.now();
    const calmAndBreathing = soundState.bowl;
    this._calmDwell = calmAndBreathing ? Math.min(8, this._calmDwell + dt) : 0;
    if (cohesion < 0.62 || this._chaosOn) this._bowlArmed = true;

    if (this._calmDwell >= 2 && now > this._bowlNext) {
      const sustained = !this._bowlArmed;
      // Deeper calm reaches for a deeper bowl.
      const want = Math.round(lerp(BOWL_NOTES.length - 1, 0, clamp((cohesion - 0.68) / 0.32)));
      this._bowlIdx = sustained ? Math.round(lerp(this._bowlIdx, want, 0.5)) : want;

      // The first arrival is clearly audible; later returns stay restrained.
      this._strikeBowl(BOWL_NOTES[this._bowlIdx], sustained ? 0.46 : 0.68);
      this._bowlArmed = false;
      // Let the 16-second shell decay breathe before another strike.
      this._bowlNext = now + lerp(26, 19, cohesion) + Math.random() * 4;
    }

    // ── Chimes: a rare transitional accent, never the calm reward ──────
    // High HRV alone used to fire bright bells while the user was breathing
    // steadily. Keep them only for the liminal state before full cohesion;
    // stable breath is represented exclusively by the singing bowl.
    const chimeEligible = soundState.chime;
    if (chimeEligible) {
      const intensity = clamp((goldIndex - 0.92) / 0.08);
      this._chimeTimer -= dt;

      if (this._gustLeft > 0) {
        // Inside a gust: a run of bells with narrowing gaps, like a breeze
        // crossing the eaves one row at a time.
        if (this._chimeTimer <= 0) {
          this._triggerChime(pickChime(), lerp(0.25, 0.7, Math.random()) * intensity);
          this._gustLeft--;
          this._gustGap *= 0.78;
          // A finished gust must hand back a REST, not its last 0.3 s gap.
          // Leaving the short gap in place let the next roll start another
          // gust almost immediately; gusts chained end to end and the piece
          // rang at ~70 bells a minute with no silence anywhere in it.
          this._chimeTimer = this._gustLeft > 0
            ? this._gustGap * (0.7 + Math.random() * 0.6)
            : restInterval(intensity);
        }
      } else if (this._chimeTimer <= 0) {
        // Between gusts: Poisson-ish waiting time, so it never feels metered.
        if (Math.random() < 0.16) {
          this._gustLeft = 2;
          this._gustGap = 0.72;
          this._chimeTimer = 0;
        } else {
          this._triggerChime(pickChime(), lerp(0.18, 0.5, Math.random()) * intensity);
          this._chimeTimer = restInterval(intensity);
        }
      }
    } else {
      this._gustLeft = 0;
      this._chimeTimer = 12;
    }
  }

  /** Read-only counters for browser regression checks. */
  diagnostics() {
    const raw = Tone.getContext().rawContext;
    return {
      ready: this.ready,
      state: raw.state,
      sampleRate: raw.sampleRate,
      baseLatency: raw.baseLatency || 0,
      lookAhead: Tone.getContext().lookAhead,
      automationWrites: this._automationWrites,
      bowlStrikes: this._bowlStrikes,
      chimeStrikes: this._chimeStrikes,
    };
  }

  setMuted(v) {
    this.muted = v;
    if (this.ready) this.master.gain.rampTo(v ? 0 : 0.78, 0.6);
  }
}

/**
 * audio.js — Buddhist & Thai Spiritual Audio Architecture
 * ─────────────────────────────────────────────────────────────────────────
 * Three voices, no samples — everything is synthesised so it can respond
 * continuously to the body instead of crossfading loops:
 *
 *   1. MANTRA DRONE (梵音)  — monastic throat-chant; breathes with respPhase
 *   2. SINGING BOWL (颂钵)  — additive, non-harmonic; struck on deep calm
 *   3. TEMPLE CHIMES (风铃) — Thai-tuned brass; scattered on high HRV
 *   + CHAOS TEXTURE        — hollow, ungrounded wind when stress takes over
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
const BOWL_PARTIALS = [
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
  return lerp(14.0, 4.0, intensity) * (0.5 + Math.random());
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

    // Chime scheduling state.
    this._chimeTimer = 0;
    this._gustLeft = 0;
    this._gustGap = 0;

    // Continuous params are only rewritten at PARAM_HZ, not per frame:
    // scheduling ~10 ramps × 60 fps into the Web Audio graph is a reliable
    // way to make the whole thing crackle.
    this._paramT = 0;
    this._lastPhase = 999;
    this._chaosOn = false;
  }

  /** Must be called from inside a real user gesture. */
  async start() {
    if (this.ready) return;
    await Tone.start();

    // ── master ────────────────────────────────────────────────────────
    this.limiter = new Tone.Limiter(-1).toDestination();
    this.master = new Tone.Gain(0.0).connect(this.limiter);

    // ── temple reverb send ────────────────────────────────────────────
    // Long, dark tail: a stone-and-gold hall, not a plate.
    this.reverb = new Tone.Reverb({ decay: 9.5, preDelay: 0.05, wet: 1 });
    await this.reverb.generate();
    this.reverbReturn = new Tone.Gain(0.9).connect(this.master);
    this.reverb.connect(this.reverbReturn);
    this.send = new Tone.Gain(1).connect(this.reverb);

    this._buildDrone();
    this._buildBowls();
    this._buildChimes();
    this._buildChaos();

    // Fade the room up over 4 s rather than snapping on.
    this.master.gain.rampTo(0.9, 4);
    this.ready = true;
  }

  // ── 1. THE MANTRA DRONE (梵音) ───────────────────────────────────────
  /**
   * Deep monastic chant. Built from detuned sawtooths at A1 plus a fifth,
   * with an FM voice for the buzzing edge of throat singing, then coloured
   * by a parallel formant bank so it reads as a human "Om" rather than a
   * synth bass.
   */
  _buildDrone() {
    this.droneSum = new Tone.Gain(0.22);

    // A1 = 55 Hz fundamental, one voice detuned ±7 cents for chorus beating,
    // plus E2 (55 × 1.5) — the open fifth that Gyuto chant sits on.
    this.droneOscs = [
      new Tone.Oscillator({ frequency: 55.0, type: 'sawtooth', detune: -7 }),
      new Tone.Oscillator({ frequency: 55.0, type: 'sawtooth', detune: +7 }),
      new Tone.Oscillator({ frequency: 82.5, type: 'sawtooth', detune: +3 }),
      new Tone.Oscillator({ frequency: 110.0, type: 'sine' }), // octave, steadies the pitch
    ];
    this.droneOscs.forEach((o) => { o.connect(this.droneSum); o.start(); });

    // The FM voice supplies the rasp. Non-integer harmonicity keeps it from
    // locking into a clean harmonic and sounding like a bass patch.
    this.droneFM = new Tone.FMOscillator({
      frequency: 55, type: 'sine', modulationType: 'square',
      harmonicity: 1.503, modulationIndex: 2.6,
    }).start();
    this.droneFMGain = new Tone.Gain(0.10).connect(this.droneSum);
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
      frequency: 0.32, delayTime: 6.5, depth: 0.4, spread: 180,
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
    this.bowlBus = new Tone.Gain(0.55).connect(this.master);
    this.bowlSend = new Tone.Gain(0.8).connect(this.send);
    this.bowlBus.connect(this.bowlSend);
    // Three voices: enough for one bowl to still be ringing under the next.
    this.bowls = [0, 1, 2].map(() => new BowlVoice(this.bowlBus));
  }

  _strikeBowl(freq, velocity) {
    const now = Tone.now() + 0.06;
    // Steal the voice that has been ringing longest.
    let voice = this.bowls[0];
    for (const v of this.bowls) if (v.busy < voice.busy) voice = v;
    voice.strike(freq, velocity, now);
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
      const synth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1.5, release: 0.25 },
        harmonicity: 8.5,      // wide, inharmonic — small struck brass
        modulationIndex: 26,
        resonance: 5200,
        octaves: 1.1,   // higher values push partials past 10 kHz and glare
        volume: -22,
      }).connect(pan);
      return { synth, pan };
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
  }

  // ── 4. CHAOS TEXTURE ────────────────────────────────────────────────
  /**
   * The sound of a mind that will not settle: brown noise through a slowly
   * swept resonant band (breath you cannot control), over two sines a
   * tritone apart. The tritone is deliberate — it is the one interval with
   * no root, so the ear can never decide where the floor is.
   */
  _buildChaos() {
    this.chaosBus = new Tone.Gain(0).connect(this.master);
    this.chaosSend = new Tone.Gain(0.5).connect(this.send);
    this.chaosBus.connect(this.chaosSend);

    this.windBP = new Tone.Filter({ type: 'bandpass', frequency: 0, Q: 2.4 });
    this.windLFO = new Tone.LFO({ frequency: 0.055, min: 180, max: 900 }).start();
    this.windLFO.connect(this.windBP.frequency);

    this.windPan = new Tone.AutoPanner({ frequency: 0.07, depth: 0.85 }).start();
    this.noise = new Tone.Noise('brown').start();
    this.noiseGain = new Tone.Gain(0.9);
    this.noise.chain(this.windBP, this.noiseGain, this.windPan, this.chaosBus);

    // 58.0 and 82.1 Hz — a ratio of 1.4155, ~594 cents. Rootless.
    this.hollowA = new Tone.Oscillator({ frequency: 58.0, type: 'sine' }).start();
    this.hollowB = new Tone.Oscillator({ frequency: 82.1, type: 'sine' }).start();
    this.hollowGain = new Tone.Gain(0.16).connect(this.chaosBus);
    this.hollowA.connect(this.hollowGain);
    this.hollowB.connect(this.hollowGain);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Per-frame update. `m` carries only scalars.
  // ─────────────────────────────────────────────────────────────────────

  /**
   * @param {object} m
   *   cohesion, goldIndex, edaNorm — 0..1
   *   respPhase                    — 1 inhale / -1 exhale / 0 erratic
   *   dt                           — seconds since last frame
   */
  update(m) {
    if (!this.ready || this.muted) return;
    const { cohesion, goldIndex, edaNorm, respPhase, dt } = m;

    // ── Breath → drone. Only re-ramp on an actual phase CHANGE. ────────
    if (respPhase !== this._lastPhase) {
      this._lastPhase = respPhase;
      if (respPhase === 1) {
        // INHALE — open the valve, let the overtones bloom, narrow the image.
        this.droneFilter.frequency.rampTo(lerp(520, 1500, cohesion), 2.2);
        this.chorus.depth = 0.22;
        this.widener.width.rampTo(0.34, 2.2);
        this.droneOut.gain.rampTo(lerp(0.45, 0.72, cohesion), 2.2);
      } else if (respPhase === -1) {
        // EXHALE — close the valve, but widen and deepen: the sound stops
        // getting brighter and starts getting *bigger*. Reads as release.
        this.droneFilter.frequency.rampTo(lerp(180, 320, cohesion), 3.0);
        this.chorus.depth = 0.85;
        this.widener.width.rampTo(0.95, 3.0);
        this.droneOut.gain.rampTo(lerp(0.40, 0.62, cohesion), 3.0);
      } else {
        // ERRATIC — the drone loses its centre.
        this.droneFilter.frequency.rampTo(340, 1.2);
        this.chorus.depth = 0.6;
        this.widener.width.rampTo(0.6, 1.2);
        this.droneOut.gain.rampTo(0.34, 1.2);
      }
    }

    // ── Throttled continuous params ───────────────────────────────────
    this._paramT += dt;
    if (this._paramT > 1 / 12) {
      this._paramT = 0;

      // Chaos crossfade. `edaNorm > 0.6` per spec — normalised, i.e. EDA 6/10.
      const chaosWanted = edaNorm > 0.6;
      const chaosAmt = clamp((edaNorm - 0.55) / 0.45);
      this.chaosBus.gain.rampTo(chaosAmt * 0.5, 2.5);
      this.windLFO.frequency.rampTo(lerp(0.04, 0.14, edaNorm), 3);

      if (chaosWanted !== this._chaosOn) {
        this._chaosOn = chaosWanted;
        // Mute the pure bowls under turbulence — a clean bowl would read as
        // resolution, and nothing has resolved.
        this.bowlBus.gain.rampTo(chaosWanted ? 0.0 : 0.55, 3.0);
      }

      // The drone thins out as the mind scatters.
      this.droneFMGain.gain.rampTo(lerp(0.05, 0.16, cohesion), 2);
      this.chimeBus.gain.rampTo(lerp(0.25, 0.85, goldIndex), 2);
    }

    // ── Singing bowl: struck on entering deep calm ────────────────────
    // Hysteresis (arm at 0.62, fire at 0.70) stops a sensor hovering on the
    // threshold from machine-gunning the bowl.
    const now = Tone.now();
    if (cohesion < 0.62) this._bowlArmed = true;

    if (!this._chaosOn && cohesion > 0.7 && now > this._bowlNext) {
      const sustained = !this._bowlArmed;
      // Deeper calm reaches for a deeper bowl.
      const want = Math.round(lerp(BOWL_NOTES.length - 1, 0, clamp((cohesion - 0.7) / 0.3)));
      this._bowlIdx = sustained ? Math.round(lerp(this._bowlIdx, want, 0.5)) : want;

      // Struck softly on arrival, softer still on each return.
      this._strikeBowl(BOWL_NOTES[this._bowlIdx], sustained ? 0.42 : 0.62);
      this._bowlArmed = false;
      // Re-strike every 14–22 s while the calm holds.
      this._bowlNext = now + lerp(22, 14, cohesion) + Math.random() * 4;
    }

    // ── Chimes: sparse, organic, only at high HRV ──────────────────────
    if (goldIndex > 0.8) {
      // Rate rises steeply across the last fifth of the gold index.
      const intensity = clamp((goldIndex - 0.8) / 0.2);
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
        if (Math.random() < 0.28) {
          this._gustLeft = 2 + ((Math.random() * 3) | 0);
          this._gustGap = 0.5;
          this._chimeTimer = 0;
        } else {
          this._triggerChime(pickChime(), lerp(0.18, 0.5, Math.random()) * intensity);
          this._chimeTimer = restInterval(intensity);
        }
      }
    } else {
      this._gustLeft = 0;
      this._chimeTimer = 1.5;
    }
  }

  setMuted(v) {
    this.muted = v;
    if (this.ready) this.master.gain.rampTo(v ? 0 : 0.9, 0.6);
  }
}

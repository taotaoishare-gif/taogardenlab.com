/**
 * app.js — Orchestrator
 * ─────────────────────────────────────────────────────────────────────────
 * The only module that knows all three others exist. It owns the frame loop
 * and the DOM, and it passes NOTHING between subsystems except plain
 * numbers: sensor.js produces scalars, visuals.js and audio.js consume them.
 * No Three.js object and no Tone.js node ever crosses this file's borders.
 *
 *      sliders / guided arc → SensorEngine → { cohesion, goldIndex, … }
 *                                                 ├→ VisualEngine (uniforms)
 *                                                 └→ AudioEngine  (params)
 */

import { SensorEngine, SensorData, SOURCE, clamp, lerp } from './sensor.js';
import { VisualEngine } from './visuals.js';
import { AudioEngine } from './audio.js';
import { BleSensor } from './ble.js';

const $ = (id) => document.getElementById(id);

const sensor = new SensorEngine();
const visuals = new VisualEngine($('stage'));
const audio = new AudioEngine();
const ble = new BleSensor();

let running = false;
let last = performance.now();
let guided = false;
let guidedT = 0;

// ─────────────────────────────────────────────────────────────────────────
// Calibration sliders → sensor.mockUpdate()
// ─────────────────────────────────────────────────────────────────────────

const S = {
  breath: $('sBreath'), depth: $('sDepth'), eda: $('sEda'),
  hrv: $('sHrv'), hr: $('sHr'),
};

/** Reads the sliders and pushes them into the model. */
function pushSliders() {
  sensor.mockUpdate({
    breath: +S.breath.value,
    depth: +S.depth.value,
    eda: +S.eda.value,
    hrv: +S.hrv.value,
    hr: +S.hr.value,
  });
  const t = sensor.targets;
  $('lbBreath').textContent = t.breathRate.toFixed(1) + ' / min';
  $('lbDepth').textContent = t.breathDepth.toFixed(2);
  $('lbEda').textContent = t.eda.toFixed(2);
  $('lbHrv').textContent = t.hrvCapacity.toFixed(2);
  $('lbHr').textContent = Math.round(t.hr) + ' bpm';
}

for (const el of Object.values(S)) {
  el.addEventListener('input', () => {
    if (guided) setGuided(false); // touching a slider takes back control
    pushSliders();
  });
}

$('sWin').addEventListener('input', (e) => {
  sensor.rmssdBeats = +e.target.value;
  $('lbWin').textContent = e.target.value + ' beats';
});

// ─────────────────────────────────────────────────────────────────────────
// Guided arc — the demo path
// ─────────────────────────────────────────────────────────────────────────
/**
 * A scripted 200-second descent from agitation into samādhi, for showing
 * the piece without a body attached. Keyframes are slider-space (0..1) and
 * are eased with a smoothstep so the sand never lurches between stages.
 *
 * The last stage does not reach a perfect 1.0 anywhere: the chedi should
 * arrive at gold, not sit parked at it.
 */
const ARC = [
  //  t(s)  breath  depth   eda    hrv     hr     name
  { t:   0, breath: .10, depth: .30, eda: .78, hrv: .30, hr: .66, cn: '心 浮', en: 'Agitated' },
  { t:  38, breath: .34, depth: .48, eda: .58, hrv: .42, hr: .55, cn: '渐 息', en: 'Settling' },
  { t:  92, breath: .62, depth: .70, eda: .32, hrv: .62, hr: .40, cn: '调 息', en: 'Coherent' },
  { t: 152, breath: .82, depth: .88, eda: .13, hrv: .84, hr: .27, cn: '入 定', en: 'Absorbed' },
  // 0.88 on the breath slider lands on 5.48 breaths/min — the resonance
  // frequency, where RSA and therefore goldIndex peak.
  { t: 205, breath: .88, depth: .96, eda: .05, hrv: .95, hr: .20, cn: '寂 照', en: 'Samadhi' },
];

function runGuided(dt) {
  guidedT += dt;
  const T = Math.min(guidedT, ARC[ARC.length - 1].t);

  let i = 0;
  while (i < ARC.length - 2 && T > ARC[i + 1].t) i++;
  const a = ARC[i], b = ARC[i + 1];
  let u = clamp((T - a.t) / (b.t - a.t));
  u = u * u * (3 - 2 * u); // smoothstep

  for (const k of ['breath', 'depth', 'eda', 'hrv', 'hr']) {
    S[k].value = lerp(a[k], b[k], u);
  }
  pushSliders();
}

function setGuided(on) {
  guided = on;
  guidedT = 0;
  $('tgGuided').classList.toggle('on', on);
}

$('tgGuided').addEventListener('click', () => setGuided(!guided));
$('tgAudio').addEventListener('click', () => {
  const on = !$('tgAudio').classList.contains('on');
  $('tgAudio').classList.toggle('on', on);
  audio.setMuted(!on);
});

// ─────────────────────────────────────────────────────────────────────────
// Bluetooth chest strap
// ─────────────────────────────────────────────────────────────────────────

/**
 * Which calibration sliders the hardware takes over. Breath rate, depth, HRV
 * capacity and resting HR all become measurements once a strap is on, so
 * they are disabled rather than left looking live. EDA stays editable — no
 * standard GATT service carries it, so unless a GSR rig is attached it
 * genuinely is a manual value.
 */
const LIVE_OVERRIDES = ['breath', 'depth', 'hrv', 'hr'];

function setSliderLock(locked) {
  for (const key of LIVE_OVERRIDES) {
    S[key].disabled = locked;
    S[key].closest('.ctl').style.opacity = locked ? 0.32 : 1;
  }
}

function showBleStatus(state, detail) {
  const el = $('bleStatus');
  const live = state === 'live';
  const label = {
    idle: 'SIMULATED', connecting: 'CONNECTING', live: 'LIVE',
    lost: 'RECONNECTING', error: 'UNAVAILABLE',
  }[state] || state.toUpperCase();

  const bits = [`SOURCE <span>${label}</span>`];
  if (detail) bits.push(detail.toUpperCase());
  if (live && ble.battery != null) bits.push(`BATTERY <span>${ble.battery}%</span>`);
  if (live && !ble.rrSupported) bits.push('<span>NO RR — HRV UNAVAILABLE</span>');
  if (SensorData.stale) bits.push('<span>SIGNAL LOST</span>');
  el.innerHTML = bits.join('<br>');

  $('tgBle').classList.toggle('on', live);
  $('tgBle').textContent = live || state === 'lost'
    ? '断开 · Disconnect'
    : '连接心率带 · Connect';
}

ble.onBeat = (rrMs, atMs) => sensor.pushBeat(rrMs, atMs);
ble.onEda = (v) => sensor.pushEda(v);
ble.onStatus = (state, detail) => {
  if (state === 'live') {
    setGuided(false);          // a real body overrides the scripted arc
    sensor.setSource(SOURCE.LIVE);
    setSliderLock(true);
  } else if (state === 'idle' || state === 'error') {
    sensor.setSource(SOURCE.MOCK);
    setSliderLock(false);
  }
  showBleStatus(state, detail);
};

$('tgBle').addEventListener('click', async () => {
  if (ble.state === 'live' || ble.state === 'lost') { ble.disconnect(); return; }
  try {
    await ble.connect();
  } catch (err) {
    // connect() already pushed a status; nothing to add but the console trail.
    console.warn('[ble]', err?.message || err);
  }
});

// Surface the "unsupported browser" case up front rather than on click.
if (BleSensor.blockedReason) {
  showBleStatus('error', BleSensor.blockedReason);
  $('tgBle').disabled = true;
  $('tgBle').style.opacity = 0.4;
} else {
  showBleStatus('idle');
}

// ─────────────────────────────────────────────────────────────────────────
// Debug graphs
// ─────────────────────────────────────────────────────────────────────────

const GRAPHS = [
  { cv: $('cvHr'),   ring: () => sensor.history.hr,    lo: 45,   hi: 110, col: '#d8b169' },
  { cv: $('cvHrv'),  ring: () => sensor.history.rmssd, lo: 0,    hi: 100, col: '#7fc9a8' },
  { cv: $('cvResp'), ring: () => sensor.history.resp,  lo: -1.1, hi: 1.1, col: '#c8ab7e' },
];

function sizeGraphs() {
  const dpr = Math.min(devicePixelRatio, 2);
  for (const g of GRAPHS) {
    const r = g.cv.getBoundingClientRect();
    if (!r.width) continue;
    g.cv.width = r.width * dpr;
    g.cv.height = r.height * dpr;
    g.ctx = g.cv.getContext('2d');
    g.ctx.scale(dpr, dpr);
    g.w = r.width;
    g.h = r.height;
  }
}

function drawGraphs() {
  for (const g of GRAPHS) {
    if (!g.ctx) continue;
    const { ctx, w, h } = g;
    ctx.clearRect(0, 0, w, h);

    // midline
    ctx.strokeStyle = 'rgba(232,220,198,.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    const ring = g.ring();
    if (ring.count < 2) continue;

    ctx.strokeStyle = g.col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ring.forEach((v, k) => {
      const x = (k / (ring.n - 1)) * w;
      const y = h - clamp((v - g.lo) / (g.hi - g.lo)) * (h - 3) - 1.5;
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────────────────────────

/** Reading of the sand's condition, driven by the two drive metrics. */
function stateName(cohesion, gold) {
  if (cohesion > 0.82 && gold > 0.78) return ['寂 照', 'Samadhi'];
  if (cohesion > 0.78) return ['鎏 金', 'Gilding'];
  if (cohesion > 0.58) return ['成 塔', 'Rising'];
  if (cohesion > 0.36) return ['凝 聚', 'Gathering'];
  return ['风 沙', 'Scattered'];
}

let fps = 60;
let hudT = 0;

function updateHud(dt) {
  const d = SensorData;

  $('barCohesion').firstElementChild.style.width = (d.cohesion * 100).toFixed(1) + '%';
  $('barGold').firstElementChild.style.width = (d.goldIndex * 100).toFixed(1) + '%';
  $('valCohesion').textContent = d.cohesion.toFixed(2);
  $('valGold').textContent = d.goldIndex.toFixed(2);

  const [cn, en] = stateName(d.cohesion, d.goldIndex);
  if ($('stateCn').textContent !== cn) {
    $('stateCn').textContent = cn;
    $('stateEn').textContent = en;
  }

  // Breath guide ring — scales with the actual respiration wave.
  const s = 0.62 + (d.respWave * 0.5 + 0.5) * 0.72;
  const ring = $('breathRing');
  ring.style.transform = `scale(${s.toFixed(3)})`;
  ring.style.borderColor =
    d.respPhase === 1 ? 'rgba(216,177,105,.75)'
    : d.respPhase === -1 ? 'rgba(127,201,168,.55)'
    : 'rgba(232,220,198,.18)';
  // "Erratic" would be a lie while a live strap is still learning the breath,
  // and "signal lost" is not the same statement as "your breathing is ragged".
  $('breathTxt').textContent =
    d.stale ? '失 联 · Signal lost'
    : d.warmup ? '校 准 · Calibrating'
    : d.respPhase === 1 ? '入 息 · Inhale'
    : d.respPhase === -1 ? '出 息 · Exhale'
    : '散 · Erratic';

  // Panel readouts at 6 Hz — cheap, but no reason to hammer the DOM.
  hudT += dt;
  if (hudT > 1 / 6) {
    hudT = 0;
    $('gvHr').textContent = d.hr.toFixed(1) + ' bpm';
    $('gvHrv').textContent = d.rmssd.toFixed(1) + ' ms';
    $('gvResp').textContent = d.respRate.toFixed(1) + ' / min';
    $('roFps').textContent = fps.toFixed(0);
    $('roPhase').textContent = d.respPhase === 1 ? 'INHALE' : d.respPhase === -1 ? 'EXHALE' : 'ERRATIC';
    $('roScore').textContent = d.respDepthScore.toFixed(3);
    $('roBeats').textContent = d.beats;
    // Staleness and battery drift without a status event, so refresh here.
    if (d.source === SOURCE.LIVE) showBleStatus(ble.state, ble.device?.name);
    drawGraphs();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Frame loop
// ─────────────────────────────────────────────────────────────────────────

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (!running || dt <= 0) return;

  fps = lerp(fps, 1 / dt, 0.06);

  if (guided) runGuided(dt);

  // 1 ── physiology
  const d = sensor.update(dt);

  // 2 ── graphics: cohesion and goldIndex become shader uniforms
  visuals.update(dt, {
    cohesion: d.cohesion,
    goldIndex: d.goldIndex,
    edaNorm: d.edaNorm,
    respWave: d.respWave,
  });

  // 3 ── audio: the same scalars drive filters, strikes and chime density
  audio.update({
    cohesion: d.cohesion,
    goldIndex: d.goldIndex,
    edaNorm: d.edaNorm,
    respPhase: d.respPhase,
    dt,
  });

  // 4 ── interface
  updateHud(dt);
}

// ─────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────

$('begin').addEventListener('click', () => {
  const btn = $('begin');
  if (btn.disabled) return;
  btn.disabled = true;

  // Lift the veil and start rendering FIRST. Building the reverb impulse
  // response takes a moment, and on a locked-down machine the audio graph
  // may never come up at all — neither may be allowed to hold the piece
  // behind a black screen in a gallery.
  $('veil').classList.add('gone');
  setGuided(true);   // arrive already breathing; the sitter can take over
  running = true;
  last = performance.now();

  // Tone's AudioContext may only be resumed from inside a user gesture, so
  // start() must be *called* here even though we do not wait on it.
  audio.start().catch((err) => {
    console.error('[audio] failed to start:', err);
    $('tgAudio').classList.remove('on');
  });
});

$('panelBtn').addEventListener('click', () => $('panel').classList.toggle('open'));

addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') $('panel').classList.toggle('open');
  if (e.key === 'g' || e.key === 'G') setGuided(!guided);
});

function relayout() { visuals.resize(); sizeGraphs(); }

addEventListener('resize', relayout);
// Mobile browsers report stale dimensions during an orientation flip and
// again as the address bar collapses, so re-measure once things settle.
addEventListener('orientationchange', () => {
  relayout();
  setTimeout(relayout, 350);
});
window.visualViewport?.addEventListener('resize', relayout);

// Silence and freeze when the tab goes away, so a backgrounded installation
// does not keep a drone running into an empty room.
addEventListener('visibilitychange', () => {
  if (!audio.ready) return;
  audio.setMuted(document.hidden || !$('tgAudio').classList.contains('on'));
});

sizeGraphs();
pushSliders();
$('roCount').textContent = visuals.particleCount.toLocaleString();
requestAnimationFrame(frame);

// Dev hook.
window.__sadhana = {
  sensor, visuals, audio, ble, SensorData,
  guided: setGuided,
  /** Force the drive metrics directly, bypassing the model. */
  force(cohesion, gold) {
    sensor._cohesion = cohesion;
    sensor._goldIndex = gold;
  },
  /**
   * Repaint HUD and graphs once. rAF is suspended whenever the tab is
   * hidden, which is exactly when an automated check wants to look at the
   * panel, so the redraw has to be callable on its own.
   */
  redraw() { hudT = 1; updateHud(0); },
};

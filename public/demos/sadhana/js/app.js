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

import { SensorEngine, SensorData, SOURCE, clamp, lerp, calibrateTo } from './sensor.js';
import { VisualEngine } from './visuals.js';
import { AudioEngine } from './audio.js?v=20260825-audio3';
import { BreathGuide } from './breath-guide.js?v=20260825-audio3';
import { WearableHub, TRANSPORT } from './wearables.js?v=20260825-pairing2';

// Personal baseline from the existing installation calibration. Set to null
// for an anonymous public kiosk, or provide a session baseline dynamically.
const RESTING_RMSSD_MS = 45.3;
if (RESTING_RMSSD_MS) {
  const ceiling = calibrateTo(RESTING_RMSSD_MS);
  console.info(`[sand-to-stupa] gold ceiling ${ceiling} ms (resting ${RESTING_RMSSD_MS} ms)`);
}

const $ = (id) => document.getElementById(id);

const sensor = new SensorEngine();
const visuals = new VisualEngine($('stage'));
const audio = new AudioEngine();
const wearables = new WearableHub();
const breathGuide = new BreathGuide(4, 6); // 6 breaths/min; longer exhale

let running = false;
let last = performance.now();
let guided = false;
let guidedT = 0;
let breathCue = breathGuide.state;

// ─────────────────────────────────────────────────────────────────────────
// Language — one language at a time, never mixed labels
// ─────────────────────────────────────────────────────────────────────────

const COPY = {
  zh: {
    documentTitle: '聚沙成塔',
    title: '聚沙成塔', hudKicker: '呼吸 · 脉动 · 成塔',
    cohesion: '聚合度', goldIndex: '金色指数',
    interactionHint: '拖动旋转 · 滚轮靠近<br>D — 打开仪表面板', panel: '面板',
    wearableEyebrow: '实时生物反馈', pairWearables: '接入可穿戴设备',
    wearableConnected: '可穿戴设备已接入', disconnect: '断开设备',
    recommendedDevices: '💡 推荐设备：支持心率带、智能手环、智能戒指、Apple Watch等支持标准蓝牙/健康协议的穿戴设备。',
    publicAvailability: '当前公开版：标准蓝牙心率设备可直接配对；Apple Watch/健康平台伴侣应用尚未公开。',
    signals: '生理信号', heartRate: '心率', hrv: '心率变异性 · RMSSD', respiration: '呼吸',
    calibration: '模拟与校准', breathRate: '呼吸频率', breathDepth: '呼吸深度',
    stressEda: '压力 · EDA', hrvCapacity: 'HRV 潜能', restingHr: '静息心率', rmssdWindow: 'RMSSD 窗口',
    mode: '模式', guided: '引导演示', audio: '声音', diagnostics: '诊断信息',
    fps: '帧率', particles: '粒子数', respPhase: '呼吸相位', respScore: '呼吸评分', beats: '心搏数',
    pairTitle: '选择接入方式', pairCopy: '选择你的设备能够使用的健康数据通道。',
    standardBluetooth: '标准蓝牙',
    standardBluetoothDesc: '适用于广播标准心率服务的心率带、手环与戒指；请使用 Android/Windows/macOS 上的 Chrome 或 Edge。',
    companionApp: '伴侣应用 / 健康协议',
    companionAppDesc: '适用于 Apple Watch、HealthKit、Health Connect 及厂商封闭设备；当前公开版未提供伴侣应用。',
    pairTruth: '真实可用范围：公开网页现在只能直连广播标准 Heart Rate Service 的蓝牙设备。',
    bluetoothReadyBadge: '可直接配对', bluetoothUnavailableBadge: '当前不可用',
    companionReadyBadge: '桥接可用', companionUnavailableBadge: '尚未开放',
    veilSub: '呼吸生物反馈冥想', poem: '息 深 则 沙 聚<br>脉 和 则 塔 金',
    begin: '开始静心', beginHint: '点击后开启声音',
    veilNote: '建议佩戴耳机 · 点击后开启声音<br><span class="only-touch">拖动旋转 · 双指捏合靠近<br></span>默认使用模拟生理信号 · 不调用摄像头或麦克风',
    stateSamadhi: '寂 照', stateGilding: '鎏 金', stateRising: '成 塔', stateGathering: '凝 聚', stateScattered: '风 沙',
    signalLost: '失 联', calibrating: '校 准', inhale: '入 息', exhale: '出 息', erratic: '散 乱',
    phaseInhale: '吸气', phaseExhale: '呼气', phaseErratic: '散乱',
    source: '数据源', simulated: '模拟', live: '实时', connecting: '连接中', waiting: '等待数据',
    reconnecting: '重新连接', unavailable: '不可用', battery: '电量', hrvUnavailable: '无 HRV 数据',
    respirationUnavailable: '无连续呼吸数据', transportBluetooth: '标准蓝牙', transportCompanion: '伴侣应用',
    rateUnit: '次/分', bpmUnit: '次/分', msUnit: '毫秒', beatsUnit: '拍',
    langAria: 'Switch to English', close: '关闭',
    detail_bluetooth_ready: '此浏览器支持直连。请先佩戴并唤醒心率带，关闭其他占用设备的 App，再点击进入系统选择器。',
    detail_select_device: '正在打开系统蓝牙设备选择器…',
    detail_cancelled: '未选择设备。请确认胸带已佩戴、电极已湿润且未被其他 App 占用。',
    detail_pair_failed: '配对失败，请重新唤醒设备后再试。',
    detail_bluetooth_unavailable: '当前浏览器没有 Web Bluetooth。请复制本页地址，用 Android/Windows/macOS 上的 Chrome 或 Edge 打开；iPhone/iPad 无法网页直连。',
    detail_secure_context_required: '蓝牙需要 HTTPS 或 localhost', detail_waiting_companion: '等待伴侣应用发送健康数据',
    detail_bluetooth_permission_denied: '蓝牙权限被拒绝。请在浏览器或系统设置中允许蓝牙访问后重试。',
    detail_bluetooth_connection_failed: '已选中设备，但无法打开心率数据。请关闭厂商 App/其他手机连接，然后重启胸带。',
    detail_bluetooth_busy: '浏览器正在处理另一个蓝牙请求，请关闭其它配对窗口后重试。',
    detail_gatt_unavailable: '该设备未向网页提供可连接的 GATT 心率服务。',
    detail_companion_unavailable: '伴侣应用/健康桥尚未在公开版提供；此按钮不再伪装成已连接。',
    detail_opening_bridge: '正在打开健康数据桥', detail_waiting_data: '健康桥已连接，等待数据',
    detail_bridge_url_invalid: '健康桥地址无效', detail_bridge_failed: '健康桥连接失败', detail_bridge_closed: '健康桥已断开',
    detail_opening_bluetooth: '正在连接蓝牙设备', detail_contact_lost: '请确认设备已正确佩戴',
    detail_heart_rate_only: '已接收心率；设备未提供 HRV', detail_reconnecting: '正在重新连接设备',
    detail_sensor_lost: '设备连接已丢失', detail_disconnected: '未接入设备',
  },
  en: {
    documentTitle: 'Sand to Stupa',
    title: 'Sand to Stupa', hudKicker: 'BREATH · PULSE · FORM',
    cohesion: 'Cohesion', goldIndex: 'Gold Index',
    interactionHint: 'Drag to orbit · Scroll to approach<br>D — open instrument panel', panel: 'Panel',
    wearableEyebrow: 'Live Biofeedback', pairWearables: 'Pair Wearables',
    wearableConnected: 'Wearable Connected', disconnect: 'Disconnect Device',
    recommendedDevices: '💡 Recommended Devices: Supports smart bands, heart rate monitors, smart rings, and Apple Watch (via companion app) compatible with standard Bluetooth or Health integration protocols.',
    publicAvailability: 'Public build today: standard Bluetooth heart-rate devices can pair directly; the Apple Watch / Health companion app is not yet released.',
    signals: 'Physiological Signals', heartRate: 'Heart Rate', hrv: 'Heart Rate Variability · RMSSD', respiration: 'Respiration',
    calibration: 'Simulation & Calibration', breathRate: 'Breath Rate', breathDepth: 'Breath Depth',
    stressEda: 'Stress · EDA', hrvCapacity: 'HRV Capacity', restingHr: 'Resting Heart Rate', rmssdWindow: 'RMSSD Window',
    mode: 'Mode', guided: 'Guided', audio: 'Audio', diagnostics: 'Diagnostics',
    fps: 'FPS', particles: 'Particles', respPhase: 'Respiration Phase', respScore: 'Respiration Score', beats: 'Beats',
    pairTitle: 'Choose a Connection', pairCopy: 'Select the health-data path available to your device.',
    standardBluetooth: 'Standard Bluetooth',
    standardBluetoothDesc: 'For devices broadcasting the standard Heart Rate Service. Use Chrome or Edge on Android, Windows, or macOS.',
    companionApp: 'Companion App / Health Integration',
    companionAppDesc: 'For Apple Watch, HealthKit, Health Connect, and vendor-locked devices. The public companion app is not yet available.',
    pairTruth: 'Actual availability: this public webpage currently connects only to Bluetooth devices that advertise the standard Heart Rate Service.',
    bluetoothReadyBadge: 'Direct pairing ready', bluetoothUnavailableBadge: 'Unavailable here',
    companionReadyBadge: 'Bridge detected', companionUnavailableBadge: 'Not released',
    veilSub: 'A Biofeedback Meditation',
    poem: 'With each deep breath, sand gathers<br>With each steady pulse, the stupa turns gold',
    begin: 'Begin Meditation', beginHint: 'Sound begins after this gesture',
    veilNote: 'Headphones recommended · Sound begins on entry<br><span class="only-touch">Drag to orbit · Pinch to approach<br></span>Simulated biosignals by default · No camera or microphone',
    stateSamadhi: 'Stillness', stateGilding: 'Gilding', stateRising: 'Stupa Rising', stateGathering: 'Gathering', stateScattered: 'Scattered',
    signalLost: 'Signal Lost', calibrating: 'Calibrating', inhale: 'Inhale', exhale: 'Exhale', erratic: 'Erratic',
    phaseInhale: 'Inhale', phaseExhale: 'Exhale', phaseErratic: 'Erratic',
    source: 'Source', simulated: 'Simulated', live: 'Live', connecting: 'Connecting', waiting: 'Waiting for Data',
    reconnecting: 'Reconnecting', unavailable: 'Unavailable', battery: 'Battery', hrvUnavailable: 'HRV unavailable',
    respirationUnavailable: 'Continuous respiration unavailable', transportBluetooth: 'Standard Bluetooth', transportCompanion: 'Companion App',
    rateUnit: '/ min', bpmUnit: 'bpm', msUnit: 'ms', beatsUnit: 'beats',
    langAria: '切换至中文', close: 'Close',
    detail_bluetooth_ready: 'Direct pairing is supported here. Wear and wake the monitor, close any app already using it, then open the system device chooser.',
    detail_select_device: 'Opening the system Bluetooth device chooser…',
    detail_cancelled: 'No device was selected. Ensure the monitor is worn, its electrodes are moist, and no other app is using it.',
    detail_pair_failed: 'Pairing failed. Wake the device and try again.',
    detail_bluetooth_unavailable: 'This browser has no Web Bluetooth. Open this URL in Chrome or Edge on Android, Windows, or macOS. iPhone and iPad cannot pair directly from a webpage.',
    detail_secure_context_required: 'Bluetooth requires HTTPS or localhost', detail_waiting_companion: 'Waiting for health data from the companion app',
    detail_bluetooth_permission_denied: 'Bluetooth permission was denied. Allow Bluetooth for the browser in browser or system settings, then retry.',
    detail_bluetooth_connection_failed: 'The device was selected, but its heart-rate stream could not be opened. Disconnect vendor apps or other phones, then restart the monitor.',
    detail_bluetooth_busy: 'Another Bluetooth request is active. Close the other chooser and retry.',
    detail_gatt_unavailable: 'This device did not expose a connectable GATT heart-rate service to the webpage.',
    detail_companion_unavailable: 'The companion Health bridge is not shipped in this public build; this option no longer pretends to be connected.',
    detail_opening_bridge: 'Opening the health-data bridge', detail_waiting_data: 'Health bridge connected; waiting for data',
    detail_bridge_url_invalid: 'Invalid health bridge URL', detail_bridge_failed: 'Health bridge connection failed', detail_bridge_closed: 'Health bridge disconnected',
    detail_opening_bluetooth: 'Opening the Bluetooth connection', detail_contact_lost: 'Check that the device is being worn correctly',
    detail_heart_rate_only: 'Heart rate received; this device does not provide HRV', detail_reconnecting: 'Reconnecting the wearable',
    detail_sensor_lost: 'Wearable connection lost', detail_disconnected: 'No wearable connected',
  },
};

let language = (() => {
  try { return localStorage.getItem('sand-to-stupa-language') || (navigator.language.startsWith('zh') ? 'zh' : 'en'); }
  catch { return 'zh'; }
})();
if (!COPY[language]) language = 'zh';
const t = (key) => COPY[language][key] ?? key;

function applyLanguage(next) {
  language = COPY[next] ? next : 'zh';
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = t('documentTitle');
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const copy = t(el.dataset.i18n);
    if (copy !== undefined) el.textContent = copy;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const copy = t(el.dataset.i18nHtml);
    if (copy !== undefined) el.innerHTML = copy;
  });
  $('langBtn').textContent = language === 'zh' ? 'EN' : '中文';
  $('langBtn').setAttribute('aria-label', t('langAria'));
  $('pairClose').setAttribute('aria-label', t('close'));
  if ($('sWin')) $('lbWin').textContent = $('sWin').value + ' ' + t('beatsUnit');
  if ($('bluetoothBadge')) updatePairingSupport();
  if ($('pairFeedback')?.classList.contains('visible') && pairFeedbackCode) {
    setPairFeedback(pairFeedbackCode, pairFeedbackTone);
  }
  try { localStorage.setItem('sand-to-stupa-language', language); } catch { /* kiosk storage may be disabled */ }
}

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
  $('lbBreath').textContent = t.breathRate.toFixed(1) + ' ' + COPY[language].rateUnit;
  $('lbDepth').textContent = t.breathDepth.toFixed(2);
  $('lbEda').textContent = t.eda.toFixed(2);
  $('lbHrv').textContent = t.hrvCapacity.toFixed(2);
  $('lbHr').textContent = Math.round(t.hr) + ' ' + COPY[language].bpmUnit;
}

for (const el of Object.values(S)) {
  el.addEventListener('input', () => {
    if (guided) setGuided(false); // touching a slider takes back control
    pushSliders();
  });
}

$('sWin').addEventListener('input', (e) => {
  sensor.rmssdBeats = +e.target.value;
  $('lbWin').textContent = e.target.value + ' ' + t('beatsUnit');
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
  if (on) breathCue = breathGuide.reset();
  $('tgGuided').classList.toggle('on', on);
}

$('tgGuided').addEventListener('click', () => setGuided(!guided));
$('tgAudio').addEventListener('click', () => {
  const on = !$('tgAudio').classList.contains('on');
  $('tgAudio').classList.toggle('on', on);
  audio.setMuted(!on);
});

// ─────────────────────────────────────────────────────────────────────────
// Consumer wearables — standard Bluetooth + companion Health bridge
// ─────────────────────────────────────────────────────────────────────────

/**
 * Which calibration sliders a live wearable takes over. EDA stays editable
 * unless an attached bridge actually supplies it; consumer health protocols
 * do not expose a universal EDA stream.
 */
const LIVE_OVERRIDES = ['breath', 'depth', 'hrv', 'hr'];
const companionSocketUrl = new URLSearchParams(location.search).get('wearableBridge') || undefined;
let pairFeedbackCode = '';
let pairFeedbackTone = 'info';

function setSliderLock(locked) {
  for (const key of LIVE_OVERRIDES) {
    S[key].disabled = locked;
    S[key].closest('.ctl').style.opacity = locked ? 0.32 : 1;
  }
}

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

function setPairFeedback(code, tone = 'info') {
  pairFeedbackCode = code;
  pairFeedbackTone = tone;
  const el = $('pairFeedback');
  const key = `detail_${code}`;
  el.textContent = t(key) === key ? t('detail_pair_failed') : t(key);
  el.dataset.tone = tone;
  el.classList.add('visible');
}

function updatePairingSupport() {
  const blocked = WearableHub.bluetoothBlockedCode;
  $('pairBluetooth').classList.toggle('unavailable', !!blocked);
  $('bluetoothBadge').textContent = t(blocked ? 'bluetoothUnavailableBadge' : 'bluetoothReadyBadge');

  const companionReady = !!companionSocketUrl || WearableHub.companionAvailable;
  $('pairCompanion').classList.toggle('unavailable', !companionReady);
  $('companionBadge').textContent = t(companionReady ? 'companionReadyBadge' : 'companionUnavailableBadge');
}

function setPairBusy(busy) {
  $('pairBluetooth').disabled = busy;
  $('pairCompanion').disabled = busy;
  $('pairClose').disabled = busy;
}

function showWearableStatus(state, detail = wearables.detail, detailCode = wearables.detailCode) {
  const el = $('wearableStatus');
  const live = state === 'live';
  const labelKey = {
    idle: 'simulated', connecting: 'connecting', waiting: 'waiting', live: 'live',
    lost: 'reconnecting', error: 'unavailable',
  }[state] || 'unavailable';

  const bits = [`${t('source')} <span>${t(labelKey)}</span>`];
  if (live && detail) bits.push(escapeHtml(detail));
  if (wearables.transport) {
    bits.push(`<span>${t(wearables.transport === TRANSPORT.BLUETOOTH ? 'transportBluetooth' : 'transportCompanion')}</span>`);
  }
  if (live && wearables.battery != null) bits.push(`${t('battery')} <span>${Math.round(wearables.battery)}%</span>`);
  if (live && !wearables.hrvSupported) bits.push(`<span>${t('hrvUnavailable')}</span>`);
  if (live && !wearables.respSupported && !wearables.rrSupported) bits.push(`<span>${t('respirationUnavailable')}</span>`);
  if (!live && detailCode && t(`detail_${detailCode}`) !== `detail_${detailCode}`) {
    bits.push(escapeHtml(t(`detail_${detailCode}`)));
  }
  if (SensorData.stale) bits.push(`<span>${t('signalLost')}</span>`);
  el.innerHTML = bits.join('<br>');

  $('wearablePair').classList.toggle('live', live);
  $('wearablePair').textContent = live ? t('wearableConnected') : t('pairWearables');
  $('wearableDisconnect').classList.toggle('visible', live || state === 'lost' || state === 'waiting');
}

wearables.onBeat = (rrMs, atMs) => sensor.pushBeat(rrMs, atMs);
wearables.onHeartRate = (bpm, atMs) => sensor.pushHeartRate(bpm, atMs);
wearables.onHrv = (rmssd, atMs) => sensor.pushHrv(rmssd, atMs);
wearables.onRespiration = (sample, atMs) => sensor.pushRespiration(sample, atMs);
wearables.onEda = (value, atMs) => sensor.pushEda(value, atMs);
wearables.onStatus = (state, detail, detailCode) => {
  if (state === 'live') {
    setGuided(false);          // a real body overrides the scripted arc
    sensor.setSource(SOURCE.LIVE);
    setSliderLock(true);
  } else if (state === 'idle' || state === 'error') {
    sensor.setSource(SOURCE.MOCK);
    setSliderLock(false);
  }
  showWearableStatus(state, detail, detailCode);
  if ($('pairSheet').classList.contains('open') && detailCode) {
    const tone = state === 'error' ? 'error' : state === 'live' ? 'success' : 'info';
    setPairFeedback(detailCode, tone);
  }
};

$('wearablePair').addEventListener('click', () => {
  updatePairingSupport();
  const blocked = WearableHub.bluetoothBlockedCode;
  setPairFeedback(blocked || 'bluetooth_ready', blocked ? 'error' : 'info');
  $('pairSheet').classList.add('open');
  $('pairSheet').setAttribute('aria-hidden', 'false');
});

function closePairSheet() {
  $('pairSheet').classList.remove('open');
  $('pairSheet').setAttribute('aria-hidden', 'true');
}

$('pairClose').addEventListener('click', closePairSheet);
$('pairSheet').addEventListener('click', (event) => {
  if (event.target === $('pairSheet')) closePairSheet();
});

$('pairBluetooth').addEventListener('click', async () => {
  setPairBusy(true);
  try {
    await wearables.pairBluetooth();
    closePairSheet();
  } catch (err) {
    if (wearables.detailCode === 'pair_failed') console.warn('[wearables]', err?.message || err);
  } finally {
    setPairBusy(false);
  }
});

$('pairCompanion').addEventListener('click', async () => {
  setPairBusy(true);
  try {
    await wearables.pairCompanion({ socketUrl: companionSocketUrl });
    closePairSheet();
  } catch (err) {
    if (wearables.detailCode !== 'companion_unavailable') console.warn('[wearables]', err?.message || err);
  } finally {
    setPairBusy(false);
  }
});

$('wearableDisconnect').addEventListener('click', () => wearables.disconnect());

// Never turn unsupported paths into dead buttons. A click now produces an
// explicit, actionable explanation in the pairing sheet.
updatePairingSupport();
showWearableStatus('idle', '', 'disconnected');

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
  if (cohesion > 0.82 && gold > 0.78) return 'stateSamadhi';
  if (cohesion > 0.78) return 'stateGilding';
  if (cohesion > 0.58) return 'stateRising';
  if (cohesion > 0.36) return 'stateGathering';
  return 'stateScattered';
}

let fps = 60;
let hudT = 0;

function updateHud(dt) {
  const d = SensorData;

  $('barCohesion').firstElementChild.style.width = (d.cohesion * 100).toFixed(1) + '%';
  $('barGold').firstElementChild.style.width = (d.goldIndex * 100).toFixed(1) + '%';
  $('valCohesion').textContent = d.cohesion.toFixed(2);
  $('valGold').textContent = d.goldIndex.toFixed(2);

  const state = t(stateName(d.cohesion, d.goldIndex));
  if ($('stateName').textContent !== state) $('stateName').textContent = state;

  // In guided mode this is the regular 4 s inhale / 6 s exhale cue. Outside
  // guided mode it returns to mirroring the participant's measured breath.
  const cueWave = guided ? breathCue.wave : d.respWave;
  const cuePhase = guided ? breathCue.phase : d.respPhase;
  const s = 0.62 + (cueWave * 0.5 + 0.5) * 0.72;
  const ring = $('breathRing');
  ring.style.transform = `scale(${s.toFixed(3)})`;
  ring.style.borderColor =
    cuePhase === 1 ? 'rgba(216,177,105,.75)'
    : cuePhase === -1 ? 'rgba(127,201,168,.55)'
    : 'rgba(232,220,198,.18)';
  // "Erratic" would be a lie while a live strap is still learning the breath,
  // and "signal lost" is not the same statement as "your breathing is ragged".
  $('breathTxt').textContent =
    guided ? (cuePhase === 1 ? t('inhale') : t('exhale'))
    : d.stale ? t('signalLost')
    : d.warmup ? t('calibrating')
    : d.respPhase === 1 ? t('inhale')
    : d.respPhase === -1 ? t('exhale')
    : t('erratic');

  // Panel readouts at 6 Hz — cheap, but no reason to hammer the DOM.
  hudT += dt;
  if (hudT > 1 / 6) {
    hudT = 0;
    $('gvHr').textContent = d.hr.toFixed(1) + ' ' + t('bpmUnit');
    $('gvHrv').textContent = d.rmssd.toFixed(1) + ' ' + t('msUnit');
    $('gvResp').textContent = d.respRate.toFixed(1) + ' ' + t('rateUnit');
    $('roFps').textContent = fps.toFixed(0);
    $('roPhase').textContent = d.respPhase === 1 ? t('phaseInhale') : d.respPhase === -1 ? t('phaseExhale') : t('phaseErratic');
    $('roScore').textContent = d.respDepthScore.toFixed(3);
    $('roBeats').textContent = d.beats;
    // Staleness and battery drift without a status event, so refresh here.
    if (d.source === SOURCE.LIVE) showWearableStatus(wearables.state, wearables.device?.name, wearables.detailCode);
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

  // A practice cue must not inherit an agitated sensor phase. Guided mode
  // supplies its own stable 4:6 cycle; manual/live modes follow the body.
  breathCue = guided
    ? breathGuide.update(dt)
    : { phase: d.respPhase, wave: d.respWave };

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
    respPhase: breathCue.phase,
    respWave: breathCue.wave,
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
$('langBtn').addEventListener('click', () => {
  applyLanguage(language === 'zh' ? 'en' : 'zh');
  pushSliders();
  showWearableStatus(wearables.state, wearables.device?.name, wearables.detailCode);
  hudT = 1;
  updateHud(0);
});

addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') $('panel').classList.toggle('open');
  if (e.key === 'g' || e.key === 'G') setGuided(!guided);
  if (e.key === 'Escape') closePairSheet();
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

applyLanguage(language);
showWearableStatus(wearables.state, wearables.device?.name, wearables.detailCode);
sizeGraphs();
pushSliders();
$('roCount').textContent = visuals.particleCount.toLocaleString();
hudT = 1;
updateHud(0);
requestAnimationFrame(frame);

// Dev hook.
window.__sandToStupa = {
  sensor, visuals, audio, wearables, SensorData,
  language: (next) => {
    if (next) applyLanguage(next);
    return language;
  },
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

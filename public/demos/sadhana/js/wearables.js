/**
 * wearables.js — consumer wearable integration
 * ────────────────────────────────────────────────────────────────────────
 * One transport-neutral adapter for two paths:
 *
 *   1. Standard Bluetooth Heart Rate Service (0x180D / 0x2A37)
 *      Heart-rate monitors and any band/ring that exposes the Bluetooth SIG
 *      profile can pair directly in Chromium.
 *
 *   2. Companion / Health bridge
 *      Apple Watch, HealthKit, Health Connect and vendor-locked rings/bands
 *      do not expose their health stream to a normal webpage. A companion
 *      app can forward standardised JSON through postMessage, a native
 *      WKWebView/Android bridge, or an optional WebSocket URL.
 *
 * This module knows nothing about the DOM, graphics or sound. It reports
 * measurements and connection state through callbacks.
 */

const HR_SERVICE = 'heart_rate';
const HR_MEASUREMENT = 'heart_rate_measurement';
const BATTERY_SERVICE = 'battery_service';
const BATTERY_LEVEL = 'battery_level';

// Optional DIY EDA/GSR transport. Consumer devices usually do not expose EDA.
const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const RR_UNIT_MS = 1000 / 1024;

export const TRANSPORT = Object.freeze({
  BLUETOOTH: 'bluetooth',
  COMPANION: 'companion',
});

/** Decode the Bluetooth SIG Heart Rate Measurement characteristic. */
export function parseHeartRate(dv) {
  const flags = dv.getUint8(0);
  const hr16 = (flags & 0x01) !== 0;
  const contactSupported = (flags & 0x04) !== 0;
  const contact = (flags & 0x02) !== 0;
  const energyPresent = (flags & 0x08) !== 0;
  const rrPresent = (flags & 0x10) !== 0;

  let i = 1;
  const hr = hr16 ? dv.getUint16(i, true) : dv.getUint8(i);
  i += hr16 ? 2 : 1;
  if (energyPresent) i += 2;

  const rr = [];
  if (rrPresent) {
    for (; i + 1 < dv.byteLength; i += 2) {
      rr.push(dv.getUint16(i, true) * RR_UNIT_MS);
    }
  }

  return {
    hr,
    rr,
    rrSupported: rrPresent,
    contactOk: contactSupported ? contact : true,
  };
}

const finite = (v) => Number.isFinite(Number(v)) ? Number(v) : null;
const firstFinite = (...values) => {
  for (const value of values) {
    const n = finite(value);
    if (n !== null) return n;
  }
  return null;
};

/**
 * Normalise the deliberately small companion protocol. This accepts common
 * field spellings so a HealthKit/Health Connect bridge does not need a large
 * adapter merely to rename `heartRate` to `hr`.
 */
export function normalizeCompanionSample(input = {}) {
  const raw = input.payload && typeof input.payload === 'object' ? input.payload : input;
  const respiration = raw.respiration && typeof raw.respiration === 'object'
    ? raw.respiration : {};

  const rrRaw = raw.rrMs ?? raw.rr ?? raw.rrIntervals ?? [];
  const rr = (Array.isArray(rrRaw) ? rrRaw : [rrRaw])
    .map(finite)
    .filter((v) => v !== null && v >= 300 && v <= 2000);

  return {
    deviceName: String(raw.deviceName ?? raw.device ?? raw.source ?? 'Companion App'),
    hr: firstFinite(raw.heartRate, raw.hr, raw.bpm),
    rr,
    rmssd: firstFinite(raw.rmssd, raw.hrvRmssd, raw.hrv_ms),
    eda: firstFinite(raw.eda, raw.stressEda),
    battery: firstFinite(raw.battery, raw.batteryLevel),
    respiration: {
      rate: firstFinite(respiration.rate, raw.respRate, raw.respirationRate),
      phase: firstFinite(respiration.phase, raw.respPhase),
      wave: firstFinite(respiration.wave, raw.respWave),
      regularity: firstFinite(respiration.regularity, raw.respRegularity),
    },
  };
}

export class WearableHub {
  constructor() {
    this.device = null;
    this.server = null;
    this.socket = null;
    this.transport = null;
    this.state = 'idle'; // idle | connecting | waiting | live | lost | error
    this.detail = '';
    this.detailCode = 'disconnected';
    this.rrSupported = false;
    this.hrvSupported = false;
    this.respSupported = false;
    this.battery = null;
    this.lastError = null;
    this.artefacts = 0;
    this.beatsAccepted = 0;
    this._lastAcceptedRR = null;
    this._rejectRun = 0;

    this.onBeat = null;        // (rrMs, atMs)
    this.onHeartRate = null;   // (bpm, atMs)
    this.onHrv = null;         // (rmssdMs, atMs)
    this.onRespiration = null; // ({ rate, phase, wave, regularity }, atMs)
    this.onEda = null;         // (0..10, atMs)
    this.onStatus = null;      // (state, detail, detailCode)

    this._decoder = new TextDecoder();
    this._nusBuf = '';
    this._messageHandler = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (!['sand-to-stupa:health', 'sand-to-stupa:wearable', 'wearable-data'].includes(msg.type)) return;
      this.pushCompanionSample(msg, performance.now());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this._messageHandler);
      // A native shell can call this directly from WKWebView.evaluateJavaScript
      // or Android WebView. It is also the easiest integration seam for a
      // local installation bridge.
      window.SandToStupaWearables = {
        push: (sample) => this.pushCompanionSample(sample, performance.now()),
        disconnect: () => this.disconnect(),
        protocol: 'sand-to-stupa/1',
      };
    }
  }

  static get bluetoothAvailable() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth && !!globalThis.isSecureContext;
  }

  static get bluetoothBlockedCode() {
    if (typeof navigator === 'undefined' || !navigator.bluetooth) return 'bluetooth_unavailable';
    if (!globalThis.isSecureContext) return 'secure_context_required';
    return null;
  }

  get connected() { return this.state === 'live' || this.state === 'lost'; }

  _status(state, detail = '', detailCode = '') {
    this.state = state;
    this.detail = detail;
    this.detailCode = detailCode;
    this.onStatus?.(state, detail, detailCode);
  }

  /** Pair a device that exposes the standard Bluetooth Heart Rate Service. */
  async pairBluetooth() {
    const blocked = WearableHub.bluetoothBlockedCode;
    if (blocked) {
      this._status('error', '', blocked);
      throw new Error(blocked);
    }

    this.transport = TRANSPORT.BLUETOOTH;
    this._status('connecting', '', 'select_device');
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
        optionalServices: [BATTERY_SERVICE, NUS_SERVICE],
      });
    } catch (err) {
      const cancelled = err?.name === 'NotFoundError';
      this._status('idle', '', cancelled ? 'cancelled' : 'pair_failed');
      if (!cancelled) this.lastError = err;
      throw err;
    }

    this.device.addEventListener('gattserverdisconnected', () => this._onDropped());
    await this._openGatt();
  }

  /**
   * Ask a HealthKit / Health Connect companion to begin streaming. A normal
   * webpage cannot query Apple Health directly; this handshake is the honest
   * bridge rather than pretending Apple Watch is a generic BLE peripheral.
   */
  async pairCompanion({ socketUrl } = {}) {
    this.transport = TRANSPORT.COMPANION;
    this.device = { name: 'Companion App' };
    this._status('waiting', '', 'waiting_companion');

    if (socketUrl) return this.connectBridgeSocket(socketUrl);

    const request = { type: 'sand-to-stupa:pair', protocol: 'sand-to-stupa/1' };
    try {
      window.webkit?.messageHandlers?.sandToStupaWearables?.postMessage(request);
    } catch { /* not inside an iOS companion shell */ }
    try {
      window.AndroidWearables?.pair?.(JSON.stringify(request));
    } catch { /* not inside an Android companion shell */ }
    window.dispatchEvent(new CustomEvent('sand-to-stupa:pair-request', { detail: request }));
  }

  /** Optional bridge for installations whose companion streams over WS/WSS. */
  connectBridgeSocket(url) {
    if (!/^wss?:\/\//i.test(String(url || ''))) {
      this._status('error', '', 'bridge_url_invalid');
      throw new Error('bridge_url_invalid');
    }
    this._status('connecting', '', 'opening_bridge');
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => this._status('waiting', '', 'waiting_data'));
    this.socket.addEventListener('message', (event) => {
      try { this.pushCompanionSample(JSON.parse(event.data), performance.now()); }
      catch (err) { this.lastError = err; }
    });
    this.socket.addEventListener('close', () => {
      if (this.transport === TRANSPORT.COMPANION) this._status('lost', '', 'bridge_closed');
    });
    this.socket.addEventListener('error', () => this._status('error', '', 'bridge_failed'));
  }

  /** Feed one sample from a companion/native bridge. */
  pushCompanionSample(input, arrivedAt = performance.now()) {
    const sample = normalizeCompanionSample(input);
    this.transport = TRANSPORT.COMPANION;
    this.device = { name: sample.deviceName };
    const R = sample.respiration;
    const hasResp = [R.rate, R.phase, R.wave, R.regularity].some((v) => v !== null);
    const hasSignal = sample.hr !== null || sample.rmssd !== null || sample.rr.length ||
      sample.eda !== null || hasResp;

    if (sample.battery !== null) this.battery = Math.max(0, Math.min(100, sample.battery));
    if (sample.rr.length) this.rrSupported = true;
    if (sample.rr.length || sample.rmssd !== null) this.hrvSupported = true;
    if (hasResp) this.respSupported = true;

    // Announce LIVE before dispatching the first values. The app switches its
    // SensorEngine from simulated to live in this callback; doing it after
    // the values would reset and discard the first companion sample.
    if (hasSignal) this._status('live', sample.deviceName, 'companion_live');

    if (sample.hr !== null) this.onHeartRate?.(sample.hr, arrivedAt);
    if (sample.rmssd !== null) this.onHrv?.(sample.rmssd, arrivedAt);
    if (sample.eda !== null) this.onEda?.(sample.eda, arrivedAt);

    if (sample.rr.length) {
      this._emitBackdatedBeats(sample.rr, arrivedAt);
    }
    if (hasResp) this.onRespiration?.(R, arrivedAt);
  }

  async _openGatt() {
    this._status('connecting', '', 'opening_bluetooth');
    this.server = await this.device.gatt.connect();

    const hrService = await this.server.getPrimaryService(HR_SERVICE);
    const hrChar = await hrService.getCharacteristic(HR_MEASUREMENT);
    hrChar.addEventListener('characteristicvaluechanged', (event) => {
      this._onHrPacket(event.target.value, performance.now());
    });
    await hrChar.startNotifications();

    try {
      const batteryService = await this.server.getPrimaryService(BATTERY_SERVICE);
      const level = await batteryService.getCharacteristic(BATTERY_LEVEL);
      this.battery = (await level.readValue()).getUint8(0);
      level.addEventListener('characteristicvaluechanged', (event) => {
        this.battery = event.target.value.getUint8(0);
      });
      await level.startNotifications().catch(() => {});
    } catch { /* battery is optional */ }

    try {
      const nus = await this.server.getPrimaryService(NUS_SERVICE);
      const tx = await nus.getCharacteristic(NUS_TX);
      tx.addEventListener('characteristicvaluechanged', (event) => this._onNusPacket(event.target.value));
      await tx.startNotifications();
    } catch { /* EDA/GSR bridge is optional */ }

    this._status('live', this.device.name || 'Bluetooth Wearable', 'bluetooth_live');
  }

  _onHrPacket(dv, arrivedAt = performance.now()) {
    let measurement;
    try { measurement = parseHeartRate(dv); }
    catch (err) { this.lastError = err; return; }

    this.rrSupported = measurement.rrSupported;
    this.hrvSupported = measurement.rrSupported;
    this.onHeartRate?.(measurement.hr, arrivedAt);

    if (!measurement.contactOk) {
      this._status('live', this.device?.name || '', 'contact_lost');
      return;
    }

    this._emitBackdatedBeats(measurement.rr, arrivedAt);
    this._status(
      'live',
      this.device?.name || 'Bluetooth Wearable',
      measurement.rrSupported ? 'bluetooth_live' : 'heart_rate_only',
    );
  }

  _emitBackdatedBeats(rr, arrivedAt) {
    const total = rr.reduce((sum, value) => sum + value, 0);
    const first = arrivedAt - total;
    let elapsed = 0;
    for (const interval of rr) {
      elapsed += interval;
      if (interval < 300 || interval > 2000) { this.artefacts++; continue; }

      // A dropped beat can still be inside the absolute 300–2000 ms range.
      // Reject isolated jumps beyond ±20%; after four consecutive rejects,
      // re-seat the reference because the change is probably sustained.
      const reference = this._lastAcceptedRR;
      if (reference !== null && Math.abs(interval - reference) / reference > 0.20) {
        this.artefacts++;
        if (++this._rejectRun >= 4) {
          this._lastAcceptedRR = interval;
          this._rejectRun = 0;
        }
        continue;
      }

      this._rejectRun = 0;
      this._lastAcceptedRR = interval;
      this.beatsAccepted++;
      this.onBeat?.(interval, first + elapsed);
    }
  }

  _onNusPacket(dv) {
    this._nusBuf += this._decoder.decode(dv.buffer ?? dv, { stream: true });
    let newline;
    while ((newline = this._nusBuf.indexOf('\n')) >= 0) {
      const line = this._nusBuf.slice(0, newline).trim();
      this._nusBuf = this._nusBuf.slice(newline + 1);
      const match = line.match(/(-?\d+(?:\.\d+)?)\s*$/);
      const value = match ? Number(match[1]) : NaN;
      if (Number.isFinite(value)) this.onEda?.(value, performance.now());
    }
    if (this._nusBuf.length > 256) this._nusBuf = '';
  }

  async _onDropped() {
    if (this.transport !== TRANSPORT.BLUETOOTH) return;
    this._status('lost', '', 'reconnecting');
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      if (!this.device) return;
      try { await this._openGatt(); return; }
      catch { /* try again */ }
    }
    this._status('error', '', 'sensor_lost');
  }

  disconnect() {
    const device = this.device;
    const socket = this.socket;
    this.device = null;
    this.socket = null;
    this.server = null;
    this.transport = null;
    this.rrSupported = false;
    this.hrvSupported = false;
    this.respSupported = false;
    this.battery = null;
    this._lastAcceptedRR = null;
    this._rejectRun = 0;
    try { device?.gatt?.disconnect(); } catch { /* already disconnected */ }
    try { socket?.close(); } catch { /* already disconnected */ }
    this._status('idle', '', 'disconnected');
  }
}

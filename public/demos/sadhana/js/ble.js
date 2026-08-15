/**
 * ble.js — Web Bluetooth ingest
 * ─────────────────────────────────────────────────────────────────────────
 * Talks to a real chest strap and hands R-peak intervals to sensor.js.
 * Knows nothing about graphics, audio, or the DOM — it emits callbacks.
 *
 * Primary source: the standard Heart Rate Service (0x180D). Any compliant
 * strap — Polar H9/H10, Garmin HRM, Wahoo TICKR, Coospo — exposes it, and
 * the ones worth using also set the RR-Interval flag, which is the only
 * field this piece actually needs: RMSSD and the derived respiration both
 * come out of the RR series, not out of the BPM number.
 *
 * Requirements the caller must respect:
 *   - Web Bluetooth is Chromium-only (Chrome, Edge, Opera, Arc). Safari and
 *     Firefox do not implement it.
 *   - It needs a SECURE CONTEXT: https, or http on localhost. Serving the
 *     piece to a phone over a LAN IP will not work without TLS.
 *   - `connect()` must be called from inside a user gesture, same as audio.
 */

// ─── GATT identifiers ────────────────────────────────────────────────────

const HR_SERVICE = 'heart_rate';           // 0x180D
const HR_MEASUREMENT = 'heart_rate_measurement'; // 0x2A37
const BATTERY_SERVICE = 'battery_service'; // 0x180F
const BATTERY_LEVEL = 'battery_level';     // 0x2A19

/**
 * Nordic UART Service — not a standard sensor service, but the de-facto
 * transport for DIY rigs. An ESP32/Arduino GSR board that prints
 * "EDA:3.42\n" over NUS will drive the stress channel; without one, EDA
 * stays on the panel slider.
 */
const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // device → host

/** RR intervals are transmitted in units of 1/1024 s, not milliseconds. */
const RR_UNIT_MS = 1000 / 1024;

// ─── Heart Rate Measurement parsing ─────────────────────────────────────

/**
 * Decode characteristic 0x2A37.
 *
 * Layout (Bluetooth SIG):
 *   byte 0  flags
 *           bit 0    HR value format: 0 = uint8, 1 = uint16
 *           bit 1-2  sensor contact status
 *           bit 3    energy expended present
 *           bit 4    RR intervals present
 *   then    HR value            (1 or 2 bytes, little-endian)
 *   then    energy expended     (2 bytes, only if bit 3)
 *   then    RR intervals        (2 bytes each, fills the remainder)
 *
 * The variable-width HR field and the optional energy field are why the RR
 * offset has to be computed rather than assumed — reading RR from a fixed
 * offset works on one strap and returns garbage on the next.
 */
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
    // "Not supported" and "not detected" are different states; only the
    // second one means the strap is off the body.
    contactOk: contactSupported ? contact : true,
  };
}

// ─── The client ─────────────────────────────────────────────────────────

export class BleSensor {
  constructor() {
    this.device = null;
    this.server = null;
    this.state = 'idle'; // idle | connecting | live | lost | error
    this.rrSupported = false;
    this.battery = null;
    this.lastError = null;

    // Callbacks, all optional.
    this.onBeat = null;    // (rrMs)      once per R-peak interval
    this.onHeartRate = null; // (bpm)
    this.onEda = null;     // (0..10)
    this.onStatus = null;  // (state, detail)
    this._decoder = new TextDecoder();
    this._nusBuf = '';

    // Artefact accounting. Surfaced so a session can be judged on the spot:
    // under 2% is a well-seated strap, over 5% means go and re-wet the
    // electrodes rather than reach for the code.
    this.artefacts = 0;
    this.beatsAccepted = 0;
    this._lastAcceptedRR = null;
    this._rejectRun = 0;
  }

  static get available() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  }

  /** Human-readable reason the browser cannot do this, or null if it can. */
  static get blockedReason() {
    if (typeof navigator === 'undefined') return 'No browser context';
    if (!navigator.bluetooth) return 'Web Bluetooth unsupported — use Chrome or Edge';
    if (!window.isSecureContext) return 'Needs https or localhost';
    return null;
  }

  _status(state, detail) {
    this.state = state;
    if (this.onStatus) this.onStatus(state, detail);
  }

  /** Must be called from a user gesture. */
  async connect() {
    const blocked = BleSensor.blockedReason;
    if (blocked) { this._status('error', blocked); throw new Error(blocked); }

    this._status('connecting', 'Select a device');
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
        // Not filtered on — a strap that lacks these should still connect.
        optionalServices: [BATTERY_SERVICE, NUS_SERVICE],
      });
    } catch (err) {
      // A cancelled chooser is a normal outcome, not a failure worth shouting about.
      this._status('idle', err?.name === 'NotFoundError' ? 'Cancelled' : String(err.message || err));
      throw err;
    }

    this.device.addEventListener('gattserverdisconnected', () => this._onDropped());
    await this._openGatt();
  }

  async _openGatt() {
    this._status('connecting', 'Opening GATT');
    this.server = await this.device.gatt.connect();

    // --- heart rate (required) ---
    const hrService = await this.server.getPrimaryService(HR_SERVICE);
    const hrChar = await hrService.getCharacteristic(HR_MEASUREMENT);
    hrChar.addEventListener('characteristicvaluechanged', (e) => {
      this._onHrPacket(e.target.value, performance.now());
    });
    await hrChar.startNotifications();

    // --- battery (optional) ---
    try {
      const bat = await this.server.getPrimaryService(BATTERY_SERVICE);
      const lvl = await bat.getCharacteristic(BATTERY_LEVEL);
      this.battery = (await lvl.readValue()).getUint8(0);
      lvl.addEventListener('characteristicvaluechanged', (e) => {
        this.battery = e.target.value.getUint8(0);
      });
      await lvl.startNotifications().catch(() => {}); // not all straps notify
    } catch { /* no battery service — harmless */ }

    // --- DIY EDA over Nordic UART (optional) ---
    try {
      const nus = await this.server.getPrimaryService(NUS_SERVICE);
      const tx = await nus.getCharacteristic(NUS_TX);
      tx.addEventListener('characteristicvaluechanged', (e) => {
        this._onNusPacket(e.target.value);
      });
      await tx.startNotifications();
    } catch { /* no GSR rig — EDA stays on the slider */ }

    this._status('live', this.device.name || 'Sensor');
  }

  /**
   * @param {DataView} dv
   * @param {number} [arrivedAt] notification arrival on the performance.now()
   *   clock. Injectable so the beat pipeline can be exercised faster than
   *   real time without a strap on someone's chest.
   */
  _onHrPacket(dv, arrivedAt = performance.now()) {
    let m;
    try {
      m = parseHeartRate(dv);
    } catch (err) {
      this.lastError = err;
      return; // a single malformed packet must not kill the stream
    }

    this.rrSupported = m.rrSupported;
    if (this.onHeartRate) this.onHeartRate(m.hr);

    if (!m.contactOk) {
      this._status('live', 'Strap not in contact');
      return;
    }

    // A packet can carry several intervals if notifications were coalesced.
    // They are ordered oldest-first and the newest one ends *now*, so each
    // beat is back-dated by the intervals that follow it. Handing them all
    // the arrival timestamp would squash several seconds of tachogram into
    // one instant and flatten the derived breath waveform.
    const total = m.rr.reduce((a, b) => a + b, 0);
    const t0 = arrivedAt - total;
    let elapsed = 0;

    // Two gates, not one. The absolute range only catches intervals that are
    // impossible; it does not catch the common ones that are merely wrong.
    //
    // A dropped beat fuses two intervals into one — 900 ms becomes 1800 ms —
    // which is a perfectly legal heart rate and sails through the absolute
    // test. It then reaches the RMSSD estimator as a ~900 ms successive
    // difference, and because that term is squared, a single artefact drives
    // the estimate from 22 ms to its 100 ms ceiling in one beat: full gold and
    // every chime, earned by a loose electrode. Dropped beats are routine in
    // the first minutes, before the electrodes are properly wetted.
    //
    // The relative gate is the standard remedy: a real beat-to-beat change
    // beyond ±20% is not physiologically plausible at rest. Rejected beats do
    // not update the reference, so bad data cannot drag it along — but after
    // four consecutive rejections the reference is re-seated, because by then
    // the change is sustained and is a body doing something (standing up),
    // not a sensor glitch.
    for (const rr of m.rr) {
      elapsed += rr;
      if (rr < 300 || rr > 2000) { this.artefacts++; continue; }

      const ref = this._lastAcceptedRR;
      if (ref !== null && Math.abs(rr - ref) / ref > 0.20) {
        this.artefacts++;
        if (++this._rejectRun >= 4) {
          this._lastAcceptedRR = rr;
          this._rejectRun = 0;
        }
        continue;
      }

      this._rejectRun = 0;
      this._lastAcceptedRR = rr;
      this.beatsAccepted++;
      if (this.onBeat) this.onBeat(rr, t0 + elapsed);
    }

    // Straps that report no RR at all cannot drive this piece: RMSSD and the
    // derived breath both need beat-to-beat timing, not an averaged BPM.
    if (!m.rrSupported) this._status('live', 'No RR data — HRV unavailable');
  }

  _onNusPacket(dv) {
    this._nusBuf += this._decoder.decode(dv.buffer ?? dv, { stream: true });
    let nl;
    while ((nl = this._nusBuf.indexOf('\n')) >= 0) {
      const line = this._nusBuf.slice(0, nl).trim();
      this._nusBuf = this._nusBuf.slice(nl + 1);
      // Accept "EDA:3.42", "eda 3.42", or a bare number.
      const match = line.match(/(-?\d+(?:\.\d+)?)\s*$/);
      if (match && this.onEda) {
        const v = parseFloat(match[1]);
        if (Number.isFinite(v)) this.onEda(v);
      }
    }
    if (this._nusBuf.length > 256) this._nusBuf = ''; // never grow unbounded
  }

  async _onDropped() {
    this._status('lost', 'Reconnecting…');
    // Straps drop constantly — sweat, movement, a wandering visitor. One
    // quiet retry keeps a gallery piece alive without staff intervention.
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      if (!this.device) return;
      try {
        await this._openGatt();
        return;
      } catch { /* try again */ }
    }
    this._status('error', 'Sensor lost');
  }

  disconnect() {
    const d = this.device;
    this.device = null; // stops _onDropped from retrying
    try { d?.gatt?.disconnect(); } catch { /* already gone */ }
    this.server = null;
    this._status('idle', 'Disconnected');
  }
}

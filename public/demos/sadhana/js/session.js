/**
 * session.js — meditation session timing and non-clinical reflection model.
 *
 * The analysis is deliberately within-session: the first valid window is the
 * participant's arrival baseline and the final valid window is compared with
 * it. No population norm or hard-coded personal RMSSD baseline is used.
 */

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const finite = (v) => Number.isFinite(v);
const mean = (values) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : 0;

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function deviation(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - m) ** 2)));
}

function metricWindow(samples, key) {
  return samples.map((sample) => sample[key]).filter(finite);
}

function relativeChange(start, end, floor = 1) {
  return (end - start) / Math.max(Math.abs(start), floor);
}

function makeTrendMetric({ key, available, start, end, score, inverse = false }) {
  const delta = relativeChange(start, end, key === 'hr' ? 35 : 1);
  return {
    key,
    available,
    start,
    end,
    delta,
    beneficialDelta: inverse ? -delta : delta,
    score: Math.round(clamp(score) * 100),
  };
}

function countBreaths(samples) {
  let previous = 0;
  let count = 0;
  for (const sample of samples) {
    if (sample.respPhase === 1 && previous === -1) count++;
    if (sample.respPhase) previous = sample.respPhase;
  }
  return count;
}

function downsample(values, max = 120) {
  if (values.length <= max) return values;
  const output = [];
  for (let i = 0; i < max; i++) {
    output.push(values[Math.floor(i * (values.length - 1) / (max - 1))]);
  }
  return output;
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function analyzeSession(input, meta = {}) {
  const all = input.filter((sample) => !sample.stale && finite(sample.at));
  if (!all.length) return null;

  // Never mix simulated physiology into a real-wearable report. A live span
  // needs at least 30 seconds (60 samples at 2 Hz) before it becomes the
  // authoritative source; otherwise the report is honestly labelled demo.
  const live = all.filter((sample) => sample.source === 'live');
  const simulated = all.filter((sample) => sample.source !== 'live');
  const samples = live.length >= 60 ? live : simulated.length ? simulated : live;
  const source = samples === live ? 'live' : 'mock';
  const startedAt = samples[0].at;
  const endedAt = samples[samples.length - 1].at;
  const measuredDuration = Math.max(1, endedAt - startedAt);
  const windowSeconds = Math.min(60, Math.max(20, measuredDuration * 0.2), measuredDuration * 0.35);
  const arrival = samples.filter((sample) => sample.at <= startedAt + windowSeconds);
  const closing = samples.filter((sample) => sample.at >= endedAt - windowSeconds);

  const capabilities = {
    breath: samples.some((sample) => sample.capabilities?.breath),
    hrv: samples.some((sample) => sample.capabilities?.hrv),
    hr: samples.some((sample) => sample.capabilities?.hr),
    eda: samples.some((sample) => sample.capabilities?.eda),
  };

  const rates = metricWindow(samples.filter((sample) => sample.capabilities?.breath), 'respRate');
  const breathScores = metricWindow(samples.filter((sample) => sample.capabilities?.breath), 'respDepthScore');
  const rateMedian = median(rates);
  const rateCv = rateMedian > 0 ? deviation(rates) / rateMedian : 1;
  const regularity = clamp(1 - rateCv / 0.18);
  const phaseLegibility = samples.length
    ? samples.filter((sample) => sample.capabilities?.breath && sample.respPhase !== 0).length
      / samples.filter((sample) => sample.capabilities?.breath).length || 0
    : 0;
  const breathScore = clamp(mean(breathScores) * 0.55 + regularity * 0.30 + phaseLegibility * 0.15);

  const firstHrv = median(metricWindow(arrival.filter((sample) => sample.capabilities?.hrv), 'rmssd'));
  const lastHrv = median(metricWindow(closing.filter((sample) => sample.capabilities?.hrv), 'rmssd'));
  const hrvDelta = relativeChange(firstHrv, lastHrv, 10);
  const hrvMetric = makeTrendMetric({
    key: 'hrv', available: capabilities.hrv, start: firstHrv, end: lastHrv,
    score: 0.5 + hrvDelta / 0.6,
  });

  const firstHr = median(metricWindow(arrival.filter((sample) => sample.capabilities?.hr), 'hr'));
  const lastHr = median(metricWindow(closing.filter((sample) => sample.capabilities?.hr), 'hr'));
  const hrSettling = relativeChange(firstHr, lastHr, 35) * -1;
  const hrMetric = makeTrendMetric({
    key: 'hr', available: capabilities.hr, start: firstHr, end: lastHr,
    score: 0.45 + hrSettling / 0.20, inverse: true,
  });

  const firstEda = median(metricWindow(arrival.filter((sample) => sample.capabilities?.eda), 'eda'));
  const lastEda = median(metricWindow(closing.filter((sample) => sample.capabilities?.eda), 'eda'));
  const edaSettling = relativeChange(firstEda, lastEda, 1) * -1;
  const edaMetric = makeTrendMetric({
    key: 'eda', available: capabilities.eda, start: firstEda, end: lastEda,
    score: 0.45 + edaSettling / 0.50, inverse: true,
  });

  const breathMetric = {
    key: 'breath', available: capabilities.breath,
    start: median(metricWindow(arrival, 'respRate')),
    end: median(metricWindow(closing, 'respRate')),
    delta: relativeChange(median(metricWindow(arrival, 'respRate')), median(metricWindow(closing, 'respRate')), 1),
    beneficialDelta: regularity,
    score: Math.round(breathScore * 100),
    regularity,
  };

  const weighted = [
    [breathMetric, 0.40], [hrvMetric, 0.30], [hrMetric, 0.15], [edaMetric, 0.15],
  ].filter(([metric]) => metric.available);
  const weightTotal = weighted.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  const score = Math.round(weighted.reduce((sum, [metric, weight]) => sum + metric.score * weight, 0) / weightTotal);

  const level = score >= 80 ? 'luminous' : score >= 60 ? 'gathered' : score >= 40 ? 'rhythm' : 'settling';
  const validSignals = Object.values(capabilities).filter(Boolean).length;
  const expected = Math.max(1, Math.round((meta.durationSeconds || measuredDuration) * 2));
  const coverage = clamp(samples.length / expected);
  const confidence = source !== 'live'
    ? 'simulated'
    : validSignals >= 4 && coverage >= 0.85
      ? 'complete'
      : validSignals >= 2 && coverage >= 0.65
        ? 'good'
        : 'limited';

  return {
    score,
    level,
    confidence,
    source,
    coverage,
    capabilities,
    durationSeconds: meta.durationSeconds || measuredDuration,
    measuredDuration,
    endedAt: meta.endedAt || Date.now(),
    breathCycles: countBreaths(samples),
    metrics: { breath: breathMetric, hrv: hrvMetric, hr: hrMetric, eda: edaMetric },
    meanCohesion: clamp(mean(metricWindow(samples, 'cohesion'))),
    meanGold: clamp(mean(metricWindow(samples, 'goldIndex'))),
    breathTrace: downsample(metricWindow(samples, 'respWave')),
    sampleCount: samples.length,
  };
}

export class MeditationSession {
  constructor(sampleHz = 2) {
    this.sampleInterval = 1 / sampleHz;
    this.reset();
  }

  reset() {
    this.active = false;
    this.elapsed = 0;
    this.durationSeconds = 600;
    this.samples = [];
    this._sampleTimer = 0;
    this.startedAt = 0;
  }

  start(durationSeconds) {
    this.reset();
    this.active = true;
    this.durationSeconds = clamp(Number(durationSeconds) || 600, 60, 7200);
    this.startedAt = Date.now();
  }

  update(dt, data, capabilities) {
    if (!this.active) return false;
    this.elapsed = Math.min(this.durationSeconds, this.elapsed + Math.max(0, dt));
    this._sampleTimer += dt;
    if (this._sampleTimer >= this.sampleInterval || this.samples.length === 0) {
      this._sampleTimer %= this.sampleInterval;
      this.samples.push({
        at: this.elapsed,
        hr: data.hr,
        rmssd: data.rmssd,
        eda: data.eda,
        respRate: data.respRate,
        respPhase: data.respPhase,
        respWave: data.respWave,
        respDepthScore: data.respDepthScore,
        cohesion: data.cohesion,
        goldIndex: data.goldIndex,
        source: data.source,
        stale: data.stale,
        capabilities: { ...capabilities },
      });
    }
    return this.elapsed >= this.durationSeconds;
  }

  finish() {
    this.active = false;
    return analyzeSession(this.samples, {
      durationSeconds: this.elapsed || this.durationSeconds,
      endedAt: Date.now(),
    });
  }

  get progress() { return clamp(this.elapsed / this.durationSeconds); }
  get remaining() { return Math.max(0, this.durationSeconds - this.elapsed); }
}

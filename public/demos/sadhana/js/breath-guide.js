/**
 * breath-guide.js — deterministic contemplative breathing cue
 *
 * The guide is intentionally independent from measured physiology. A cue
 * must remain regular while the participant is unsettled; otherwise it only
 * mirrors dysregulation and cannot help them find a slower rhythm.
 */
export class BreathGuide {
  constructor(inhaleSeconds = 4, exhaleSeconds = 6) {
    this.inhaleSeconds = inhaleSeconds;
    this.exhaleSeconds = exhaleSeconds;
    this.duration = inhaleSeconds + exhaleSeconds;
    this.state = { phase: 1, wave: -1 };
    this.reset();
  }

  reset() {
    this.elapsed = 0;
    this.state.phase = 1;
    this.state.wave = -1;
    return this.state;
  }

  update(dt) {
    this.elapsed = (this.elapsed + Math.max(0, dt)) % this.duration;
    if (this.elapsed < this.inhaleSeconds) {
      const u = this.elapsed / this.inhaleSeconds;
      this.state.phase = 1;
      this.state.wave = -Math.cos(Math.PI * u); // -1 → +1
    } else {
      const u = (this.elapsed - this.inhaleSeconds) / this.exhaleSeconds;
      this.state.phase = -1;
      this.state.wave = Math.cos(Math.PI * u);  // +1 → -1
    }
    return this.state;
  }
}

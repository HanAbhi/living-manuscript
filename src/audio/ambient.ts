/**
 * Synthesized Ambient Audio Engine using Web Audio API.
 * Produces a quiet, meditative singing-bowl/tanpura drone with harmonic frequencies
 * and soft resonant bell chimes triggered as concentric mandala rings unfurl.
 */

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying = false;
  private volume = 0.35;

  /**
   * Initializes audio context on user gesture.
   */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Starts meditative ambient drone.
   */
  start(): void {
    if (this.isPlaying) return;
    const ctx = this.ensureContext();

    // Drone master gain with smooth fade-in
    this.droneGain = ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.droneGain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 3.0);

    // Warm low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, ctx.currentTime);

    this.droneGain.connect(filter);
    filter.connect(this.masterGain!);

    // Sacred harmonic frequencies (A = 432Hz tuning, base 108Hz / 162Hz / 216Hz)
    const fundamental = 108; // D2
    const harmonics = [1.0, 1.5, 2.0, 3.0]; // Root, perfect fifth, octave, twelfth

    this.oscillators = [];
    harmonics.forEach((h, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      // Subtle organic detuning for natural chorus beating
      const detuneCents = (idx - 1.5) * 3.5;
      osc.frequency.setValueAtTime(fundamental * h, ctx.currentTime);
      osc.detune.setValueAtTime(detuneCents, ctx.currentTime);

      const amp = 0.28 / (idx + 1);
      oscGain.gain.setValueAtTime(amp, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(this.droneGain!);
      osc.start();
      this.oscillators.push(osc);
    });

    this.isPlaying = true;
  }

  /**
   * Stops drone playback with smooth decay.
   */
  stop(): void {
    if (!this.isPlaying || !this.ctx || !this.droneGain) return;

    this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.ctx.currentTime);
    this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.5);

    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore
        }
      });
      this.oscillators = [];
      this.isPlaying = false;
    }, 1600);
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  /**
   * Synthesizes a soft, crystalline Tibetan singing-bowl chime when a new ring unfolds.
   */
  playRingChime(ringIndex: number): void {
    if (!this.isPlaying && this.volume === 0) return;
    try {
      const ctx = this.ensureContext();
      const chimeGain = ctx.createGain();

      // Pentatonic scale degrees based on ring index
      const pentatonicRatios = [1.0, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2.0];
      const ratio = pentatonicRatios[ringIndex % pentatonicRatios.length];
      const baseFreq = 324 * ratio; // Meditative singing bowl register

      // Singing bowl partial overtones (non-integer frequencies)
      const partials = [1.0, 2.76, 5.4];
      const decayDuration = 3.5;

      chimeGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.18 * this.volume, ctx.currentTime + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decayDuration);
      chimeGain.connect(this.masterGain!);

      partials.forEach((p, idx) => {
        const osc = ctx.createOscillator();
        const pGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * p, ctx.currentTime);

        const pAmp = 0.35 / (idx * 1.5 + 1);
        pGain.gain.setValueAtTime(pAmp, ctx.currentTime);

        osc.connect(pGain);
        pGain.connect(chimeGain);

        osc.start();
        osc.stop(ctx.currentTime + decayDuration);
      });
    } catch {
      // Audio autoplay policy or device restrictions
    }
  }
}

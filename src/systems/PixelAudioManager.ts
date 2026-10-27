export class PixelAudioManager {
  private static instance: PixelAudioManager | null = null;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private activeBgmOscillators: OscillatorNode[] = [];
  private bgmInterval: number | null = null;
  private jeepOsc: OscillatorNode | null = null;
  private jeepGain: GainNode | null = null;

  public static getInstance(): PixelAudioManager {
    if (!PixelAudioManager.instance) {
      PixelAudioManager.instance = new PixelAudioManager();
    }
    return PixelAudioManager.instance;
  }

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.gain.value = 0.5;
        this.sfxGain.gain.value = 0.7;

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public setMusicVolume(val: number) {
    if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, val));
  }

  public setSfxVolume(val: number) {
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, val));
  }

  // ── Procedural Sound Effects ───────────────────────────────────────────────
  public playFootstep(surface: 'dirt' | 'stone' | 'wood' = 'stone') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'dirt') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.08);
    } else if (surface === 'wood') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(75, t + 0.09);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.09);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.07);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.07);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.16);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playLand() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playLanternToggle(active: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(active ? 550 : 380, t);
    osc.frequency.exponentialRampToValueAtTime(active ? 920 : 210, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playTorchWhoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.45);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.15);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.46);
  }

  public playStoneGrind() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.linearRampToValueAtTime(48, t + 0.6);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.61);
  }

  public playSanskritChime() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.85);
    });
  }

  public playDialTurn() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playDialLock() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const chords = [440, 554.37, 659.25, 880]; // A major chime
    chords.forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.92);
    });
  }

  public playVaultOpen() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Sub-bass earthquake rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(45, t);
    sub.frequency.linearRampToValueAtTime(32, t + 2.2);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.linearRampToValueAtTime(0.001, t + 2.2);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 2.25);

    // Stone grinding screech
    const grind = this.ctx.createOscillator();
    const grindGain = this.ctx.createGain();
    grind.type = 'triangle';
    grind.frequency.setValueAtTime(110, t);
    grind.frequency.linearRampToValueAtTime(135, t + 1.2);
    grind.frequency.linearRampToValueAtTime(90, t + 2.2);

    grindGain.gain.setValueAtTime(0.25, t);
    grindGain.gain.linearRampToValueAtTime(0.001, t + 2.2);

    grind.connect(grindGain);
    grindGain.connect(this.sfxGain);
    grind.start(t);
    grind.stop(t + 2.25);
  }

  public playVictory() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    // Indian Raga Bhupali / Mohanam pentatonic celebration: C D E G A C'
    const notes = [
      { f: 261.63, d: 0.18, pause: 0.0 },
      { f: 293.66, d: 0.18, pause: 0.16 },
      { f: 329.63, d: 0.18, pause: 0.32 },
      { f: 392.00, d: 0.22, pause: 0.48 },
      { f: 440.00, d: 0.25, pause: 0.68 },
      { f: 523.25, d: 0.85, pause: 0.92 },
    ];

    notes.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + n.pause;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + n.d + 0.05);
    });
  }

  // ── Jeep Engine Audio Loop ─────────────────────────────────────────────────
  public startJeepSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.jeepOsc) return;

    const t = this.ctx.currentTime;
    this.jeepOsc = this.ctx.createOscillator();
    this.jeepGain = this.ctx.createGain();

    this.jeepOsc.type = 'sawtooth';
    this.jeepOsc.frequency.setValueAtTime(58, t);

    this.jeepGain.gain.setValueAtTime(0.08, t);

    this.jeepOsc.connect(this.jeepGain);
    this.jeepGain.connect(this.sfxGain);
    this.jeepOsc.start(t);
  }

  public updateJeepThrottle(speedRatio: number) {
    if (!this.ctx || !this.jeepOsc || !this.jeepGain) return;
    const t = this.ctx.currentTime;
    const freq = 58 + speedRatio * 85;
    this.jeepOsc.frequency.setTargetAtTime(freq, t, 0.1);
    this.jeepGain.gain.setTargetAtTime(0.06 + speedRatio * 0.12, t, 0.1);
  }

  public stopJeepSound() {
    if (this.jeepOsc) {
      try {
        this.jeepOsc.stop();
        this.jeepOsc.disconnect();
      } catch (e) {}
      this.jeepOsc = null;
      this.jeepGain = null;
    }
  }

  // ── Ambient Background Tracks ──────────────────────────────────────────────
  public stopBgm() {
    if (this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.activeBgmOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeBgmOscillators = [];
  }

  public playDawnAmbience() {
    this.initContext();
    this.stopBgm();
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    // Drone 1: Soft root chord D2 (73.42 Hz) and A2 (110 Hz)
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(73.42, t);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110.0, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 3.0);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(t);
    osc2.start(t);
    this.activeBgmOscillators.push(osc1, osc2);

    // Periodic gentle morning bird chirp
    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(2400, now);
      bOsc.frequency.exponentialRampToValueAtTime(3200, now + 0.06);
      bOsc.frequency.exponentialRampToValueAtTime(2100, now + 0.12);

      bGain.gain.setValueAtTime(0.04, now);
      bGain.gain.linearRampToValueAtTime(0.001, now + 0.12);

      bOsc.connect(bGain);
      bGain.connect(this.musicGain);
      bOsc.start(now);
      bOsc.stop(now + 0.13);
    }, 4500);
  }

  public playRuinsAmbience() {
    this.initContext();
    this.stopBgm();
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Low ancient subterranean harmonic drone: C2 (65.41 Hz) + G2 (98 Hz) + D3 (146.83 Hz)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(65.41, t);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(98.0, t);

    // Low-pass filter for deep cavern warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 2.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(t);
    osc2.start(t);
    this.activeBgmOscillators.push(osc1, osc2);
  }
}

export const audioManager = PixelAudioManager.getInstance();

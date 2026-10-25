/**
 * GlobeTrotter - Procedural Web Audio Engine
 * Provides rich, low-latency synthesized sounds and atmospheric musical tracks
 * without requiring external audio files.
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private currentMusicNodes: { oscs: OscillatorNode[]; stop: () => void } | null = null;
  private currentTrack: string = 'none';

  public isMuted: boolean = false;
  public musicVolume: number = 0.55;
  public sfxVolume: number = 0.7;

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser autoplay policies
  }

  public init() {
    if (this.ctx || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<boolean>('globetrotter:mute-state-change', { detail: muted }));
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  // --- Sound Effects ---

  public playFootstep() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playJump() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.14);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playLand() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.09);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playCoin() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const playTone = (freq: number, delay: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.19);
    };

    playTone(987.77, 0); // B5
    playTone(1318.51, 0.06); // E6
  }

  public playGem() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66, 1760.0]; // D5, A5, D6, A6 arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const delay = idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.38);
    });
  }

  public playHit() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.2);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playShoot() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playPuzzleRotate() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(330, t + 0.1);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playPuzzleSolve() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Ancient temple bell chime (chords C4, G4, C5, E5)
    [261.63, 392.0, 523.25, 659.25].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const delay = idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 1.3);
    });
  }

  public playEngine() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.18);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playExplosion() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.48);
  }

  public playTimeWarp() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.7);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  public playArtifactHarmonic() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Divine harmonic resonance (C5, E5, G5, B5, D6)
    [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const delay = idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + delay);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 2.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 2.6);
    });
  }

  // --- Cinematic Ambient Background Music Tracks ---

  public stopMusic() {
    if (this.currentMusicNodes) {
      try {
        this.currentMusicNodes.stop();
      } catch (e) {
        // ignore
      }
      this.currentMusicNodes = null;
    }
    this.currentTrack = 'none';
  }

  public playMusic(trackName: 'menu' | 'tunnel' | 'puzzle' | 'chase' | 'flash' | 'combat' | 'temple') {
    if (this.currentTrack === trackName) return;
    this.stopMusic();
    this.init();
    if (!this.ctx || !this.musicGain) return;

    this.currentTrack = trackName;
    const t = this.ctx.currentTime;

    const oscs: OscillatorNode[] = [];
    const intervalIds: number[] = [];

    if (trackName === 'menu') {
      // Atmospheric mystery: Low drone + Indian modal flute-like pad (D minor / Bhairavi pentatonic)
      const baseFreqs = [73.42, 110.0, 146.83]; // D2, A2, D3
      baseFreqs.forEach((f) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.18 * this.musicVolume, t);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        oscs.push(osc);
      });

      // Periodic singing bowl chime
      const bellNotes = [293.66, 349.23, 440.0, 523.25];
      let bellIdx = 0;
      const bellInterval = window.setInterval(() => {
        if (!this.ctx || !this.musicGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(bellNotes[bellIdx % bellNotes.length], now);
        g.gain.setValueAtTime(0.15 * this.musicVolume, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 3.1);
        bellIdx++;
      }, 3500);
      intervalIds.push(bellInterval);
    } else if (trackName === 'tunnel') {
      // Subterranean tension: Pulsing low bass & echo drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, t); // A1
      gain.gain.setValueAtTime(0.12 * this.musicVolume, t);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      oscs.push(osc);

      const beat = window.setInterval(() => {
        if (!this.ctx || !this.musicGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(82.41, now); // E2
        o.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        g.gain.setValueAtTime(0.15 * this.musicVolume, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        o.connect(g);
        g.connect(this.musicGain);
        o.start(now);
        o.stop(now + 0.18);
      }, 750);
      intervalIds.push(beat);
    } else if (trackName === 'puzzle') {
      // Mystical ancient sanctum: Gentle shimmering major chords & meditation drone
      [130.81, 196.0, 261.63, 329.63].forEach((f) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.12 * this.musicVolume, t);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        oscs.push(osc);
      });
    } else if (trackName === 'chase') {
      // High-octane pursuit: Fast driving synth bassline (135 BPM)
      const bassNotes = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42];
      let step = 0;
      const chaseInterval = window.setInterval(() => {
        if (!this.ctx || !this.musicGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassNotes[step % bassNotes.length], now);
        gain.gain.setValueAtTime(0.22 * this.musicVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.2);
        step++;
      }, 220);
      intervalIds.push(chaseInterval);
    } else if (trackName === 'combat') {
      // Intense battle drums & brassy stabs
      const combatNotes = [73.42, 87.31, 98.0, 110.0];
      let step = 0;
      const combatInterval = window.setInterval(() => {
        if (!this.ctx || !this.musicGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(combatNotes[step % combatNotes.length], now);
        gain.gain.setValueAtTime(0.18 * this.musicVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.27);
        step++;
      }, 320);
      intervalIds.push(combatInterval);
    } else if (trackName === 'temple') {
      // Majestic sacred hymn: Warm choir-like organ pad & radiant golden chords
      const sacredChords = [
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [196.0, 246.94, 293.66, 392.0],  // G
        [220.0, 261.63, 329.63, 440.0],  // Am
        [261.63, 329.63, 392.0, 523.25], // C
      ];
      let chordIdx = 0;
      const templeInterval = window.setInterval(() => {
        if (!this.ctx || !this.musicGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const chord = sacredChords[chordIdx % sacredChords.length];
        chord.forEach((freq) => {
          if (!this.ctx || !this.musicGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.16 * this.musicVolume, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 4.9);
        });
        chordIdx++;
      }, 4500);
      intervalIds.push(templeInterval);
    }

    this.currentMusicNodes = {
      oscs,
      stop: () => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch (e) {
            // ignore
          }
        });
        intervalIds.forEach((id) => clearInterval(id));
      },
    };
  }
}

export const audioManager = new AudioManager();

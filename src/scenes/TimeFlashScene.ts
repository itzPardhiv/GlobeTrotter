/**
 * GlobeTrotter - Time-Travel Flash-Cut Interlude
 * Rapid cinematic montage traversing across 4 distinct eras:
 * Ancient Golden Age, Medieval Rites, 1920s Discovery, and Cosmic Futuristic Epoch.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';

interface EraSlide {
  era: string;
  year: string;
  themeColor: number;
  bgGradient: [number, number, number, number];
  icon: string;
  quote: string;
}

export class TimeFlashScene extends Phaser.Scene {
  private currentSlideIndex: number = 0;
  private slideContainer!: Phaser.GameObjects.Container;
  private chromaticOverlay!: Phaser.GameObjects.Rectangle;

  private eras: EraSlide[] = [
    {
      era: 'THE GOLDEN VEDIC EPOCH',
      year: '1400 BCE',
      themeColor: 0xffd700,
      bgGradient: [0x221504, 0x3d2707, 0x140d02, 0x0a0601],
      icon: '☸',
      quote: 'The Saptarishi forge the celestial core upon Mount Meru.',
    },
    {
      era: 'THE IMPERIAL SANCTUM RITES',
      year: '1025 CE',
      themeColor: 0xe056fd,
      bgGradient: [0x1a0628, 0x2e0c45, 0x0f0317, 0x07010a],
      icon: '🔱',
      quote: 'Chola architects seal the divine chambers with Sanskrit astrological ciphers.',
    },
    {
      era: 'THE EXPEDITION IN THE RUINS',
      year: '1928 CE',
      themeColor: 0x00f7ff,
      bgGradient: [0x05131e, 0x0a263d, 0x030a10, 0x020508],
      icon: '🧭',
      quote: 'The explorer triggers the harmonic frequency. The timeline shatters.',
    },
    {
      era: 'THE CELESTIAL OBSERVATORY',
      year: '3042 CE',
      themeColor: 0x68d391,
      bgGradient: [0x041810, 0x092e1e, 0x020e0a, 0x010705],
      icon: '✨',
      quote: 'Humanity reaches the stars — only to discover the relic already waiting.',
    },
  ];

  constructor() {
    super({ key: 'TimeFlashScene' });
  }

  public create() {
    this.currentSlideIndex = 0;
    this.hasFinished = false;
    audioManager.playTimeWarp();

    const w = this.scale.width;
    const h = this.scale.height;

    this.slideContainer = this.add.container(0, 0);

    // Full screen chromatic glitch overlay
    this.chromaticOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 0).setDepth(30);

    // Skip button in corner
    const skipBtn = this.add.text(w - 120, 36, '[ SKIP FLASH > ]', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(40);

    skipBtn.on('pointerdown', () => this.finishInterlude());
    this.input.keyboard?.on('keydown-SPACE', () => this.finishInterlude());

    // Begin montage sequence
    this.showNextEra();
  }

  private showNextEra() {
    if (this.hasFinished) return;
    if (this.currentSlideIndex >= this.eras.length) {
      this.finishInterlude();
      return;
    }

    const eraData = this.eras[this.currentSlideIndex];
    this.slideContainer.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;

    // Flash sound & screen distortion
    audioManager.playTimeWarp();
    this.triggerGlitchFlash(eraData.themeColor);

    // Layered Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      eraData.bgGradient[0],
      eraData.bgGradient[1],
      eraData.bgGradient[2],
      eraData.bgGradient[3],
      1
    );
    bg.fillRect(0, 0, w, h);

    // Sacred geometric mandala in center
    const mandala = this.add.graphics();
    mandala.lineStyle(2, eraData.themeColor, 0.4);
    for (let r = 50; r <= 280; r += 45) {
      mandala.strokeCircle(w / 2, h / 2, r);
    }
    // Rotating ray spokes
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mandala.beginPath();
      mandala.moveTo(w / 2, h / 2);
      mandala.lineTo(w / 2 + Math.cos(a) * 320, h / 2 + Math.sin(a) * 320);
      mandala.stroke();
    }

    // Sacred Icon Emblem
    const icon = this.add.text(w / 2, h * 0.38, eraData.icon, {
      fontSize: '64px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Year Subtitle
    const yearText = this.add.text(w / 2, h * 0.52, eraData.year, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffd700',
      letterSpacing: 6,
    }).setOrigin(0.5);

    // Era Title
    const eraText = this.add.text(w / 2, h * 0.58, eraData.era, {
      fontFamily: 'Cinzel, serif',
      fontSize: '32px',
      color: '#ffffff',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Narrative Quote
    const quoteText = this.add.text(w / 2, h * 0.68, `"${eraData.quote}"`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '18px',
      color: '#cbd5e1',
      align: 'center',
    }).setOrigin(0.5);

    this.slideContainer.add([bg, mandala, icon, yearText, eraText, quoteText]);

    // Zoom scale-in effect
    this.slideContainer.setScale(0.96);
    this.tweens.add({
      targets: this.slideContainer,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 2500,
      ease: 'Sine.easeOut',
    });

    this.currentSlideIndex++;
    this.time.delayedCall(2500, () => this.showNextEra());
  }

  private triggerGlitchFlash(color: number) {
    this.chromaticOverlay.setFillStyle(color, 0.45);
    this.tweens.add({
      targets: this.chromaticOverlay,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
    });
    this.cameras.main.shake(180, 0.01);
  }

  private hasFinished: boolean = false;
  private finishInterlude() {
    if (this.hasFinished) return;
    this.hasFinished = true;

    this.tweens.killTweensOf(this.slideContainer);
    this.tweens.killTweensOf(this.chromaticOverlay);

    // Transition into Level 4 Combat
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CombatScene');
    });
  }
}

import Phaser from 'phaser';
import { audioManager } from '../systems/PixelAudioManager';
import { saveManager } from '../systems/SaveManager';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('ResultsScene');
  }

  create() {
    const w = 640;
    const h = 360;

    audioManager.playVictory();

    // 1. Dark Ancient Vault Background with Gold Embers
    this.add.tileSprite(0, 0, w, h, 'bg_hypostyle_hall').setOrigin(0, 0);

    const fader = this.add.rectangle(w / 2, h / 2, w, h, 0x05070c, 0.78);

    if (this.textures.exists('fx_ember')) {
      this.add.particles(w / 2, h - 20, 'fx_ember', {
        lifespan: 3000,
        speedX: { min: -30, max: 30 },
        speedY: { min: -50, max: -20 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.8, end: 0 },
        frequency: 180,
      });
    }

    // 2. Central Results Scroll / Plaque
    const plaque = this.add.rectangle(w / 2, h / 2, 460, 290, 0x101522, 0.96);
    plaque.setStrokeStyle(2, 0xd4af37);

    // Decorative Header
    const title = this.add.text(w / 2, 60, 'LEVEL 1 EXPEDITION COMPLETE', {
      fontFamily: 'Cinzel, serif',
      fontSize: '20px',
      color: '#ffd700',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const subtitle = this.add.text(w / 2, 85, 'THE SUNKEN SANCTUM OF THE DECCAN', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#a89478',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // 3. 3-Star Rating Display
    const starsContainer = this.add.container(w / 2, 120);
    for (let s = -1; s <= 1; s++) {
      const star = this.add.text(s * 36, 0, '★', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#ffd700',
      }).setOrigin(0.5);
      starsContainer.add(star);
    }

    // 4. Score & Discovery Metrics Breakdown
    const metrics = [
      { label: 'ANCIENT SCRIPTURES DECIPHERED', val: '3 / 3 (100%)' },
      { label: 'CELESTIAL SURYA-CHAKRA DIALS', val: 'SOLVED (0°, 90°, 180°)' },
      { label: 'LEGENDARY RELIC RECOVERED', val: 'SURYA-CHAKRA (SOLAR DISC)' },
      { label: 'EXPLORATION XP AWARDED', val: '+1,500 XP' },
    ];

    metrics.forEach((m, idx) => {
      const y = 160 + idx * 24;
      this.add.text(w / 2 - 180, y, m.label, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '11px',
        color: '#b0a088',
        letterSpacing: 1,
      }).setOrigin(0, 0.5);

      this.add.text(w / 2 + 180, y, m.val, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '11px',
        color: '#ffd700',
        align: 'right',
      }).setOrigin(1, 0.5);
    });

    // 5. Action Buttons
    const btnReplay = this.createButton(w / 2 - 110, 280, 'REPLAY LEVEL 1', () => {
      this.scene.start('PreludeCinematicScene');
    });

    const btnMenu = this.createButton(w / 2 + 110, 280, 'MAIN MENU', () => {
      this.scene.start('MainMenuScene');
    });

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 190, 30, 0x1a2234);
    bg.setStrokeStyle(1, 0x8a7038);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#e8dcba',
      letterSpacing: 1,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x283857);
      text.setColor('#ffd700');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a2234);
      text.setColor('#e8dcba');
    });
    bg.on('pointerdown', () => {
      audioManager.playFootstep('stone');
      onClick();
    });

    container.add([bg, text]);
    return container;
  }
}

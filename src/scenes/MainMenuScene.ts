import Phaser from 'phaser';
import { audioManager } from '../systems/PixelAudioManager';
import { saveManager } from '../systems/SaveManager';

export class MainMenuScene extends Phaser.Scene {
  private skyLayer!: Phaser.GameObjects.TileSprite;
  private mtnLayer!: Phaser.GameObjects.TileSprite;
  private hillLayer!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('MainMenuScene');
  }

  create() {
    const w = 640;
    const h = 360;

    // 1. Multi-Layer Parallax Background
    this.skyLayer = this.add.tileSprite(0, 0, w, h, 'bg_dawn_sky').setOrigin(0, 0);
    this.mtnLayer = this.add.tileSprite(0, 0, w, h, 'bg_distant_mountains').setOrigin(0, 0);
    this.hillLayer = this.add.tileSprite(0, 0, w, h, 'bg_mid_hills').setOrigin(0, 0);

    // Subtle morning mist overlay
    const mist = this.add.rectangle(w / 2, h - 60, w, 80, 0xd8b584, 0.12);

    // Floating embers/dust
    if (this.textures.exists('fx_dust')) {
      this.add.particles(w / 2, h - 40, 'fx_dust', {
        lifespan: 3500,
        speedX: { min: -20, max: 20 },
        speedY: { min: -30, max: -10 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        frequency: 180,
      });
    }

    // 2. Title & Subtitle with Gold Shimmer
    const title = this.add.text(w / 2, 75, 'GLOBETROTTER', {
      fontFamily: 'Cinzel, serif',
      fontSize: '34px',
      color: '#ffd700',
      stroke: '#281a0e',
      strokeThickness: 5,
      letterSpacing: 4,
    }).setOrigin(0.5);

    const subtitle = this.add.text(w / 2, 110, 'THE LOST RELIC · PIXEL EDITION', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '13px',
      color: '#dfcaa0',
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: { from: 0.85, to: 1.0 },
      scale: { from: 0.99, to: 1.01 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Interactive Menu Buttons
    const buttons = [
      {
        label: 'BEGIN EXPEDITION (PRELUDE)',
        action: () => {
          audioManager.playDawnAmbience();
          this.scene.start('PreludeCinematicScene');
        },
      },
      {
        label: 'WILDERNESS CAMPSITE (SCENE 5)',
        action: () => {
          audioManager.playDawnAmbience();
          this.scene.start('WildernessScene');
        },
      },
      {
        label: 'SUNKEN SANCTUM & PUZZLE (LEVEL 1)',
        action: () => {
          audioManager.playRuinsAmbience();
          this.scene.start('RuinsDescentScene');
        },
      },
      {
        label: 'AUDIO: ACTIVE (TOGGLE MUTE)',
        isAudioBtn: true,
        action: (btn: any) => {
          const isMuted = audioManager.toggleMute();
          btn.text.setText(isMuted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE (TOGGLE MUTE)');
        },
      },
    ];

    buttons.forEach((b, idx) => {
      const y = 175 + idx * 38;
      const btn = this.createMenuButton(w / 2, y, b.label, () => b.action(btn));
    });

    // Footer credits
    this.add.text(w / 2, h - 20, 'AN AUTHENTIC INDIAN ADVENTURE · PRODUCED WITH AAA CINEMATIC CRAFTSMANSHIP', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      color: '#98876c',
      letterSpacing: 1,
    }).setOrigin(0.5);

    audioManager.playDawnAmbience();
  }

  private createMenuButton(x: number, y: number, label: string, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 310, 30, 0x101624, 0.9);
    bg.setStrokeStyle(1, 0x8a7038);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '13px',
      color: '#e8dcba',
      letterSpacing: 2,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x222e47, 0.98);
      bg.setStrokeStyle(2, 0xffd700);
      text.setColor('#ffd700');
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x101624, 0.9);
      bg.setStrokeStyle(1, 0x8a7038);
      text.setColor('#e8dcba');
    });

    bg.on('pointerdown', () => {
      audioManager.playFootstep('stone');
      onClick();
    });

    container.add([bg, text]);
    return { container, text };
  }

  update(time: number, delta: number) {
    const dt = delta * 0.001;
    this.skyLayer.tilePositionX += 2 * dt;
    this.mtnLayer.tilePositionX += 6 * dt;
    this.hillLayer.tilePositionX += 14 * dt;
  }
}

/**
 * GlobeTrotter - Results & Victory Scene
 * Epilogue debriefing screen celebrating expedition completion,
 * displaying collected relics and ratings.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  public create() {
    audioManager.playMusic('menu');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    const w = this.scale.width;
    const h = this.scale.height;

    // Atmospheric backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060912, 0x060912, 0x181e2e, 0x241d13, 1);
    bg.fillRect(0, 0, w, h);

    // Drifting gold particles
    if (this.textures.exists('particle_gold')) {
      this.add.particles(0, 0, 'particle_gold', {
        x: { min: 0, max: w },
        y: { min: 0, max: h },
        speedY: { min: -15, max: -40 },
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 3000,
        frequency: 140,
      });
    }

    const save = saveManager.get();

    // Central Victory Card
    const card = this.add.container(w / 2, h / 2);

    const panel = this.add.rectangle(0, 0, 680, 520, 0x0e131d, 0.94).setStrokeStyle(2, 0xd4af37);

    // Header Trophy Icon & Title
    const header = this.add.text(0, -210, 'EXPEDITION ACCOMPLISHED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffd700',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -170, 'GLOBETROTTER · THE LOST RELIC', {
      fontFamily: 'Cinzel, serif',
      fontSize: '16px',
      color: '#e2e8f0',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Radiant Artifact Centerpiece
    const relic = this.add.sprite(0, -75, 'lost_relic').setScale(1.1);
    this.tweens.add({
      targets: relic,
      angle: 360,
      duration: 12000,
      repeat: -1,
      ease: 'Linear',
    });

    // Rating Stars
    const stars = this.add.text(0, 15, '★ ★ ★', {
      fontSize: '32px',
      color: '#ffd700',
    }).setOrigin(0.5);

    // Debrief Narrative
    const narrative = this.add.text(0, 65,
      '"Through ancient subterranean tunnels, Vedic symbol chambers, and the canyon pursuit,\n' +
      'the explorer unsealed the grand sanctum and harmonized the celestial relic.\n' +
      'The sacred timeline is preserved."',
      {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '16px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 4,
      }
    ).setOrigin(0.5);

    // Stats Grid
    const stat1 = this.add.text(-180, 135, `GOLD COINS: ${save.coinsTotal}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '18px',
      color: '#ffd700',
    });
    const stat2 = this.add.text(40, 135, `SECRET GEMS: ${save.gemsTotal}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '18px',
      color: '#00f7ff',
    });

    // Action Buttons
    const createBtn = (x: number, y: number, label: string, onClick: () => void) => {
      const btn = this.add.rectangle(x, y, 220, 42, 0x182030).setStrokeStyle(1, 0xd4af37);
      const txt = this.add.text(x, y, label, {
        fontFamily: 'Cinzel, serif',
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(0.5);

      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        btn.setFillStyle(0x2a364f);
        txt.setColor('#ffd700');
      });
      btn.on('pointerout', () => {
        btn.setFillStyle(0x182030);
        txt.setColor('#ffffff');
      });
      btn.on('pointerdown', () => {
        audioManager.playCoin();
        onClick();
      });

      card.add([btn, txt]);
    };

    createBtn(-130, 205, 'PLAY AGAIN', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TunnelScene');
      });
    });

    createBtn(130, 205, 'MAIN MENU', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });

    card.add([panel, header, subtitle, relic, stars, narrative, stat1, stat2]);
  }
}

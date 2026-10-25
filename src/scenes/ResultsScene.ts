/**
 * GlobeTrotter - Results & Victory Scene
 * Epilogue debriefing screen celebrating expedition completion,
 * displaying collected relics and ratings.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

export interface ResultsData {
  levelNum?: number;
  levelName?: string;
  stars?: number;
  score?: number;
  xpEarned?: number;
  relicsCount?: number;
  discoveriesCount?: number;
  masteryCount?: number;
  deathsCount?: number;
  noDeathBonus?: boolean;
}

export class ResultsScene extends Phaser.Scene {
  private isTransitioning: boolean = false;
  private resultsData: ResultsData = {};

  constructor() {
    super({ key: 'ResultsScene' });
  }

  public init(data?: ResultsData) {
    if (data) {
      this.resultsData = data;
    }
  }

  public create() {
    this.isTransitioning = false;
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
    const data = this.resultsData;
    const starsEarned = data.stars || save.levelStars[data.levelNum || 1] || 1;
    const levelScore = data.score !== undefined ? data.score : 85;
    const xpEarned = data.xpEarned || 215;

    // Central Victory Card
    const card = this.add.container(w / 2, h / 2);

    const panel = this.add.rectangle(0, 0, 720, 560, 0x0e131d, 0.96).setStrokeStyle(2, 0xd4af37);

    // Header Trophy Icon & Title
    const header = this.add.text(0, -235, 'EXPEDITION ACCOMPLISHED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffd700',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -200, data.levelName || 'CHAPTER I · THE SUNKEN TUNNEL', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#00f7ff',
      letterSpacing: 3,
    }).setOrigin(0.5);

    // Radiant Artifact Centerpiece
    const relic = this.add.sprite(0, -115, 'lost_relic').setScale(1.15);
    this.tweens.add({
      targets: relic,
      angle: 360,
      duration: 12000,
      repeat: -1,
      ease: 'Linear',
    });

    // Rating Stars (Calculated via S = 0.40P + 0.30D + 0.30M)
    const starString = starsEarned === 3 ? '★ ★ ★' : starsEarned === 2 ? '★ ★ ☆' : '★ ☆ ☆';
    const stars = this.add.text(0, -35, starString, {
      fontSize: '34px',
      color: '#ffd700',
    }).setOrigin(0.5);

    const ratingNote = this.add.text(0, 0, `MASTERY SCORE: ${Math.round(levelScore)}/100 · ${starsEarned} STARS EARNED`, {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#a0aec0',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Debrief Narrative
    const narrative = this.add.text(0, 40,
      '"Rudhra traversed the ancient subterranean ruins, awakened the monumental solar mechanism,\n' +
      'and unsealed the pathway to the lost jungle sanctuary."',
      {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '15px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 3,
      }
    ).setOrigin(0.5);

    // Stats Grid Container
    const gridY = 105;
    const stat1 = this.add.text(-220, gridY, `EXPEDITION XP: +${xpEarned}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffd700',
    });
    const stat2 = this.add.text(40, gridY, `TOTAL XP: ${save.totalXp} XP`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#00f7ff',
    });

    const stat3 = this.add.text(-220, gridY + 30, `RELICS SECURED: ${data.relicsCount !== undefined ? data.relicsCount : save.collectedRelicIds?.length || 1}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      color: '#e2e8f0',
    });
    const stat4 = this.add.text(40, gridY + 30, `DISCOVERIES: ${data.discoveriesCount !== undefined ? data.discoveriesCount : 4} / 5 FOUND`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      color: '#e2e8f0',
    });

    const bonusMsg = data.noDeathBonus
      ? '★ PERFECT RUN: NO DEATHS (+50 BONUS XP EARNED)'
      : `EXPEDITION CASUALTIES: ${data.deathsCount || 0}`;
    const statBonus = this.add.text(0, gridY + 68, bonusMsg, {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: data.noDeathBonus ? '#ffd700' : '#a0aec0',
    }).setOrigin(0.5);

    // Action Buttons
    const createBtn = (x: number, y: number, width: number, label: string, onClick: () => void, isPrimary: boolean = false) => {
      const btn = this.add.rectangle(x, y, width, 40, isPrimary ? 0x223348 : 0x141a26).setStrokeStyle(1.5, isPrimary ? 0x00f7ff : 0xd4af37);
      const txt = this.add.text(x, y, label, {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: isPrimary ? '#00f7ff' : '#ffffff',
      }).setOrigin(0.5);

      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        btn.setFillStyle(0x2a3e5c);
        txt.setColor('#ffd700');
      });
      btn.on('pointerout', () => {
        btn.setFillStyle(isPrimary ? 0x223348 : 0x141a26);
        txt.setColor(isPrimary ? '#00f7ff' : '#ffffff');
      });
      btn.on('pointerdown', () => {
        audioManager.playCoin();
        onClick();
      });

      card.add([btn, txt]);
    };

    // Button Row: [REPLAY EXPEDITION] [CONTINUE TO CHAPTER II] [MAIN MENU]
    createBtn(-220, 225, 180, 'REPLAY LEVEL', () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TunnelScene');
      });
    });

    createBtn(0, 225, 210, 'CONTINUE CHAPTER II', () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PuzzleScene');
      });
    }, true);

    createBtn(220, 225, 180, 'MAIN MENU', () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });

    card.add([panel, header, subtitle, relic, stars, ratingNote, narrative, stat1, stat2, stat3, stat4, statBonus]);
  }
}

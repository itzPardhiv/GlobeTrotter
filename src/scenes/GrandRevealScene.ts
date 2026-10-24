/**
 * GlobeTrotter - Level 5: The Grand Reveal
 * Emotional and visual climax: Sacred Indian temple sanctum,
 * monumental golden statues of Hindu deities, volumetric sunbeam shafts,
 * floating golden dust, the radiant hovering Lost Relic, and the final ascension.
 */

import Phaser from 'phaser';
import confetti from 'canvas-confetti';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

export class GrandRevealScene extends Phaser.Scene {
  private relicSprite!: Phaser.GameObjects.Sprite;
  private explorerSprite!: Phaser.GameObjects.Sprite;
  private sunbeam!: Phaser.GameObjects.Image;
  private interactKeyPrompt!: Phaser.GameObjects.Container;

  private isCinematicPlaying: boolean = true;
  private isRelicClaimed: boolean = false;
  private goldDustParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'GrandRevealScene' });
  }

  public create() {
    this.isCinematicPlaying = true;
    this.isRelicClaimed = false;

    audioManager.playMusic('temple');
    this.cameras.main.fadeIn(1200, 0, 0, 0);

    const w = this.scale.width;
    const h = this.scale.height;

    // 1. Deep Grand Temple Hall Atmosphere
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x05070e, 0x05070e, 0x161c28, 0x1c170e, 1);
    bg.fillRect(0, 0, w, h);

    // Distant Temple Wall Carvings & Golden Niches
    const niches = this.add.graphics();
    niches.fillStyle(0x0c111c, 0.9);
    for (let x = 60; x < w; x += 220) {
      niches.fillRect(x, 180, 160, 340);
      niches.lineStyle(2, 0x3d301c);
      niches.strokeRect(x, 180, 160, 340);
    }

    // 2. Colossal Stone Columns flanking the sacred aisle using uploaded authentic pillars
    const colLeft1 = this.add.image(140, 360, 'asset_pillar_intact').setScale(1.6).setTint(0x7c6952);
    const colLeft2 = this.add.image(280, 360, 'asset_pillar_intact').setScale(1.35).setTint(0x5a4a38);
    const colRight1 = this.add.image(w - 140, 360, 'asset_pillar_intact').setScale(1.6).setTint(0x7c6952);
    const colRight2 = this.add.image(w - 280, 360, 'asset_pillar_intact').setScale(1.35).setTint(0x5a4a38);

    // Overhead Sacred Torana Arch above the deities
    this.add.image(w / 2, 120, 'asset_arch_ornate').setScale(1.8).setTint(0xd4af37);

    // 3. Sacred Golden Statues of Hindu Deities (Arranged in respectful architectural majesty)
    // Left: Lord Shiva Nataraja (dancing cosmic harmony)
    const statueShiva = this.add.image(220, 420, 'statue_shiva').setScale(1.15).setDepth(4);
    // Far Left: Lord Ganesha (auspicious remover of obstacles)
    const statueGanesha = this.add.image(80, 440, 'statue_ganesha').setScale(0.95).setDepth(3);

    // Right: Lord Vishnu (peaceful divine preservation)
    const statueVishnu = this.add.image(w - 220, 420, 'statue_vishnu').setScale(1.15).setDepth(4);
    // Far Right: Goddess Lakshmi (divine grace & illumination)
    const statueGaneshaRight = this.add.image(w - 80, 440, 'statue_ganesha').setScale(0.95).setDepth(3).setFlipX(true);

    // Golden Aura Glow behind statues
    [statueShiva, statueVishnu].forEach((st) => {
      this.tweens.add({
        targets: st,
        scaleX: st.scaleX * 1.02,
        scaleY: st.scaleY * 1.02,
        duration: 2800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // 4. Temple Dais and Grand Altar in Center
    const dais = this.add.graphics();
    dais.fillStyle(0x1a150e, 1);
    dais.beginPath();
    dais.moveTo(w / 2 - 240, h - 60);
    dais.lineTo(w / 2 - 160, 520);
    dais.lineTo(w / 2 + 160, 520);
    dais.lineTo(w / 2 + 240, h - 60);
    dais.closePath();
    dais.fill();
    dais.lineStyle(3, 0xd4af37);
    dais.stroke();

    // Sacred Floor Masonry using carved lotus platform beams
    for (let x = 0; x < w; x += 260) {
      const segWidth = Math.min(260, w - x);
      const plat = this.add.image(x + segWidth / 2, h - 22, 'asset_platform_long');
      plat.setDisplaySize(segWidth, 42);
      plat.setTint(0x5a4632);
    }

    // Altar Table
    this.add.image(w / 2, 510, 'relic_altar').setScale(1.3).setDepth(5);

    // 5. Volumetric Sunlight Shaft Streaming from High Oculus Dome
    this.sunbeam = this.add.image(w / 2, 250, 'sunlight_shaft').setScale(1.8).setDepth(6);
    this.sunbeam.setAlpha(0.65);
    this.tweens.add({
      targets: this.sunbeam,
      alpha: { from: 0.55, to: 0.8 },
      scaleX: { from: 1.75, to: 1.9 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 6. The Radiant Hovering Lost Relic
    this.relicSprite = this.add.sprite(w / 2, 380, 'lost_relic').setScale(1.2).setDepth(8);

    // Floating and slow majestic rotation
    this.tweens.add({
      targets: this.relicSprite,
      y: 360,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.relicSprite,
      angle: 360,
      duration: 16000,
      repeat: -1,
      ease: 'Linear',
    });

    // 7. Golden Dust Motes floating in sunlight
    if (this.textures.exists('particle_gold')) {
      this.goldDustParticles = this.add.particles(0, 0, 'particle_gold', {
        x: { min: w / 2 - 120, max: w / 2 + 120 },
        y: { min: 60, max: 540 },
        speedY: { min: -10, max: 20 },
        speedX: { min: -15, max: 15 },
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 4000,
        frequency: 80,
      });
      this.goldDustParticles.setDepth(7);
    }

    // 8. Explorer character walking slowly into the grand sanctum
    this.explorerSprite = this.add.sprite(180, 580, 'explorer_sheet', 0).setScale(1.6).setDepth(10);
    this.explorerSprite.setAlpha(0);

    // 9. Interactive Prompt: [E] CLAIM THE LOST RELIC
    this.interactKeyPrompt = this.add.container(w / 2, 460).setDepth(20).setVisible(false);
    const pBg = this.add.rectangle(0, 0, 260, 44, 0x111624, 0.95).setStrokeStyle(2, 0xffd700);
    const pTxt = this.add.text(0, 0, '[E] CLAIM THE LOST RELIC', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#ffd700',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.interactKeyPrompt.add([pBg, pTxt]);

    // Make clickable
    pBg.setInteractive({ useHandCursor: true });
    pBg.on('pointerdown', () => this.claimArtifact());

    // Skip button for cinematic
    const skipBtn = this.add.text(w - 120, 36, '[ SKIP INTRO > ]', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#bfa15f',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(30);

    skipBtn.on('pointerdown', () => this.skipCinematic());

    // Begin Cinematic Walk Sequence
    this.startRevealCinematic();

    // Input listener
    this.input.keyboard?.on('keydown-E', () => {
      if (!this.isCinematicPlaying && !this.isRelicClaimed) {
        this.claimArtifact();
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.isCinematicPlaying && !this.isRelicClaimed) {
        this.claimArtifact();
      }
    });
  }

  private startRevealCinematic() {
    const w = this.scale.width;

    // Fade in explorer & walk to altar
    this.tweens.add({
      targets: this.explorerSprite,
      alpha: 1,
      duration: 600,
    });

    this.explorerSprite.play('explorer_run');

    this.tweens.add({
      targets: this.explorerSprite,
      x: w / 2 - 80,
      duration: 4500,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.explorerSprite.play('explorer_idle');
        this.isCinematicPlaying = false;

        // Show prompt
        this.interactKeyPrompt.setVisible(true);
        this.tweens.add({
          targets: this.interactKeyPrompt,
          scaleX: { from: 0.9, to: 1.05 },
          scaleY: { from: 0.9, to: 1.05 },
          duration: 600,
          yoyo: true,
          repeat: -1,
        });

        // Subtitle
        this.add.text(w / 2, this.scale.height - 30, 'STEP FORWARD AND HARNESS THE CELESTIAL SOURCE', {
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '16px',
          color: '#e2e8f0',
        }).setOrigin(0.5);
      },
    });
  }

  private skipCinematic() {
    this.tweens.killTweensOf(this.explorerSprite);
    this.explorerSprite.setAlpha(1);
    this.explorerSprite.setPosition(this.scale.width / 2 - 80, 580);
    this.explorerSprite.play('explorer_idle');
    this.isCinematicPlaying = false;
    this.interactKeyPrompt.setVisible(true);
  }

  private claimArtifact() {
    if (this.isRelicClaimed) return;
    this.isRelicClaimed = true;
    this.interactKeyPrompt.setVisible(false);

    audioManager.playArtifactHarmonic();

    // Trigger Canvas Confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#ffd700', '#00f7ff', '#ffae19', '#ffffff'],
      });
    } catch (e) {
      // ignore
    }

    // Relic intensifies and descends into explorer's hands
    this.tweens.add({
      targets: this.relicSprite,
      x: this.explorerSprite.x + 20,
      y: this.explorerSprite.y - 30,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1600,
      ease: 'Power2.easeOut',
    });

    // Blinding divine golden pulse
    const flash = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0xfff5cc,
      0
    ).setDepth(50);

    this.tweens.add({
      targets: flash,
      alpha: 0.95,
      duration: 1800,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        saveManager.setLevelComplete(5, 5000, 3);
        this.cameras.main.fadeOut(800, 255, 255, 255);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('ResultsScene');
        });
      },
    });
  }
}

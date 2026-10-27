import Phaser from 'phaser';
import { ExpeditionJeep } from '../entities/ExpeditionJeep';
import { audioManager } from '../systems/PixelAudioManager';

export class PreludeCinematicScene extends Phaser.Scene {
  private skyLayer!: Phaser.GameObjects.TileSprite;
  private mtnLayer!: Phaser.GameObjects.TileSprite;
  private hillLayer!: Phaser.GameObjects.TileSprite;
  private roadPlinth!: Phaser.GameObjects.Rectangle;
  private jeep!: ExpeditionJeep;
  private cinematicStep: number = 1;
  private stateTimer: number = 0;
  private captionBanner!: Phaser.GameObjects.Container;
  private captionText!: Phaser.GameObjects.Text;
  private birdsGroup!: Phaser.GameObjects.Group;

  constructor() {
    super('PreludeCinematicScene');
  }

  create() {
    const w = 640;
    const h = 360;
    this.cinematicStep = 1;
    this.stateTimer = 0;

    audioManager.playDawnAmbience();

    // ── 1. Parallax Backdrop ─────────────────────────────────────────────────
    this.skyLayer = this.add.tileSprite(0, 0, w, h, 'bg_dawn_sky').setOrigin(0, 0);
    this.mtnLayer = this.add.tileSprite(0, 0, w, h, 'bg_distant_mountains').setOrigin(0, 0);
    this.hillLayer = this.add.tileSprite(0, 0, w, h, 'bg_mid_hills').setOrigin(0, 0);

    // Winding dirt road ground plinth
    this.roadPlinth = this.add.rectangle(w / 2, h - 25, w, 50, 0x3d2d1c);
    // Road texture details: tire tracks
    const track1 = this.add.rectangle(w / 2, h - 35, w, 3, 0x271c10);
    const track2 = this.add.rectangle(w / 2, h - 18, w, 3, 0x271c10);

    // Dense foreground foliage silhouettes framing the cinematic
    const fgTreeLeft = this.add.rectangle(20, h / 2, 60, h, 0x0c140e, 0.95);
    const fgTreeRight = this.add.rectangle(w - 20, h / 2, 60, h, 0x0c140e, 0.95);

    // ── 2. Birds Flying across Sky ───────────────────────────────────────────
    this.birdsGroup = this.add.group();
    for (let i = 0; i < 4; i++) {
      const bird = this.add.text(w + i * 45, 90 + i * 16, 'v', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#1a1410',
      });
      this.birdsGroup.add(bird);
    }

    // ── 3. The Expedition Jeep Entity ────────────────────────────────────────
    this.jeep = new ExpeditionJeep(this, -80, h - 55);
    this.jeep.velocityX = 110;
    audioManager.startJeepSound();

    // ── 4. Cinematic Caption & Subtitle Banner ────────────────────────────────
    this.captionBanner = this.add.container(w / 2, 38).setDepth(80);
    const capBg = this.add.rectangle(0, 0, 480, 26, 0x070c14, 0.88);
    capBg.setStrokeStyle(1, 0x7c6536);
    this.captionText = this.add.text(0, 0, 'SCENE 1: BEFORE SUNRISE — THE DECCAN MOUNTAIN FRONTIER', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#ffd700',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.captionBanner.add([capBg, this.captionText]);

    // Skip Prompt
    const skipText = this.add.text(w - 18, h - 16, '[SPACE] SKIP PROLOGUE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      color: '#b09e7c',
    }).setOrigin(1, 0.5).setDepth(85);

    // Initial fade from deep dawn darkness
    const fader = this.add.rectangle(w / 2, h / 2, w, h, 0x05070c).setDepth(90);
    this.tweens.add({
      targets: fader,
      alpha: 0,
      duration: 1800,
      onComplete: () => fader.destroy(),
    });

    // Skip on Space or Enter
    this.input.keyboard?.on('keydown-SPACE', () => this.completeCinematic());
    this.input.keyboard?.on('keydown-ENTER', () => this.completeCinematic());
  }

  update(time: number, delta: number) {
    const dt = delta * 0.001;
    this.stateTimer += dt;

    // Animate parallax
    this.skyLayer.tilePositionX += 6 * dt;
    this.mtnLayer.tilePositionX += 14 * dt;
    this.hillLayer.tilePositionX += 34 * dt;

    // Animate birds
    this.birdsGroup.getChildren().forEach((b: any) => {
      b.x -= 70 * dt;
      b.y += Math.sin(this.stateTimer * 4.0 + b.x) * 0.3;
      if (b.x < -20) b.x = 660;
    });

    this.jeep.updateJeep(time, delta);

    // Cinematic State Machine Timing
    if (this.cinematicStep === 1) {
      // Scene 1: Vista reveal
      if (this.stateTimer > 4.0) {
        this.cinematicStep = 2;
        this.captionText.setText('SCENE 2: EXPEDITION JEEP APPROACHING DEEP JUNGLE TRAIL');
      }
    } else if (this.cinematicStep === 2) {
      // Scene 2: Jeep cruising
      if (this.jeep.x > 260) {
        this.cinematicStep = 3;
        this.captionText.setText('SCENE 3: RUDHRA — EXPEDITION LEADER & ANCIENT HISTORIAN');
      }
    } else if (this.cinematicStep === 3) {
      // Scene 3: Approaching ruins
      if (this.jeep.x > 380) {
        this.cinematicStep = 4;
        this.captionText.setText('SCENE 4: EXPEDITION ARRIVAL AT EXCAVATION SITE');
        this.jeep.stopAndSettle(() => {
          this.time.delayedCall(1200, () => {
            this.completeCinematic();
          });
        });
      }
    }
  }

  public completeCinematic() {
    audioManager.stopJeepSound();
    const fader = this.add.rectangle(320, 180, 640, 360, 0x05070c, 0).setDepth(99);
    this.tweens.add({
      targets: fader,
      alpha: 1,
      duration: 700,
      onComplete: () => {
        this.scene.start('WildernessScene');
      },
    });
  }
}

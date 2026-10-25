/**
 * GlobeTrotter - Level 2: The Puzzle Chamber
 * Deterministic symbol-alignment puzzle with ancient rotating stone dials,
 * wall clue tablets, golden door unlocking cinematic, and escape portal.
 */

import Phaser from 'phaser';
import { Explorer } from '../entities/Explorer';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

interface PuzzleDial {
  id: string;
  name: string;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  currentAngle: number;
  targetAngle: number;
  isRotating: boolean;
  lockLight: Phaser.GameObjects.Arc;
}

export class PuzzleScene extends Phaser.Scene {
  private player!: Explorer;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private dials: PuzzleDial[] = [];
  private isPuzzleSolved: boolean = false;
  private doorOpeningTween?: Phaser.Tweens.Tween;
  private vaultDoor!: Phaser.GameObjects.Rectangle;
  private hintText!: Phaser.GameObjects.Text;
  private interactPrompt!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'PuzzleScene' });
  }

  public create() {
    this.isPuzzleSolved = false;
    this.hasProceeded = false;
    this.dials = [];

    audioManager.playMusic('puzzle');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    const w = this.scale.width;
    const h = this.scale.height;

    // 1. Atmosphere & Background Architecture
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080c16, 0x080c16, 0x141a29, 0x1a150e, 1);
    bg.fillRect(0, 0, w, h);

    // Temple Pillars framing the chamber using authentic intact pillars
    this.add.image(100, 360, 'asset_pillar_intact').setScale(1.4).setTint(0x7c6952);
    this.add.image(w - 100, 360, 'asset_pillar_intact').setScale(1.4).setTint(0x7c6952);
    this.add.image(w * 0.28, 360, 'asset_pillar_intact').setScale(1.15).setTint(0x4a3d2e);
    this.add.image(w * 0.72, 360, 'asset_pillar_intact').setScale(1.15).setTint(0x4a3d2e);

    // Overhead Ornate Torana Arch
    this.add.image(w / 2, 190, 'asset_arch_ornate').setScale(1.4).setTint(0xbfa15f);

    // Wall Torches
    const t1 = this.add.image(220, 240, 'asset_torch').setScale(1.3).setTint(0x9a8366);
    const t2 = this.add.image(w - 220, 240, 'asset_torch').setScale(1.3).setTint(0x9a8366);
    this.tweens.add({ targets: [t1, t2], alpha: { from: 0.8, to: 1 }, duration: 200, yoyo: true, repeat: -1 });

    // 2. Central Sealed Vault Doorway (Behind the altar)
    const doorFrame = this.add.graphics();
    doorFrame.fillStyle(0x0c0f18, 1);
    doorFrame.fillRect(w / 2 - 100, 200, 200, 320);
    doorFrame.lineStyle(6, 0xd4af37);
    doorFrame.strokeRect(w / 2 - 100, 200, 200, 320);

    // The Sliding Stone Vault Door
    this.vaultDoor = this.add.rectangle(w / 2, 360, 190, 310, 0x221a12).setStrokeStyle(2, 0x8c6d32);

    // Carved Vault Emblems on Door with Sanskrit header
    const doorDeco = this.add.text(w / 2, 340, '॥ सूर्य चक्र ॥\nCELESTIAL LOCK', {
      fontFamily: 'Cinzel, serif',
      fontSize: '20px',
      color: '#d4af37',
      align: 'center',
    }).setOrigin(0.5);

    // 3. Ground Platforms using carved lotus platform beams
    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x < w; x += 260) {
      const segWidth = Math.min(260, w - x);
      const plat = this.platforms.create(x + segWidth / 2, h - 22, 'asset_platform_long');
      plat.setDisplaySize(segWidth, 42);
      plat.refreshBody();
    }

    // Altar dais in center
    const dais = this.platforms.create(w / 2, 530, 'asset_platform_long');
    dais.setScale(1.4, 1).refreshBody();

    // Stepped stone platforms to ascend to altar dais (eliminating softlock)
    // Left steps ascending from floor (y=677) to dais (y=471.5)
    // Positioned outside dais boundary (dais x: 262 to 1018) for clear vertical headroom
    const step1L = this.platforms.create(100, 620, 'asset_platform_short');
    step1L.setDisplaySize(120, 36).refreshBody();

    const step2L = this.platforms.create(195, 545, 'asset_platform_short');
    step2L.setDisplaySize(120, 36).refreshBody();

    // Right steps (symmetrical access)
    const step2R = this.platforms.create(w - 195, 545, 'asset_platform_short');
    step2R.setDisplaySize(120, 36).refreshBody();

    const step1R = this.platforms.create(w - 100, 620, 'asset_platform_short');
    step1R.setDisplaySize(120, 36).refreshBody();

    // 4. Wall Clue Tablet on left wall
    const tablet = this.add.image(200, 420, 'puzzle_clue_tablet').setScale(0.9);
    tablet.setInteractive({ useHandCursor: true });
    tablet.on('pointerdown', () => {
      audioManager.playFootstep();
      this.toggleHint();
    });

    // 5. The Three Rotating Relic Dials
    // Dial 1: Sun (x: 420, target 0 deg)
    // Dial 2: Lotus (x: 640, target 90 deg)
    // Dial 3: Trishula (x: 860, target 180 deg)
    const dialConfigs = [
      { id: 'sun', name: 'Surya Sun Dial', x: 440, y: 440, target: 0, initial: 180 },
      { id: 'lotus', name: 'Padma Lotus Dial', x: 640, y: 420, target: 90, initial: 270 },
      { id: 'trishula', name: 'Trishula Dial', x: 840, y: 440, target: 180, initial: 90 },
    ];

    dialConfigs.forEach((cfg) => {
      const container = this.add.container(cfg.x, cfg.y);

      // Stone stand base
      const stand = this.add.rectangle(0, 50, 24, 60, 0x362c20).setStrokeStyle(1, 0x8b6f4e);

      // Dial sprite
      const sprite = this.add.sprite(0, 0, `puzzle_dial_${cfg.id}`).setScale(0.95);
      sprite.angle = cfg.initial;

      // Indicator Lock Gem on dial rim
      const lockLight = this.add.circle(0, -38, 5, 0x444444);

      // Key prompt badge
      const badge = this.add.rectangle(0, -56, 32, 20, 0x111624, 0.9).setStrokeStyle(1, 0xd4af37);
      const badgeTxt = this.add.text(0, -56, '[E]', {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '12px',
        color: '#ffd700',
      }).setOrigin(0.5);

      container.add([stand, sprite, lockLight, badge, badgeTxt]);

      // Make clickable
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        this.rotateDial(dial);
      });

      const dial: PuzzleDial = {
        id: cfg.id,
        name: cfg.name,
        container,
        sprite,
        currentAngle: cfg.initial,
        targetAngle: cfg.target,
        isRotating: false,
        lockLight,
      };

      this.dials.push(dial);
    });

    // 6. Player Explorer
    this.player = new Explorer(this, 180, 520);
    this.physics.add.collider(this.player, this.platforms);

    // 7. Interaction Prompt Floating UI
    this.interactPrompt = this.add.container(0, 0).setVisible(false).setDepth(40);
    const pBg = this.add.rectangle(0, 0, 180, 32, 0x0d121c, 0.95).setStrokeStyle(1, 0xd4af37);
    const pTxt = this.add.text(0, 0, 'PRESS [E] OR CLICK', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#ffd700',
    }).setOrigin(0.5);
    this.interactPrompt.add([pBg, pTxt]);

    // 8. Hint Banner at bottom
    this.hintText = this.add.text(w / 2, h - 34,
      'CLUE: Inspect the wall tablet. Align all three seals according to the Vedic Triad.', {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '15px',
        color: '#bfa15f',
      }
    ).setOrigin(0.5);

    // E key handler for interaction
    this.input.keyboard?.on('keydown-E', () => {
      this.handleNearbyInteraction();
    });

    // HUD Header
    this.add.text(24, 24, 'CHAPTER II · THE PUZZLE CHAMBER', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#d4af37',
      letterSpacing: 2,
    });

    // Pause key: ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.launch('PauseScene', { returnTo: 'PuzzleScene' });
      this.scene.pause();
    });
  }

  public update(time: number, delta: number) {
    if (this.player) {
      this.player.update(time, delta);

      // Check proximity to dials (accounting for vertical position on altar dais)
      let nearDial: PuzzleDial | null = null;
      for (const d of this.dials) {
        if (Math.abs(this.player.x - d.container.x) < 65 && Math.abs(this.player.y - d.container.y) < 90) {
          nearDial = d;
          break;
        }
      }

      if (nearDial && !this.isPuzzleSolved) {
        this.interactPrompt.setVisible(true);
        this.interactPrompt.setPosition(nearDial.container.x, nearDial.container.y - 70);
      } else {
        this.interactPrompt.setVisible(false);
      }
    }
  }

  private handleNearbyInteraction() {
    if (this.isPuzzleSolved) return;
    for (const d of this.dials) {
      if (Math.abs(this.player.x - d.container.x) < 65 && Math.abs(this.player.y - d.container.y) < 90) {
        this.rotateDial(d);
        break;
      }
    }
  }

  private rotateDial(dial: PuzzleDial) {
    if (dial.isRotating || this.isPuzzleSolved) return;

    dial.isRotating = true;
    audioManager.playPuzzleRotate();

    const newAngle = (dial.currentAngle + 90) % 360;
    dial.currentAngle = newAngle;

    this.tweens.add({
      targets: dial.sprite,
      angle: dial.sprite.angle + 90,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        dial.isRotating = false;

        // Check if this dial is in correct position
        const isAligned = dial.currentAngle === dial.targetAngle;
        dial.lockLight.setFillStyle(isAligned ? 0x00f7ff : 0x444444);

        if (isAligned) {
          audioManager.playCoin();
        }

        this.checkAllDials();
      },
    });
  }

  private checkAllDials() {
    const allCorrect = this.dials.every((d) => d.currentAngle === d.targetAngle);
    if (allCorrect && !this.isPuzzleSolved) {
      this.solvePuzzle();
    }
  }

  private solvePuzzle() {
    this.isPuzzleSolved = true;
    audioManager.playPuzzleSolve();

    // Camera shake & rumble
    this.cameras.main.shake(1200, 0.012);

    this.hintText.setText('VAULT SEAL UNLOCKED! THE SECRET PURSUIT TUNNEL IS OPEN!');
    this.hintText.setColor('#00f7ff');

    // Light beam from vault door
    const beam = this.add.graphics();
    beam.fillGradientStyle(0xffd700, 0xffd700, 0x000000, 0x000000, 0.6, 0.6, 0, 0);
    beam.fillRect(this.scale.width / 2 - 90, 210, 180, 300);

    // Vault door slides upward into ceiling
    this.doorOpeningTween = this.tweens.add({
      targets: this.vaultDoor,
      y: 120,
      duration: 1800,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // Vehicle exit trigger zone (sized to reliably trigger when entering the doorway on the dais)
        const exitTrigger = this.add.zone(this.scale.width / 2, 430, 160, 220);
        this.physics.add.existing(exitTrigger, true);
        this.physics.add.overlap(this.player, exitTrigger, () => {
          this.proceedToCarChase();
        });
      },
    });
  }

  private toggleHint() {
    this.hintText.setText('SOLAR DISK: UP (0°) · LOTUS: RIGHT (90°) · TRIDENT: DOWN (180°)');
    this.hintText.setColor('#ffd700');
  }

  private hasProceeded: boolean = false;
  private proceedToCarChase() {
    if (this.hasProceeded) return;
    this.hasProceeded = true;
    saveManager.setLevelComplete(2, 500);

    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ChaseScene');
    });
  }
}

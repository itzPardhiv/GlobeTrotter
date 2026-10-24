/**
 * GlobeTrotter - Cinematic Prologue Intro Scene
 * Atmospheric introduction establishing the explorer's arrival at the forgotten ruins.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  public create() {
    this.hasProceeded = false;
    const w = this.scale.width;
    const h = this.scale.height;

    audioManager.playMusic('menu');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Deep subterranean cave entrance background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x04060a, 0x04060a, 0x111622, 0x18130f, 1);
    bg.fillRect(0, 0, w, h);

    // Ancient stone archway framing
    this.add.image(120, h * 0.5, 'temple_pillar').setScale(1.5).setTint(0x33281e);
    this.add.image(w - 120, h * 0.5, 'temple_pillar').setScale(1.5).setTint(0x33281e);

    // Cave floor with ancient stone masonry
    for (let x = 0; x < w; x += 64) {
      this.add.image(x + 32, h - 32, 'stone_tile').setTint(0x554433);
    }

    // Torch on wall flickers
    const torch = this.add.image(w * 0.65, h * 0.42, 'torch_sconce').setScale(1.4);
    this.tweens.add({
      targets: torch,
      alpha: { from: 0.85, to: 1 },
      scaleX: { from: 1.35, to: 1.45 },
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // Explorer walking in from the left
    const explorer = this.add.sprite(-40, h - 90, 'explorer_sheet', 2).setScale(1.8);
    if (!this.anims.exists('intro_walk')) {
      this.anims.create({
        key: 'intro_walk',
        frames: this.anims.generateFrameNumbers('explorer_sheet', { start: 2, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    explorer.play('intro_walk');

    // Walk into scene
    this.tweens.add({
      targets: explorer,
      x: w * 0.38,
      duration: 3200,
      ease: 'Power1',
      onComplete: () => {
        explorer.anims.stop();
        explorer.setFrame(0); // idle looking at ruins
        audioManager.playPuzzleSolve();

        // Reveal the ancient carved threshold inscription
        narrativeBox.setVisible(true);
        this.tweens.add({
          targets: narrativeBox,
          alpha: { from: 0, to: 1 },
          duration: 600,
        });
      },
    });

    // Narrative dialogue card
    const narrativeBox = this.add.container(w / 2, h * 0.32);
    narrativeBox.setVisible(false);
    narrativeBox.setAlpha(0);

    const boxBg = this.add.rectangle(0, 0, 740, 165, 0x0c111c, 0.94).setStrokeStyle(2, 0xd4af37);
    const dateText = this.add.text(-330, -56, 'SUBTERRANEAN MANDAPAS — THE SUNKEN THRESHOLD · 1928', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#d4af37',
      letterSpacing: 2,
    });

    const bodyText = this.add.text(-330, -25,
      '"Following a weathered Sanskrit copper inscription, Dr. Harrison Vance penetrates\n' +
      'the forgotten rock-cut mandapas of a monumental Hindu civilization.\n' +
      'Ahead lies the Sunken Tunnel — guarded by ancient trials, chasms, and the Surya Seal."',
      {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '17px',
        color: '#f8fafc',
        lineSpacing: 8,
      }
    );

    const proceedHint = this.add.text(0, 54, 'PRESS [SPACE] OR CLICK TO ENTER THE MONUMENTAL RUINS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#ffd700',
    }).setOrigin(0.5);

    narrativeBox.add([boxBg, dateText, bodyText, proceedHint]);

    // Skip button in top corner
    const skipBtn = this.add.text(w - 120, 36, '[ SKIP > ]', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#bfa15f',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => this.proceedToTunnel());

    // Input handlers
    this.input.keyboard?.on('keydown-SPACE', () => this.proceedToTunnel());
    this.input.keyboard?.on('keydown-ENTER', () => this.proceedToTunnel());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > h * 0.2) this.proceedToTunnel();
    });

    // Auto-advance after 9 seconds if undisturbed
    this.time.delayedCall(9500, () => this.proceedToTunnel());
  }

  private hasProceeded: boolean = false;
  private proceedToTunnel() {
    if (this.hasProceeded) return;
    this.hasProceeded = true;
    saveManager.markIntroSeen();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TunnelScene');
    });
  }
}

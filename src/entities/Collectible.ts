/**
 * GlobeTrotter - Collectibles & Interactive Objects
 * Includes: Gold Medallions, Secret Cyan Gems, Ammo Crates, and Checkpoint Totems.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';

export class CoinCollectible extends Phaser.Physics.Arcade.Sprite {
  public value: number = 10;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coin_gold');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // Floating bobbing animation
    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 1000 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public collect() {
    audioManager.playCoin();
    // Sparkle burst
    if (this.scene.textures.exists('particle_gold')) {
      const emitter = this.scene.add.particles(this.x, this.y, 'particle_gold', {
        speed: { min: 40, max: 90 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 300,
      });
      emitter.explode(8);
      this.scene.time.delayedCall(400, () => emitter.destroy());
    }
    this.destroy();
  }
}

export class GemCollectible extends Phaser.Physics.Arcade.Sprite {
  public value: number = 50;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'gem_blue');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // Shimmering float
    scene.tweens.add({
      targets: this,
      y: y - 8,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public collect() {
    audioManager.playGem();
    if (this.scene.textures.exists('particle_blue')) {
      const emitter = this.scene.add.particles(this.x, this.y, 'particle_blue', {
        speed: { min: 50, max: 120 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 450,
      });
      emitter.explode(14);
      this.scene.time.delayedCall(500, () => emitter.destroy());
    }
    this.destroy();
  }
}

export class AmmoCollectible extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ammo_box');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public collect() {
    audioManager.playCoin();
    this.destroy();
  }
}

export class CheckpointTotem extends Phaser.Physics.Arcade.Sprite {
  public isActivated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'checkpoint_totem');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setSize(36, 80);
    this.setTint(0x777777); // Dim until activated
  }

  public activate() {
    if (this.isActivated) return;
    this.isActivated = true;
    this.clearTint();
    audioManager.playPuzzleSolve();

    // Pulse glow
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 250,
      yoyo: true,
      repeat: 1,
    });
  }
}

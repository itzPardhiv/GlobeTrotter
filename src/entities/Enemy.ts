/**
 * GlobeTrotter - Enemy Mercenary Entity
 * Patrol AI, shooting telegraph, directional combat, and hit reactions.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';

export class EnemyMercenary extends Phaser.Physics.Arcade.Sprite {
  public health: number = 3;
  public maxHealth: number = 3;
  public isDead: boolean = false;
  private patrolMinX: number;
  private patrolMaxX: number;
  private moveSpeed: number = 75;
  private shootCooldown: number = 0;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolDistance: number = 140) {
    super(scene, x, y, 'enemy_sheet', 0);
    this.patrolMinX = x - patrolDistance / 2;
    this.patrolMaxX = x + patrolDistance / 2;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(24, 46);
    this.setOffset(20, 16);
    this.setVelocityX(this.moveSpeed);

    // Setup animations
    this.initAnimations(scene);

    // Overhead Health Bar
    this.healthBarBg = scene.add.rectangle(x, y - 28, 30, 4, 0x111111);
    this.healthBarFill = scene.add.rectangle(x, y - 28, 28, 2, 0xe53e3e);
    this.healthBarBg.setDepth(15);
    this.healthBarFill.setDepth(16);

    this.play('enemy_walk');
  }

  private initAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists('enemy_walk')) {
      scene.anims.create({
        key: 'enemy_walk',
        frames: scene.anims.generateFrameNumbers('enemy_sheet', { start: 1, end: 2 }),
        frameRate: 4,
        repeat: -1,
      });

      scene.anims.create({
        key: 'enemy_shoot',
        frames: [{ key: 'enemy_sheet', frame: 3 }],
        frameRate: 1,
      });

      scene.anims.create({
        key: 'enemy_hurt',
        frames: [{ key: 'enemy_sheet', frame: 4 }],
        frameRate: 2,
      });

      scene.anims.create({
        key: 'enemy_dead',
        frames: [{ key: 'enemy_sheet', frame: 5 }],
        frameRate: 1,
      });
    }
  }

  public updateEnemy(delta: number, playerX: number, playerY: number, onShoot: (x: number, y: number, dirX: number) => void) {
    if (this.isDead) return;

    // Sync health bar position
    this.healthBarBg.setPosition(this.x, this.y - 28);
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.healthBarFill.setSize(28 * healthPercent, 2);
    this.healthBarFill.setPosition(this.x - (14 * (1 - healthPercent)), this.y - 28);

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const lineOfSight = distToPlayer < 280 && Math.abs(this.y - playerY) < 60;

    this.shootCooldown -= delta;

    if (lineOfSight) {
      // Face the player
      const dirToPlayer = playerX > this.x ? 1 : -1;
      this.setFlipX(dirToPlayer < 0);
      this.setVelocityX(0);

      if (this.shootCooldown <= 0) {
        this.shootCooldown = 2200; // Fire every 2.2 seconds
        this.play('enemy_shoot');

        // Telegraph flash before bullet release
        this.setTint(0xff5555);
        this.scene.time.delayedCall(250, () => {
          if (this.isDead) return;
          this.clearTint();
          audioManager.playShoot();
          onShoot(this.x + (dirToPlayer * 20), this.y, dirToPlayer);

          this.scene.time.delayedCall(300, () => {
            if (!this.isDead) this.play('enemy_walk');
          });
        });
      }
    } else {
      // Normal patrol
      if (this.x <= this.patrolMinX) {
        this.setVelocityX(this.moveSpeed);
        this.setFlipX(false);
      } else if (this.x >= this.patrolMaxX) {
        this.setVelocityX(-this.moveSpeed);
        this.setFlipX(true);
      }
      this.play('enemy_walk', true);
    }
  }

  public takeDamage(damage: number = 1): boolean {
    if (this.isDead) return false;

    this.health -= damage;
    audioManager.playHit();

    // Hit flash & knockback
    this.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => this.clearTint());

    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die() {
    this.isDead = true;
    this.setVelocity(0, 0);
    this.play('enemy_dead');
    this.healthBarBg.setVisible(false);
    this.healthBarFill.setVisible(false);

    // Particle burst
    if (this.scene.textures.exists('particle_gold')) {
      const emitter = this.scene.add.particles(this.x, this.y, 'particle_gold', {
        speed: { min: 30, max: 70 },
        scale: { start: 0.6, end: 0 },
        lifespan: 300,
      });
      emitter.explode(8);
      this.scene.time.delayedCall(350, () => emitter.destroy());
    }

    this.scene.time.delayedCall(600, () => {
      this.destroy();
    });
  }

  public destroy(fromScene?: boolean) {
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    super.destroy(fromScene);
  }
}

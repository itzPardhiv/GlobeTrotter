/**
 * GlobeTrotter - Environmental Hazards & Traps
 * Includes: Spikes, Swinging Pendulum Blades, Falling Boulders, and Crumbling Platforms.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';

export class FloorSpikes extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'trap_spikes');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.setSize(60, 20);
    this.setOffset(2, 12);
  }
}

export class SwingingBlade extends Phaser.GameObjects.Container {
  public bladeSprite: Phaser.GameObjects.Sprite;
  public hitArea: Phaser.GameObjects.Zone;
  private swingTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, swingDuration: number = 1800) {
    super(scene, x, y);
    scene.add.existing(this);

    this.bladeSprite = scene.add.sprite(0, 0, 'swinging_blade');
    this.bladeSprite.setOrigin(0.5, 0); // pivot at top chain link
    this.add(this.bladeSprite);

    // Hit area located at blade head
    this.hitArea = scene.add.zone(0, 90, 48, 40);
    scene.physics.add.existing(this.hitArea, false);
    const body = this.hitArea.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.add(this.hitArea);

    this.bladeSprite.angle = -60;

    this.swingTween = scene.tweens.add({
      targets: this.bladeSprite,
      angle: 60,
      duration: swingDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        // sync zone with rotated blade
        const rad = Phaser.Math.DegToRad(this.bladeSprite.angle + 90);
        this.hitArea.x = Math.cos(rad) * 90;
        this.hitArea.y = Math.sin(rad) * 90;
      },
    });
  }

  public destroy(fromScene?: boolean) {
    if (this.swingTween) this.swingTween.stop();
    super.destroy(fromScene);
  }
}

export class FallingBoulder extends Phaser.Physics.Arcade.Sprite {
  private triggered: boolean = false;
  private initialY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boulder');
    this.initialY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setSize(38, 38);
  }

  public checkTrigger(playerX: number) {
    if (this.triggered) return;
    if (Math.abs(this.x - playerX) < 80) {
      this.triggered = true;
      // Telegraph shake before falling
      this.scene.tweens.add({
        targets: this,
        x: this.x + 4,
        duration: 40,
        yoyo: true,
        repeat: 6,
        onComplete: () => {
          const body = this.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.setAllowGravity(true);
            body.setGravityY(700);
            body.setVelocityY(150);
          }
        },
      });
    }
  }

  public shatter() {
    audioManager.playHit();
    this.scene.cameras.main.shake(100, 0.008);
    this.destroy();
  }
}

export class CrumblingPlatform extends Phaser.Physics.Arcade.Sprite {
  public isCollapsing: boolean = false;
  private spawnPosX: number;
  private spawnPosY: number;
  private collapseTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'platform_stone');
    this.spawnPosX = x;
    this.spawnPosY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(180, 24, false);
    body.setOffset(6, 4);
  }

  public resetPlatform() {
    if (this.collapseTimer) {
      this.collapseTimer.remove();
      this.collapseTimer = undefined;
    }
    this.scene.tweens.killTweensOf(this);
    this.setPosition(this.spawnPosX, this.spawnPosY);
    this.setAlpha(1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.reset(this.spawnPosX, this.spawnPosY);
      body.enable = true;
    }
    this.isCollapsing = false;
  }

  public triggerCollapse() {
    if (this.isCollapsing) return;
    this.isCollapsing = true;

    // Shaking telegraph (12 half-cycles returning to exact spawn position)
    this.scene.tweens.add({
      targets: this,
      x: this.spawnPosX + 3,
      duration: 35,
      yoyo: true,
      repeat: 11,
      onComplete: () => {
        this.x = this.spawnPosX;
        // Fall and disappear: collision body tracks the visible platform down
        this.scene.tweens.add({
          targets: this,
          y: this.spawnPosY + 60,
          alpha: 0,
          duration: 300,
          ease: 'Quad.easeIn',
          onUpdate: () => {
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body && body.enable) {
              body.updateFromGameObject();
            }
          },
          onComplete: () => {
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body) body.enable = false;

            // Respawn after 3.5 seconds
            this.collapseTimer = this.scene.time.delayedCall(3500, () => {
              this.resetPlatform();
            });
          },
        });
      },
    });
  }
}

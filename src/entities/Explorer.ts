/**
 * GlobeTrotter - Explorer Player Entity
 * Handles physics, movement, coyote time, jump buffering, health, shooting,
 * invulnerability, crouching, and animations.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { PLAYER_JUMP_SPEED, PLAYER_RUN_SPEED } from '../systems/GameplayRules';

export class Explorer extends Phaser.Physics.Arcade.Sprite {
  public maxHealth: number = 5;
  public health: number = 5;
  public isInvulnerable: boolean = false;
  public isCrouching: boolean = false;
  public isDead: boolean = false;
  public ammo: number = 18;

  // Jump feel & buffering
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private readonly COYOTE_DURATION = 120; // ms
  private readonly JUMP_BUFFER_DURATION = 100; // ms

  // Input keys
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    c: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    shoot: Phaser.Input.Keyboard.Key;
    interact: Phaser.Input.Keyboard.Key;
  };

  private stepTimer: number = 0;
  private dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'explorer_sheet', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup physics body
    this.setCollideWorldBounds(true);
    this.setSize(24, 46);
    this.setOffset(20, 16);
    this.setDepth(10);

    // Setup animations if not already created
    this.initAnimations(scene);

    // Setup controls
    if (scene.input.keyboard) {
      this.keys = {
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        a: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        w: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        s: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        c: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
        shift: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
        space: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        shoot: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
        interact: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      };
    }

    // Dust particles
    if (scene.textures.exists('particle_dust')) {
      this.dustEmitter = scene.add.particles(0, 0, 'particle_dust', {
        speed: { min: 20, max: 40 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 250,
        emitting: false,
      });
      this.dustEmitter.setDepth(9);
    }

    this.play('explorer_idle');
  }

  private initAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists('explorer_idle')) {
      scene.anims.create({
        key: 'explorer_idle',
        frames: scene.anims.generateFrameNumbers('explorer_sheet', { start: 0, end: 1 }),
        frameRate: 3,
        repeat: -1,
      });

      scene.anims.create({
        key: 'explorer_run',
        frames: scene.anims.generateFrameNumbers('explorer_sheet', { start: 2, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });

      scene.anims.create({
        key: 'explorer_jump',
        frames: [{ key: 'explorer_sheet', frame: 6 }],
        frameRate: 1,
      });

      scene.anims.create({
        key: 'explorer_fall',
        frames: [{ key: 'explorer_sheet', frame: 7 }],
        frameRate: 1,
      });

      scene.anims.create({
        key: 'explorer_crouch',
        frames: [{ key: 'explorer_sheet', frame: 8 }],
        frameRate: 1,
      });

      scene.anims.create({
        key: 'explorer_shoot',
        frames: [{ key: 'explorer_sheet', frame: 9 }],
        frameRate: 6,
      });

      scene.anims.create({
        key: 'explorer_hurt',
        frames: [{ key: 'explorer_sheet', frame: 10 }],
        frameRate: 4,
      });
    }
  }

  public update(time: number, delta: number) {
    if (this.isDead) return;

    const clampedDelta = Math.min(delta, 50);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;

    // Coyote timer
    if (onFloor) {
      this.coyoteTimer = this.COYOTE_DURATION;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - clampedDelta);
    }

    // Jump buffering
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.space) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up);

    if (jumpPressed) {
      this.jumpBufferTimer = this.JUMP_BUFFER_DURATION;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - clampedDelta);
    }

    // Crouch check (S, Down, or C)
    const crouchHeld = this.keys.s.isDown || this.keys.down.isDown || (this.keys.c && this.keys.c.isDown);
    this.isCrouching = crouchHeld && onFloor;

    if (this.isCrouching) {
      this.setSize(24, 30);
      this.setOffset(20, 32);
      this.setVelocityX(0);
      this.play('explorer_crouch', true);
      return;
    } else {
      this.setSize(24, 46);
      this.setOffset(20, 16);
    }

    // Sprint modifier (Shift)
    const sprintHeld = this.keys.shift && this.keys.shift.isDown;
    const speed = sprintHeld && onFloor ? Math.round(PLAYER_RUN_SPEED * 1.32) : PLAYER_RUN_SPEED;

    // Horizontal Movement
    const moveLeft = this.keys.a.isDown || this.keys.left.isDown;
    const moveRight = this.keys.d.isDown || this.keys.right.isDown;

    if (moveLeft) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
      if (onFloor) {
        this.play('explorer_run', true);
        this.spawnFootstepDust();
      }
    } else if (moveRight) {
      this.setVelocityX(speed);
      this.setFlipX(false);
      if (onFloor) {
        this.play('explorer_run', true);
        this.spawnFootstepDust();
      }
    } else {
      this.setVelocityX(0);
      if (onFloor) {
        this.play('explorer_idle', true);
      }
    }

    // Jump execution (Coyote Time + Buffered Input)
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.setVelocityY(-PLAYER_JUMP_SPEED);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      audioManager.playJump();
      this.spawnJumpDust();
    }

    // Air states
    if (!onFloor) {
      if (body.velocity.y < 0) {
        this.play('explorer_jump', true);
      } else {
        this.play('explorer_fall', true);
      }
    }
  }

  private spawnFootstepDust() {
    this.stepTimer++;
    if (this.stepTimer % 18 === 0) {
      audioManager.playFootstep();
      if (this.dustEmitter) {
        this.dustEmitter.explode(2, this.x, this.y + 24);
      }
    }
  }

  private spawnJumpDust() {
    if (this.dustEmitter) {
      this.dustEmitter.explode(6, this.x, this.y + 24);
    }
  }

  public takeDamage(amount: number = 1): boolean {
    if (this.isInvulnerable || this.isDead) return false;

    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    audioManager.playHit();

    // Screen shake & hit flash
    this.scene.cameras.main.shake(180, 0.015);
    this.setTint(0xff4444);

    if (this.health <= 0) {
      this.die();
      return true;
    }

    // Invulnerability flashing tween
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.isInvulnerable = false;
        this.clearTint();
        this.setAlpha(1);
      },
    });

    return true;
  }

  public heal(amount: number = 1) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public getLanternPosition(): { x: number; y: number } {
    const offsetX = this.flipX ? -12 : 12;
    const offsetY = this.isCrouching ? 10 : 2;
    return {
      x: this.x + offsetX,
      y: this.y + offsetY,
    };
  }

  private die() {
    this.isDead = true;
    this.setVelocity(0, -200);
    this.setTint(0x666666);
    this.scene.time.delayedCall(1000, () => {
      this.scene.events.emit('player_died');
    });
  }
}

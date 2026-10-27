import Phaser from 'phaser';
import { audioManager } from '../systems/PixelAudioManager';

export class PixelRudhra extends Phaser.Physics.Arcade.Sprite {
  // Movement Physics Tuning
  public readonly WALK_SPEED = 140;
  public readonly SPRINT_SPEED = 220;
  public readonly CROUCH_SPEED = 70;
  public readonly JUMP_VELOCITY = -330;
  public readonly GRAVITY = 850;

  // Timers & States
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private footstepTimer = 0;
  public isSprinting = false;
  public isCrouching = false;
  public isInteracting = false;
  public isCarryingArtifact = false;
  public isLanternOn = true;
  public canControl = true;
  private facingRight = true;

  // Particle emitter for footstep dust
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Input keys
  private cursors: Phaser.Types.InputPlugin.Keyboard.CursorKeys | null = null;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyL!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'rudhra_sheet', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(30);
    this.setGravityY(this.GRAVITY);
    this.setCollideWorldBounds(true);

    // Tight pixel hitbox (width: 14, height: 38, offset: x=9, y=10)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 38);
    body.setOffset(9, 10);

    this.initAnimations();
    this.initInputs();
    this.initParticles();
  }

  private initAnimations() {
    const anims = this.scene.anims;
    if (anims.exists('rudhra_idle')) return;

    anims.create({
      key: 'rudhra_idle',
      frames: anims.generateFrameNumbers('rudhra_sheet', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });

    anims.create({
      key: 'rudhra_walk',
      frames: anims.generateFrameNumbers('rudhra_sheet', { start: 4, end: 9 }),
      frameRate: 10,
      repeat: -1,
    });

    anims.create({
      key: 'rudhra_run',
      frames: anims.generateFrameNumbers('rudhra_sheet', { start: 10, end: 15 }),
      frameRate: 14,
      repeat: -1,
    });

    anims.create({
      key: 'rudhra_jump_up',
      frames: [{ key: 'rudhra_sheet', frame: 16 }],
      frameRate: 1,
    });

    anims.create({
      key: 'rudhra_jump_apex',
      frames: [{ key: 'rudhra_sheet', frame: 17 }],
      frameRate: 1,
    });

    anims.create({
      key: 'rudhra_jump_down',
      frames: [{ key: 'rudhra_sheet', frame: 18 }],
      frameRate: 1,
    });

    anims.create({
      key: 'rudhra_land',
      frames: [{ key: 'rudhra_sheet', frame: 19 }],
      frameRate: 8,
    });

    anims.create({
      key: 'rudhra_crouch',
      frames: anims.generateFrameNumbers('rudhra_sheet', { start: 20, end: 21 }),
      frameRate: 4,
      repeat: -1,
    });

    anims.create({
      key: 'rudhra_interact',
      frames: anims.generateFrameNumbers('rudhra_sheet', { start: 22, end: 23 }),
      frameRate: 6,
      repeat: 0,
    });

    anims.create({
      key: 'rudhra_place_artifact',
      frames: anims.generateFrameNumbers('rudhra_sheet', { start: 24, end: 25 }),
      frameRate: 4,
      repeat: 0,
    });
  }

  private initInputs() {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    this.cursors = kb.createCursorKeys();
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyShift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyL = kb.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    this.keyL.on('down', () => {
      this.isLanternOn = !this.isLanternOn;
      audioManager.playLanternToggle(this.isLanternOn);
    });
  }

  private initParticles() {
    if (this.scene.textures.exists('fx_dust')) {
      this.dustEmitter = this.scene.add.particles(0, 0, 'fx_dust', {
        lifespan: 350,
        speedX: { min: -15, max: 15 },
        speedY: { min: -8, max: -2 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        emitting: false,
      });
      this.dustEmitter.setDepth(25);
    }
  }

  public getLanternWorldPosition(): { x: number; y: number } {
    const offsetX = this.facingRight ? 10 : -10;
    const offsetY = this.isCrouching ? 8 : 4;
    return { x: this.x + offsetX, y: this.y + offsetY };
  }

  public playInteractionAnimation(onComplete?: () => void) {
    this.isInteracting = true;
    this.setVelocityX(0);
    this.play('rudhra_interact');
    this.once('animationcomplete', () => {
      this.isInteracting = false;
      if (onComplete) onComplete();
    });
  }

  public playArtifactPlacementAnimation(onComplete?: () => void) {
    this.isInteracting = true;
    this.setVelocityX(0);
    this.play('rudhra_place_artifact');
    this.scene.time.delayedCall(1200, () => {
      this.isInteracting = false;
      if (onComplete) onComplete();
    });
  }

  public updateRudhra(time: number, delta: number, surfaceType: 'dirt' | 'stone' | 'wood' = 'stone') {
    if (!this.body) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;

    // Coyote time & jump buffer
    if (onFloor) {
      this.coyoteTimer = 120;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    if (this.canControl && !this.isInteracting) {
      const isJumpPressed =
        (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
        Phaser.Input.Keyboard.JustDown(this.keyW) ||
        Phaser.Input.Keyboard.JustDown(this.keySpace);

      if (isJumpPressed) {
        this.jumpBufferTimer = 120;
      } else {
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
      }

      // Execute jump
      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isCrouching) {
        this.setVelocityY(this.JUMP_VELOCITY);
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        audioManager.playJump();
        if (this.dustEmitter) {
          this.dustEmitter.explode(4, this.x, this.y + 20);
        }
      }

      // Variable jump cut
      const isJumpHolding =
        (this.cursors && this.cursors.up.isDown) ||
        this.keyW.isDown ||
        this.keySpace.isDown;
      if (!isJumpHolding && body.velocity.y < -120) {
        this.setVelocityY(body.velocity.y * 0.65);
      }

      // Horizontal movement
      const moveLeft = (this.cursors && this.cursors.left.isDown) || this.keyA.isDown;
      const moveRight = (this.cursors && this.cursors.right.isDown) || this.keyD.isDown;
      const crouch = (this.cursors && this.cursors.down.isDown) || this.keyS.isDown;
      const sprint = this.keyShift.isDown && !crouch;

      this.isCrouching = crouch && onFloor;
      this.isSprinting = sprint && !this.isCrouching;

      // Adjust hitbox when crouching
      if (this.isCrouching) {
        body.setSize(14, 26);
        body.setOffset(9, 22);
      } else {
        body.setSize(14, 38);
        body.setOffset(9, 10);
      }

      const targetSpeed = this.isCrouching
        ? this.CROUCH_SPEED
        : this.isSprinting
          ? this.SPRINT_SPEED
          : this.WALK_SPEED;

      if (moveLeft && !moveRight) {
        this.setVelocityX(-targetSpeed);
        this.facingRight = false;
        this.setFlipX(true);
      } else if (moveRight && !moveLeft) {
        this.setVelocityX(targetSpeed);
        this.facingRight = true;
        this.setFlipX(false);
      } else {
        this.setVelocityX(0);
      }

      // Footstep audio cadence & dust
      if (onFloor && Math.abs(body.velocity.x) > 10) {
        const stepRate = this.isSprinting ? 220 : 320;
        this.footstepTimer += delta;
        if (this.footstepTimer >= stepRate) {
          this.footstepTimer = 0;
          audioManager.playFootstep(surfaceType);
          if (this.dustEmitter) {
            this.dustEmitter.explode(2, this.x, this.y + 19);
          }
        }
      } else {
        this.footstepTimer = 0;
      }

      // Animation selection
      if (!onFloor) {
        if (body.velocity.y < -40) {
          this.play('rudhra_jump_up', true);
        } else if (body.velocity.y > 40) {
          this.play('rudhra_jump_down', true);
        } else {
          this.play('rudhra_jump_apex', true);
        }
      } else if (this.isCrouching) {
        this.play('rudhra_crouch', true);
      } else if (Math.abs(body.velocity.x) > 10) {
        if (this.isSprinting) {
          this.play('rudhra_run', true);
        } else {
          this.play('rudhra_walk', true);
        }
      } else {
        this.play('rudhra_idle', true);
      }
    }
  }
}

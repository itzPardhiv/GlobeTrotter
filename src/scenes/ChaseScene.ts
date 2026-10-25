/**
 * GlobeTrotter - Level 3: The Car Chase
 * High-speed mountain canyon pursuit with expedition jeep, enemy vehicles,
 * road obstacles, nitro boost, collapsed bridge jumps, and dynamic parallax.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

interface RoadHazard {
  sprite: Phaser.GameObjects.Sprite;
  zone: Phaser.GameObjects.Zone;
  type: 'rock' | 'gap' | 'flare';
}

export class ChaseScene extends Phaser.Scene {
  private playerJeep!: Phaser.Physics.Arcade.Sprite;
  private enemyJeep!: Phaser.GameObjects.Sprite;
  private roadBg!: Phaser.GameObjects.TileSprite;
  private canyonBg!: Phaser.GameObjects.TileSprite;
  private distantMountains!: Phaser.GameObjects.TileSprite;

  private hazards: RoadHazard[] = [];
  private speed: number = 420;
  private chaseProgress: number = 0;
  private readonly CHASE_GOAL: number = 3200; // Distance to collapsing bridge climax

  private playerHealth: number = 4;
  private isJumping: boolean = false;
  private isBoosting: boolean = false;
  private isInvulnerable: boolean = false;
  private isGameOver: boolean = false;

  private dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private hudHearts: Phaser.GameObjects.Text[] = [];
  private hudProgressFill!: Phaser.GameObjects.Rectangle;

  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'ChaseScene' });
  }

  public create() {
    this.playerHealth = 4;
    this.chaseProgress = 0;
    this.speed = 420;
    this.hazards = [];
    this.isJumping = false;
    this.isBoosting = false;
    this.isInvulnerable = false;
    this.isGameOver = false;
    this.hasTriggeredClimax = false;
    this.hudHearts = [];

    audioManager.playMusic('chase');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const w = this.scale.width;
    const h = this.scale.height;

    // 1. Multi-Layer Parallax Canyon Environment
    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x192138, 0x192138, 0xd47a37, 0xfcb045, 1);
    sky.fillRect(0, 0, w, h);

    // Distant mountain ridge texture
    this.distantMountains = this.add.tileSprite(w / 2, h * 0.45, w, 220, 'stone_tile');
    this.distantMountains.setTint(0x352b20).setAlpha(0.65);

    // Midground Canyon Red Rock Cliffs
    this.canyonBg = this.add.tileSprite(w / 2, h * 0.58, w, 200, 'platform_stone');
    this.canyonBg.setTint(0x73381e);

    // Roadway (Lower third)
    const roadY = h * 0.76;
    this.roadBg = this.add.tileSprite(w / 2, roadY + 50, w, 140, 'stone_tile');
    this.roadBg.setTint(0x2d241c);

    // Road highway lane markings
    for (let x = 0; x < w; x += 120) {
      const line = this.add.rectangle(x, roadY + 50, 48, 6, 0xd4af37, 0.6);
      this.tweens.add({
        targets: line,
        x: '-=1280',
        duration: 1800,
        repeat: -1,
      });
    }

    // 2. Player Expedition Jeep
    this.playerJeep = this.physics.add.sprite(280, roadY + 30, 'player_jeep');
    this.playerJeep.setSize(110, 48);
    this.playerJeep.setOffset(15, 18);
    this.playerJeep.setDepth(15);
    (this.playerJeep.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Tire dust & smoke emitter
    if (this.textures.exists('particle_dust')) {
      this.dustEmitter = this.add.particles(0, 0, 'particle_dust', {
        speedX: { min: -120, max: -220 },
        speedY: { min: -10, max: -30 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 400,
      });
      this.dustEmitter.startFollow(this.playerJeep, -50, 20);
      this.dustEmitter.setDepth(14);
    }

    // 3. Enemy Pursuit Buggy (Stalking behind on the left)
    this.enemyJeep = this.add.sprite(90, roadY + 30, 'enemy_jeep');
    this.enemyJeep.setDepth(15);

    // Shaking engine idle for both
    this.tweens.add({
      targets: [this.playerJeep, this.enemyJeep],
      y: '+=2',
      duration: 80,
      yoyo: true,
      repeat: -1,
    });

    // 4. Setup Controls
    if (this.input.keyboard) {
      this.keys = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      };
    }

    // 5. Periodic Hazard Spawning (Boulders, Gaps, Enemy Flare rockets)
    this.time.addEvent({
      delay: 1500,
      callback: () => this.spawnHazard(),
      loop: true,
    });

    // Periodic Enemy Shoot Flare
    this.time.addEvent({
      delay: 3200,
      callback: () => this.enemyFireFlare(),
      loop: true,
    });

    // 6. HUD
    this.createHUD();

    // Pause key: ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.launch('PauseScene', { returnTo: 'ChaseScene' });
      this.scene.pause();
    });
  }

  public update(time: number, delta: number) {
    if (!this.keys) return;
    const dt = Math.min(delta / 1000, 0.05);

    // Update speed based on nitro boost
    this.isBoosting = this.keys.shift.isDown || this.keys.w.isDown;
    const currentSpeed = this.isBoosting ? this.speed * 1.4 : this.speed;

    // Scroll parallax backgrounds
    this.distantMountains.tilePositionX += currentSpeed * 0.15 * dt;
    this.canyonBg.tilePositionX += currentSpeed * 0.45 * dt;
    this.roadBg.tilePositionX += currentSpeed * dt;

    // Progress counter
    this.chaseProgress += currentSpeed * dt * 0.5;
    const progressRatio = Math.min(1, this.chaseProgress / this.CHASE_GOAL);
    this.hudProgressFill.setSize(220 * progressRatio, 8);

    // Player Movement (Horizontal positioning & Lane steering)
    const moveLeft = this.keys.left.isDown || this.keys.a.isDown;
    const moveRight = this.keys.right.isDown || this.keys.d.isDown;
    const moveUp = this.keys.up.isDown;
    const moveDown = this.keys.down.isDown || this.keys.s.isDown;

    if (moveLeft && this.playerJeep.x > 180) {
      this.playerJeep.x -= 200 * dt;
    } else if (moveRight && this.playerJeep.x < this.scale.width - 150) {
      this.playerJeep.x += 240 * dt;
    }

    const defaultY = this.scale.height * 0.76 + 30;
    if (moveUp && !this.isJumping) {
      this.playerJeep.y = Math.max(defaultY - 35, this.playerJeep.y - 140 * dt);
    } else if (moveDown && !this.isJumping) {
      this.playerJeep.y = Math.min(defaultY + 35, this.playerJeep.y + 140 * dt);
    }

    // Jump mechanic: Space bar
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.isJumping) {
      this.jumpJeep();
    }

    // Update hazards & collisions
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.sprite.x -= currentSpeed * dt * 1.1;
      h.zone.x = h.sprite.x;
      h.zone.y = h.sprite.y;

      // Check collision with player jeep
      if (!this.isInvulnerable) {
        const boundsP = this.playerJeep.getBounds();
        const boundsH = h.sprite.getBounds();

        if (Phaser.Geom.Intersects.RectangleToRectangle(boundsP, boundsH)) {
          // If jumping high, dodge ground boulders/gaps!
          if (this.isJumping && h.type !== 'flare') {
            // Dodged successfully!
          } else {
            this.handlePlayerHit();
            h.sprite.destroy();
            h.zone.destroy();
            this.hazards.splice(i, 1);
            continue;
          }
        }
      }

      // Despawn off-screen left
      if (h.sprite.x < -100) {
        h.sprite.destroy();
        h.zone.destroy();
        this.hazards.splice(i, 1);
      }
    }

    // Climax check: Reach collapsing bridge
    if (this.chaseProgress >= this.CHASE_GOAL && !this.hasTriggeredClimax) {
      this.triggerBridgeClimax();
    }
  }

  private jumpJeep() {
    this.isJumping = true;
    audioManager.playJump();

    this.tweens.add({
      targets: this.playerJeep,
      y: this.playerJeep.y - 75,
      angle: -10,
      duration: 320,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isJumping = false;
        this.playerJeep.angle = 0;
        audioManager.playLand();
      },
    });
  }

  private spawnHazard() {
    if (this.hasTriggeredClimax) return;
    const w = this.scale.width;
    const roadY = this.scale.height * 0.76;
    const laneOffset = (Math.random() - 0.5) * 60;

    const isRock = Math.random() > 0.4;
    const texture = isRock ? 'boulder' : 'trap_spikes';
    const spr = this.add.sprite(w + 60, roadY + 30 + laneOffset, texture);
    spr.setDepth(13);

    const zone = this.add.zone(spr.x, spr.y, 40, 40);
    this.hazards.push({
      sprite: spr,
      zone,
      type: isRock ? 'rock' : 'gap',
    });
  }

  private enemyFireFlare() {
    if (this.hasTriggeredClimax) return;
    audioManager.playShoot();

    const flare = this.add.sprite(this.enemyJeep.x + 60, this.enemyJeep.y - 20, 'particle_gold').setScale(2);
    flare.setTint(0xff3333);
    flare.setDepth(16);

    const zone = this.add.zone(flare.x, flare.y, 20, 20);
    const hazard: RoadHazard = { sprite: flare, zone, type: 'flare' };
    this.hazards.push(hazard);

    // Flare curves forward towards player
    this.tweens.add({
      targets: flare,
      x: this.scale.width + 100,
      y: this.playerJeep.y,
      duration: 1600,
      ease: 'Linear',
    });
  }

  private handlePlayerHit() {
    if (this.hasTriggeredClimax || this.isGameOver) return;
    this.playerHealth--;
    this.isInvulnerable = true;
    audioManager.playHit();
    this.cameras.main.shake(250, 0.02);

    this.playerJeep.setTint(0xff3333);
    this.updateHUD();

    if (this.playerHealth <= 0) {
      this.chaseGameOver();
      return;
    }

    this.tweens.add({
      targets: this.playerJeep,
      alpha: 0.4,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.isInvulnerable = false;
        this.playerJeep.clearTint();
        this.playerJeep.setAlpha(1);
      },
    });
  }

  private chaseGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    audioManager.playExplosion();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart();
    });
  }

  private hasTriggeredClimax: boolean = false;
  private triggerBridgeClimax() {
    this.hasTriggeredClimax = true;
    audioManager.playEngine();

    // Warning sign: COLLAPSING TRESTLE BRIDGE!
    const alertTxt = this.add.text(this.scale.width / 2, 220, '⚠ COLLAPSING GORGE BRIDGE AHEAD! LEAP! ⚠', {
      fontFamily: 'Cinzel, serif',
      fontSize: '22px',
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: alertTxt,
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      duration: 250,
      yoyo: true,
      repeat: 3,
    });

    // Massive cinematic jump sequence
    this.time.delayedCall(1200, () => {
      audioManager.playJump();
      this.cameras.main.shake(600, 0.015);

      this.tweens.add({
        targets: this.playerJeep,
        x: this.scale.width + 200,
        y: this.playerJeep.y - 160,
        angle: -25,
        duration: 1600,
        ease: 'Quad.easeOut',
        onComplete: () => {
          saveManager.setLevelComplete(3, 1000);
          audioManager.playPuzzleSolve();

          // Transition into Time Travel Interlude
          this.cameras.main.fade(600, 255, 255, 255);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TimeFlashScene');
          });
        },
      });
    });
  }

  private createHUD() {
    const hud = this.add.container(0, 0).setDepth(100);

    // Hearts
    for (let i = 0; i < 4; i++) {
      const h = this.add.text(24 + i * 26, 20, '♥', {
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#ef4444',
      });
      this.hudHearts.push(h);
      hud.add(h);
    }

    // Title
    const title = this.add.text(24, 52, 'CHAPTER III · THE CANYON PURSUIT', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#d4af37',
      letterSpacing: 2,
    });
    hud.add(title);

    // Distance Progress Bar (Top Center)
    const progBg = this.add.rectangle(this.scale.width / 2, 32, 224, 12, 0x111624, 0.9).setStrokeStyle(1, 0xd4af37);
    this.hudProgressFill = this.add.rectangle(this.scale.width / 2 - 110, 32, 0, 8, 0x00f7ff).setOrigin(0, 0.5);
    const progLabel = this.add.text(this.scale.width / 2, 50, 'ESCAPE ROUTE DISTANCE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#ffd700',
    }).setOrigin(0.5);

    hud.add([progBg, this.hudProgressFill, progLabel]);

    // Controls reminder
    const hint = this.add.text(this.scale.width / 2, this.scale.height - 24,
      'A / D: Position · Up / Down: Lane · SPACE: Jump Chasm · SHIFT / W: Nitro Boost', {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '14px',
        color: '#fde047',
      }
    ).setOrigin(0.5);
    hud.add(hint);
  }

  private updateHUD() {
    for (let i = 0; i < 4; i++) {
      if (this.hudHearts[i]) {
        this.hudHearts[i].setColor(i < this.playerHealth ? '#ef4444' : '#4b5563');
      }
    }
  }
}

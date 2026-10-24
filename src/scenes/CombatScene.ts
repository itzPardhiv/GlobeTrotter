/**
 * GlobeTrotter - Level 4: The Last Stand
 * 2D Action-platforming combat stage: directional shooting, bullet physics,
 * enemy mercenaries, cover mechanics, ammo pickups, and unlocking the inner sanctum.
 */

import Phaser from 'phaser';
import { Explorer } from '../entities/Explorer';
import { EnemyMercenary } from '../entities/Enemy';
import { AmmoCollectible } from '../entities/Collectible';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

interface Projectile {
  sprite: Phaser.Physics.Arcade.Sprite;
  isPlayerBullet: boolean;
  damage: number;
}

export class CombatScene extends Phaser.Scene {
  private player!: Explorer;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: EnemyMercenary[] = [];
  private bullets: Projectile[] = [];
  private ammoCrates: AmmoCollectible[] = [];

  private hudHearts: Phaser.GameObjects.Text[] = [];
  private hudAmmoText!: Phaser.GameObjects.Text;
  private hudEnemiesText!: Phaser.GameObjects.Text;

  private sanctumGate!: Phaser.GameObjects.Graphics;
  private gateSensor!: Phaser.GameObjects.Zone;
  private isGateOpen: boolean = false;

  private readonly LEVEL_WIDTH = 2600;
  private readonly LEVEL_HEIGHT = 720;

  constructor() {
    super({ key: 'CombatScene' });
  }

  public create() {
    this.enemies = [];
    this.bullets = [];
    this.ammoCrates = [];
    this.isGateOpen = false;
    this.hasProceeded = false;
    this.hudHearts = [];

    audioManager.playMusic('combat');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.physics.world.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);

    // 1. Atmosphere & Architecture
    this.buildAtmosphere();

    // 2. Platforms & Cover Pillars
    this.platforms = this.physics.add.staticGroup();

    // 3. Player Explorer (instantiated before level geometry and gate sensors)
    this.player = new Explorer(this, 120, 520);
    this.player.ammo = 18;

    this.buildLevelGeometry();

    this.physics.add.collider(this.player, this.platforms);

    // 4. Enemy Mercenaries
    const enemySpawns = [
      { x: 620, y: 520, dist: 160 },
      { x: 1040, y: 380, dist: 120 },
      { x: 1420, y: 520, dist: 180 },
      { x: 1850, y: 340, dist: 140 },
      { x: 2150, y: 520, dist: 150 },
    ];

    enemySpawns.forEach((sp) => {
      const enemy = new EnemyMercenary(this, sp.x, sp.y, sp.dist);
      this.physics.add.collider(enemy, this.platforms);
      this.enemies.push(enemy);
    });

    // Ammo pickups
    const a1 = new AmmoCollectible(this, 880, 480);
    const a2 = new AmmoCollectible(this, 1680, 480);
    this.ammoCrates.push(a1, a2);

    // 5. Controls for Shooting
    this.input.keyboard?.on('keydown-J', () => this.playerShoot());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't shoot if clicking UI pause button
      if (pointer.y > 60) this.playerShoot();
    });

    // 6. Camera Follow
    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 7. HUD
    this.createHUD();

    // Player death listener (deduplicated on restart)
    this.events.off('player_died');
    this.events.on('player_died', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.restart();
      });
    });

    // Pause key: ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.launch('PauseScene', { returnTo: 'CombatScene' });
      this.scene.pause();
    });
  }

  private buildAtmosphere() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060912, 0x060912, 0x1a120b, 0x1f140a, 1);
    bg.fillRect(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);

    // Torches
    for (let x = 180; x < this.LEVEL_WIDTH; x += 350) {
      this.add.image(x, 260, 'asset_torch').setScale(1.2).setTint(0x9a8366);
    }
  }

  private buildLevelGeometry() {
    // Ground using authentic carved lotus platform beams
    for (let x = 0; x < this.LEVEL_WIDTH; x += 260) {
      const segWidth = Math.min(260, this.LEVEL_WIDTH - x);
      const t = this.platforms.create(x + segWidth / 2, 680, 'asset_platform_long');
      t.setDisplaySize(segWidth, 42);
      t.refreshBody();
    }

    // Cover Platforms & broken stone barriers
    const platPositions = [
      { x: 500, y: 560 },
      { x: 1040, y: 440 },
      { x: 1350, y: 550 },
      { x: 1850, y: 420 },
    ];

    platPositions.forEach((pos) => {
      const p = this.platforms.create(pos.x, pos.y, 'asset_platform_short');
      p.refreshBody();
      // Cover pillars behind platform
      this.add.image(pos.x, pos.y - 80, 'asset_pillar_intact').setScale(0.85).setTint(0x5a4632);
    });

    // 8. The Sealed Inner Sanctum Gate (At x: 2450)
    this.sanctumGate = this.add.graphics();
    this.drawGate(false);

    this.gateSensor = this.add.zone(2450, 560, 100, 160);
    this.physics.add.existing(this.gateSensor, true);
    if (this.player) {
      this.physics.add.overlap(this.player, this.gateSensor, () => {
        if (this.isGateOpen) {
          this.proceedToGrandReveal();
        }
      });
    }
  }

  private drawGate(isOpen: boolean) {
    this.sanctumGate.clear();
    const gx = 2400;
    const gy = 440;

    // Archway
    this.sanctumGate.fillStyle(0x0a0c14, 1);
    this.sanctumGate.fillRect(gx, gy, 120, 210);
    this.sanctumGate.lineStyle(4, isOpen ? 0x00f7ff : 0xd4af37);
    this.sanctumGate.strokeRect(gx, gy, 120, 210);

    if (isOpen) {
      // Golden light pouring into the grand reveal
      this.sanctumGate.fillGradientStyle(0xffd700, 0xffd700, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
      this.sanctumGate.fillRect(gx + 10, gy + 10, 100, 190);
    } else {
      // Crossed iron security bars
      this.sanctumGate.lineStyle(3, 0x882222);
      this.sanctumGate.moveTo(gx, gy);
      this.sanctumGate.lineTo(gx + 120, gy + 210);
      this.sanctumGate.moveTo(gx + 120, gy);
      this.sanctumGate.lineTo(gx, gy + 210);
      this.sanctumGate.stroke();
    }
  }

  private playerShoot() {
    if (this.player.ammo <= 0 || this.player.isDead) return;

    this.player.ammo--;
    this.updateHUD();
    audioManager.playShoot();
    this.player.play('explorer_shoot');

    // Muzzle direction
    const dir = this.player.flipX ? -1 : 1;
    const bulletSpr = this.physics.add.sprite(
      this.player.x + (dir * 28),
      this.player.y - 4,
      'bullet'
    );
    bulletSpr.setFlipX(dir < 0);
    bulletSpr.setDepth(18);

    const bBody = bulletSpr.body as Phaser.Physics.Arcade.Body;
    bBody.setAllowGravity(false);
    bBody.setVelocityX(dir * 580);

    this.bullets.push({
      sprite: bulletSpr,
      isPlayerBullet: true,
      damage: 1,
    });

    // Reset animation
    this.time.delayedCall(160, () => {
      if (!this.player.isDead) this.player.play('explorer_idle');
    });
  }

  public update(time: number, delta: number) {
    if (this.player) {
      this.player.update(time, delta);
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isDead) {
        this.enemies.splice(i, 1);
        this.updateHUD();
        this.checkAllEnemiesDefeated();
        continue;
      }

      e.updateEnemy(delta, this.player.x, this.player.y, (ex, ey, dir) => {
        // Enemy shooting bullet
        const b = this.physics.add.sprite(ex, ey, 'bullet');
        b.setTint(0xff3333);
        b.setFlipX(dir < 0);
        b.setDepth(18);

        const bb = b.body as Phaser.Physics.Arcade.Body;
        bb.setAllowGravity(false);
        bb.setVelocityX(dir * 380);

        this.bullets.push({
          sprite: b,
          isPlayerBullet: false,
          damage: 1,
        });
      });
    }

    // Update bullets & collision
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const bSpr = b.sprite;

      // Despawn off world
      if (bSpr.x < 0 || bSpr.x > this.LEVEL_WIDTH) {
        bSpr.destroy();
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.isPlayerBullet) {
        // Check collision with enemies
        for (const e of this.enemies) {
          if (!e.isDead && Phaser.Geom.Intersects.RectangleToRectangle(bSpr.getBounds(), e.getBounds())) {
            e.takeDamage(b.damage);
            bSpr.destroy();
            this.bullets.splice(i, 1);
            break;
          }
        }
      } else {
        // Enemy bullet against player
        // Note: Crouching player ducks under bullets!
        if (!this.player.isInvulnerable && !this.player.isDead) {
          if (Phaser.Geom.Intersects.RectangleToRectangle(bSpr.getBounds(), this.player.getBounds())) {
            if (this.player.isCrouching && bSpr.y < this.player.y) {
              // Dodged under cover!
            } else {
              this.player.takeDamage(b.damage);
              this.updateHUD();
              bSpr.destroy();
              this.bullets.splice(i, 1);
            }
          }
        }
      }
    }

    // Check ammo pickup
    for (let i = this.ammoCrates.length - 1; i >= 0; i--) {
      const crate = this.ammoCrates[i];
      if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), crate.getBounds())) {
        crate.collect();
        this.player.ammo += 12;
        this.updateHUD();
        this.ammoCrates.splice(i, 1);
      }
    }
  }

  private checkAllEnemiesDefeated() {
    if (this.enemies.length === 0 && !this.isGateOpen) {
      this.isGateOpen = true;
      audioManager.playPuzzleSolve();
      this.drawGate(true);
      this.cameras.main.shake(400, 0.01);
    }
  }

  private hasProceeded: boolean = false;
  private proceedToGrandReveal() {
    if (this.hasProceeded) return;
    this.hasProceeded = true;
    saveManager.setLevelComplete(4, 1500);

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GrandRevealScene');
    });
  }

  private createHUD() {
    const hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // Hearts
    for (let i = 0; i < 5; i++) {
      const h = this.add.text(24 + i * 26, 20, '♥', {
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#ef4444',
      });
      this.hudHearts.push(h);
      hud.add(h);
    }

    // Level Title
    hud.add(this.add.text(24, 52, 'CHAPTER IV · THE LAST STAND', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#d4af37',
      letterSpacing: 2,
    }));

    // Ammo & Enemies Remaining (Top Right)
    const ammoBg = this.add.rectangle(this.scale.width - 240, 32, 110, 30, 0x131a29, 0.9).setStrokeStyle(1, 0xd4af37);
    this.hudAmmoText = this.add.text(this.scale.width - 240, 32, `AMMO: ${this.player.ammo}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      color: '#ffd700',
    }).setOrigin(0.5);

    const enemyBg = this.add.rectangle(this.scale.width - 110, 32, 120, 30, 0x131a29, 0.9).setStrokeStyle(1, 0xd4af37);
    this.hudEnemiesText = this.add.text(this.scale.width - 110, 32, `GUARDS: ${this.enemies.length}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
    }).setOrigin(0.5);

    hud.add([ammoBg, this.hudAmmoText, enemyBg, this.hudEnemiesText]);
  }

  private updateHUD() {
    for (let i = 0; i < 5; i++) {
      if (this.hudHearts[i]) {
        this.hudHearts[i].setColor(i < this.player.health ? '#ef4444' : '#4b5563');
      }
    }
    if (this.hudAmmoText) this.hudAmmoText.setText(`AMMO: ${this.player.ammo}`);
    if (this.hudEnemiesText) this.hudEnemiesText.setText(`GUARDS: ${this.enemies.length}`);
  }
}

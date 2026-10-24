/**
 * GlobeTrotter: The Lost Relic - Chapter I: The Sunken Tunnel
 * An expansive, monumental subterranean Hindu temple expedition.
 * Monolithic rock-cut mandapas inspired by Ellora and Hampi,
 * authentic modular stone platforms, carved pillars, torana arches,
 * wall deity reliefs, dynamic handheld lantern radial illumination,
 * crumbling sandstone spans, secret vimana shrines, and the Grand Surya Vault Gate.
 */

import Phaser from 'phaser';
import { Explorer } from '../entities/Explorer';
import { FloorSpikes, SwingingBlade, FallingBoulder, CrumblingPlatform } from '../entities/Trap';
import { CoinCollectible, GemCollectible, CheckpointTotem } from '../entities/Collectible';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';
import { hasReachedPitBottom, isWithinGateRange, type PitRange } from '../systems/GameplayRules';

interface TorchLight {
  x: number;
  y: number;
  flame: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Image;
}

export class TunnelScene extends Phaser.Scene {
  private player!: Explorer;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private crumblingPlatforms: CrumblingPlatform[] = [];
  private spikesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private swingingBlades: SwingingBlade[] = [];
  private boulders: FallingBoulder[] = [];
  private coinsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private gemsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private checkpoints: CheckpointTotem[] = [];

  // Dynamic Lighting System
  private ambientShadow!: Phaser.GameObjects.RenderTexture;
  private lanternGlow!: Phaser.GameObjects.Image;
  private torchLights: TorchLight[] = [];

  private checkpointPos: { x: number; y: number } = { x: 140, y: 520 };
  private coinsCollected: number = 0;
  private gemsCollected: number = 0;

  // Monumental Level Dimensions: 4800px wide
  private readonly LEVEL_WIDTH = 4800;
  private readonly LEVEL_HEIGHT = 720;
  private readonly PIT_RANGES: readonly PitRange[] = [[1500, 1920], [3650, 4100]];

  // Vault Gate
  private suryaVaultDisc!: Phaser.GameObjects.Image;
  private vaultGateFrame!: Phaser.GameObjects.Container;
  private gatePrompt!: Phaser.GameObjects.Text;
  private isVaultUnlocked: boolean = false;

  // HUD Elements
  private hudHearts: Phaser.GameObjects.Text[] = [];
  private hudCoinText!: Phaser.GameObjects.Text;
  private hudGemText!: Phaser.GameObjects.Text;
  private objectiveBanner!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TunnelScene' });
  }

  public create() {
    this.checkpointPos = { x: 140, y: 520 };
    this.coinsCollected = 0;
    this.gemsCollected = 0;
    this.crumblingPlatforms = [];
    this.swingingBlades = [];
    this.boulders = [];
    this.checkpoints = [];
    this.torchLights = [];
    this.hudHearts = [];
    this.isVaultUnlocked = false;

    audioManager.playMusic('tunnel');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Set world physics bounds
    this.physics.world.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);

    // 1. Build Deep Ellora/Hampi Rock-Cut Backgrounds & Parallax
    this.createMonumentalBackgrounds();

    // 2. Physics Groups for Platforms, Traps, and Collectibles
    this.platforms = this.physics.add.staticGroup();
    this.spikesGroup = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.staticGroup();
    this.gemsGroup = this.physics.add.staticGroup();

    // 3. Spawn Protagonist: Dr. Harrison Vance (created before architecture zones)
    this.player = new Explorer(this, this.checkpointPos.x, this.checkpointPos.y);

    // 4. Build the 7 Expansive Architectural Sections
    this.buildMonumentalArchitecture();

    // Setup Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.crumblingPlatforms.forEach((cp) => {
      this.physics.add.collider(this.player, cp, () => {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down || body.touching.down) {
          cp.triggerCollapse();
        }
      });
    });

    // Spikes overlap
    this.physics.add.overlap(this.player, this.spikesGroup, () => {
      this.handlePlayerDamage();
    });

    // Swinging Blade traps
    this.swingingBlades.forEach((blade) => {
      this.physics.add.overlap(this.player, blade.hitArea, () => {
        this.handlePlayerDamage();
      });
    });

    // Falling Stalactites / Boulders
    this.boulders.forEach((boulder) => {
      this.physics.add.collider(boulder, this.platforms, () => boulder.shatter());
      this.physics.add.overlap(this.player, boulder, () => {
        this.handlePlayerDamage(2);
        boulder.shatter();
      });
    });

    // Collectibles
    this.physics.add.overlap(this.player, this.coinsGroup, (_p, coinObj) => {
      const coin = coinObj as unknown as CoinCollectible;
      coin.collect();
      this.coinsCollected++;
      this.updateHUD();
    });

    this.physics.add.overlap(this.player, this.gemsGroup, (_p, gemObj) => {
      const gem = gemObj as unknown as GemCollectible;
      gem.collect();
      this.gemsCollected++;
      this.updateHUD();
      this.showDiscoveryBanner('VEDIC SAPPHIRE RELIC SECURED');
    });

    // Checkpoints
    this.checkpoints.forEach((cp) => {
      this.physics.add.overlap(this.player, cp, () => {
        if (!cp.isActivated) {
          cp.activate();
          this.checkpointPos = { x: cp.x, y: cp.y - 20 };
          this.showDiscoveryBanner('CHECKPOINT SANCTUARY REACHED');
        }
      });
    });

    // 5. Setup Camera
    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 6. Dynamic Handheld Lantern Radial Lighting Mask
    this.setupDynamicLighting();

    // 7. Atmospheric Embers and Temple Dust Particles
    if (this.textures.exists('particle_gold')) {
      const particles = this.add.particles(0, 0, 'particle_gold', {
        x: { min: 0, max: this.LEVEL_WIDTH },
        y: { min: 80, max: this.LEVEL_HEIGHT },
        speedY: { min: -12, max: -35 },
        speedX: { min: -15, max: 15 },
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 3600,
        frequency: 160,
      });
      particles.setDepth(14);
    }

    // 8. Create HUD Overlay
    this.createHUD();

    // Player death listener (deduplicated on respawn/re-entry)
    this.events.off('player_died');
    this.events.on('player_died', () => {
      this.respawnPlayer();
    });

    // Pause key: ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.launch('PauseScene', { returnTo: 'TunnelScene' });
      this.scene.pause();
    });
  }

  /**
   * Creates Ellora & Hampi-inspired connected rock-cut backgrounds and multi-layer parallax
   */
  private createMonumentalBackgrounds() {
    const w = this.LEVEL_WIDTH;
    const h = this.LEVEL_HEIGHT;

    // 1. Far Panoramic Ruin Layer: Ellora basalt silhouettes, Gopurams, Vimanas, Kalyani reservoir (Parallax: 0.25)
    if (this.textures.exists('bg_tunnel_far')) {
      this.add.image(0, 0, 'bg_tunnel_far')
        .setOrigin(0, 0)
        .setScrollFactor(0.25, 0)
        .setDepth(-28);
    } else {
      const caveBg = this.add.graphics().setDepth(-30);
      caveBg.fillGradientStyle(0x05070d, 0x05070d, 0x111624, 0x18130c, 1);
      caveBg.fillRect(0, 0, w, h);
    }

    // 2. Midground Architectural Ruin Layer: Sandstone colonnades, stepped ghats, arches (Parallax: 0.55)
    if (this.textures.exists('bg_tunnel_mid')) {
      this.add.image(0, 0, 'bg_tunnel_mid')
        .setOrigin(0, 0)
        .setScrollFactor(0.55, 0)
        .setDepth(-18);
    }

    // 3. Cavern Ceiling Strata: Monolithic rock ceiling, hanging stalactites, stone corbels (Parallax: 0.70)
    if (this.textures.exists('bg_tunnel_ceiling')) {
      this.add.image(0, 0, 'bg_tunnel_ceiling')
        .setOrigin(0, 0)
        .setScrollFactor(0.7, 0)
        .setDepth(-12);
    }

    // 4. Foreground Framing Colonnades: Colossal lotus columns at natural zone thresholds (Parallax: 1.15)
    // Carefully offset so they frame section thresholds and never obscure gameplay, platforms, or the Surya Vault Gate
    const framingX = [40, 1540, 2400, 3600, 5300];
    framingX.forEach((fx) => {
      this.add.image(fx, 360, 'asset_pillar_intact')
        .setDepth(20)
        .setScale(1.4)
        .setScrollFactor(1.15, 1.0)
        .setAlpha(0.65)
        .setTint(0x14100c); // Deep atmospheric silhouette framing the action
    });
  }

  /**
   * Builds the 7 Monumental Architectural Sections of Chapter I
   */
  private buildMonumentalArchitecture() {
    // SECTION 1: THE SANCTUM THRESHOLD (0 - 750px)
    // Starting floor of long lotus platforms
    this.createLotusFloor(0, 750, 680);
    // Entry rock-cut masonry corner & lintel
    this.add.image(40, 530, 'asset_wall_corner').setScale(1.1).setDepth(2);
    this.add.image(140, 480, 'asset_doorway').setScale(1.3).setDepth(2);
    this.add.image(240, 440, 'asset_wall_panel').setScale(1.05).setDepth(1);
    this.addTorch(280, 440);
    this.spawnCoins(360, 620, 3);
    this.add.image(520, 520, 'asset_wall_panel').setScale(1.05).setDepth(1);

    // SECTION 2: THE HYPOSTYLE MANDAPA OF 1000 LOTUS PILLARS (750 - 1500px)
    // Towering carved intact pillars on stone plinths and elevated lotus beam platforms
    this.createLotusFloor(750, 1500, 680);

    // Plinth pedestals for columns
    this.add.image(880, 635, 'asset_pedestal').setScale(0.9).setDepth(2);
    this.add.image(1300, 635, 'asset_pedestal').setScale(0.9).setDepth(2);

    const pil1 = this.add.image(880, 460, 'asset_pillar_intact').setScale(1.3).setDepth(2);
    pil1.setTint(0x9a8366);
    const pil2 = this.add.image(1300, 460, 'asset_pillar_intact').setScale(1.3).setDepth(2);
    pil2.setTint(0x9a8366);

    // Overhead ornate torana arch spanning between columns
    const torana1 = this.add.image(1090, 260, 'asset_arch_ornate').setScale(1.2).setDepth(2);
    torana1.setTint(0xb39977);

    // Arch connecting second pillar to eastern hall
    const archEast = this.add.image(1300, 290, 'asset_arch_simple').setScale(1.05).setDepth(1);
    archEast.setTint(0x7a654d);

    // Midground carved wall relief panels
    this.add.image(940, 490, 'asset_wall_panel').setScale(1.0).setDepth(1);
    this.add.image(1240, 490, 'asset_wall_panel').setScale(1.0).setDepth(1);

    // Elevated stepping platforms with structural support column (Zone 2)
    const pilSupport1 = this.add.image(980, 650, 'asset_pillar_intact').setScale(0.95).setDepth(1);
    pilSupport1.setTint(0x7a654d);
    const pElevated1 = this.createPlatform(980, 630, 'short');
    this.spawnCoins(944, 540, 3);

    const pElevated2 = this.createPlatform(1200, 555, 'short');
    this.addTorch(1200, 450);

    // Spikes under the high ledge
    this.createSpikes(1060, 640);

    // SECTION 3: THE CHASM OF BROKEN PILLARS & TEMPLE TANK (1500 - 2300px)
    // A massive 400px abyss! Floating water mist below.
    // Stepped ghat terraces, broken pillar stepping stones, and swinging pendulum blade.
    const chasmStart = 1520;
    const chasmEnd = 1920;

    // Stepped ghat terraces descending into the water
    const ghatWest = this.add.image(1500, 615, 'asset_wall_corner').setScale(1.05).setDepth(2);
    ghatWest.setTint(0x4a4035);
    const ghatEast = this.add.image(1940, 615, 'asset_wall_corner').setScale(1.05).setDepth(2);
    ghatEast.setTint(0x4a4035);

    // Glowing subterranean temple tank waters at bottom of abyss
    const tankWater = this.add.graphics().setDepth(-5);
    tankWater.fillGradientStyle(0x00f7ff, 0x00f7ff, 0x021a24, 0x021a24, 0.45, 0.45, 0.9, 0.9);
    tankWater.fillRect(chasmStart - 50, 650, chasmEnd - chasmStart + 100, 70);

    // Broken pillar stepping stone 1 (structural pier rising from submerged plinth)
    const bp1 = this.createPlatform(1630, 630, 'short');
    const bPier1 = this.add.image(1630, 680, 'asset_pillar_broken').setScale(1.25).setDepth(1);
    bPier1.setTint(0x5a4a38);

    // Broken pillar stepping stone 2
    const bp2 = this.createPlatform(1800, 560, 'short');
    const bPier2 = this.add.image(1800, 630, 'asset_pillar_broken').setScale(1.25).setDepth(1);
    bPier2.setTint(0x5a4a38);

    // Ruined ceiling anchor arch from which the pendulum swings
    const chasmArch = this.add.image(1730, 140, 'asset_arch_simple').setScale(1.2).setDepth(2);
    chasmArch.setTint(0x6e5b47);

    // Swinging pendulum blade guarding the chasm span
    const blade1 = new SwingingBlade(this, 1730, 180, 1500);
    this.swingingBlades.push(blade1);

    // Landing floor after chasm
    this.createLotusFloor(1920, 2300, 680);
    this.add.image(1960, 630, 'asset_rubble').setScale(1.1).setDepth(3);
    this.add.image(2120, 520, 'asset_wall_panel').setScale(1.0).setDepth(1);

    // SECTION 4: THE SECRET ELEVATED VIMANA ALCOVE (2300 - 2900px)
    // High vertical platforming trial rewarding the secret Vedic Sapphire Relic!
    this.createLotusFloor(2300, 2900, 680);
    this.addTorch(2360, 440);

    // Shuddering platform leading to secret high ledge
    const cpSecret = new CrumblingPlatform(this, 2480, 595);
    this.crumblingPlatforms.push(cpSecret);

    const pSecretMid = this.createPlatform(2620, 550, 'short');

    // Secret high sanctuary ledge with structural support pillar below
    const secretSupportPil = this.add.image(2780, 530, 'asset_pillar_intact').setScale(1.1).setDepth(1);
    secretSupportPil.setTint(0x6e5c46);

    const pSecretHigh = this.createPlatform(2780, 470, 'short');
    // Wall corner with carved seated deity relief framing the shrine
    this.add.image(2840, 350, 'asset_wall_corner').setScale(0.95).setDepth(1);
    this.add.image(2720, 350, 'asset_wall_panel').setScale(0.95).setDepth(1);
    // Lotus pedestal block
    this.add.image(2780, 390, 'asset_pedestal').setScale(0.85).setDepth(2);
    // Rare Glowing Blue Vedic Gem resting on the pedestal!
    const secretGem = new GemCollectible(this, 2780, 345);
    this.gemsGroup.add(secretGem);

    // Falling stalactite hazard below secret alcove
    const boulder1 = new FallingBoulder(this, 2580, 120);
    this.boulders.push(boulder1);

    // SECTION 5: THE CEREMONIAL CHECKPOINT MANDAPA (2900 - 3500px)
    this.createLotusFloor(2900, 3500, 680);

    // Symmetrical colonnaded pavilion: flanking pillars and ornate torana arch
    this.add.image(3000, 635, 'asset_pedestal').setScale(0.9).setDepth(2);
    this.add.image(3300, 635, 'asset_pedestal').setScale(0.9).setDepth(2);
    const cpPilL = this.add.image(3000, 470, 'asset_pillar_intact').setScale(1.2).setDepth(2);
    const cpPilR = this.add.image(3300, 470, 'asset_pillar_intact').setScale(1.2).setDepth(2);
    cpPilL.setTint(0x9a8366);
    cpPilR.setTint(0x9a8366);

    const cpTorana = this.add.image(3150, 275, 'asset_arch_ornate').setScale(1.25).setDepth(2);
    cpTorana.setTint(0xb39977);

    // Monumental Shrine architecture: doorway niche, wall reliefs, stone altar
    const shrineNiche = this.add.image(3150, 490, 'asset_doorway').setScale(1.4).setDepth(2);
    shrineNiche.setTint(0xc2a884);
    this.add.image(3040, 480, 'asset_wall_panel').setScale(1.1).setDepth(1);
    this.add.image(3260, 480, 'asset_wall_panel').setScale(1.1).setDepth(1);

    // Checkpoint Totem standing proudly before the shrine
    const cpTotem = new CheckpointTotem(this, 3150, 600);
    this.checkpoints.push(cpTotem);

    // Dual flaming torches flanking the shrine
    this.addTorch(3050, 420);
    this.addTorch(3250, 420);

    // SECTION 6: THE CRUMBLING SANDSTONE SPAN (3500 - 4100px)
    // Traversal across an ancient collapsed bridge with collapsing stone & swinging blades
    this.createLotusFloor(3500, 3650, 680);

    // Western bridge abutment & rubble
    this.add.image(3640, 615, 'asset_wall_corner').setScale(1.05).setDepth(2);
    this.add.image(3630, 635, 'asset_rubble').setScale(1.0).setDepth(3);

    // Supporting broken pier stumps rising from the trench beneath crumbling platforms
    const bPierBridge1 = this.add.image(3750, 660, 'asset_pillar_broken').setScale(1.1).setDepth(1);
    bPierBridge1.setTint(0x5a4938);
    const cpBridge1 = new CrumblingPlatform(this, 3750, 605);
    this.crumblingPlatforms.push(cpBridge1);

    const bPierBridge2 = this.add.image(3920, 610, 'asset_pillar_broken').setScale(1.1).setDepth(1);
    bPierBridge2.setTint(0x5a4938);
    const cpBridge2 = new CrumblingPlatform(this, 3920, 555);
    this.crumblingPlatforms.push(cpBridge2);

    // Ruined overhead anchor arch for blade 2
    const bridgeArch = this.add.image(3830, 140, 'asset_arch_simple').setScale(1.1).setDepth(1);
    bridgeArch.setTint(0x5a4938);

    const blade2 = new SwingingBlade(this, 3830, 200, 1400);
    this.swingingBlades.push(blade2);

    // Eastern bridge abutment & rubble
    this.add.image(4080, 615, 'asset_wall_corner').setScale(1.05).setDepth(2);
    this.add.image(4090, 635, 'asset_rubble').setScale(1.0).setDepth(3);

    // Spikes in the trench below the bridge
    this.createSpikes(3750, 640);
    this.createSpikes(3920, 640);

    // Falling stalactite
    const boulder2 = new FallingBoulder(this, 3880, 130);
    this.boulders.push(boulder2);

    // SECTION 7: THE GRAND SURYA VAULT GATE (4100 - 4800px)
    // The awe-inspiring climax of Chapter I!
    this.createLotusFloor(4100, 4800, 680);

    // Plinth pedestals for colossal columns
    this.add.image(4280, 635, 'asset_pedestal').setScale(1.1).setDepth(3);
    this.add.image(4620, 635, 'asset_pedestal').setScale(1.1).setDepth(3);

    // Monumental stone entrance archways framing the final vault
    const archFinal = this.add.image(4450, 280, 'asset_arch_ornate').setScale(1.6).setDepth(3);
    archFinal.setTint(0xd4af37);

    const pilFinalL = this.add.image(4280, 420, 'asset_pillar_intact').setScale(1.6).setDepth(3);
    const pilFinalR = this.add.image(4620, 420, 'asset_pillar_intact').setScale(1.6).setDepth(3);
    pilFinalL.setTint(0x8a7356);
    pilFinalR.setTint(0x8a7356);

    // Flanking carved masonry wall panels
    this.add.image(4200, 460, 'asset_wall_panel').setScale(1.2).setDepth(1);
    this.add.image(4700, 460, 'asset_wall_panel').setScale(1.2).setDepth(1);

    // Rubble at foot of gate
    this.add.image(4290, 630, 'asset_rubble').setScale(1.2).setDepth(4);
    this.add.image(4610, 630, 'asset_rubble').setScale(1.2).setDepth(4);

    // The Colossal Monolithic Surya Vault Gate
    this.vaultGateFrame = this.add.container(4450, 480).setDepth(2);

    // Vault stone frame
    const vBg = this.add.rectangle(0, 0, 220, 320, 0x121724).setStrokeStyle(5, 0xd4af37);
    // Sanskrit Runes carved into the portal arch
    const sanskritRunes = this.add.text(0, -125, '॥ ॐ तत्सत् · सूर्य मण्डल द्वारम् ॥', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#ffd700',
    }).setOrigin(0.5);

    // Rotating Surya Solar Disc Seal in center of gate
    this.suryaVaultDisc = this.add.image(0, 0, 'puzzle_dial_sun').setScale(1.5);
    this.tweens.add({
      targets: this.suryaVaultDisc,
      angle: 360,
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    });

    this.gatePrompt = this.add.text(0, 95, '[E] UNSEAL SURYA VAULT', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#ffd700',
      backgroundColor: '#0a0d16',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setVisible(false);

    this.vaultGateFrame.add([vBg, sanskritRunes, this.suryaVaultDisc, this.gatePrompt]);

    // Vault Gate trigger zone
    const gateZone = this.add.zone(4450, 560, 160, 180);
    this.physics.add.existing(gateZone, true);
    if (this.player) {
      this.physics.add.overlap(this.player, gateZone, () => {
        if (!this.isVaultUnlocked && this.gatePrompt) this.gatePrompt.setVisible(true);
      });
    }

    // Also support pressing E when close
    this.input.keyboard?.on('keydown-E', () => {
      if (!this.isVaultUnlocked && this.player && isWithinGateRange(this.player.x, 4450)) {
        this.unlockSuryaVault();
      }
    });
  }

  /**
   * Helper to tile long carved lotus platform beams (`asset_platform_long`)
   */
  private createLotusFloor(startX: number, endX: number, y: number) {
    const beamWidth = 260; // visual width of platform_long
    for (let x = startX; x < endX; x += beamWidth) {
      const segWidth = Math.min(beamWidth, endX - x);
      const plat = this.platforms.create(x + segWidth / 2, y, 'asset_platform_long');
      plat.setDisplaySize(segWidth, 42);
      plat.refreshBody();
      plat.setDepth(4);
    }
  }

  private createPlatform(x: number, y: number, type: 'long' | 'short') {
    const key = type === 'long' ? 'asset_platform_long' : 'asset_platform_short';
    const plat = this.platforms.create(x, y, key);
    plat.refreshBody();
    plat.setDepth(4);
    return plat;
  }

  private createSpikes(x: number, y: number) {
    const sp = new FloorSpikes(this, x, y);
    this.spikesGroup.add(sp);
    sp.setDepth(5);
  }

  private spawnCoins(startX: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const c = new CoinCollectible(this, startX + i * 36, y);
      this.coinsGroup.add(c);
      c.setDepth(6);
    }
  }

  private addTorch(x: number, y: number) {
    // Sconce fixture
    const sconce = this.add.image(x, y + 10, 'asset_torch').setScale(1.2).setDepth(2);
    sconce.setTint(0x9a8366);

    // Animated Diya torch flame
    const flame = this.add.sprite(x, y - 10, 'particle_gold').setScale(1.4).setDepth(7);
    flame.setTint(0xff7700);
    this.tweens.add({
      targets: flame,
      scaleX: { from: 1.2, to: 1.6 },
      scaleY: { from: 1.3, to: 1.8 },
      alpha: { from: 0.85, to: 1 },
      duration: 120 + Math.random() * 50,
      yoyo: true,
      repeat: -1,
    });

    // Warm radial glow image for lighting
    const glow = this.add.image(x, y - 10, 'light_radial_torch').setScale(1.3).setDepth(8);
    glow.setAlpha(0.7);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.6, to: 0.8 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    this.torchLights.push({ x, y: y - 10, flame, glow });
  }

  /**
   * Sets up real-time dynamic radial lantern lighting
   */
  private setupDynamicLighting() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Lantern warm glow attached to Dr. Vance
    this.lanternGlow = this.add.image(0, 0, 'light_radial_warm').setScale(1.8).setDepth(12);
    this.lanternGlow.setAlpha(0.85);

    // Subtle breathing pulse on lantern light
    this.tweens.add({
      targets: this.lanternGlow,
      scaleX: { from: 1.75, to: 1.9 },
      scaleY: { from: 1.75, to: 1.9 },
      alpha: { from: 0.8, to: 0.92 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Dark ambient veil covering screen edges (vignette)
    this.ambientShadow = this.add.renderTexture(0, 0, w, h).setScrollFactor(0).setDepth(11);
    this.ambientShadow.setAlpha(0.25);
  }

  public update(time: number, delta: number) {
    if (this.player) {
      this.player.update(time, delta);

      // Sync Dr. Vance's dynamic lantern position
      const lanternPos = this.player.getLanternPosition();
      this.lanternGlow.setPosition(lanternPos.x, lanternPos.y);

      // Check falling stalactites trigger proximity
      this.boulders.forEach((b) => b.checkTrigger(this.player.x));

      // Abyss chasm void death check
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      if (hasReachedPitBottom(this.player.x, playerBody.bottom, this.LEVEL_HEIGHT, this.PIT_RANGES)) {
        this.handlePlayerDamage(5);
      }

      if (this.gatePrompt && !this.isVaultUnlocked) {
        this.gatePrompt.setVisible(isWithinGateRange(this.player.x, 4450));
      }
    }
  }

  private handlePlayerDamage(amount: number = 1) {
    if (this.player.takeDamage(amount)) {
      this.updateHUD();
    }
  }

  private respawnPlayer() {
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.player.health = this.player.maxHealth;
      this.player.isDead = false;
      this.player.isInvulnerable = false;
      this.player.clearTint();
      this.player.setAlpha(1);
      this.player.setPosition(this.checkpointPos.x, this.checkpointPos.y);
      this.player.setVelocity(0, 0);
      this.crumblingPlatforms.forEach((cp) => cp.resetPlatform());
      this.updateHUD();
      this.cameras.main.fadeIn(400, 0, 0, 0);
    });
  }

  private unlockSuryaVault() {
    if (this.isVaultUnlocked) return;
    this.isVaultUnlocked = true;
    this.gatePrompt?.setVisible(false);
    audioManager.playPuzzleSolve();

    // Dramatic camera shake and celestial beam
    this.cameras.main.shake(1200, 0.015);
    this.showDiscoveryBanner('SURYA SEAL UNLOCKED · AWAKENING CELESTIAL GEAR LOCK');

    // Golden light rays pouring through portal
    const vaultBeam = this.add.graphics().setDepth(15);
    vaultBeam.fillGradientStyle(0xffd700, 0xffd700, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    vaultBeam.fillRect(4350, 280, 200, 400);

    // Rapid acceleration of the Surya solar disc
    this.tweens.add({
      targets: this.suryaVaultDisc,
      angle: '+=1080',
      duration: 2000,
      ease: 'Power2.easeIn',
      onComplete: () => {
        saveManager.addCollectibles(this.coinsCollected, this.gemsCollected);
        saveManager.setLevelComplete(1, this.coinsCollected * 10 + this.gemsCollected * 50);

        // Transition to Chapter 2: The Puzzle Chamber
        this.cameras.main.fadeOut(800, 255, 215, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('PuzzleScene');
        });
      },
    });
  }

  private showDiscoveryBanner(msg: string) {
    if (this.objectiveBanner) {
      this.objectiveBanner.setText(`◈ ${msg} ◈`);
      this.objectiveBanner.setAlpha(1);
      this.tweens.add({
        targets: this.objectiveBanner,
        alpha: 0,
        delay: 2400,
        duration: 600,
      });
    }
  }

  // --- World-Matched Minimal HUD System ---
  private createHUD() {
    const hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // Diya Oil Lamp / Hearts Indicator (Top Left)
    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(24 + i * 28, 20, '🪔', {
        fontSize: '20px',
      });
      this.hudHearts.push(heart);
      hud.add(heart);
    }

    // Monumental Chapter Title
    const titleText = this.add.text(24, 50, 'CHAPTER I · THE SUNKEN TUNNEL (ELLORA SANCTUM)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#d4af37',
      letterSpacing: 2,
    });
    hud.add(titleText);

    // Center Discovery Banner
    this.objectiveBanner = this.add.text(this.scale.width / 2, 75, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    hud.add(this.objectiveBanner);

    // Coin & Gem Counters (Top Right)
    const coinMedallion = this.add.circle(this.scale.width - 240, 32, 10, 0xffd700);
    this.hudCoinText = this.add.text(this.scale.width - 222, 22, '0', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });

    const gemCrystal = this.add.polygon(this.scale.width - 150, 32, [0, -9, 9, 0, 0, 9, -9, 0], 0x00f7ff);
    this.hudGemText = this.add.text(this.scale.width - 132, 22, '0', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });

    // Pause Button
    const pauseBtn = this.add.rectangle(this.scale.width - 50, 32, 36, 32, 0x141b2a, 0.9).setStrokeStyle(1, 0xd4af37);
    const pauseTxt = this.add.text(this.scale.width - 50, 32, '❚❚', {
      fontSize: '12px',
      color: '#ffd700',
    }).setOrigin(0.5);

    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => {
      this.scene.launch('PauseScene', { returnTo: 'TunnelScene' });
      this.scene.pause();
    });

    hud.add([coinMedallion, this.hudCoinText, gemCrystal, this.hudGemText, pauseBtn, pauseTxt]);
  }

  private updateHUD() {
    for (let i = 0; i < 5; i++) {
      if (this.hudHearts[i]) {
        this.hudHearts[i].setAlpha(i < this.player.health ? 1 : 0.25);
      }
    }
    if (this.hudCoinText) this.hudCoinText.setText(this.coinsCollected.toString());
    if (this.hudGemText) this.hudGemText.setText(this.gemsCollected.toString());
  }
}

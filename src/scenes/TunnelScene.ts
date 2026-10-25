/**
 * GlobeTrotter: The Lost Relic — Chapter I: The Sunken Tunnel
 *
 * ARCHITECTURAL GRAMMAR (single coherent ruleset):
 *
 *   FLOOR_Y     = 659   (top surface of main floor tier — static physics)
 *   FLOOR_CENTER= 680   (platform.create() y for floor segments)
 *   CEIL_Y      = 60    (bottom of ceiling structural zone)
 *   HALL_HEIGHT = 599   (FLOOR_Y - CEIL_Y — net interior clearance)
 *
 *   Column:   width=28, height=280,  base at FLOOR_Y, capital top at ~CEIL_Y+100
 *   Beam/lintel spans between column capitals at y=180
 *   Platform tier 1:  y_center=600 → surface=579  (rise 80px — reachable)
 *   Platform tier 2:  y_center=575 → surface=554  (rise 105px — at limit)
 *   NO platform above y_surface=554 from the main floor (physics cap is ~108px).
 *
 *   Jump physics (verified):
 *     JUMP_SPEED  = 460 px/s   GRAVITY = 980 px/s²
 *     max rise    = 460²/(2×980) ≈ 108 px
 *     run speed   = 210 px/s
 *     max h-reach (flat)       = (2×460/980)×210 ≈ 197 px
 *     h-reach at 80px rise    ≈ 132 px
 *
 * Seven zones share the same stone palette and column spacing (every 380px).
 * Variation comes from damage state, water, lighting, elevation, not asset swaps.
 */

import Phaser from 'phaser';
import { Explorer } from '../entities/Explorer';
import { FloorSpikes, SwingingBlade, FallingBoulder, CrumblingPlatform } from '../entities/Trap';
import { CoinCollectible, GemCollectible, CheckpointTotem } from '../entities/Collectible';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';
import { hasReachedPitBottom, isWithinGateRange, calculateStarRating, type PitRange } from '../systems/GameplayRules';
import { gamification, JOURNAL_ENTRIES, RELIC_REGISTRY, ACHIEVEMENTS } from '../systems/Gamification';

// ─── Architectural Constants ───────────────────────────────────────────────
const FLOOR_Y      = 659;   // top-of-floor surface (player stands here)
const FLOOR_CENTER = 680;   // platform.create() centre y for 42px-tall segment
const CEIL_Y       = 68;    // bottom of ceiling band
const COL_WIDTH    = 28;
const COL_HEIGHT   = 282;   // from capital top (CEIL_Y+110=178) to base (FLOOR_Y=659) → 481px visual col
const COL_SPACING  = 380;   // columns repeat every 380px
// Platform surface y-values (must be >= FLOOR_Y - 108 = 551)
const PLAT_Y_LO    = 600;   // platform centre → surface 579  (rise=80px) — easy hop
const PLAT_Y_HI    = 576;   // platform centre → surface 555  (rise=104px) — challenging, reachable
const BEAM_Y       = 180;   // ornamental beam connecting column capitals

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
  private lanternGlow!: Phaser.GameObjects.Image;
  private torchLights: TorchLight[] = [];

  private checkpointPos: { x: number; y: number } = { x: 140, y: 580 };
  private coinsCollected: number = 0;
  private gemsCollected: number = 0;

  // Level Dimensions
  private readonly LEVEL_WIDTH  = 4800;
  private readonly LEVEL_HEIGHT = 720;
  // Pit death zones (gaps in the main floor)
  private readonly PIT_RANGES: readonly PitRange[] = [
    [1520, 1940],   // Zone 3 chasm
    [3650, 4100],   // Zone 6 bridge gap
  ];

  // Vault Gate
  private suryaVaultDisc!: Phaser.GameObjects.Image;
  private vaultGateFrame!: Phaser.GameObjects.Container;
  private gatePrompt!: Phaser.GameObjects.Text;
  private isVaultUnlocked: boolean = false;

  // Gamification & Progression Tracking
  private hasArtifact: boolean = false;
  private isMechanismSolved: boolean = false;
  private deathsThisRun: number = 0;
  private isCinematicActive: boolean = false;
  private isJournalModalOpen: boolean = false;
  private isTabletModalOpen: boolean = false;
  private discoveriesFoundThisRun: Set<string> = new Set();
  private masteryChallengesCompleted: Set<string> = new Set();

  // Sequence 1: Ancient Relic Plinth
  private artifactPedestal?: Phaser.GameObjects.Container;
  private artifactGlow?: Phaser.GameObjects.Image;
  private artifactPrompt?: Phaser.GameObjects.Text;

  // Sequence 3 & 4: Inscriptions and Mechanism
  private inscriptionGitaPrompt?: Phaser.GameObjects.Text;
  private mechanismSocketContainer?: Phaser.GameObjects.Container;
  private mechanismRings?: Phaser.GameObjects.Image;
  private mechanismSocketGlow?: Phaser.GameObjects.Image;
  private mechanismRunes?: Phaser.GameObjects.Text;
  private mechanismPrompt?: Phaser.GameObjects.Text;
  private blueLightBeams: Phaser.GameObjects.Graphics[] = [];
  private tabletModal?: Phaser.GameObjects.Container;
  private journalModal?: Phaser.GameObjects.Container;

  // HUD
  private hudHearts: Phaser.GameObjects.Text[] = [];
  private hudCoinText!: Phaser.GameObjects.Text;
  private hudGemText!: Phaser.GameObjects.Text;
  private objectiveBanner!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TunnelScene' });
  }

  public create() {
    // Reset state on every entry (prevents duplication on restart)
    this.checkpointPos   = { x: 140, y: 580 };
    this.coinsCollected  = 0;
    this.gemsCollected   = 0;
    this.crumblingPlatforms = [];
    this.swingingBlades  = [];
    this.boulders        = [];
    this.checkpoints     = [];
    this.torchLights     = [];
    this.hudHearts       = [];
    this.isVaultUnlocked = false;

    // Gamification state initialization
    this.hasArtifact = saveManager.hasRelic('relic_sun_disc_fragment');
    this.isMechanismSolved = saveManager.isEventAwarded('mech_artifact_socket');
    this.deathsThisRun = 0;
    this.isCinematicActive = false;
    this.isJournalModalOpen = false;
    this.isTabletModalOpen = false;
    this.discoveriesFoundThisRun = new Set();
    this.masteryChallengesCompleted = new Set();
    this.blueLightBeams = [];

    gamification.unlockJournal(this, 'entry_arrival');

    audioManager.playMusic('tunnel');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.physics.world.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);

    // Layer order (depth):
    //  -30 … -20  : far atmospheric background
    //  -20 … -10  : midground architectural ruins
    //  -10 … -2   : ceiling band
    //   1  …  3   : background wall details (non-collidable décor)
    //   4          : floor & platform surfaces (collidable)
    //   5  …  6   : foreground décor, traps, collectibles
    //   7  …  9   : particle fx, torches
    //   10         : player
    //   11 … 13   : lighting overlays
    //  100         : HUD

    this.buildBackgroundLayers();

    this.platforms   = this.physics.add.staticGroup();
    this.spikesGroup = this.physics.add.staticGroup();
    this.coinsGroup  = this.physics.add.staticGroup();
    this.gemsGroup   = this.physics.add.staticGroup();

    // Player spawns just above the floor so the fade-in feels like descent
    this.player = new Explorer(this, this.checkpointPos.x, this.checkpointPos.y);

    this.buildMonumentalArchitecture();

    // ── Collision registrations ─────────────────────────────────────────────
    this.physics.add.collider(this.player, this.platforms);

    this.crumblingPlatforms.forEach((cp) => {
      this.physics.add.collider(this.player, cp, () => {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down || body.touching.down) cp.triggerCollapse();
      });
    });

    this.physics.add.overlap(this.player, this.spikesGroup, () => {
      this.handlePlayerDamage();
    });

    this.swingingBlades.forEach((blade) => {
      this.physics.add.overlap(this.player, blade.hitArea, () => {
        this.handlePlayerDamage();
      });
    });

    this.boulders.forEach((boulder) => {
      this.physics.add.collider(boulder, this.platforms, () => boulder.shatter());
      this.physics.add.overlap(this.player, boulder, () => {
        this.handlePlayerDamage(2);
        boulder.shatter();
      });
    });

    this.physics.add.overlap(this.player, this.coinsGroup, (_p, coinObj) => {
      const coin = coinObj as unknown as CoinCollectible;
      coin.collect();
      this.coinsCollected++;
      if (this.coinsCollected >= 5) {
        gamification.unlockAchievement(this, 'treasure_hunter');
      }
      this.updateHUD();
    });

    this.physics.add.overlap(this.player, this.gemsGroup, (_p, gemObj) => {
      const gem = gemObj as unknown as GemCollectible;
      gem.collect();
      this.gemsCollected++;
      this.discoveriesFoundThisRun.add('sapphire');
      this.masteryChallengesCompleted.add('secret_chamber');
      gamification.collectRelic(this, 'relic_vedic_sapphire');
      this.updateHUD();
      this.showDiscoveryBanner('VEDIC SAPPHIRE RELIC SECURED');
    });

    this.checkpoints.forEach((cp) => {
      this.physics.add.overlap(this.player, cp, () => {
        if (!cp.isActivated) {
          cp.activate();
          this.checkpointPos = { x: cp.x, y: FLOOR_Y - 30 };
          this.showDiscoveryBanner('CHECKPOINT SANCTUARY REACHED');
        }
      });
    });

    // ── Camera ──────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ── Lantern glow ────────────────────────────────────────────────────────
    this.setupLanternGlow();

    // ── Atmospheric embers ──────────────────────────────────────────────────
    if (this.textures.exists('particle_gold')) {
      const embers = this.add.particles(0, 0, 'particle_gold', {
        x: { min: 0, max: this.LEVEL_WIDTH },
        y: { min: CEIL_Y + 20, max: FLOOR_Y - 20 },
        speedY: { min: -10, max: -30 },
        speedX: { min: -12, max: 12 },
        scale: { start: 0.5, end: 0.05 },
        alpha: { start: 0.45, end: 0 },
        lifespan: 3800,
        frequency: 180,
      });
      embers.setDepth(9);
    }

    this.createHUD();

    this.events.off('player_died');
    this.events.on('player_died', () => this.respawnPlayer());

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.isTabletModalOpen) {
        this.closeTabletModal();
        return;
      }
      if (this.isJournalModalOpen) {
        this.toggleJournalModal();
        return;
      }
      this.scene.launch('PauseScene', { returnTo: 'TunnelScene' });
      this.scene.pause();
    });

    this.input.keyboard?.on('keydown-J', () => {
      this.toggleJournalModal();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isTabletModalOpen) {
        this.closeTabletModal();
      }
    });

    this.input.keyboard?.on('keydown-E', () => {
      this.handleInteractions();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUND LAYERS
  // ═══════════════════════════════════════════════════════════════════════════

  private buildBackgroundLayers() {
    const w = this.LEVEL_WIDTH;
    const h = this.LEVEL_HEIGHT;

    // 1. Sky/void gradient — absolute floor of the compositing stack
    const voidBg = this.add.graphics().setDepth(-30).setScrollFactor(0);
    voidBg.fillGradientStyle(0x020509, 0x020509, 0x0d1018, 0x0d1018, 1);
    voidBg.fillRect(0, 0, 1280, 720);

    // 2. Far ruin panorama (2160×720, scrollFactor 0.25)
    if (this.textures.exists('bg_tunnel_far')) {
      this.add.image(0, 0, 'bg_tunnel_far')
        .setOrigin(0, 0)
        .setScrollFactor(0.25, 0)
        .setDepth(-28);
    }

    // 3. Midground colonnade ruins (3216×720, scrollFactor 0.55)
    if (this.textures.exists('bg_tunnel_mid')) {
      this.add.image(0, 0, 'bg_tunnel_mid')
        .setOrigin(0, 0)
        .setScrollFactor(0.55, 0)
        .setDepth(-18);
    }

    // 4. Procedural wall background — fills the full 4800px to prevent any
    //    empty void being exposed when the real bg images don't tile fully.
    //    Rendered behind everything, acts as architectural wall colour.
    const wallBg = this.add.graphics().setDepth(-20);
    // Base wall fill — warm sandstone dark tone
    wallBg.fillStyle(0x1a130a, 1);
    wallBg.fillRect(0, 0, w, h);
    // Continuous stone-block course lines across the full width
    wallBg.lineStyle(1, 0x2a1f13, 0.6);
    for (let row = CEIL_Y; row < FLOOR_Y; row += 48) {
      wallBg.lineBetween(0, row, w, row);
    }
    // Vertical mortar lines — staggered every 160px per row
    for (let row = CEIL_Y; row < FLOOR_Y; row += 48) {
      const offset = ((row / 48) % 2) * 80;
      for (let col = offset; col < w; col += 160) {
        wallBg.lineBetween(col, row, col, row + 48);
      }
    }

    // 5. Ceiling rock band (3744×150, scrollFactor 0.70)
    if (this.textures.exists('bg_tunnel_ceiling')) {
      this.add.image(0, 0, 'bg_tunnel_ceiling')
        .setOrigin(0, 0)
        .setScrollFactor(0.7, 0)
        .setDepth(-12);
    } else {
      // Fallback ceiling silhouette
      const ceilFb = this.add.graphics().setDepth(-12);
      ceilFb.fillStyle(0x050810, 1);
      ceilFb.fillRect(0, 0, w, CEIL_Y + 20);
    }

    // 6. Ground plane — solid dark stone beneath the walkable floor
    const ground = this.add.graphics().setDepth(3);
    ground.fillStyle(0x110d08, 1);
    ground.fillRect(0, FLOOR_Y + 21, w, h - FLOOR_Y - 21);
    // Stone flagstones on the floor surface
    ground.lineStyle(1, 0x1e160e, 0.7);
    for (let fx = 0; fx < w; fx += 200) {
      ground.lineBetween(fx, FLOOR_Y + 21, fx, FLOOR_Y + 50);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEVEN ZONES
  // ═══════════════════════════════════════════════════════════════════════════

  private buildMonumentalArchitecture() {
    this.buildZone1_SanctumThreshold();
    this.buildZone2_HypostyleMandapa();
    this.buildZone3_ChasmAndTank();
    this.buildZone4_VimanaAlcove();
    this.buildZone5_CheckpointMandapa();
    this.buildZone6_CrumblingSandstoneSpan();
    this.buildZone7_SuryaVaultGate();
  }

  // ─── Zone 1: Sanctum Threshold (0 – 750) ──────────────────────────────────
  private buildZone1_SanctumThreshold() {
    const Z_START = 0;
    const Z_END   = 750;

    this.tileFloor(Z_START, Z_END);

    // Entrance arch and lintel at the zone start
    this.placeArch(200, true);   // ornate torana arch centred x=200
    this.placeColumn(40);
    this.placeColumn(400);
    this.drawBeam(40, 400);

    // Decorative wall panels recessed between columns
    this.placeWallPanel(200, 340);
    this.placeWallPanel(200, 440);

    // Torch sconces on entry columns
    this.addTorch(40,  FLOOR_Y - COL_HEIGHT + 40);
    this.addTorch(400, FLOOR_Y - COL_HEIGHT + 40);

    // Introductory coins — easy to collect, teach the mechanic
    this.spawnCoins(150, FLOOR_Y - 60, 4);

    // ── Sequence 1: The Discovered Lost Relic Artifact (x=280) ──
    const artX = 280;
    const artY = FLOOR_Y - 40;
    this.placePedestal(artX, FLOOR_Y - 14);

    this.artifactPedestal = this.add.container(artX, artY).setDepth(6);
    this.artifactGlow = this.add.image(0, 0, 'light_radial_warm')
      .setScale(0.85)
      .setAlpha(0.9);
    const artDisc = this.add.image(0, 0, 'puzzle_dial_sun')
      .setScale(0.7)
      .setTint(0xffd700);
    this.artifactPrompt = this.add.text(0, -36, '[E] EXAMINE ANCIENT ARTIFACT', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#ffd700',
      backgroundColor: '#0c111caa',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setVisible(false);

    this.artifactPedestal.add([this.artifactGlow, artDisc, this.artifactPrompt]);

    this.tweens.add({
      targets: artDisc,
      y: -6,
      angle: 360,
      duration: 8000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    if (this.hasArtifact) {
      this.artifactPedestal.setVisible(false);
    }

    // First doorway recess in the south wall
    this.placeDoorway(560, FLOOR_Y - 100);
  }

  // ─── Zone 2: Hypostyle Mandapa (750 – 1500) ───────────────────────────────
  private buildZone2_HypostyleMandapa() {
    const Z_START = 750;
    const Z_END   = 1500;

    this.tileFloor(Z_START, Z_END);

    // Three paired colonnade bays — regular interval of 380px
    const colPairs: [number, number][] = [
      [780, 760 + COL_SPACING],
      [780 + COL_SPACING, 760 + COL_SPACING * 2],
    ];

    colPairs.forEach(([lx, rx]) => {
      this.placeColumn(lx);
      this.placeColumn(rx);
      this.drawBeam(lx, rx);
      this.placeWallPanel((lx + rx) / 2, 300);
      this.addTorch(lx, FLOOR_Y - COL_HEIGHT + 60);
    });

    // Wall panels on outer faces
    this.placeWallPanel(800, 420);
    this.placeWallPanel(1460, 420);

    // ── Sequence 3: Authentic Sanskrit Wall Inscription (Bhagavad Gita 2.47) ──
    const inscrX = 1100;
    const inscrY = 350;
    this.add.image(inscrX, inscrY, 'asset_wall_panel').setScale(1.2).setTint(0x6b533e).setDepth(1);
    const gitaText = this.add.text(inscrX, inscrY - 10, '॥ कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ॥', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#ffd700',
      stroke: '#1c130b',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);
    this.tweens.add({
      targets: gitaText,
      alpha: { from: 0.75, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    this.inscriptionGitaPrompt = this.add.text(inscrX, inscrY + 36, '[E] TRANSLATE ANCIENT SCRIPTURE', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#ffd700',
      backgroundColor: '#0c111caa',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setDepth(10).setVisible(false);

    // Elevated stepping platform: tier-1 hop (rise 80px) — physics verified ✓
    // Platform at x=1040, surface y = PLAT_Y_LO - 21 = 579. Rise = FLOOR_Y - 579 = 80px < 108px ✓
    this.createMidPlatform(1040, PLAT_Y_LO);
    // Coins reward players who make this hop
    this.spawnCoins(990, PLAT_Y_LO - 60, 3);

    // Second elevated platform further right — also tier-1 (rise 80px) ✓
    this.createMidPlatform(1150, PLAT_Y_LO);   // bridge hop

    // Spike hazard in the trench beneath platforms — below the platform, not on the floor
    this.createSpikes(1060, FLOOR_Y - 2);

    // ── Sequence 4: The Monumental Sealed Artifact Mechanism (x=1480) ──
    const mechX = 1480;
    const mechY = FLOOR_Y - 140;

    this.mechanismSocketContainer = this.add.container(mechX, mechY).setDepth(3);
    const mechFrame = this.add.rectangle(0, 0, 150, 190, 0x14100c).setStrokeStyle(3, 0x8c6d3b);
    this.mechanismRings = this.add.image(0, 0, 'puzzle_dial_sun')
      .setScale(1.15)
      .setTint(this.isMechanismSolved ? 0xffd700 : 0x5a4835);
    this.mechanismSocketGlow = this.add.image(0, 0, 'light_radial_warm')
      .setScale(1.0)
      .setAlpha(this.isMechanismSolved ? 0.9 : 0);
    this.mechanismRunes = this.add.text(0, -75, '॥ ॐ तत्सत् · सूर्य मण्डल द्वारम् ॥', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: this.isMechanismSolved ? '#ffd700' : '#8c7352',
    }).setOrigin(0.5);

    this.mechanismPrompt = this.add.text(0, 80, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#ffd700',
      backgroundColor: '#0c111caa',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setVisible(false);

    this.mechanismSocketContainer.add([
      mechFrame,
      this.mechanismRings,
      this.mechanismSocketGlow,
      this.mechanismRunes,
      this.mechanismPrompt,
    ]);

    // Wall corner marking transition to Zone 3
    this.placeWallCorner(1470, FLOOR_Y - 60);
  }

  // ─── Zone 3: Chasm of Broken Pillars & Ancient Tank (1500 – 2300) ─────────
  private buildZone3_ChasmAndTank() {
    const Z_START  = 1500;
    const Z_END    = 2300;
    const CHASM_S  = 1520;
    const CHASM_E  = 1940;

    // Floor on both sides of chasm
    this.tileFloor(Z_START, CHASM_S);
    this.tileFloor(CHASM_E, Z_END);

    // Western ghat abutment
    this.placeWallCorner(1490, FLOOR_Y - 50);
    this.placeColumn(1490);
    this.addTorch(1490, FLOOR_Y - COL_HEIGHT + 60);

    // Subterranean temple tank — glowing water at bottom of abyss
    const tankGfx = this.add.graphics().setDepth(1);
    tankGfx.fillGradientStyle(0x003a4a, 0x003a4a, 0x021a24, 0x021a24, 0.85, 0.85, 1, 1);
    tankGfx.fillRect(CHASM_S, 660, CHASM_E - CHASM_S, 60);
    // Animated shimmer on water surface
    tankGfx.lineStyle(1, 0x00b4cc, 0.4);
    for (let wx = CHASM_S; wx < CHASM_E; wx += 40) {
      tankGfx.lineBetween(wx, 665, wx + 20, 668);
    }

    // Celestial blue shafts of light piercing the abyss
    const beam1 = this.add.graphics().setDepth(2);
    beam1.fillGradientStyle(0x00d4ff, 0x00d4ff, 0x002244, 0x002244, 0.25, 0.25, 0.02, 0.02);
    beam1.fillTriangle(1600, CEIL_Y, 1750, CEIL_Y, 1680, FLOOR_Y);
    this.blueLightBeams.push(beam1);

    const beam2 = this.add.graphics().setDepth(2);
    beam2.fillGradientStyle(0x00d4ff, 0x00d4ff, 0x002244, 0x002244, 0.25, 0.25, 0.02, 0.02);
    beam2.fillTriangle(1780, CEIL_Y, 1920, CEIL_Y, 1850, FLOOR_Y);
    this.blueLightBeams.push(beam2);

    // Broken pillar stepping stones rising from the tank
    // Stone 1 at x=1640 — from west bank (1520), gap=120px. h-reach flat ≈ 197px ✓
    //   Platform surface at PLAT_Y_LO - 21 = 579. Rise from floor = FLOOR_Y - 579 = 80px < 108 ✓
    this.createMidPlatform(1640, PLAT_Y_LO);
    this.placeBrokenPillar(1640, FLOOR_Y - 10);

    // Stone 2 at x=1790 — from stone 1 (1640), gap=150px. h-reach at same height ≈ 197px ✓
    this.createMidPlatform(1790, PLAT_Y_LO);
    this.placeBrokenPillar(1790, FLOOR_Y - 10);

    // Pendulum blade guarding the chasm — suspended from arch overhead
    this.placeArchSimple(1715, CEIL_Y + 80);
    const blade1 = new SwingingBlade(this, 1715, CEIL_Y + 120, 1500);
    this.swingingBlades.push(blade1);

    // Eastern ghat abutment
    this.placeColumn(1950);
    this.placeWallCorner(1960, FLOOR_Y - 50);
    this.addTorch(1950, FLOOR_Y - COL_HEIGHT + 60);

    // Post-chasm landing zone features
    this.placeRubble(2010, FLOOR_Y - 10);
    this.placeWallPanel(2150, 380);
    this.spawnCoins(2050, FLOOR_Y - 60, 3);
    this.placeColumn(2270);
    this.drawBeam(1950, 2270);
  }

  // ─── Zone 4: Secret Elevated Vimana Alcove (2300 – 2900) ─────────────────
  private buildZone4_VimanaAlcove() {
    const Z_START = 2300;
    const Z_END   = 2900;

    this.tileFloor(Z_START, Z_END);

    this.placeColumn(2300);
    this.placeColumn(2680);
    this.drawBeam(2300, 2680);
    this.addTorch(2300, FLOOR_Y - COL_HEIGHT + 60);

    // The secret path uses a staircase of platforms — each step within 108px max rise
    // Step 1: PLAT_Y_LO (surface 579, rise from floor = 80px) ✓
    this.createMidPlatform(2430, PLAT_Y_LO);
    // Step 2: PLAT_Y_HI (surface 555, rise from step1 surface 579 = 24px) ✓
    //   Horizontal from 2430 to 2560 = 130px. h-reach at 24px rise ≈ 180px ✓
    this.createMidPlatform(2560, PLAT_Y_HI);

    // Step 3: PLAT_Y_HI again (same height, this IS the secret shrine ledge)
    //   Horizontal from 2560 to 2700 = 140px. h-reach at 0px rise (same height) = 197px ✓
    this.createMidPlatform(2700, PLAT_Y_HI);

    // Crumbling platform leading the route — between step 1 and step 2
    // At x=2490, PLAT_Y_LO — player must commit quickly
    const cpSecret = new CrumblingPlatform(this, 2490, PLAT_Y_LO);
    this.crumblingPlatforms.push(cpSecret);

    // Secret shrine alcove architecture at platform 2700
    this.placeWallCorner(2760, PLAT_Y_HI - 80);
    this.placeWallPanel(2700, PLAT_Y_HI - 120);
    this.placeDoorway(2700, PLAT_Y_HI - 90);
    this.placePedestal(2700, PLAT_Y_HI - 40);

    // The Vedic Sapphire Gem — placed on the shrine pedestal at a reachable y
    const secretGem = new GemCollectible(this, 2700, PLAT_Y_HI - 65);
    this.gemsGroup.add(secretGem);
    secretGem.setDepth(6);

    // Falling stalactite hazard — warns player of overhead danger in the alcove
    // Triggered when player is within 80px horizontally (defined in FallingBoulder)
    const boulder1 = new FallingBoulder(this, 2540, CEIL_Y + 10);
    this.boulders.push(boulder1);

    this.placeColumn(2880);
    this.drawBeam(2680, 2880);
    this.addTorch(2680, FLOOR_Y - COL_HEIGHT + 60);
  }

  // ─── Zone 5: Ceremonial Checkpoint Mandapa (2900 – 3500) ─────────────────
  private buildZone5_CheckpointMandapa() {
    const Z_START = 2900;
    const Z_END   = 3500;

    this.tileFloor(Z_START, Z_END);

    // Formal symmetrical colonnade framing the checkpoint shrine
    this.placeColumn(2920);
    this.placeColumn(3300);
    this.drawBeam(2920, 3300);
    this.placeArch(3110, true);
    this.placeWallPanel(3000, 340);
    this.placeWallPanel(3200, 340);
    this.placeDoorway(3110, FLOOR_Y - 100);

    this.addTorch(2920, FLOOR_Y - COL_HEIGHT + 60);
    this.addTorch(3300, FLOOR_Y - COL_HEIGHT + 60);
    // Two flanking torch sconces at shrine level
    this.addTorch(3060, FLOOR_Y - 180);
    this.addTorch(3160, FLOOR_Y - 180);

    // Checkpoint totem placed in the shrine alcove
    const cpTotem = new CheckpointTotem(this, 3110, FLOOR_Y - 20);
    this.checkpoints.push(cpTotem);

    // Second colonnade bay east of checkpoint
    this.placeColumn(3470);
    this.drawBeam(3300, 3470);
    this.placeWallPanel(3400, 420);

    // Coins around the checkpoint reward exploration
    this.spawnCoins(2980, FLOOR_Y - 60, 3);
    this.spawnCoins(3200, FLOOR_Y - 60, 3);
  }

  // ─── Zone 6: Crumbling Sandstone Span (3500 – 4100) ──────────────────────
  private buildZone6_CrumblingSandstoneSpan() {
    const Z_START  = 3500;
    const Z_END    = 4100;
    const BRIDGE_S = 3640;
    const BRIDGE_E = 4080;

    // Solid floor approaches on both sides
    this.tileFloor(Z_START, BRIDGE_S);
    this.tileFloor(BRIDGE_E, Z_END);

    // Western bridge abutment — collapsed arch signals structural failure
    this.placeColumn(3500);
    this.placeColumn(3620);
    this.placeArchSimple(3560, CEIL_Y + 100);
    this.placeWallCorner(3620, FLOOR_Y - 50);
    this.placeRubble(3590, FLOOR_Y - 8);
    this.addTorch(3500, FLOOR_Y - COL_HEIGHT + 60);

    // Bridge: two crumbling spans separated by a gap
    // Platform A at x=3740, PLAT_Y_LO — rise 80px from west abutment floor ✓
    // h-reach from 3620 floor to 3740 = 120px gap at 80px rise → h-reach≈132px ✓ (tight)
    const cpBridge1 = new CrumblingPlatform(this, 3740, PLAT_Y_LO);
    this.crumblingPlatforms.push(cpBridge1);
    this.placeBrokenPillar(3740, FLOOR_Y - 10);

    // Platform B at x=3900, PLAT_Y_LO — same height, gap 160px, h-reach flat ≈ 197px ✓
    const cpBridge2 = new CrumblingPlatform(this, 3900, PLAT_Y_LO);
    this.crumblingPlatforms.push(cpBridge2);
    this.placeBrokenPillar(3900, FLOOR_Y - 10);

    // From platform B (3900) to east floor (4080): gap = 4080-3900-90(half plat)=90px
    // Player falls from platform (surface 579) to floor (659) = 80px drop, no rise required ✓

    // Overhead ruined arch for pendulum blade — anchor point
    this.placeArchSimple(3820, CEIL_Y + 80);
    const blade2 = new SwingingBlade(this, 3820, CEIL_Y + 120, 1400);
    this.swingingBlades.push(blade2);

    // Spikes at the bottom of the bridge gap — integrated into the trench
    // At y = FLOOR_Y - 2: visible in the gap between the span and the floor
    // Player who misses the crumbling platform will land on them
    this.createSpikes(3740, FLOOR_Y - 2);
    this.createSpikes(3900, FLOOR_Y - 2);

    // Falling boulder from overhead cracked ceiling
    const boulder2 = new FallingBoulder(this, 3870, CEIL_Y + 15);
    this.boulders.push(boulder2);

    // Eastern abutment
    this.placeColumn(4060);
    this.placeWallCorner(4070, FLOOR_Y - 50);
    this.placeRubble(4100, FLOOR_Y - 8);
    this.addTorch(4060, FLOOR_Y - COL_HEIGHT + 60);
  }

  // ─── Zone 7: Grand Surya Vault Gate (4100 – 4800) ─────────────────────────
  private buildZone7_SuryaVaultGate() {
    const Z_START = 4100;
    const Z_END   = 4800;
    const GATE_X  = 4450;

    this.tileFloor(Z_START, Z_END);

    // Monumental approach colonnade — two pairs flanking the gate
    this.placeColumn(4130);
    this.placeColumn(4230);
    this.drawBeam(4130, 4230);

    this.placeColumn(4660);
    this.placeColumn(4760);
    this.drawBeam(4660, 4760);

    // Monumental entrance arch spanning the gate
    this.placeArch(GATE_X, true);
    this.placeWallPanel(GATE_X - 180, 340);
    this.placeWallPanel(GATE_X + 180, 340);

    // Flanking colossal pillars — wider and taller for the climax
    const pilL = this.add.image(GATE_X - 160, FLOOR_Y - COL_HEIGHT / 2, 'asset_pillar_intact')
      .setScale(1.8, 1.8).setTint(0x8a7356).setDepth(3);
    const pilR = this.add.image(GATE_X + 160, FLOOR_Y - COL_HEIGHT / 2, 'asset_pillar_intact')
      .setScale(1.8, 1.8).setTint(0x8a7356).setDepth(3);
    void pilL; void pilR; // suppress unused var warning

    // Pedestal plinths at column bases
    this.placePedestal(GATE_X - 160, FLOOR_Y - 20);
    this.placePedestal(GATE_X + 160, FLOOR_Y - 20);

    // Rubble at gate base
    this.placeRubble(GATE_X - 200, FLOOR_Y - 8);
    this.placeRubble(GATE_X + 200, FLOOR_Y - 8);

    // Flanking torches — ceremonial double set
    this.addTorch(GATE_X - 200, FLOOR_Y - COL_HEIGHT + 60);
    this.addTorch(GATE_X + 200, FLOOR_Y - COL_HEIGHT + 60);
    this.addTorch(GATE_X - 120, FLOOR_Y - 180);
    this.addTorch(GATE_X + 120, FLOOR_Y - 180);

    // ── The Surya Vault Gate ──
    this.vaultGateFrame = this.add.container(GATE_X, FLOOR_Y - 160).setDepth(4);

    const vBg = this.add.rectangle(0, 0, 240, 320, 0x0b1020).setStrokeStyle(4, 0xd4af37);
    const runeText = this.add.text(0, -140, '॥ ॐ तत्सत् · सूर्य मण्डल द्वारम् ॥', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#ffd700',
    }).setOrigin(0.5);

    this.suryaVaultDisc = this.add.image(0, 0, 'puzzle_dial_sun').setScale(1.6);
    this.tweens.add({
      targets: this.suryaVaultDisc,
      angle: 360,
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    });

    this.gatePrompt = this.add.text(0, 105, '[E] UNSEAL THE VAULT', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#ffd700',
      backgroundColor: '#0a0d18',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setVisible(false);

    this.vaultGateFrame.add([vBg, runeText, this.suryaVaultDisc, this.gatePrompt]);

    // Gate interaction zone
    const gateZone = this.add.zone(GATE_X, FLOOR_Y - 80, 180, 200);
    this.physics.add.existing(gateZone, true);
    if (this.player) {
      this.physics.add.overlap(this.player, gateZone, () => {
        if (!this.isVaultUnlocked && this.gatePrompt) this.gatePrompt.setVisible(true);
      });
    }

    this.input.keyboard?.on('keydown-E', () => {
      if (!this.isVaultUnlocked && this.player && isWithinGateRange(this.player.x, GATE_X)) {
        this.unlockSuryaVault(GATE_X);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHITECTURAL PRIMITIVES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Tile the main collidable floor using 'asset_platform_long'.
   * Platform centre placed at FLOOR_CENTER so surface top is at FLOOR_Y.
   */
  private tileFloor(startX: number, endX: number) {
    const SEG = 260; // visual width of platform_long tile
    for (let x = startX; x < endX; x += SEG) {
      const segW = Math.min(SEG, endX - x);
      const plat = this.platforms.create(x + segW / 2, FLOOR_CENTER, 'asset_platform_long');
      plat.setDisplaySize(segW, 42);
      plat.refreshBody();
      plat.setDepth(4);
    }
  }

  /**
   * Create a mid-air stepping platform using 'asset_platform_short'.
   * y = platform CENTRE (surface = y - 21).
   */
  private createMidPlatform(x: number, y: number): Phaser.Physics.Arcade.Image {
    const plat = this.platforms.create(x, y, 'asset_platform_short');
    plat.refreshBody();
    plat.setDepth(4);
    return plat;
  }

  /**
   * Place a monolithic column. Base at FLOOR_Y, capital at FLOOR_Y - COL_HEIGHT.
   */
  private placeColumn(x: number) {
    const cy = FLOOR_Y - COL_HEIGHT / 2;
    const col = this.add.image(x, cy, 'asset_pillar_intact')
      .setDisplaySize(COL_WIDTH, COL_HEIGHT)
      .setTint(0x9a8366)
      .setDepth(2);
    // Base plinth
    this.add.image(x, FLOOR_Y - 10, 'asset_pedestal')
      .setDisplaySize(44, 20)
      .setTint(0x7a654d)
      .setDepth(2);
    return col;
  }

  /** Horizontal beam connecting two column capitals at BEAM_Y. */
  private drawBeam(x1: number, x2: number) {
    const beamLen = x2 - x1;
    const beamMidX = (x1 + x2) / 2;
    const beamGfx = this.add.graphics().setDepth(2);
    beamGfx.fillStyle(0x6b5841, 1);
    beamGfx.fillRect(x1, BEAM_Y, beamLen, 18);
    beamGfx.lineStyle(2, 0x8c7357, 0.8);
    beamGfx.strokeRect(x1, BEAM_Y, beamLen, 18);
    // Carved relief band on beam soffit
    beamGfx.fillStyle(0x7a6549, 0.5);
    beamGfx.fillRect(x1 + 4, BEAM_Y + 6, beamLen - 8, 6);
    void beamMidX;
    return beamGfx;
  }

  /** Ornate or simple arch. x = centre of span. */
  private placeArch(x: number, ornate: boolean = false) {
    const key = ornate ? 'asset_arch_ornate' : 'asset_arch_simple';
    const tint = ornate ? 0xb39977 : 0x7a654d;
    return this.add.image(x, BEAM_Y - 20, key)
      .setScale(1.2)
      .setTint(tint)
      .setDepth(2);
  }

  private placeArchSimple(x: number, y: number) {
    return this.add.image(x, y, 'asset_arch_simple')
      .setScale(1.1)
      .setTint(0x6e5b47)
      .setDepth(2);
  }

  private placeWallPanel(x: number, y: number) {
    return this.add.image(x, y, 'asset_wall_panel')
      .setScale(1.0)
      .setTint(0x7a6046)
      .setDepth(1);
  }

  private placeWallCorner(x: number, y: number) {
    return this.add.image(x, y, 'asset_wall_corner')
      .setScale(1.0)
      .setTint(0x4a4035)
      .setDepth(2);
  }

  private placeDoorway(x: number, y: number) {
    return this.add.image(x, y, 'asset_doorway')
      .setScale(1.2)
      .setTint(0xc2a884)
      .setDepth(2);
  }

  private placePedestal(x: number, y: number) {
    return this.add.image(x, y, 'asset_pedestal')
      .setScale(0.9)
      .setTint(0x7a654d)
      .setDepth(2);
  }

  private placeRubble(x: number, y: number) {
    return this.add.image(x, y, 'asset_rubble')
      .setScale(1.0)
      .setTint(0x5a4938)
      .setDepth(3);
  }

  private placeBrokenPillar(x: number, y: number) {
    return this.add.image(x, y, 'asset_pillar_broken')
      .setScale(1.2)
      .setTint(0x5a4a38)
      .setDepth(1);
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
    // Sconce bracket
    this.add.image(x, y + 10, 'asset_torch')
      .setScale(1.1)
      .setTint(0x9a8366)
      .setDepth(2);

    // Animated flame sprite
    const flame = this.add.sprite(x, y - 8, 'particle_gold')
      .setScale(1.3)
      .setTint(0xff7700)
      .setDepth(7);
    this.tweens.add({
      targets: flame,
      scaleX: { from: 1.1, to: 1.5 },
      scaleY: { from: 1.2, to: 1.7 },
      alpha: { from: 0.85, to: 1 },
      duration: 110 + Math.random() * 60,
      yoyo: true,
      repeat: -1,
    });

    // Warm radial glow
    const glow = this.add.image(x, y - 8, 'light_radial_torch')
      .setScale(1.2)
      .setAlpha(0.65)
      .setDepth(8);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.55, to: 0.75 },
      duration: 220,
      yoyo: true,
      repeat: -1,
    });

    this.torchLights.push({ x, y: y - 8, flame, glow });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════════════════

  private setupLanternGlow() {
    this.lanternGlow = this.add.image(0, 0, 'light_radial_warm')
      .setScale(1.8)
      .setAlpha(0.82)
      .setDepth(12);

    this.tweens.add({
      targets: this.lanternGlow,
      scaleX: { from: 1.75, to: 1.9 },
      scaleY: { from: 1.75, to: 1.9 },
      alpha: { from: 0.78, to: 0.9 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  public update(time: number, delta: number) {
    if (!this.player) return;

    if (this.isCinematicActive || this.isJournalModalOpen || this.isTabletModalOpen) {
      this.player.setVelocityX(0);
      return;
    }

    this.player.update(time, delta);

    // Sync lantern to player
    const lanternPos = this.player.getLanternPosition();
    this.lanternGlow.setPosition(lanternPos.x, lanternPos.y);

    // Boulder proximity triggers
    this.boulders.forEach((b) => b.checkTrigger(this.player.x));

    // Abyss death check
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (hasReachedPitBottom(this.player.x, playerBody.bottom, this.LEVEL_HEIGHT, this.PIT_RANGES)) {
      this.handlePlayerDamage(5);
    }

    // ── Proximity Prompts & Zone Exploration Triggers ──
    // 1. Artifact Plinth (x=280)
    if (this.artifactPrompt) {
      this.artifactPrompt.setVisible(!this.hasArtifact && Math.abs(this.player.x - 280) < 65);
    }

    // 2. Zone 2 Entry & Inscription (x=750..1100)
    if (this.player.x > 760 && !saveManager.isEventAwarded('loc_hypostyle_mandapa')) {
      gamification.awardXP(this, 'loc_hypostyle_mandapa', 'LOCATION_DISCOVERY', 'Entered Hypostyle Mandapa');
      gamification.unlockJournal(this, 'entry_lantern_descent');
      gamification.unlockAchievement(this, 'first_steps');
    }

    if (this.inscriptionGitaPrompt) {
      this.inscriptionGitaPrompt.setVisible(Math.abs(this.player.x - 1100) < 75);
    }

    // 3. Artifact Mechanism (x=1480)
    if (this.mechanismPrompt) {
      const inMechRange = Math.abs(this.player.x - 1480) < 85;
      this.mechanismPrompt.setVisible(inMechRange && !this.isMechanismSolved);
      if (inMechRange && !this.isMechanismSolved) {
        this.mechanismPrompt.setText(this.hasArtifact ? '[E] INSERT SURYA-CHAKRA RELIC' : '[E] INSPECT SEALED MECHANISM');
      }
    }

    // 4. Secret Elevated Vimana Alcove (Zone 4: x >= 2680, y <= PLAT_Y_HI)
    if (this.player.x >= 2680 && this.player.y <= PLAT_Y_HI + 30) {
      if (!saveManager.isEventAwarded('route_vimana_shrine')) {
        this.discoveriesFoundThisRun.add('vimana_route');
        gamification.awardXP(this, 'route_vimana_shrine', 'HIDDEN_ROUTE', 'Hidden Vimana Route Found');
        gamification.unlockAchievement(this, 'keen_observer');
      }
    }

    // 5. Zone 6 Trap Gauntlet Survival (x >= 4100)
    if (this.player.x >= 4100) {
      if (!this.masteryChallengesCompleted.has('traps_survived')) {
        this.masteryChallengesCompleted.add('traps_survived');
        gamification.unlockAchievement(this, 'trap_survivor');
      }
    }

    // 6. Gate prompt visibility (x=4450)
    if (this.gatePrompt && !this.isVaultUnlocked) {
      this.gatePrompt.setVisible(isWithinGateRange(this.player.x, 4450));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERACTION HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  private handleInteractions(gateX: number = 4450) {
    if (this.isCinematicActive || this.isJournalModalOpen || this.isTabletModalOpen) return;

    // 1. Surya Vault Gate
    if (!this.isVaultUnlocked && this.player && isWithinGateRange(this.player.x, gateX)) {
      this.unlockSuryaVault(gateX);
      return;
    }

    // 2. Artifact Pickup (x=280)
    if (!this.hasArtifact && Math.abs(this.player.x - 280) < 65) {
      this.hasArtifact = true;
      this.discoveriesFoundThisRun.add('artifact');
      if (this.artifactPedestal) this.artifactPedestal.setVisible(false);
      audioManager.playCoin();
      gamification.collectRelic(this, 'relic_sun_disc_fragment');
      this.showDiscoveryBanner('SURYA-CHAKRA RELIC RECOVERED · A SACRED CELESTIAL KEY');
      return;
    }

    // 3. Gita Inscription (x=1100)
    if (Math.abs(this.player.x - 1100) < 75) {
      this.discoveriesFoundThisRun.add('inscr_gita');
      this.showTabletModal(
        '॥ कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ॥',
        'BHAGAVAD GITA · CHAPTER II, VERSE 47',
        'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, nor be attached to inaction.',
        'Rudhra observes the rock-cut mandapa engraving: True wisdom requires steadfast action unclouded by greed or fear.'
      );
      gamification.inspectInscription(this, 'record_gita_karma');
      return;
    }

    // 4. Sealed Ancient Mechanism (x=1480)
    if (Math.abs(this.player.x - 1480) < 85) {
      if (!this.hasArtifact) {
        this.showDiscoveryBanner('THE SOCKET DEMANDS THE CORE RELIC DISCOVERED NEAR THE RUINS ENTRANCE');
        audioManager.playHit();
      } else if (!this.isMechanismSolved) {
        this.triggerMechanismRevealCinematic();
      }
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEQUENCE 4: 10-STEP MONUMENTAL CINEMATIC REVEAL
  // ═══════════════════════════════════════════════════════════════════════════

  private triggerMechanismRevealCinematic() {
    if (this.isCinematicActive || this.isMechanismSolved) return;
    this.isCinematicActive = true;
    this.player.setVelocity(0, 0);
    this.mechanismPrompt?.setVisible(false);

    // Step 1: Relic aligns with mechanism socket
    const relicFlyer = this.add.image(this.player.x, this.player.y - 12, 'puzzle_dial_sun')
      .setScale(0.8)
      .setDepth(20)
      .setTint(0xffd700);

    this.tweens.add({
      targets: relicFlyer,
      x: 1480,
      y: FLOOR_Y - 140,
      scale: 1.15,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => {
        relicFlyer.destroy();
        audioManager.playPuzzleSolve();

        // Step 2: Ancient markings illuminate
        if (this.mechanismRunes) {
          this.mechanismRunes.setColor('#ffd700');
          this.tweens.add({
            targets: this.mechanismRunes,
            scale: 1.15,
            duration: 400,
            yoyo: true,
          });
        }
        if (this.mechanismSocketGlow) {
          this.tweens.add({
            targets: this.mechanismSocketGlow,
            alpha: 1,
            duration: 600,
          });
        }

        // Step 3: Stone components rotate and slide
        this.cameras.main.shake(1400, 0.012);
        if (this.mechanismRings) {
          this.mechanismRings.setTint(0xffd700);
          this.tweens.add({
            targets: this.mechanismRings,
            angle: '+=360',
            duration: 1600,
            ease: 'Cubic.easeInOut',
          });
        }

        // Step 4 & 5: Low mechanical sound builds & Torches ignite sequentially
        this.time.delayedCall(400, () => {
          this.torchLights.forEach((t, idx) => {
            if (t.x >= 1480 && t.x <= 2300) {
              this.time.delayedCall(idx * 160, () => {
                audioManager.playCoin();
                this.tweens.add({
                  targets: [t.flame, t.glow],
                  scaleX: '+=0.4',
                  scaleY: '+=0.4',
                  alpha: 1,
                  duration: 200,
                });
              });
            }
          });
        });

        // Step 6, 7 & 8: Environment becomes visible, large structures emerge, blue sunlight shafts beam down
        this.time.delayedCall(800, () => {
          this.blueLightBeams.forEach((beam) => {
            this.tweens.add({
              targets: beam,
              alpha: { from: 0.15, to: 0.85 },
              duration: 1400,
            });
          });
        });

        // Step 9: Camera reveals the newly discovered world (smooth pan to x=1950)
        this.time.delayedCall(1200, () => {
          this.cameras.main.stopFollow();
          this.cameras.main.pan(1950, FLOOR_Y - 140, 2000, 'Sine.easeInOut');

          // Step 10: Pan back to Rudhra and restore control
          this.time.delayedCall(2800, () => {
            this.cameras.main.pan(this.player.x, this.player.y, 1400, 'Sine.easeInOut');
            this.time.delayedCall(1500, () => {
              this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
              this.isCinematicActive = false;
              this.isMechanismSolved = true;
              this.masteryChallengesCompleted.add('mechanism');

              this.showDiscoveryBanner('SANCTUM AWAKENED · CELESTIAL BRIDGES REVEALED');
              gamification.awardXP(this, 'mech_artifact_socket', 'SOLVE_PUZZLE', 'Artifact Mechanism Activated');
              gamification.unlockAchievement(this, 'mechanism_master');
              gamification.unlockAchievement(this, 'light_in_darkness');
              gamification.unlockJournal(this, 'entry_mechanism_solved');
            });
          });
        });
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SANSKRIT TABLET DIALOGUE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  private showTabletModal(title: string, source: string, translation: string, loreNote: string) {
    if (this.tabletModal) this.tabletModal.destroy();
    this.isTabletModalOpen = true;
    this.player.setVelocityX(0);

    const w = this.scale.width;
    const h = this.scale.height;
    const modal = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(300);

    const overlay = this.add.rectangle(0, 0, w, h, 0x04060a, 0.75).setInteractive();
    const panel = this.add.rectangle(0, 0, 700, 340, 0x0f1422, 0.96).setStrokeStyle(2, 0xd4af37);

    const header = this.add.text(0, -125, title, {
      fontFamily: 'Cinzel, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    const sourceTxt = this.add.text(0, -90, `◈ ${source} ◈`, {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#00f7ff',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const transTxt = this.add.text(0, -25, `"${translation}"`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '17px',
      color: '#f8fafc',
      align: 'center',
      wordWrap: { width: 620 },
      lineSpacing: 4,
    }).setOrigin(0.5);

    const noteTxt = this.add.text(0, 60, `Expedition Lore Note: ${loreNote}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#94a3b8',
      align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5);

    const closeBtn = this.add.rectangle(0, 120, 200, 36, 0x241d13).setStrokeStyle(1, 0xd4af37).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(0, 120, 'CLOSE TABLET [SPACE]', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#ffd700',
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.closeTabletModal());
    overlay.on('pointerdown', () => this.closeTabletModal());

    modal.add([overlay, panel, header, sourceTxt, transTxt, noteTxt, closeBtn, closeTxt]);
    this.tabletModal = modal;
  }

  private closeTabletModal() {
    if (this.tabletModal) {
      this.tabletModal.destroy();
      this.tabletModal = undefined;
    }
    this.isTabletModalOpen = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IN-GAME DISCOVERY JOURNAL MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  private toggleJournalModal() {
    if (this.isJournalModalOpen) {
      if (this.journalModal) {
        this.journalModal.destroy();
        this.journalModal = undefined;
      }
      this.isJournalModalOpen = false;
      return;
    }

    this.isJournalModalOpen = true;
    this.player.setVelocityX(0);

    const w = this.scale.width;
    const h = this.scale.height;
    const modal = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(300);

    const overlay = this.add.rectangle(0, 0, w, h, 0x03050a, 0.8).setInteractive();
    const panel = this.add.rectangle(0, 0, 780, 520, 0x0c111c, 0.97).setStrokeStyle(2, 0xd4af37);

    const title = this.add.text(0, -225, '◈ DISCOVERY JOURNAL · ARCHAEOLOGICAL CODEX ◈', {
      fontFamily: 'Cinzel, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffd700',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const sub = this.add.text(0, -195, `EXPEDITION XP: ${saveManager.get().totalXp} XP · ADVENTURER: RUDHRA`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      color: '#00f7ff',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Section 1: Relics (4 categories)
    const relicHead = this.add.text(-350, -160, 'COLLECTED RELICS & ARTIFACTS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#ffd700',
    });

    const relics = Object.values(RELIC_REGISTRY);
    const relicEntries: Phaser.GameObjects.Text[] = [];
    relics.forEach((r, idx) => {
      const isCollected = saveManager.hasRelic(r.id);
      const icon = isCollected ? '✓' : '🔒';
      const col = isCollected ? '#ffffff' : '#556677';
      const txt = this.add.text(-350, -135 + idx * 24, `${icon} [${r.category.toUpperCase()}] ${r.name}`, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '14px',
        color: col,
      });
      relicEntries.push(txt);
    });

    // Section 2: Achievements (10 achievements)
    const achHead = this.add.text(50, -160, 'EXPEDITION ACHIEVEMENTS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#ffd700',
    });

    const achEntries: Phaser.GameObjects.Text[] = [];
    ACHIEVEMENTS.forEach((a, idx) => {
      const isUnlocked = saveManager.isAchievementUnlocked(a.id);
      const icon = isUnlocked ? a.icon : '🔒';
      const col = isUnlocked ? '#ffd700' : '#4a5568';
      const txt = this.add.text(50, -135 + idx * 24, `${icon} ${a.name}: ${a.description}`, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '13px',
        color: col,
      });
      achEntries.push(txt);
    });

    // Close button
    const closeBtn = this.add.rectangle(0, 215, 200, 36, 0x182030).setStrokeStyle(1, 0xd4af37).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(0, 215, 'CLOSE JOURNAL [J]', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.toggleJournalModal());
    overlay.on('pointerdown', () => this.toggleJournalModal());

    modal.add([overlay, panel, title, sub, relicHead, ...relicEntries, achHead, ...achEntries, closeBtn, closeTxt]);
    this.journalModal = modal;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAMEPLAY EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  private handlePlayerDamage(amount: number = 1) {
    if (this.player.takeDamage(amount)) {
      this.updateHUD();
    }
  }

  private respawnPlayer() {
    this.deathsThisRun++;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.player.health        = this.player.maxHealth;
      this.player.isDead        = false;
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

  private unlockSuryaVault(gateX: number) {
    if (this.isVaultUnlocked) return;
    this.isVaultUnlocked = true;
    this.gatePrompt?.setVisible(false);
    audioManager.playPuzzleSolve();

    this.cameras.main.shake(1200, 0.015);
    this.showDiscoveryBanner('SURYA SEAL UNLOCKED · AWAKENING THE CELESTIAL GEAR LOCK');

    // Golden light beam through the portal
    const beam = this.add.graphics().setDepth(15);
    beam.fillGradientStyle(0xffd700, 0xffd700, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    beam.fillRect(gateX - 90, CEIL_Y, 180, FLOOR_Y - CEIL_Y);

    // Calculate Exact 3-Star Rating: S = 0.40P + 0.30D + 0.30M
    const dFound = this.discoveriesFoundThisRun.size;
    const mCompleted = this.masteryChallengesCompleted.size;
    const rating = calculateStarRating(100, dFound, 5, mCompleted, 3);

    // Exploration XP rewards
    gamification.awardXP(this, 'level_1_completed', 'LEVEL_COMPLETE', 'Chapter I Completed');
    const perfectRun = this.deathsThisRun === 0;
    if (perfectRun) {
      gamification.awardXP(this, 'level_1_no_death', 'NO_DEATH_BONUS', 'Flawless Expedition Bonus');
    }

    if (rating.stars === 3) {
      gamification.unlockAchievement(this, 'perfect_explorer');
    }

    this.tweens.add({
      targets: this.suryaVaultDisc,
      angle: '+=1080',
      duration: 2000,
      ease: 'Power2.easeIn',
      onComplete: () => {
        saveManager.addCollectibles(this.coinsCollected, this.gemsCollected);
        saveManager.setLevelRating(1, {
          stars: rating.stars,
          score: rating.score,
          xp: 100 + (perfectRun ? 50 : 0) + (this.coinsCollected * 10) + (this.gemsCollected * 50),
        });

        this.cameras.main.fadeOut(800, 255, 215, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('ResultsScene', {
            levelNum: 1,
            levelName: 'CHAPTER I · THE SUNKEN TUNNEL',
            stars: rating.stars,
            score: rating.score,
            xpEarned: 100 + (perfectRun ? 50 : 0) + (this.coinsCollected * 10) + (this.gemsCollected * 50),
            relicsCount: this.hasArtifact ? 2 : 1,
            discoveriesCount: Math.min(5, dFound + 1),
            masteryCount: mCompleted,
            deathsCount: this.deathsThisRun,
            noDeathBonus: perfectRun,
          });
        });
      },
    });
  }

  private showDiscoveryBanner(msg: string) {
    if (!this.objectiveBanner) return;
    this.objectiveBanner.setText(`◈ ${msg} ◈`).setAlpha(1);
    this.tweens.killTweensOf(this.objectiveBanner);
    this.tweens.add({
      targets: this.objectiveBanner,
      alpha: 0,
      delay: 2600,
      duration: 600,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════════════════════

  private createHUD() {
    const hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(24 + i * 28, 18, '🪔', { fontSize: '20px' });
      this.hudHearts.push(heart);
      hud.add(heart);
    }

    const titleText = this.add.text(24, 50, 'CHAPTER I · THE SUNKEN TUNNEL', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#d4af37',
      letterSpacing: 2,
    });
    hud.add(titleText);

    this.objectiveBanner = this.add.text(this.scale.width / 2, 76, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    hud.add(this.objectiveBanner);

    // Journal trigger button
    const journalBtn = this.add.rectangle(this.scale.width - 340, 32, 100, 32, 0x141b2a, 0.9)
      .setStrokeStyle(1, 0xd4af37);
    const journalTxt = this.add.text(this.scale.width - 340, 32, '📖 JOURNAL [J]', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#ffd700',
    }).setOrigin(0.5);
    journalBtn.setInteractive({ useHandCursor: true });
    journalBtn.on('pointerdown', () => this.toggleJournalModal());

    const coinIcon = this.add.circle(this.scale.width - 240, 32, 10, 0xffd700);
    this.hudCoinText = this.add.text(this.scale.width - 222, 22, '0', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });

    const gemIcon = this.add.polygon(this.scale.width - 150, 32, [0, -9, 9, 0, 0, 9, -9, 0], 0x00f7ff);
    this.hudGemText = this.add.text(this.scale.width - 132, 22, '0', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });

    const pauseBtn = this.add.rectangle(this.scale.width - 50, 32, 36, 32, 0x141b2a, 0.9)
      .setStrokeStyle(1, 0xd4af37);
    const pauseTxt = this.add.text(this.scale.width - 50, 32, '❚❚', {
      fontSize: '12px',
      color: '#ffd700',
    }).setOrigin(0.5);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => {
      this.scene.launch('PauseScene', { returnTo: 'TunnelScene' });
      this.scene.pause();
    });

    hud.add([journalBtn, journalTxt, coinIcon, this.hudCoinText, gemIcon, this.hudGemText, pauseBtn, pauseTxt]);
  }

  private updateHUD() {
    for (let i = 0; i < 5; i++) {
      if (this.hudHearts[i]) {
        this.hudHearts[i].setAlpha(i < this.player.health ? 1 : 0.25);
      }
    }
    if (this.hudCoinText) this.hudCoinText.setText(this.coinsCollected.toString());
    if (this.hudGemText)  this.hudGemText.setText(this.gemsCollected.toString());
  }
}

import Phaser from 'phaser';
import { PixelRudhra } from '../entities/PixelRudhra';
import { HUDOverlay } from '../ui/HUDOverlay';
import { DialogueManager } from '../systems/DialogueManager';
import { LightingManager, LightSource } from '../systems/LightingManager';
import { SANSKRIT_EPIGRAPHS } from '../config';
import { audioManager } from '../systems/PixelAudioManager';

export class RuinsDescentScene extends Phaser.Scene {
  private player!: PixelRudhra;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hud!: HUDOverlay;
  private dialogue!: DialogueManager;
  private lighting!: LightingManager;

  private torches: { sprite: Phaser.GameObjects.Image; light: LightSource }[] = [];
  private altarReceptacle!: Phaser.GameObjects.Rectangle;
  private altarGlow!: Phaser.GameObjects.Arc;
  private sunbeamRay!: Phaser.GameObjects.Polygon;

  private activePromptTarget: string | null = null;
  private isArtifactPlaced: boolean = false;
  private isRevealComplete: boolean = false;

  constructor() {
    super('RuinsDescentScene');
  }

  create() {
    const worldW = 1200;
    const worldH = 360;

    this.physics.world.setBounds(0, 0, worldW, worldH);
    audioManager.playRuinsAmbience();

    // ── 1. Subterranean Hypostyle Hall Backdrop ──────────────────────────────
    this.add.tileSprite(0, 0, worldW, worldH, 'bg_hypostyle_hall').setOrigin(0, 0).setScrollFactor(0.4);

    // ── 2. Terrain & Descending Stone Steps ──────────────────────────────────
    this.platforms = this.physics.add.staticGroup();

    // Descending stairs from entrance (x:0, y:200) to main hall floor (x:300+, y:320)
    for (let x = 0; x < 320; x += 32) {
      const stepY = 180 + (x / 320) * 120;
      const b = this.platforms.create(x + 16, stepY + 16, 'tile_ruins_block');
      b.refreshBody();
    }

    // Main hypostyle hall stone floor
    for (let x = 320; x < worldW; x += 32) {
      const b = this.platforms.create(x + 16, 320 + 16, 'tile_ruins_block');
      b.refreshBody();
    }

    // Carved fluted stone pillars framing the hypostyle corridor
    for (let px = 340; px < worldW; px += 160) {
      const pillar = this.add.image(px, 190, 'tile_ruins_block').setScale(1.4, 6.8).setDepth(10);
    }

    // ── 3. Wall Sconces & Torches (Initially unlit) ──────────────────────────
    const torchPositions = [
      { id: 'torch_1', x: 420, y: 220 },
      { id: 'torch_2', x: 580, y: 220 },
      { id: 'torch_3', x: 740, y: 220 },
      { id: 'torch_center', x: 880, y: 200 },
      { id: 'torch_5', x: 1020, y: 220 },
    ];

    torchPositions.forEach((tp) => {
      const sprite = this.add.image(tp.x, tp.y, 'prop_torch_sconce').setDepth(15);
      // Flame invisible before reveal
      sprite.setAlpha(0.4);
      this.torches.push({
        sprite,
        light: null as any, // Will link to lighting manager below
      });
    });

    // ── 4. Ancient Sanskrit Tablets on Hall Walls ────────────────────────────
    // Tablet 1: Bhagavad Gita 2.47 (x: 480)
    const tab1 = this.add.image(480, 275, 'prop_sanskrit_tablet').setDepth(14);
    // Tablet 2: Valmiki Ramayana 2.12.3 (x: 680)
    const tab2 = this.add.image(680, 275, 'prop_sanskrit_tablet').setDepth(14);

    // ── 5. Central Celestial Altar Dais (x: 880) ─────────────────────────────
    const altarDais = this.platforms.create(880, 310, 'tile_ruins_block');
    altarDais.setScale(2.5, 0.8).refreshBody();

    const altarStand = this.add.rectangle(880, 280, 36, 40, 0x3d2c18).setDepth(14);
    altarStand.setStrokeStyle(2, 0xd4af37);

    this.altarReceptacle = this.add.rectangle(880, 260, 22, 10, 0x181008).setDepth(15);
    this.altarGlow = this.add.circle(880, 258, 6, 0xffd700, 0).setDepth(16);

    // ── 6. Overhead Sunlight Aperture (Appears during Great Reveal) ──────────
    const sunbeamPoints = [
      { x: 860, y: 0 },
      { x: 900, y: 0 },
      { x: 950, y: 320 },
      { x: 810, y: 320 },
    ];
    this.sunbeamRay = this.add.polygon(0, 0, sunbeamPoints, 0x7eb5d6, 0).setOrigin(0, 0).setDepth(18);

    // ── 7. Player Explorer (Rudhra) ──────────────────────────────────────────
    this.player = new PixelRudhra(this, 50, 160);
    this.physics.add.collider(this.player, this.platforms);

    // ── 8. Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ── 9. Lighting Manager (Descent into Darkness) ───────────────────────────
    this.lighting = new LightingManager(this, 640, 360);
    this.lighting.setAmbientDarkness(0.94); // Near pitch black darkness!
    this.lighting.registerPlayerLantern(this.player.x, this.player.y, 90);

    // Link torches to lighting manager
    torchPositions.forEach((tp, idx) => {
      const light = this.lighting.addTorchLight(tp.id, tp.x, tp.y, 90);
      this.torches[idx].light = light;
    });

    // Floating dust particles
    if (this.textures.exists('fx_dust')) {
      this.add.particles(worldW / 2, 260, 'fx_dust', {
        lifespan: 4000,
        speedX: { min: -10, max: 10 },
        speedY: { min: -15, max: -4 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.45, end: 0 },
        frequency: 220,
      }).setDepth(25);
    }

    // ── 10. UI HUD & Dialogue ────────────────────────────────────────────────
    this.hud = new HUDOverlay(this);
    this.dialogue = new DialogueManager(this);

    this.hud.setObjective('Descend with handheld lantern and inspect ancient Sanskrit epigraphs');

    this.cameras.main.fadeIn(700, 0, 0, 0);

    // Interaction key [E]
    this.input.keyboard?.on('keydown-E', () => {
      this.handleInteract();
    });
  }

  update(time: number, delta: number) {
    if (this.hud.getIsPaused() || this.dialogue.isDialogueOpen()) {
      this.player.setVelocityX(0);
      return;
    }

    this.player.updateRudhra(time, delta, 'stone');

    // Update handheld lantern position
    const lanternPos = this.player.getLanternWorldPosition();
    this.lighting.updatePlayerPosition(lanternPos.x, lanternPos.y);
    this.lighting.update(time, delta);

    // Check interaction distances
    const px = this.player.x;

    if (Math.abs(px - 480) < 45) {
      this.activePromptTarget = 'gita_tablet';
      this.hud.showPrompt('[E] DECIPHER GITA MANDAPA EPIGRAPH (2.47)');
    } else if (Math.abs(px - 680) < 45) {
      this.activePromptTarget = 'ramayana_tablet';
      this.hud.showPrompt('[E] TRANSLATE RAMAYANA SATYA EPIGRAPH');
    } else if (Math.abs(px - 880) < 55) {
      if (!this.isArtifactPlaced) {
        this.activePromptTarget = 'altar';
        this.hud.showPrompt('[E] PLACE SURYA-CHAKRA ARTIFAC ON PEDESTAL');
      } else if (this.isRevealComplete) {
        this.activePromptTarget = 'traverse_portal';
        this.hud.showPrompt('[E] ENTER THE SUNKEN SANCTUM TRAVERSAL');
      }
    } else if (px > 1120 && this.isRevealComplete) {
      this.activePromptTarget = 'traverse_portal';
      this.hud.showPrompt('[E] PROCEED TO LEVEL 1 TRAVERSAL ROUTE');
    } else {
      this.activePromptTarget = null;
      this.hud.hidePrompt();
    }
  }

  private handleInteract() {
    if (!this.activePromptTarget || this.dialogue.isDialogueOpen()) return;

    if (this.activePromptTarget === 'gita_tablet') {
      this.player.playInteractionAnimation(() => {
        this.hud.updateLoreCount(2, 3);
        this.dialogue.showEpigraph(SANSKRIT_EPIGRAPHS.gita_karma);
      });
    } else if (this.activePromptTarget === 'ramayana_tablet') {
      this.player.playInteractionAnimation(() => {
        this.hud.updateLoreCount(3, 3);
        this.dialogue.showEpigraph(SANSKRIT_EPIGRAPHS.ramayana_satya);
      });
    } else if (this.activePromptTarget === 'altar' && !this.isArtifactPlaced) {
      this.executeArtifactPlacement();
    } else if (this.activePromptTarget === 'traverse_portal') {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.time.delayedCall(850, () => {
        this.scene.start('SanctumTraversalScene');
      });
    }
  }

  // ── THE GREAT TORCH REVEAL CHOREOGRAPHY ─────────────────────────────────────
  private executeArtifactPlacement() {
    this.isArtifactPlaced = true;
    this.player.canControl = false;
    this.hud.hidePrompt();

    // 1. Placement animation
    this.player.playArtifactPlacementAnimation(() => {
      audioManager.playStoneGrind();

      // Altar relic appears
      const placedRelic = this.add.image(880, 255, 'prop_lost_relic').setDepth(17);
      this.hud.setRelicActive(true);

      // 2. Solar channels illuminate
      this.tweens.add({
        targets: this.altarGlow,
        alpha: 1.0,
        radius: 28,
        duration: 900,
        onComplete: () => {
          this.triggerGreatTorchReveal();
        },
      });
    });
  }

  private triggerGreatTorchReveal() {
    this.hud.setObjective('The ruins awaken! Follow the illuminated path forward');

    // Camera shake
    this.cameras.main.shake(1200, 0.008);
    audioManager.playVaultOpen();

    // Staged sequential torch ignition
    // Step A: Center Torch (880)
    this.time.delayedCall(800, () => {
      this.igniteTorch(3); // Center torch
      this.lighting.setAmbientDarkness(0.75);
    });

    // Step B: Flanking Torches (580 and 1020)
    this.time.delayedCall(1600, () => {
      this.igniteTorch(1);
      this.igniteTorch(4);
      this.lighting.setAmbientDarkness(0.55);
    });

    // Step C: Outer Torches (420 and 740)
    this.time.delayedCall(2400, () => {
      this.igniteTorch(0);
      this.igniteTorch(2);
      this.lighting.setAmbientDarkness(0.38); // Warm atmospheric visibility!

      // Step D: Piercing Blue Sunlight Beam from above
      this.tweens.add({
        targets: this.sunbeamRay,
        alpha: 0.32,
        duration: 1400,
      });

      // Floating sunbeam motes
      if (this.textures.exists('fx_sunbeam')) {
        this.add.particles(880, 160, 'fx_sunbeam', {
          lifespan: 5000,
          speedX: { min: -15, max: 15 },
          speedY: { min: 8, max: 25 },
          scale: { start: 1.0, end: 0 },
          alpha: { start: 0.8, end: 0 },
          frequency: 140,
        }).setDepth(26);
      }

      this.isRevealComplete = true;
      this.player.canControl = true;
    });
  }

  private igniteTorch(index: number) {
    if (this.torches[index]) {
      const t = this.torches[index];
      t.sprite.setAlpha(1.0);
      this.lighting.setLightActive(t.light.id, true, 110);
      audioManager.playTorchWhoosh();

      // Fire spark burst
      if (this.textures.exists('fx_ember')) {
        this.add.particles(t.sprite.x, t.sprite.y - 10, 'fx_ember', {
          lifespan: 600,
          speedX: { min: -35, max: 35 },
          speedY: { min: -45, max: -15 },
          scale: { start: 1.0, end: 0 },
          emitting: false,
        }).explode(6);
      }
    }
  }

  shutdown() {
    this.lighting.destroy();
  }
}

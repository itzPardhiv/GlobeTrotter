import Phaser from 'phaser';
import { PixelRudhra } from '../entities/PixelRudhra';
import { HUDOverlay } from '../ui/HUDOverlay';
import { DialogueManager } from '../systems/DialogueManager';
import { SANSKRIT_EPIGRAPHS } from '../config';
import { audioManager } from '../systems/PixelAudioManager';
import { saveManager } from '../systems/SaveManager';

export class WildernessScene extends Phaser.Scene {
  private player!: PixelRudhra;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hud!: HUDOverlay;
  private dialogue!: DialogueManager;

  private skyBg!: Phaser.GameObjects.TileSprite;
  private mtnBg!: Phaser.GameObjects.TileSprite;
  private hillsBg!: Phaser.GameObjects.TileSprite;

  private activePromptTarget: string | null = null;
  private discoveredNotes = false;
  private discoveredGateway = false;

  constructor() {
    super('WildernessScene');
  }

  create() {
    const worldW = 1280; // Extended 2-screen outdoor wilderness trail
    const worldH = 360;

    this.physics.world.setBounds(0, 0, worldW, worldH);
    audioManager.playDawnAmbience();

    // ── 1. Parallax Layers ───────────────────────────────────────────────────
    this.skyBg = this.add.tileSprite(0, 0, worldW, worldH, 'bg_dawn_sky').setOrigin(0, 0).setScrollFactor(0.15);
    this.mtnBg = this.add.tileSprite(0, 0, worldW, worldH, 'bg_distant_mountains').setOrigin(0, 0).setScrollFactor(0.35);
    this.hillsBg = this.add.tileSprite(0, 0, worldW, worldH, 'bg_mid_hills').setOrigin(0, 0).setScrollFactor(0.65);

    // ── 2. Terrain Platforms ─────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();

    // Ground floor from x=0 to x=worldW
    for (let x = 0; x < worldW; x += 32) {
      // Natural terrain steps
      let platY = 320;
      if (x > 320 && x < 540) platY = 300; // Elevation ridge 1
      if (x >= 540 && x < 840) platY = 320; // Clear campsite valley
      if (x >= 840) platY = 288; // Ascending stone terrace toward ruins

      const tile = this.platforms.create(x + 16, platY + 16, 'tile_jungle_ground');
      tile.refreshBody();
    }

    // Elevated stone ruin platforms & steps
    const step1 = this.platforms.create(380, 260, 'tile_ruins_block');
    step1.refreshBody();
    const step2 = this.platforms.create(440, 230, 'tile_ruins_block');
    step2.refreshBody();

    // ── 3. Campsite & Expedition Props ───────────────────────────────────────
    // Stationary Expedition Jeep parked at trail start (x: 100)
    const parkedJeep = this.add.container(100, 290);
    const jBody = this.add.image(0, 0, 'jeep_body');
    const jWheelR = this.add.image(-28, 16, 'jeep_wheel');
    const jWheelF = this.add.image(32, 16, 'jeep_wheel');
    parkedJeep.add([jBody, jWheelR, jWheelF]).setDepth(15);

    // Campsite Tent & Fire (x: 620)
    const tent = this.add.image(620, 295, 'prop_campsite_tent').setDepth(15);

    // Broken Pillars & Carved Stone Fragments
    const pillar1 = this.add.image(440, 190, 'tile_ruins_block').setScale(1.2, 2.5).setDepth(12);
    const pillar2 = this.add.image(780, 280, 'tile_ruins_block').setScale(1.0, 1.8).setDepth(12);

    // ── 4. Torana Gateway Landmark (x: 1040) ─────────────────────────────────
    const torana = this.add.image(1040, 205, 'torana_gateway').setDepth(16);

    // Cavern Entrance Portal (x: 1200)
    const cavernPortal = this.add.rectangle(1210, 240, 60, 100, 0x05070c).setDepth(14);
    const cavernSteps = this.add.rectangle(1190, 275, 40, 26, 0x483622).setDepth(15);

    // ── 5. Player Explorer (Rudhra) ──────────────────────────────────────────
    this.player = new PixelRudhra(this, 180, 280);
    this.physics.add.collider(this.player, this.platforms);

    // ── 6. Camera Follow ─────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(60, 40);

    // ── 7. UI HUD & Dialogue System ──────────────────────────────────────────
    this.hud = new HUDOverlay(this);
    this.dialogue = new DialogueManager(this);

    this.hud.setObjective('Inspect the campsite and find the entrance to the ancient ruins');

    // Fade in from black
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Handle Interaction key [E]
    this.input.keyboard?.on('keydown-E', () => {
      this.handleInteract();
    });
  }

  update(time: number, delta: number) {
    if (this.hud.getIsPaused() || this.dialogue.isDialogueOpen()) {
      this.player.setVelocityX(0);
      return;
    }

    this.player.updateRudhra(time, delta, 'dirt');

    // Check distance to interactive landmarks
    const px = this.player.x;

    if (Math.abs(px - 100) < 55) {
      // Parked Jeep
      this.activePromptTarget = 'jeep';
      this.hud.showPrompt('[E] INSPECT EXPEDITION JEEP (GT-07)');
    } else if (Math.abs(px - 620) < 50) {
      // Campsite Tent & Journal
      this.activePromptTarget = 'campsite';
      this.hud.showPrompt('[E] EXAMINE RUDHRA\'S EXPEDITION JOURNAL');
    } else if (Math.abs(px - 1040) < 65) {
      // Torana Archway Inscription
      this.activePromptTarget = 'torana';
      this.hud.showPrompt('[E] TRANSLATE SACRED TORANA LINTEL (MUNDAKA UPANISHAD)');
    } else if (px > 1160) {
      // Cavern entrance
      this.activePromptTarget = 'entrance';
      this.hud.showPrompt('[E] DESCEND INTO THE SUBTERRANEAN RUINS');
    } else {
      this.activePromptTarget = null;
      this.hud.hidePrompt();
    }
  }

  private handleInteract() {
    if (!this.activePromptTarget || this.dialogue.isDialogueOpen()) return;

    if (this.activePromptTarget === 'jeep') {
      this.player.playInteractionAnimation(() => {
        this.dialogue.showStoryDialogue(
          'RUDHRA · EXPEDITION JEEP',
          'The 4x4 engine has cooled down. The cargo rack holds field tools, rope coils, and spare fuel. Ahead lies the forgotten threshold.'
        );
      });
    } else if (this.activePromptTarget === 'campsite') {
      this.player.playInteractionAnimation(() => {
        this.discoveredNotes = true;
        this.hud.updateLoreCount(1, 3);
        this.hud.setObjective('Proceed past the Torana Gateway to the ancient entrance');
        this.dialogue.showStoryDialogue(
          'EXPEDITION JOURNAL · NOTE #1',
          '"Field Log Day 14: Satellite scans confirmed subterranean hypostyle chambers aligned with the solar equinox. The Surya-Chakra relic is the key to the vault mechanisms."'
        );
      });
    } else if (this.activePromptTarget === 'torana') {
      this.player.playInteractionAnimation(() => {
        this.discoveredGateway = true;
        this.hud.updateLoreCount(this.discoveredNotes ? 2 : 1, 3);
        this.dialogue.showEpigraph(SANSKRIT_EPIGRAPHS.mundaka_satya, () => {
          this.hud.setObjective('Descend the stone stairs into the dark ruins');
        });
      });
    } else if (this.activePromptTarget === 'entrance') {
      this.player.canControl = false;
      this.player.playInteractionAnimation(() => {
        audioManager.playStoneGrind();
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.time.delayedCall(850, () => {
          this.scene.start('RuinsDescentScene');
        });
      });
    }
  }
}

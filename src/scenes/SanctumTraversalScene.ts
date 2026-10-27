import Phaser from 'phaser';
import { PixelRudhra } from '../entities/PixelRudhra';
import { HUDOverlay } from '../ui/HUDOverlay';
import { DialogueManager } from '../systems/DialogueManager';
import { audioManager } from '../systems/PixelAudioManager';
import { saveManager } from '../systems/SaveManager';

interface DialState {
  id: string;
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  gem: Phaser.GameObjects.Arc;
  currentAngle: number;
  targetAngle: number;
  isAligned: boolean;
}

export class SanctumTraversalScene extends Phaser.Scene {
  private player!: PixelRudhra;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hud!: HUDOverlay;
  private dialogue!: DialogueManager;

  private dials: DialState[] = [];
  private vaultDoor!: Phaser.GameObjects.Image;
  private activePromptTarget: string | null = null;
  private isPuzzleSolved: boolean = false;
  private isLevelCompleted: boolean = false;

  constructor() {
    super('SanctumTraversalScene');
  }

  create() {
    const worldW = 1920; // 3-screen expansive traversal level
    const worldH = 360;

    this.physics.world.setBounds(0, 0, worldW, worldH);
    audioManager.playRuinsAmbience();

    // ── 1. Parallax Backdrop ─────────────────────────────────────────────────
    this.add.tileSprite(0, 0, worldW, worldH, 'bg_hypostyle_hall').setOrigin(0, 0).setScrollFactor(0.3);

    // Subtle atmospheric mist ribbons in chasm
    const chasmMist = this.add.rectangle(worldW / 2, 340, worldW, 40, 0x141e2a, 0.45);

    // ── 2. SECTION A & B: Traversal Platforms & Chasm Suspension Bridge ──────
    this.platforms = this.physics.add.staticGroup();

    // Zone 1: West Terrace (x: 0 to 420)
    for (let x = 0; x < 420; x += 32) {
      const tile = this.platforms.create(x + 16, 320 + 16, 'tile_ruins_block');
      tile.refreshBody();
    }

    // Elevated stone platforms & broken stairs (x: 180 to 360)
    const platA1 = this.platforms.create(220, 260, 'tile_ruins_block');
    platA1.setScale(2.0, 1.0).refreshBody();

    const platA2 = this.platforms.create(340, 210, 'tile_ruins_block');
    platA2.setScale(2.5, 1.0).refreshBody();

    // Zone 2: Deep Chasm with Suspension Rope & Wood Bridge (x: 420 to 760)
    // Planks spanning chasm
    for (let bx = 440; bx < 740; bx += 48) {
      const plank = this.platforms.create(bx + 24, 210, 'tile_bridge_plank');
      plank.refreshBody();
    }
    // Decorative bridge suspension ropes
    const ropeGraphics = this.add.graphics().setDepth(14);
    ropeGraphics.lineStyle(2, 0xa88544);
    ropeGraphics.beginPath();
    ropeGraphics.moveTo(420, 190);
    ropeGraphics.lineTo(580, 225);
    ropeGraphics.lineTo(760, 190);
    ropeGraphics.strokePath();

    // Zone 3: SECTION C — Central Temple Terrace & Torana Archway (x: 760 to 1180)
    for (let x = 760; x < 1180; x += 32) {
      const tile = this.platforms.create(x + 16, 320 + 16, 'tile_ruins_block');
      tile.refreshBody();
    }

    // Monumental Torana Gateway (x: 960)
    const torana = this.add.image(960, 215, 'torana_gateway').setDepth(15);

    // Zone 4: SECTION D & E — Enclosed Temple Vestibule & Sunken Sanctum (x: 1180 to 1920)
    for (let x = 1180; x < worldW; x += 32) {
      const tile = this.platforms.create(x + 16, 320 + 16, 'tile_ruins_block');
      tile.refreshBody();
    }

    // Sanctum Elevated Altar Dais (x: 1480 to 1720)
    for (let dx = 1460; dx < 1740; dx += 32) {
      const b = this.platforms.create(dx + 16, 260, 'tile_ruins_block');
      b.refreshBody();
    }
    // Access steps to altar dais
    const stepL = this.platforms.create(1420, 290, 'tile_ruins_block');
    stepL.refreshBody();
    const stepR = this.platforms.create(1780, 290, 'tile_ruins_block');
    stepR.refreshBody();

    // ── 3. SECTION F: SURYA-CHAKRA 3-DIAL PUZZLE ALIGNMENT ────────────────────
    // Clue Stele on left wall of vestibule (x: 1260)
    const clueStele = this.add.image(1260, 275, 'prop_sanskrit_tablet').setDepth(15);

    // 3 Rotating Dials positioned on the Altar Dais
    const dialConfigs = [
      { id: 'sun', name: 'Surya Sun Dial', x: 1510, y: 220, target: 0, initial: 180 },
      { id: 'lotus', name: 'Padma Lotus Dial', x: 1600, y: 200, target: 90, initial: 270 },
      { id: 'trishula', name: 'Trishula Dial', x: 1690, y: 220, target: 180, initial: 90 },
    ];

    this.dials = [];
    dialConfigs.forEach((cfg) => {
      // Stone base column
      const stand = this.add.rectangle(cfg.x, cfg.y + 26, 18, 30, 0x3d2c18).setDepth(14);
      stand.setStrokeStyle(1, 0x8c6d32);

      // Dial sprite
      const sprite = this.add.sprite(cfg.x, cfg.y, `puzzle_dial_${cfg.id}`).setDepth(16);
      sprite.setAngle(cfg.initial);

      // Indicator Gem
      const gem = this.add.circle(cfg.x, cfg.y - 28, 4, 0xff3333).setDepth(17);

      this.dials.push({
        id: cfg.id,
        name: cfg.name,
        sprite,
        gem,
        currentAngle: cfg.initial,
        targetAngle: cfg.target,
        isAligned: cfg.initial % 360 === cfg.target % 360,
      });
    });

    // Colossal Stone Vault Door (x: 1840, y: 230)
    this.vaultDoor = this.add.image(1840, 230, 'prop_vault_door').setDepth(18);

    // ── 4. Inner Relic Chamber Pedestal (Beyond Vault Door, x: 1890) ─────────
    const relic = this.add.image(1890, 280, 'prop_lost_relic').setDepth(12);

    // ── 5. Player Explorer (Rudhra) ──────────────────────────────────────────
    this.player = new PixelRudhra(this, 60, 260);
    this.physics.add.collider(this.player, this.platforms);

    // ── 6. Camera ────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ── 7. UI HUD & Dialogue ────────────────────────────────────────────────
    this.hud = new HUDOverlay(this);
    this.dialogue = new DialogueManager(this);

    this.hud.setObjective('Traverse the chasm bridge and unlock the Sunken Sanctum vault');

    this.cameras.main.fadeIn(600, 0, 0, 0);

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

    // Determine ground surface for footstep sounds
    const px = this.player.x;
    const surface = (px >= 420 && px <= 760) ? 'wood' : 'stone';
    this.player.updateRudhra(time, delta, surface);

    // Check interaction ranges
    if (Math.abs(px - 1260) < 45) {
      this.activePromptTarget = 'clue_stele';
      this.hud.showPrompt('[E] READ ASTRONOMICAL DIAL CIPHER');
    } else if (Math.abs(px - 1510) < 35 && !this.isPuzzleSolved) {
      this.activePromptTarget = 'dial_sun';
      this.hud.showPrompt('[E] ROTATE SURYA SUN DIAL');
    } else if (Math.abs(px - 1600) < 35 && !this.isPuzzleSolved) {
      this.activePromptTarget = 'dial_lotus';
      this.hud.showPrompt('[E] ROTATE PADMA LOTUS DIAL');
    } else if (Math.abs(px - 1690) < 35 && !this.isPuzzleSolved) {
      this.activePromptTarget = 'dial_trishula';
      this.hud.showPrompt('[E] ROTATE TRISHULA DIAL');
    } else if (px > 1860 && this.isPuzzleSolved && !this.isLevelCompleted) {
      this.activePromptTarget = 'claim_relic';
      this.hud.showPrompt('[E] CLAIM THE LOST SURYA-CHAKRA RELIC');
    } else {
      this.activePromptTarget = null;
      this.hud.hidePrompt();
    }
  }

  private handleInteract() {
    if (!this.activePromptTarget || this.dialogue.isDialogueOpen()) return;

    if (this.activePromptTarget === 'clue_stele') {
      this.player.playInteractionAnimation(() => {
        this.dialogue.showStoryDialogue(
          'ANCIENT ASTRONOMICAL CIPHER',
          '"Align the Surya Sun to zenith (0°), turn the Sacred Lotus eastward (90°), and set the Trishula facing the subterranean depth (180°). Thus shall the vault yield."'
        );
      });
    } else if (this.activePromptTarget === 'dial_sun') {
      this.rotateDial(0);
    } else if (this.activePromptTarget === 'dial_lotus') {
      this.rotateDial(1);
    } else if (this.activePromptTarget === 'dial_trishula') {
      this.rotateDial(2);
    } else if (this.activePromptTarget === 'claim_relic') {
      this.completeLevel1();
    }
  }

  private rotateDial(index: number) {
    const dial = this.dials[index];
    if (!dial) return;

    audioManager.playDialTurn();
    dial.currentAngle = (dial.currentAngle + 90) % 360;

    this.tweens.add({
      targets: dial.sprite,
      angle: dial.currentAngle,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        dial.isAligned = dial.currentAngle === dial.targetAngle;
        if (dial.isAligned) {
          dial.gem.setFillStyle(0x33ff33); // Green indicator lock!
          audioManager.playDialLock();
        } else {
          dial.gem.setFillStyle(0xff3333);
        }
        this.checkPuzzleCompletion();
      },
    });
  }

  private checkPuzzleCompletion() {
    const allAligned = this.dials.every((d) => d.isAligned);
    if (allAligned && !this.isPuzzleSolved) {
      this.isPuzzleSolved = true;
      this.hud.setObjective('The celestial lock is broken! Enter the Inner Sanctuary');

      audioManager.playVictory();
      audioManager.playVaultOpen();
      this.cameras.main.shake(1400, 0.01);

      // Slide colossal stone vault door upward
      this.tweens.add({
        targets: this.vaultDoor,
        y: 60, // Slide up into ceiling vault
        duration: 2400,
        ease: 'Cubic.easeInOut',
      });
    }
  }

  private completeLevel1() {
    this.isLevelCompleted = true;
    this.player.canControl = false;
    this.hud.hidePrompt();

    audioManager.playVictory();

    this.player.playInteractionAnimation(() => {
      this.dialogue.showStoryDialogue(
        'RUDHRA · EXPEDITION SUCCESS',
        'The Surya-Chakra has been recovered! The ancient celestial mechanism reveals the coordinate inscriptions of Varanasi and the lost empire.',
        () => {
          this.cameras.main.fadeOut(1000, 0, 0, 0);
          this.time.delayedCall(1100, () => {
            this.scene.start('ResultsScene');
          });
        }
      );
    });
  }
}

import Phaser from 'phaser';
import { audioManager } from '../systems/PixelAudioManager';
import { saveManager } from '../systems/SaveManager';

export class HUDOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private objectiveText: Phaser.GameObjects.Text;
  private healthHearts: Phaser.GameObjects.Text[] = [];
  private promptContainer: Phaser.GameObjects.Container;
  private promptText: Phaser.GameObjects.Text;
  private loreCountText: Phaser.GameObjects.Text;
  private relicIcon: Phaser.GameObjects.Image;
  private pauseModal: Phaser.GameObjects.Container;
  private isPaused: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = 640;
    const h = 360;

    this.container = scene.add.container(0, 0).setDepth(90).setScrollFactor(0);

    // ── 1. Top Objective Banner ──────────────────────────────────────────────
    const bannerBg = scene.add.rectangle(w / 2, 18, 330, 24, 0x0c111a, 0.92);
    bannerBg.setStrokeStyle(1, 0x7c6536);
    const compassIcon = scene.add.text(w / 2 - 150, 18, '⌖', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#ffd700',
    }).setOrigin(0.5);

    this.objectiveText = scene.add.text(w / 2 + 5, 18, 'OBJECTIVE: Explore the Deccan Wilderness', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      color: '#e8dcba',
      letterSpacing: 1,
    }).setOrigin(0.5);

    // ── 2. Top-Left Health & Player Badge ────────────────────────────────────
    const badgeBg = scene.add.rectangle(60, 18, 100, 24, 0x0c111a, 0.92);
    badgeBg.setStrokeStyle(1, 0x7c6536);
    const nameText = scene.add.text(20, 18, 'RUDHRA', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#d4af37',
    }).setOrigin(0, 0.5);

    for (let i = 0; i < 3; i++) {
      const heart = scene.add.text(70 + i * 13, 18, '♥', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#e53935',
      }).setOrigin(0.5);
      this.healthHearts.push(heart);
    }

    // ── 3. Top-Right Lore & Relic Status ─────────────────────────────────────
    const statusBg = scene.add.rectangle(w - 56, 18, 92, 24, 0x0c111a, 0.92);
    statusBg.setStrokeStyle(1, 0x7c6536);

    this.relicIcon = scene.add.image(w - 86, 18, 'prop_lost_relic').setScale(0.5).setAlpha(0.35);
    this.loreCountText = scene.add.text(w - 70, 18, 'LORE: 0/3', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '10px',
      color: '#ffd700',
    }).setOrigin(0, 0.5);

    // ── 4. Bottom Contextual Interaction Prompt ──────────────────────────────
    this.promptContainer = scene.add.container(w / 2, h - 30).setVisible(false);
    const promptBg = scene.add.rectangle(0, 0, 280, 24, 0x0f1522, 0.95);
    promptBg.setStrokeStyle(1, 0xd4af37);
    this.promptText = scene.add.text(0, 0, '[E] EXAMINE ANCIENT INSCRIPTION', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#ffd700',
      letterSpacing: 1,
    }).setOrigin(0.5);
    this.promptContainer.add([promptBg, this.promptText]);

    // ── 5. Pause Modal ───────────────────────────────────────────────────────
    this.pauseModal = scene.add.container(0, 0).setVisible(false).setDepth(99);
    const pauseBackdrop = scene.add.rectangle(w / 2, h / 2, w, h, 0x05070c, 0.85);
    pauseBackdrop.setInteractive();

    const pauseBox = scene.add.rectangle(w / 2, h / 2, 320, 220, 0x121722, 0.98);
    pauseBox.setStrokeStyle(2, 0xd4af37);

    const pauseTitle = scene.add.text(w / 2, h / 2 - 75, 'EXPEDITION PAUSED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '16px',
      color: '#ffd700',
    }).setOrigin(0.5);

    const btnResume = this.createMenuButton(w / 2, h / 2 - 25, 'RESUME EXPEDITION', () => this.togglePause());
    const btnMute = this.createMenuButton(w / 2, h / 2 + 15, 'TOGGLE AUDIO (MUTE)', () => {
      audioManager.toggleMute();
      btnMute.text.setText(audioManager['isMuted'] ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE');
    });
    const btnMenu = this.createMenuButton(w / 2, h / 2 + 55, 'RETURN TO MAIN MENU', () => {
      this.isPaused = false;
      this.scene.scene.start('MainMenuScene');
    });

    this.pauseModal.add([pauseBackdrop, pauseBox, pauseTitle, btnResume.container, btnMute.container, btnMenu.container]);

    this.container.add([
      bannerBg,
      compassIcon,
      this.objectiveText,
      badgeBg,
      nameText,
      ...this.healthHearts,
      statusBg,
      this.relicIcon,
      this.loreCountText,
      this.promptContainer,
      this.pauseModal,
    ]);

    // Keyboard ESC for pause
    scene.input.keyboard?.on('keydown-ESC', () => this.togglePause());
  }

  private createMenuButton(x: number, y: number, label: string, onClick: () => void) {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, 220, 28, 0x1c2332);
    bg.setStrokeStyle(1, 0x6e582c);
    bg.setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#e5dcc8',
      letterSpacing: 1,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a354d);
      text.setColor('#ffd700');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1c2332);
      text.setColor('#e5dcc8');
    });
    bg.on('pointerdown', () => {
      audioManager.playFootstep('stone');
      onClick();
    });

    container.add([bg, text]);
    return { container, text };
  }

  public setObjective(text: string) {
    this.objectiveText.setText(`OBJECTIVE: ${text}`);
  }

  public showPrompt(text: string) {
    this.promptText.setText(text);
    this.promptContainer.setVisible(true);
  }

  public hidePrompt() {
    this.promptContainer.setVisible(false);
  }

  public updateLoreCount(count: number, total = 3) {
    this.loreCountText.setText(`LORE: ${count}/${total}`);
  }

  public setRelicActive(active: boolean) {
    this.relicIcon.setAlpha(active ? 1.0 : 0.35);
  }

  public updateHealth(current: number) {
    this.healthHearts.forEach((h, idx) => {
      h.setColor(idx < current ? '#e53935' : '#444444');
    });
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseModal.setVisible(this.isPaused);
    if (this.isPaused) {
      this.scene.physics.pause();
    } else {
      this.scene.physics.resume();
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }
}

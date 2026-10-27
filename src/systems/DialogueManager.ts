import Phaser from 'phaser';
import { SanskritEpigraph } from '../types';
import { audioManager } from './PixelAudioManager';

export class DialogueManager {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private backdrop: Phaser.GameObjects.Rectangle;
  private box: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private sanskritText: Phaser.GameObjects.Text;
  private translitText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private loreText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;

  private isOpen: boolean = false;
  private onCompleteCallback: (() => void) | null = null;
  private typeTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = 640;
    const h = 360;

    this.container = scene.add.container(0, 0).setDepth(100).setVisible(false).setScrollFactor(0);

    // Dim backdrop
    this.backdrop = scene.add.rectangle(w / 2, h / 2, w, h, 0x05070c, 0.75);
    this.backdrop.setInteractive();

    // Ornate Dialogue Box
    this.box = scene.add.rectangle(w / 2, h / 2, 540, 240, 0x121722, 0.95);
    this.box.setStrokeStyle(2, 0xd4af37);

    // Gold decorative corner brackets
    const bracketTop = scene.add.rectangle(w / 2, h / 2 - 110, 520, 2, 0x8c6d32);
    const bracketBot = scene.add.rectangle(w / 2, h / 2 + 100, 520, 2, 0x8c6d32);

    // Title / Speaker
    this.titleText = scene.add.text(w / 2, h / 2 - 95, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#ffd700',
      align: 'center',
    }).setOrigin(0.5);

    // Sanskrit Devanagari Script
    this.sanskritText = scene.add.text(w / 2, h / 2 - 65, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#ffe57f',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    // Roman Transliteration
    this.translitText = scene.add.text(w / 2, h / 2 - 30, '', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#a8c0d4',
      fontStyle: 'italic',
      align: 'center',
    }).setOrigin(0.5);

    // English Translation
    this.bodyText = scene.add.text(w / 2, h / 2 + 15, '', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '13px',
      color: '#e5dcc8',
      align: 'center',
      wordWrap: { width: 480 },
      lineSpacing: 3,
    }).setOrigin(0.5);

    // Archaeological Lore Note
    this.loreText = scene.add.text(w / 2, h / 2 + 65, '', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      color: '#9c8868',
      align: 'center',
      wordWrap: { width: 480 },
    }).setOrigin(0.5);

    // Advance Prompt
    this.promptText = scene.add.text(w / 2, h / 2 + 108, 'PRESS [SPACE] OR CLICK TO CONTINUE', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '11px',
      color: '#ffd700',
    }).setOrigin(0.5);

    this.container.add([
      this.backdrop,
      this.box,
      bracketTop,
      bracketBot,
      this.titleText,
      this.sanskritText,
      this.translitText,
      this.bodyText,
      this.loreText,
      this.promptText,
    ]);

    // Input handlers
    this.backdrop.on('pointerdown', () => this.advance());
    scene.input.keyboard?.on('keydown-SPACE', () => this.advance());
    scene.input.keyboard?.on('keydown-E', () => this.advance());
    scene.input.keyboard?.on('keydown-ENTER', () => this.advance());
  }

  public showEpigraph(epigraph: SanskritEpigraph, onComplete?: () => void) {
    this.isOpen = true;
    this.onCompleteCallback = onComplete || null;
    this.container.setVisible(true);

    audioManager.playSanskritChime();

    this.titleText.setText(epigraph.source.toUpperCase());
    this.sanskritText.setText(epigraph.sanskrit);
    this.translitText.setText(`"${epigraph.transliteration}"`);
    this.bodyText.setText(epigraph.translation);
    this.loreText.setText(`ARCHAEOLOGICAL CONTEXT: ${epigraph.archaeologicalNote}`);

    // Subtle scale pop
    this.container.setScale(0.92);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  public showStoryDialogue(speaker: string, message: string, onComplete?: () => void) {
    this.isOpen = true;
    this.onCompleteCallback = onComplete || null;
    this.container.setVisible(true);

    audioManager.playFootstep('stone');

    this.titleText.setText(speaker.toUpperCase());
    this.sanskritText.setText('');
    this.translitText.setText('');
    this.bodyText.setText(message);
    this.loreText.setText('');

    this.container.setScale(0.92);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  public advance() {
    if (!this.isOpen) return;
    this.close();
  }

  public close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.setVisible(false);

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  public isDialogueOpen(): boolean {
    return this.isOpen;
  }
}

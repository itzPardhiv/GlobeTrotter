/**
 * GlobeTrotter - Pause Scene
 * Modal in-game pause menu with Resume, Restart, Audio Toggle, and Return to Menu.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

export class PauseScene extends Phaser.Scene {
  private returnToSceneKey: string = 'TunnelScene';

  constructor() {
    super({ key: 'PauseScene' });
  }

  public init(data: { returnTo?: string }) {
    if (data && data.returnTo) {
      this.returnToSceneKey = data.returnTo;
    }
  }

  public create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Semi-transparent dark overlay (no backdrop-filter)
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72);

    const panel = this.add.container(w / 2, h / 2);

    const box = this.add.rectangle(0, 0, 420, 360, 0x121722).setStrokeStyle(2, 0xd4af37);
    const title = this.add.text(0, -130, 'EXPEDITION PAUSED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      color: '#ffd700',
      letterSpacing: 2,
    }).setOrigin(0.5);

    panel.add([box, title]);

    const createBtn = (y: number, labelText: string, onClick: () => void) => {
      const btn = this.add.rectangle(0, y, 260, 40, 0x1c2436).setStrokeStyle(1, 0x475569);
      const txt = this.add.text(0, y, labelText, {
        fontFamily: 'Cinzel, serif',
        fontSize: '15px',
        color: '#ffffff',
      }).setOrigin(0.5);

      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        btn.setFillStyle(0x2a364f);
        btn.setStrokeStyle(1, 0xd4af37);
        txt.setColor('#ffd700');
      });
      btn.on('pointerout', () => {
        btn.setFillStyle(0x1c2436);
        btn.setStrokeStyle(1, 0x475569);
        txt.setColor('#ffffff');
      });
      btn.on('pointerdown', () => {
        audioManager.playFootstep();
        onClick();
      });

      panel.add([btn, txt]);
    };

    // 1. Resume
    createBtn(-60, 'RESUME JOURNEY', () => this.resumeGame());

    // 2. Restart Level
    createBtn(0, 'RESTART CHAPTER', () => {
      this.scene.stop();
      this.scene.stop(this.returnToSceneKey);
      this.scene.start(this.returnToSceneKey);
    });

    // 3. Audio Toggle
    createBtn(60, audioManager.isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO', () => {
      const muted = !audioManager.isMuted;
      audioManager.setMuted(muted);
      saveManager.updateAudioSettings(muted, audioManager.musicVolume, audioManager.sfxVolume);
      this.scene.restart({ returnTo: this.returnToSceneKey });
    });

    // 4. Return to Main Menu
    createBtn(120, 'MAIN MENU', () => {
      this.scene.stop();
      this.scene.stop(this.returnToSceneKey);
      this.scene.start('MainMenuScene');
    });

    // Resume on ESC or SPACE
    this.input.keyboard?.on('keydown-ESC', () => this.resumeGame());
  }

  private resumeGame() {
    this.scene.stop();
    this.scene.resume(this.returnToSceneKey);
  }
}

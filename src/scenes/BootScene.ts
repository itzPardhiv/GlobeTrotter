/**
 * GlobeTrotter - Boot Scene
 * Generates procedural HD-2D textures, initializes audio and save systems,
 * and seamlessly loads the main menu.
 */

import Phaser from 'phaser';
import { TextureGenerator } from '../systems/TextureGenerator';
import { saveManager } from '../systems/SaveManager';
import { audioManager } from '../systems/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload() {
    // Preload the user's uploaded authentic modular Hindu temple architecture assets
    this.load.image('asset_platform_long', '/assets/aistudio/platform_long_01_8d7371b5.png');
    this.load.image('asset_platform_short', '/assets/aistudio/platform_short_01_acd7daba.png');
    this.load.image('asset_pillar_intact', '/assets/aistudio/pillar_intact_01_d1f3ed68.png');
    this.load.image('asset_pillar_broken', '/assets/aistudio/pillar_broken_01_e1a8864a.png');
    this.load.image('asset_arch_ornate', '/assets/aistudio/arch_ornate_01_a528764f.png');
    this.load.image('asset_arch_simple', '/assets/aistudio/arch_simple_01_02310f9e.png');
    this.load.image('asset_doorway', '/assets/aistudio/doorway_01_dce37c8c.png');
    this.load.image('asset_wall_panel', '/assets/aistudio/wall_panel_01_4fca1e59.png');
    this.load.image('asset_wall_corner', '/assets/aistudio/wall_corner_01_11addc0b.png');
    this.load.image('asset_pedestal', '/assets/aistudio/base_decorative_01_06478c98.png');
    this.load.image('asset_rubble', '/assets/aistudio/rubble_pile_01_b6db607b.png');
    this.load.image('asset_torch', '/assets/aistudio/torch_fixture_01_908237a8.png');
    this.load.image('asset_protagonist_ref', '/assets/aistudio/protagonist_reference_f57facac.png');
  }

  public create() {
    // Generate all procedural game assets & sprites
    TextureGenerator.generateAll(this);

    // Apply saved audio settings
    const save = saveManager.get();
    audioManager.isMuted = save.soundMuted;
    audioManager.musicVolume = save.musicVolume;
    audioManager.sfxVolume = save.sfxVolume;

    // Small atmospheric loader transition
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const title = this.add.text(cx, cy - 20, 'GLOBETROTTER: THE LOST RELIC', {
      fontFamily: 'Cinzel, serif',
      fontSize: '32px',
      color: '#d4af37',
    }).setOrigin(0.5);

    const sub = this.add.text(cx, cy + 24, 'AWAKENING THE ANCIENT SANCTUM...', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      color: '#a08855',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, sub],
      alpha: { from: 0.2, to: 1 },
      duration: 350,
      yoyo: true,
      onComplete: () => {
        this.scene.start('MainMenuScene');
      },
    });
  }
}

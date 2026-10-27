import Phaser from 'phaser';
import { PixelAssetGenerator } from '../systems/PixelAssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Generate all procedural handcrafted pixel-art assets into TextureManager
    PixelAssetGenerator.generateAll(this);

    // Hide HTML loader overlay if present
    const loader = document.getElementById('loader-overlay');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 600);
    }

    // Launch main menu
    this.scene.start('MainMenuScene');
  }
}

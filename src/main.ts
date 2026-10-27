import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PreludeCinematicScene } from './scenes/PreludeCinematicScene';
import { WildernessScene } from './scenes/WildernessScene';
import { RuinsDescentScene } from './scenes/RuinsDescentScene';
import { SanctumTraversalScene } from './scenes/SanctumTraversalScene';
import { ResultsScene } from './scenes/ResultsScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MainMenuScene,
    PreludeCinematicScene,
    WildernessScene,
    RuinsDescentScene,
    SanctumTraversalScene,
    ResultsScene,
  ],
  backgroundColor: '#05070c',
};

export const game = new Phaser.Game(config);

// Expose global handle for automated verification and test audits
if (typeof window !== 'undefined') {
  (window as any).__GLOBETROTTER_PIXEL_GAME__ = game;
}

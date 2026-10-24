/**
 * GlobeTrotter: The Lost Relic - Phaser Game Configuration
 * Responsive 1280x720 canvas, WebGL renderer, Arcade physics.
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { IntroScene } from './scenes/IntroScene';
import { TunnelScene } from './scenes/TunnelScene';
import { PuzzleScene } from './scenes/PuzzleScene';
import { ChaseScene } from './scenes/ChaseScene';
import { TimeFlashScene } from './scenes/TimeFlashScene';
import { CombatScene } from './scenes/CombatScene';
import { GrandRevealScene } from './scenes/GrandRevealScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultsScene } from './scenes/ResultsScene';
import { WORLD_GRAVITY } from './systems/GameplayRules';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0d14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: WORLD_GRAVITY },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MainMenuScene,
    IntroScene,
    TunnelScene,
    PuzzleScene,
    ChaseScene,
    TimeFlashScene,
    CombatScene,
    GrandRevealScene,
    PauseScene,
    ResultsScene,
  ],
};

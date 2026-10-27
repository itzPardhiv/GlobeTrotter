export interface GameProgressState {
  version: number;
  currentScene: string;
  checkpointId: string;
  playerPos: { x: number; y: number };
  health: number;
  maxHealth: number;
  coins: number;
  xp: number;
  hasArtifact: boolean;
  placedArtifact: boolean;
  torchesLit: boolean;
  puzzleSolved: boolean;
  dialAngles: { sun: number; lotus: number; trishula: number };
  discoveredLore: string[];
  level1Complete: boolean;
  stars: number;
  timeElapsed: number;
}

export interface SettingsState {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  pixelScale: number;
}

export interface SanskritEpigraph {
  id: string;
  sanskrit: string;
  transliteration: string;
  source: string;
  translation: string;
  archaeologicalNote: string;
}

export interface InteractionTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  promptText: string;
  action: () => void;
  oneShot?: boolean;
  disabled?: boolean;
}

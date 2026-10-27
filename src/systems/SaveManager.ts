import { GameProgressState, SettingsState } from '../types';

const SAVE_KEY = 'globetrotter_pixel_edition_save_v1';
const SETTINGS_KEY = 'globetrotter_pixel_edition_settings_v1';

export const DEFAULT_SAVE_STATE: GameProgressState = {
  version: 1,
  currentScene: 'PreludeCinematicScene',
  checkpointId: 'cp_wilderness_start',
  playerPos: { x: 120, y: 260 },
  health: 3,
  maxHealth: 3,
  coins: 0,
  xp: 0,
  hasArtifact: false,
  placedArtifact: false,
  torchesLit: false,
  puzzleSolved: false,
  dialAngles: { sun: 180, lotus: 270, trishula: 90 },
  discoveredLore: [],
  level1Complete: false,
  stars: 0,
  timeElapsed: 0,
};

export const DEFAULT_SETTINGS: SettingsState = {
  musicVolume: 0.7,
  sfxVolume: 0.85,
  screenShake: true,
  pixelScale: 1.0,
};

export class SaveManager {
  private static instance: SaveManager | null = null;
  private currentSave: GameProgressState = { ...DEFAULT_SAVE_STATE };
  private currentSettings: SettingsState = { ...DEFAULT_SETTINGS };

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  constructor() {
    this.loadSettings();
    this.loadGame();
  }

  public getSave(): GameProgressState {
    return this.currentSave;
  }

  public getSettings(): SettingsState {
    return this.currentSettings;
  }

  public saveGame(partialState?: Partial<GameProgressState>) {
    if (partialState) {
      this.currentSave = { ...this.currentSave, ...partialState };
    }
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.currentSave));
    } catch (err) {
      console.warn('[SaveManager] Failed to persist game save to localStorage:', err);
    }
  }

  public loadGame(): GameProgressState {
    if (typeof localStorage === 'undefined') return this.currentSave;
    try {
      const dataStr = localStorage.getItem(SAVE_KEY);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed && typeof parsed === 'object' && parsed.version === 1) {
          this.currentSave = {
            ...DEFAULT_SAVE_STATE,
            ...parsed,
            playerPos: parsed.playerPos ? { ...parsed.playerPos } : { ...DEFAULT_SAVE_STATE.playerPos },
            dialAngles: parsed.dialAngles ? { ...parsed.dialAngles } : { ...DEFAULT_SAVE_STATE.dialAngles },
            discoveredLore: Array.isArray(parsed.discoveredLore) ? parsed.discoveredLore : [],
          };
          return this.currentSave;
        }
      }
    } catch (err) {
      console.warn('[SaveManager] Corrupted save detected, restoring default progression:', err);
    }
    this.currentSave = { ...DEFAULT_SAVE_STATE };
    return this.currentSave;
  }

  public resetProgress() {
    this.currentSave = { ...DEFAULT_SAVE_STATE };
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
  }

  public saveSettings(settings: Partial<SettingsState>) {
    this.currentSettings = { ...this.currentSettings, ...settings };
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.currentSettings));
    } catch (e) {}
  }

  public loadSettings(): SettingsState {
    if (typeof localStorage === 'undefined') return this.currentSettings;
    try {
      const dataStr = localStorage.getItem(SETTINGS_KEY);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed && typeof parsed === 'object') {
          this.currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
          return this.currentSettings;
        }
      }
    } catch (e) {}
    this.currentSettings = { ...DEFAULT_SETTINGS };
    return this.currentSettings;
  }
}

export const saveManager = SaveManager.getInstance();

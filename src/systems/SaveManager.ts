/**
 * GlobeTrotter - Save Manager
 * Manages persistent progress in localStorage safely.
 */

export interface GameProgress {
  unlockedLevel: number; // 1 to 5
  coinsTotal: number;
  gemsTotal: number;
  levelStars: Record<number, number>;
  highScores: Record<number, number>;
  soundMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  hasSeenIntro: boolean;
  // Gamification & Discovery extensions
  totalXp: number;
  awardedEventIds: string[];
  collectedRelicIds: string[];
  unlockedJournalIds: string[];
  unlockedAchievements: string[];
  levelRatings: Record<number, { stars: number; score: number; xp: number }>;
}

const STORAGE_KEY = 'globetrotter_save_v1';

function createDefaultSave(): GameProgress {
  return {
    unlockedLevel: 1,
    coinsTotal: 0,
    gemsTotal: 0,
    levelStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    highScores: {},
    soundMuted: false,
    musicVolume: 0.6,
    sfxVolume: 0.7,
    hasSeenIntro: false,
    totalXp: 0,
    awardedEventIds: [],
    collectedRelicIds: [],
    unlockedJournalIds: [],
    unlockedAchievements: [],
    levelRatings: {},
  };
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function mergeNumberRecord(
  value: unknown,
  defaults: Record<number, number>,
  maxValue: number,
): Record<number, number> {
  const result = { ...defaults };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const level = Number(rawKey);
    if (!Number.isInteger(level) || level < 1 || level > 5) continue;
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) continue;
    result[level] = Math.max(0, Math.min(maxValue, Math.floor(rawValue)));
  }
  return result;
}

export class SaveManager {
  private data: GameProgress;

  constructor() {
    this.data = this.load();
  }

  public load(): GameProgress {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return createDefaultSave();
          }

          const raw = parsed as Record<string, unknown>;
          const defaults = createDefaultSave();
          return {
            unlockedLevel: Math.floor(finiteNumber(raw.unlockedLevel, defaults.unlockedLevel, 1, 5)),
            coinsTotal: Math.floor(finiteNumber(raw.coinsTotal, defaults.coinsTotal, 0, Number.MAX_SAFE_INTEGER)),
            gemsTotal: Math.floor(finiteNumber(raw.gemsTotal, defaults.gemsTotal, 0, Number.MAX_SAFE_INTEGER)),
            levelStars: mergeNumberRecord(raw.levelStars, defaults.levelStars, 3),
            highScores: mergeNumberRecord(raw.highScores, defaults.highScores, Number.MAX_SAFE_INTEGER),
            soundMuted: typeof raw.soundMuted === 'boolean' ? raw.soundMuted : defaults.soundMuted,
            musicVolume: finiteNumber(raw.musicVolume, defaults.musicVolume, 0, 1),
            sfxVolume: finiteNumber(raw.sfxVolume, defaults.sfxVolume, 0, 1),
            hasSeenIntro: typeof raw.hasSeenIntro === 'boolean' ? raw.hasSeenIntro : defaults.hasSeenIntro,
            totalXp: Math.floor(finiteNumber(raw.totalXp, defaults.totalXp, 0, Number.MAX_SAFE_INTEGER)),
            awardedEventIds: Array.isArray(raw.awardedEventIds) ? raw.awardedEventIds.filter((x): x is string => typeof x === 'string') : [],
            collectedRelicIds: Array.isArray(raw.collectedRelicIds) ? raw.collectedRelicIds.filter((x): x is string => typeof x === 'string') : [],
            unlockedJournalIds: Array.isArray(raw.unlockedJournalIds) ? raw.unlockedJournalIds.filter((x): x is string => typeof x === 'string') : [],
            unlockedAchievements: Array.isArray(raw.unlockedAchievements) ? raw.unlockedAchievements.filter((x): x is string => typeof x === 'string') : [],
            levelRatings: raw.levelRatings && typeof raw.levelRatings === 'object' && !Array.isArray(raw.levelRatings) ? (raw.levelRatings as Record<number, { stars: number; score: number; xp: number }>) : {},
          };
        }
      }
    } catch (e) {
      // LocalStorage or JSON parse error fallback
    }
    return createDefaultSave();
  }

  public save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public get(): GameProgress {
    return this.data;
  }

  public unlockLevel(levelNum: number) {
    if (levelNum > this.data.unlockedLevel) {
      this.data.unlockedLevel = Math.min(5, levelNum);
      this.save();
    }
  }

  public addCollectibles(coins: number, gems: number) {
    this.data.coinsTotal += coins;
    this.data.gemsTotal += gems;
    this.save();
  }

  public setLevelComplete(levelNum: number, score: number, stars: number = 3) {
    this.unlockLevel(levelNum + 1);
    this.data.levelStars[levelNum] = Math.max(this.data.levelStars[levelNum] || 0, stars);
    const prevHigh = this.data.highScores[levelNum] || 0;
    if (score > prevHigh) {
      this.data.highScores[levelNum] = score;
    }
    this.save();
  }

  public awardXP(eventId: string, amount: number): boolean {
    if (!this.data.awardedEventIds) this.data.awardedEventIds = [];
    if (this.data.awardedEventIds.includes(eventId)) {
      return false; // Prevent duplicate award
    }
    this.data.awardedEventIds.push(eventId);
    this.data.totalXp = (this.data.totalXp || 0) + amount;
    this.save();
    return true;
  }

  public awardEvent(eventId: string): boolean {
    if (!this.data.awardedEventIds) this.data.awardedEventIds = [];
    if (this.data.awardedEventIds.includes(eventId)) {
      return false;
    }
    this.data.awardedEventIds.push(eventId);
    this.save();
    return true;
  }

  public isEventAwarded(eventId: string): boolean {
    return this.data.awardedEventIds ? this.data.awardedEventIds.includes(eventId) : false;
  }

  public collectRelic(relicId: string): boolean {
    if (!this.data.collectedRelicIds) this.data.collectedRelicIds = [];
    if (this.data.collectedRelicIds.includes(relicId)) {
      return false;
    }
    this.data.collectedRelicIds.push(relicId);
    this.save();
    return true;
  }

  public hasRelic(relicId: string): boolean {
    return this.data.collectedRelicIds ? this.data.collectedRelicIds.includes(relicId) : false;
  }

  public unlockJournal(journalId: string): boolean {
    if (!this.data.unlockedJournalIds) this.data.unlockedJournalIds = [];
    if (this.data.unlockedJournalIds.includes(journalId)) {
      return false;
    }
    this.data.unlockedJournalIds.push(journalId);
    this.save();
    return true;
  }

  public isJournalUnlocked(journalId: string): boolean {
    return this.data.unlockedJournalIds ? this.data.unlockedJournalIds.includes(journalId) : false;
  }

  public unlockAchievement(achId: string): boolean {
    if (!this.data.unlockedAchievements) this.data.unlockedAchievements = [];
    if (this.data.unlockedAchievements.includes(achId)) {
      return false;
    }
    this.data.unlockedAchievements.push(achId);
    this.save();
    return true;
  }

  public isAchievementUnlocked(achId: string): boolean {
    return this.data.unlockedAchievements ? this.data.unlockedAchievements.includes(achId) : false;
  }

  public setLevelRating(levelNum: number, rating: { stars: number; score: number; xp: number }) {
    if (!this.data.levelRatings) this.data.levelRatings = {};
    const existing = this.data.levelRatings[levelNum];
    if (!existing || rating.stars > existing.stars || (rating.stars === existing.stars && rating.score > existing.score)) {
      this.data.levelRatings[levelNum] = rating;
    }
    this.setLevelComplete(levelNum, rating.score, rating.stars);
  }

  public updateAudioSettings(muted: boolean, musicVol: number, sfxVol: number) {
    this.data.soundMuted = muted;
    this.data.musicVolume = musicVol;
    this.data.sfxVolume = sfxVol;
    this.save();
  }

  public markIntroSeen() {
    this.data.hasSeenIntro = true;
    this.save();
  }

  public resetProgress() {
    this.data = createDefaultSave();
    this.save();
  }
}

export const saveManager = new SaveManager();

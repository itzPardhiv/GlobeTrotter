import assert from 'node:assert/strict';
import { GATE_INTERACTION_RANGE, WORLD_GRAVITY, PLAYER_JUMP_SPEED, PLAYER_RUN_SPEED, hasReachedPitBottom, horizontalJumpReach, isWithinGateRange, maxJumpRise } from '../src/systems/GameplayRules.ts';

const entries = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
  },
});

const { SaveManager } = await import('../src/systems/SaveManager.ts');

assert.equal(maxJumpRise(), (PLAYER_JUMP_SPEED ** 2) / (2 * WORLD_GRAVITY));
assert.ok(Math.abs(maxJumpRise() - 107.96) < 0.02);
assert.ok(Math.abs(horizontalJumpReach(0) - (2 * PLAYER_JUMP_SPEED / WORLD_GRAVITY) * PLAYER_RUN_SPEED) < 0.01);
assert.equal(horizontalJumpReach(maxJumpRise() + 1), 0);
assert.equal(isWithinGateRange(100, 239), true);
assert.equal(isWithinGateRange(100, 240), false);
assert.equal(GATE_INTERACTION_RANGE, 140);

const pits = [[1500, 1920], [3650, 4100]] as const;
assert.equal(hasReachedPitBottom(1700, 719.5, 720, pits), true);
assert.equal(hasReachedPitBottom(1700, 700, 720, pits), false);
assert.equal(hasReachedPitBottom(2000, 720, 720, pits), false);

const first = new SaveManager();
first.get().levelStars[1] = 3;
first.get().highScores[1] = 500;
const second = new SaveManager();
assert.equal(second.get().levelStars[1], 0, 'default levelStars are not shared between instances');
assert.equal(second.get().highScores[1], undefined, 'default highScores are not shared between instances');

entries.set('globetrotter_save_v1', JSON.stringify({
  unlockedLevel: 99,
  coinsTotal: -5,
  levelStars: { 1: 7, 2: -2, 6: 3 },
  highScores: { 2: 124.9, 6: 9 },
  soundMuted: 'yes',
  musicVolume: 2,
  sfxVolume: -1,
}));
const recovered = new SaveManager().get();
assert.equal(recovered.unlockedLevel, 5);
assert.equal(recovered.coinsTotal, 0);
assert.equal(recovered.levelStars[1], 3);
assert.equal(recovered.levelStars[2], 0);
assert.equal(recovered.levelStars[6], undefined);
assert.equal(recovered.highScores[2], 124);
assert.equal(recovered.highScores[6], undefined);
assert.equal(recovered.soundMuted, false);
assert.equal(recovered.musicVolume, 1);
assert.equal(recovered.sfxVolume, 0);

entries.set('globetrotter_save_v1', '{invalid json');
const malformed = new SaveManager();
assert.equal(malformed.get().unlockedLevel, 1);
malformed.resetProgress();
assert.equal(malformed.get().unlockedLevel, 1);
assert.equal(malformed.get().levelStars[1], 0);
assert.deepEqual(JSON.parse(entries.get('globetrotter_save_v1') ?? 'null').levelStars, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

console.log('Gameplay and save regression checks passed.');

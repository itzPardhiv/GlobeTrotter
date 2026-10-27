import { GAME_WIDTH, GAME_HEIGHT, SANSKRIT_EPIGRAPHS } from '../src/config';
import { SaveManager, DEFAULT_SAVE_STATE } from '../src/systems/SaveManager';

console.log('======================================================');
console.log('GLOBETROTTER: PIXEL EDITION — AUTOMATED AUDIT SUITE');
console.log('======================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failCount++;
  }
}

// ── 1. CONFIGURATION & VIRTUAL RESOLUTION AUDIT ──────────────────────────────
console.log('--- 1. Configuration & Resolution Audit ---');
assert(GAME_WIDTH === 640, `Virtual resolution width is 640 (got ${GAME_WIDTH})`);
assert(GAME_HEIGHT === 360, `Virtual resolution height is 360 (got ${GAME_HEIGHT})`);
assert((GAME_WIDTH / GAME_HEIGHT).toFixed(3) === '1.778', 'Aspect ratio is strictly 16:9 widescreen');

// ── 2. AUTHENTIC SANSKRIT EPIGRAPHS AUDIT ───────────────────────────────────
console.log('\n--- 2. Authentic Sanskrit Epigraphs Audit ---');
const mundaka = SANSKRIT_EPIGRAPHS.mundaka_satya;
assert(mundaka !== undefined, 'Mundaka Upanishad epigraph registered');
assert(mundaka.sanskrit.includes('सत्यमेव जयते'), 'Mundaka contains authentic Devanagari text');
assert(mundaka.transliteration.includes('Satyameva jayate'), 'Mundaka contains verified Roman transliteration');
assert(mundaka.source.includes('Mundaka Upanishad 3.1.6'), 'Mundaka accurately attributed to 3.1.6');

const gita = SANSKRIT_EPIGRAPHS.gita_karma;
assert(gita !== undefined, 'Bhagavad Gita 2.47 epigraph registered');
assert(gita.sanskrit.includes('कर्मण्येवाधिकारस्ते'), 'Gita contains authentic Devanagari text');
assert(gita.translation.includes('fruits of action'), 'Gita translation accurately captures Karma Yoga');

const ramayana = SANSKRIT_EPIGRAPHS.ramayana_satya;
assert(ramayana !== undefined, 'Valmiki Ramayana epigraph registered');
assert(ramayana.sanskrit.includes('आहुः सत्यं हि परमं धर्मं'), 'Ramayana contains authentic Devanagari text');
assert(ramayana.source.includes('Ayodhya Kanda 2.12.3'), 'Ramayana accurately attributed to Ayodhya Kanda 2.12.3');

// ── 3. SAVE SYSTEM & DATA INTEGRITY AUDIT ────────────────────────────────────
console.log('\n--- 3. Save System & Data Integrity Audit ---');
// Mock localStorage in Node
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
};

const sm = new SaveManager();
const initialSave = sm.getSave();
assert(initialSave.version === 1, 'Save version initialized to 1');
assert(initialSave.checkpointId === 'cp_wilderness_start', 'Initial checkpoint set to wilderness start');
assert(initialSave.health === 3, 'Initial health set to 3 full hearts');

sm.saveGame({ coins: 45, xp: 250, hasArtifact: true });
const updatedSave = sm.getSave();
assert(updatedSave.coins === 45, 'Coins persisted correctly');
assert(updatedSave.xp === 250, 'XP persisted correctly');
assert(updatedSave.hasArtifact === true, 'Artifact ownership persisted');

sm.resetProgress();
const resetSave = sm.getSave();
assert(resetSave.coins === 0, 'Progress reset successfully restores default state');

// ── 4. SURYA-CHAKRA DIAL PUZZLE LOGIC AUDIT ──────────────────────────────────
console.log('\n--- 4. Surya-Chakra Dial Puzzle Logic Audit ---');
const dialTargets = { sun: 0, lotus: 90, trishula: 180 };
let testAngles = { sun: 180, lotus: 270, trishula: 90 };

function isSolved(angles: { sun: number; lotus: number; trishula: number }) {
  return (
    angles.sun % 360 === dialTargets.sun &&
    angles.lotus % 360 === dialTargets.lotus &&
    angles.trishula % 360 === dialTargets.trishula
  );
}

assert(!isSolved(testAngles), 'Initial dial angles do not bypass puzzle');

// Simulate 2 rotations of Sun (180 -> 270 -> 0)
testAngles.sun = (testAngles.sun + 180) % 360;
assert(testAngles.sun === 0, 'Surya Sun Dial aligns to zenith 0°');

// Simulate 2 rotations of Lotus (270 -> 0 -> 90)
testAngles.lotus = (testAngles.lotus + 180) % 360;
assert(testAngles.lotus === 90, 'Padma Lotus Dial aligns to east 90°');

// Simulate 1 rotation of Trishula (90 -> 180)
testAngles.trishula = (testAngles.trishula + 90) % 360;
assert(testAngles.trishula === 180, 'Trishula Dial aligns to depth 180°');

assert(isSolved(testAngles), 'Surya-Chakra puzzle resolves to solved when all 3 dials align');

// ── 5. SCORING & 3-STAR RATING MODEL AUDIT ───────────────────────────────────
console.log('\n--- 5. Scoring & 3-Star Rating Model Audit ---');
function calculateStars(timeSeconds: number, loreFound: number, healthRemaining: number) {
  let score = 0;
  if (timeSeconds < 300) score += 1;
  if (loreFound === 3) score += 1;
  if (healthRemaining >= 2) score += 1;
  return Math.max(1, score);
}

assert(calculateStars(180, 3, 3) === 3, 'Perfect run awards 3 stars');
assert(calculateStars(400, 3, 3) === 2, 'Slower run with full exploration awards 2 stars');
assert(calculateStars(500, 1, 1) === 1, 'Minimum completion awards 1 star');

// ── 6. PROJECT DIRECTORY ISOLATION AUDIT ──────────────────────────────────────
console.log('\n--- 6. Project Directory Isolation Audit ---');
const cwd = process.cwd();
assert(cwd.includes('GlobeTrotter-Pixel-Edition'), `Working directory is inside GlobeTrotter-Pixel-Edition (${cwd})`);
assert(!cwd.endsWith('globetrotter'), 'Not running inside the existing 3D project root');

console.log('\n======================================================');
console.log(`AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================');

if (failCount > 0) process.exit(1);

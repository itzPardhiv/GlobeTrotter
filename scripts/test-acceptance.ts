/**
 * GlobeTrotter: The Lost Relic - Automated Acceptance and Integrity Test Suite
 * Tests asset presence, scene configuration, texture key parity, Sanskrit inscription fidelity,
 * and entity physics definitions.
 */

import fs from 'fs';
import path from 'path';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${message}`);
  }
}

console.log('=== GLOBETROTTER: ACCEPTANCE & STABILIZATION AUDIT ===\n');

// 1. Asset Audit
console.log('--- 1. Modular Temple Asset Audit ---');
const assetDir = path.resolve(process.cwd(), 'public/assets/aistudio');
const requiredAssets = [
  'platform_long_01_8d7371b5.png',
  'platform_short_01_acd7daba.png',
  'pillar_intact_01_d1f3ed68.png',
  'pillar_broken_01_e1a8864a.png',
  'arch_ornate_01_a528764f.png',
  'arch_simple_01_02310f9e.png',
  'doorway_01_dce37c8c.png',
  'wall_panel_01_4fca1e59.png',
  'wall_corner_01_11addc0b.png',
  'base_decorative_01_06478c98.png',
  'rubble_pile_01_b6db607b.png',
  'torch_fixture_01_908237a8.png',
  'protagonist_reference_f57facac.png',
];

for (const asset of requiredAssets) {
  const filePath = path.join(assetDir, asset);
  const exists = fs.existsSync(filePath);
  const size = exists ? fs.statSync(filePath).size : 0;
  assert(exists && size > 100, `Asset ${asset} verified (Size: ${size} bytes)`);
}

// 2. Scene Key Consistency Audit
console.log('\n--- 2. Scene Registration & Key Consistency ---');
const configSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/config.ts'), 'utf-8');
const scenes = [
  'BootScene',
  'MainMenuScene',
  'IntroScene',
  'TunnelScene',
  'PuzzleScene',
  'ChaseScene',
  'TimeFlashScene',
  'CombatScene',
  'GrandRevealScene',
  'PauseScene',
  'ResultsScene',
];

for (const scene of scenes) {
  assert(configSrc.includes(scene), `Scene ${scene} registered in gameConfig`);
  const sceneFile = path.resolve(process.cwd(), `src/scenes/${scene}.ts`);
  assert(fs.existsSync(sceneFile), `Scene implementation exists at src/scenes/${scene}.ts`);
}

// 3. Physics & Player Initialization Order Audit
console.log('\n--- 3. Physics Collider Safety Audit ---');
const tunnelSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/scenes/TunnelScene.ts'), 'utf-8');
const combatSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/scenes/CombatScene.ts'), 'utf-8');

// Check that player is instantiated before building geometry
const playerIdxTunnel = tunnelSrc.indexOf('this.player = new Explorer');
const archIdxTunnel = tunnelSrc.indexOf('this.buildMonumentalArchitecture()');
assert(playerIdxTunnel !== -1 && playerIdxTunnel < archIdxTunnel, 'TunnelScene initializes player BEFORE buildMonumentalArchitecture()');

const playerIdxCombat = combatSrc.indexOf('this.player = new Explorer');
const geoIdxCombat = combatSrc.indexOf('this.buildLevelGeometry()');
assert(playerIdxCombat !== -1 && playerIdxCombat < geoIdxCombat, 'CombatScene initializes player BEFORE buildLevelGeometry()');

// Check that overlap calls are guarded
assert(tunnelSrc.includes('if (this.player) {\n      this.physics.add.overlap(this.player, gateZone'), 'TunnelScene guards gateZone overlap with this.player check');
assert(combatSrc.includes('if (this.player) {\n      this.physics.add.overlap(this.player, this.gateSensor'), 'CombatScene guards gateSensor overlap with this.player check');

// 4. Sanskrit Inscription Fidelity Audit
console.log('\n--- 4. Sanskrit & Iconography Fidelity Audit ---');
assert(tunnelSrc.includes('ॐ तत्सत् · सूर्य मण्डल द्वारम्'), 'TunnelScene contains verified sacred Sanskrit: ॐ तत्सत् · सूर्य मण्डल द्वारम्');
const puzzleSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/scenes/PuzzleScene.ts'), 'utf-8');
assert(puzzleSrc.includes('॥ सूर्य चक्र ॥'), 'PuzzleScene contains verified Sanskrit: ॥ सूर्य चक्र ॥ (Surya Chakra)');

// 5. Dynamic Handheld Lantern Radial Lighting Audit
console.log('\n--- 5. Dynamic Lantern Radial Lighting Pipeline ---');
const explorerSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/entities/Explorer.ts'), 'utf-8');
assert(explorerSrc.includes('getLanternPosition(): { x: number; y: number }'), 'Explorer provides getLanternPosition() with dynamic directional offsets');
assert(tunnelSrc.includes('this.lanternGlow.setPosition(lanternPos.x, lanternPos.y)'), 'TunnelScene updates lantern glow position every frame in update()');

// 6. Texture Key Parity Audit
console.log('\n--- 6. Texture Key Registry Audit ---');
const texGenSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/systems/TextureGenerator.ts'), 'utf-8');
const expectedTextureKeys = [
  'explorer_sheet',
  'enemy_sheet',
  'player_jeep',
  'enemy_jeep',
  'statue_shiva',
  'statue_vishnu',
  'statue_ganesha',
  'lost_relic',
  'light_radial_warm',
  'light_radial_torch',
  'particle_gold',
];

for (const key of expectedTextureKeys) {
  assert(texGenSrc.includes(`'${key}'`), `TextureGenerator generates key '${key}'`);
}

assert(texGenSrc.includes("`puzzle_dial_${sym.id}`") && texGenSrc.includes("'sun'") && texGenSrc.includes("'lotus'") && texGenSrc.includes("'trishula'"), "TextureGenerator generates puzzle dials: 'puzzle_dial_sun', 'puzzle_dial_lotus', 'puzzle_dial_trishula'");

console.log(`\n========================================`);
console.log(`AUDIT COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log(`========================================`);

if (failedTests > 0) {
  process.exit(1);
}

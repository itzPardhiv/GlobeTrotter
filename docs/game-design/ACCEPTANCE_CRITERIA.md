# GlobeTrotter: The Lost Relic — Acceptance Criteria & Verification Matrix

## 1. Quality Gates & Verification Standards

A feature is never accepted based on claims or static mockups; it is accepted only when verified in actual code, automated test suites, and interactive browser execution.

---

## 2. Verification Matrix

| Area | Master Prompt Requirement | Implementation Verification | Status |
|---|---|---|---|
| **Story** | Rudhra established as authentic Indian bounty hunter | Verified in `TextureGenerator.ts`, `DialogueSystem.ts`, `Gamification.ts` | **PASS** |
| **Story** | Bounty confrontation introduces 1 billion gold coins map | 17-line interactive confrontation dialogue in `DialogueSystem.ts` | **PASS** |
| **Story** | Map inspection reveals coordinates & cosmic danger | Full modal with coordinates (24°18'N 82°45'E) & lore in `ThreeHUD.tsx` | **PASS** |
| **Story** | Temple murals & mechanisms reveal artifact saves Earth | Mundaka Upanishad translation & celestial codex in `ThreeGame.ts` | **PASS** |
| **Gameplay** | Responsive movement, acceleration, and jumping | Kinematic controller with 35.0 m/s² accel, coyote time, jump buffering | **PASS** |
| **Gameplay** | Crouch navigation through low crawlways | Standing 1.65m blocked by 1.2m ceiling; crouching 0.95m passes | **PASS** |
| **Gameplay** | Proximity interactions with clear visual prompts | Checked every frame; dynamic prompts `[E]` displayed on HUD | **PASS** |
| **Gameplay** | Map and Relic inventory tracking without duplication | `SaveManager` deduplicated event flags & carried 3D prop state | **PASS** |
| **Gameplay** | Mechanism socketing & 6-beat progressive reveal | Sequential brazier ignition, gear rotation, ambient light swell | **PASS** |
| **Presentation** | Premium 3D geometry without retro 2D pixelation | Full 3D meshes, PBR materials, ACES tone mapping, dynamic shadows | **PASS** |
| **Presentation** | Lantern distance GLSL shader illumination | Murals dynamically illuminate in relation to lantern world pos | **PASS** |
| **Engineering** | 2D Phaser Classic mode preserved | Toggleable via HUD button; unmounts/mounts cleanly | **PASS** |
| **Engineering** | Zero regressions across test suites | 55 unit tests, adversarial stress tests, and 3D audits pass | **PASS** |
| **Engineering** | Production build compiles cleanly | `vite build` completes in < 1.4s with 0 errors | **PASS** |

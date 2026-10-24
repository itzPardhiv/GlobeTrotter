# GlobeTrotter: The Lost Relic — Monumental Hindu Civilization Adventure

An epic, cinematic 2.5D action-adventure through a subterranean Hindu lost civilization. The player controls Dr. Harrison Vance, equipped with a dynamic brass lantern, traversing monumental rock-cut mandapas inspired by Ellora and Hampi to discover the ancient secrets of the Lost Relic.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions have been aligned based on user confirmations and the master creative direction:

- **Confirmed Scope Priority**: Focus deeply on **Chapter I: The Sunken Tunnel** as an expansive, monumental showcase level with cinematic depth, colossal scale, secret sanctum alcoves, and vast chasms.
- **Confirmed Lighting Architecture**: Dr. Harrison Vance's signature brass lantern will feature a dynamic radial illumination system with penumbra falloff, casting warm amber light on ancient carved sandstone surfaces while deep recesses remain enveloped in cool teal-shadow mystery.
- **Confirmed Architectural Style**: Exclusively rooted in monolithic rock-cut Hindu sacred architecture inspired by Ellora (Kailasa rock-cut monoliths) and Hampi (Vijayanagara stone chariot & pillared mandapas).
- **Strict Cultural Direction**: 100% authentic Hindu iconography (carved lotus friezes, sacred toranas, Kalasha finials, Surya wheels, Trishula emblems, Sanskrit epigraphy). Zero unrelated religious or generic fantasy motifs.
- **Asset Pack Integration**: Map the 26 uploaded modular stone assets (long/short lotus platforms, intact and broken carved pillars, ornate toranas, temple wall corners with seated deity reliefs, bronze oil sconces, and rubble piles) directly into the level geometry and collision system.

---

## 1. Overview & Core Concept

- **What It Delivers**: A monumental 2.5D cinematic platformer and environmental mystery experience where player traversal contrasts with the towering scale of a forgotten subterranean Hindu civilization.
- **Protagonist**: Dr. Harrison Vance, an explorer styled precisely after the provided canonical reference (`protagonist_reference_f57facac.png`): fedora, leather jacket, red neckerchief, khaki cargo pants, boots, satchel, and swinging brass oil lantern.
- **Core Pillars**:
  1. *Epic Scale*: Colossal monolithic pillars and multi-layered parallax arches extending beyond the viewport.
  2. *Atmospheric Contrast*: Golden torchlight and lantern beams cutting through deep teal and obsidian shadows.
  3. *Fluid Traversal & Secrets*: Responsive 60 FPS physics with coyote time, jump buffering, ledge mantling, secret elevated shrines, crumbling stone traps, and ancient Sanskrit seal mechanics.

---

## 2. User Experience & Visual Design

### The 7-Stage Progression of Chapter I: The Sunken Tunnel
```
[ 1. The Threshold ] ──> [ 2. Colossal Hypostyle ] ──> [ 3. Broken Chasm ]
         │
         ▼
[ 4. Secret Vimana Shrine ] ──> [ 5. Checkpoint Mandapa ] ──> [ 6. The Crumbling Span ] ──> [ 7. Grand Surya Vault Gate ]
```

1. **The Threshold of the Subterranean Ghats**:
   - Dr. Vance steps out from a narrow mountain crevice into an immense cavern.
   - Cinematic camera reveal: The camera pulls back to display towering carved Dravidian columns disappearing into darkness.
2. **The Colossal Hypostyle Mandapa**:
   - Traversal across layered modular lotus beams (`platform_long_01` & `platform_short_01`).
   - Intact sculpted pillars (`pillar_intact_01`) frame the midground; broken fractured pillars (`pillar_broken_01`) create stepping stones.
3. **The Sacred Chasm & Hanging Toranas**:
   - A deep chasm dropping into a mist-filled subterranean temple tank with glowing blue waters.
   - Ornate carved arches (`arch_ornate_01`) span overhead with trailing vines and ancient Sanskrit inscriptions.
4. **Secret Elevated Vimana Alcove**:
   - High hidden ledge accessible via timed wall rebounds or crumbling rubble piles (`rubble_pile_01`).
   - Houses a glowing celestial sapphire relic (`gem_blue`) resting upon a carved lotus altar (`base_decorative_01`).
5. **The Checkpoint Mandapa**:
   - An ancient shrine niche (`doorway_01`) with wall corner deity reliefs (`wall_corner_01`).
   - Wall torch sconces (`torch_fixture_01`) ignite with a gentle whoosh when Vance approaches, establishing a warm haven.
6. **The Crumbling Span & Falling Stalactites**:
   - High-tension platforming: crumbling sandstone blocks that shudder and drop after 0.6 seconds.
7. **The Grand Surya Vault Gate**:
   - A colossal monolithic stone doorway locked with a massive rotating stone wheel inscribed with 8 solar rays and Sanskrit numerals.
   - Interacting with `[E]` triggers the celestial unlocking sequence, leading toward Chapter II's Celestial Gear Lock.

### Color Palette & Atmospheric Tokens
- **Background Depths (60%)**: Deep obsidian navy (`#06080F`), temple shadow teal (`#0A131F`), weathered cave basalt (`#141722`).
- **Architectural Sandstone (30%)**: Warm Ellora granite (`#544638`), antique carved sandstone (`#7C6952`), moss-kissed stone (`#3E4438`).
- **Sacred Focal Accents (10%)**: Temple diya flame amber (`#FF9900`), antique temple gold (`#D4AF37`), celestial Vedic sapphire (`#00F7FF`).

### Typography Hierarchy
- **Title & Chapter Headings**: `Cinzel Decorative` & `Cinzel` (Antique gold serif, generous letter spacing).
- **Sanskrit Inscriptions & Objective Subtitles**: `Rajdhani` (Semi-bold, crisp, high legibility over dark backgrounds).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Asset Loading from Local Disk**:
  - *Chosen Approach*: Load all 26 uploaded PNG assets directly from `/public/assets/aistudio/...` via Phaser's `load.image()` and texture manager, supplemented with high-resolution canvas blending for smooth tiling.
  - *Why*: Guarantees zero 404s, authentic hand-painted texture fidelity, and 100% adherence to the user's supplied asset pack.
- **Decision 2: Dynamic 2.5D Radial Lighting System**:
  - *Chosen Approach*: Implement a custom lighting pipeline using Phaser's WebGL Light2D pipeline or a composited multi-layer alpha mask with radial falloff centered on Dr. Vance's lantern and wall torches.
  - *Why*: Delivers dramatic cinematic contrast between the illuminated carved sandstone and pitch-black ruins without performance penalties.
- **Decision 3: Canonical Dr. Vance Character Integration**:
  - *Chosen Approach*: Build a custom multi-frame animated explorer matching the exact visual anatomy from `protagonist_reference_f57facac.png` (side-profile fedora, leather jacket folds, lantern in hand, cargo boots), featuring responsive animation states (Idle, Run, Jump, Fall, Crouch, Interact).

---

## 4. Technical Architecture & Component Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App.tsx (Game Shell)                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Phaser 3 Game Canvas                         │  │
│  │                                                                  │  │
│  │  ┌────────────────────┐   ┌───────────────────────────────────┐  │  │
│  │  │   BootScene.ts     │──>│         MainMenuScene.ts          │  │  │
│  │  │ (Preload uploaded  │   │  (Monumental Gopuram Silhouette,  │  │  │
│  │  │  temple PNG assets)│   │   Drifting Embers, Gold Title)    │  │  │
│  │  └────────────────────┘   └─────────────────┬─────────────────┘  │  │
│  │                                             │                    │  │
│  │                                             ▼                    │  │
│  │                                   ┌───────────────────┐          │  │
│  │                                   │   IntroScene.ts   │          │  │
│  │                                   │ (Prologue Inscription)       │  │
│  │                                   └─────────┬─────────┘          │  │
│  │                                             │                    │  │
│  │                                             ▼                    │  │
│  │                                   ┌───────────────────┐          │  │
│  │                                   │   TunnelScene.ts  │          │  │
│  │                                   │  (EXPANSIVE CH. 1 │          │  │
│  │                                   │  MONUMENTAL LEVEL)│          │  │
│  │                                   └─────────┬─────────┘          │  │
│  │                                             │                    │  │
│  │                                             ▼                    │  │
│  │                            ┌─────────────────────────────────┐   │  │
│  │                            │   Chapter II Teaser & Vault     │   │  │
│  │                            │  (Celestial Gear Mechanism)     │   │  │
│  │                            └─────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │        HUD Overlay (Health Diya, Coins, Gems, Pause Menu)        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities:
- `src/systems/AssetLoader.ts`: Preloads all 26 user-provided PNG files from `/public/assets/aistudio/...`.
- `src/entities/DrHarrisonVance.ts`: Player entity with physics, coyote time (120ms), jump buffering, dynamic lantern position, and dust particles.
- `src/scenes/TunnelScene.ts`: The expanded monumental Chapter I level assembled with modular platforms, pillars, arches, alcoves, chasm hazards, and the grand Surya vault.
- `src/systems/AudioManager.ts`: Enhanced with resonant subterranean drones, stone scraping audio, ancient temple bells, and footstep audio.

---

## 5. Verification & Acceptance Criteria

1. **Asset Fidelity**: Every platform, pillar, arch, torch, wall corner, and pedestal in Chapter I strictly uses the user's provided assets.
2. **Cultural Purity**: Exclusively Hindu temple motifs—lotus relief carvings, sacred toranas, Kalasha pinnacles, Sanskrit runes.
3. **Responsive Controls**: Smooth 60 FPS jumping, landing, crouch sliding, and collision detection.
4. **Cinematic Lighting**: Dynamic radial illumination around Dr. Vance's lantern and warm torchlight at sanctuary shrines.
5. **Compilation**: Clean `compile_applet` and `lint_applet` execution with zero runtime warnings.

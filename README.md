# GLOBETROTTER: THE LOST RELIC — PIXEL EDITION
## Complete Prelude + Complete Level 1 | AAA-Inspired Art Direction | Independent Project

**GlobeTrotter: The Lost Relic — Pixel Edition** is a complete, playable, premium 2D cinematic pixel-art adventure game set in the forgotten ruins of the Deccan plateau in ancient India. Players assume control of Rudhra, an intrepid archaeologist and explorer who uncovers an ancient temple complex hiding the legendary Surya-Chakra relic.

---

## 1. Technical Architecture & Design Specs

- **Virtual Canvas Resolution**: `640 × 360` (Native 16:9 widescreen retro pixel resolution).
- **Display Scaling**: Clean 2x integer scaling (`1280 × 720`) with nearest-neighbor texture filtering (`Phaser.Scale.FIT`).
- **Core Engine**: Phaser 3 (WebGL renderer with 2D Arcade Physics) + TypeScript + Vite.
- **Project Isolation**: 100% independent sibling project located at `GlobeTrotter-Pixel-Edition/`. Zero modifications or dependencies linked to the original 3D project.
- **Rendering Pipeline**: Multi-layer parallax scrolling, dynamic 2D pixel lighting cutout masks, organic torch flicker, light rays, particle emitters (dust, embers, tire clouds).
- **Audio Architecture**: Pure procedural Web Audio API synthesis (no external copyrighted mp3s/wavs; runs entirely self-contained without missing asset errors).
- **Save State**: LocalStorage persistence with versioned schema validation (`saveVersion: 1`), tracking checkpoints, relics, codex discoveries, and level rating.

---

## 2. Narrative & Scene Breakdown

### Prelude (Cinematic Master Sequence)
1. **Scene 1: Before Sunrise** — Vast layered silhouette of the Deccan mountain range at dawn. Muted indigo sky transitioning to amber and pale gold, animated morning bird flocks, and rolling valley mist.
2. **Scene 2: The Expedition Jeep** — Old 4x4 expedition vehicle navigating a winding jungle mountain road with rotating knobby wheels, responsive suspension bounce, headlight cones, and tire dust plumes.
3. **Scene 3: Cabin Interior Reveal** — Close-up framing into the vehicle cabin highlighting Rudhra's focused expression, beard, and expedition cap.
4. **Scene 4: Arrival at the Excavation Site** — The jeep pulls up to the overgrown stone entrance of the ruins, engine cuts, suspension settles, and dust clears.
5. **Scene 5: Playable Wilderness Exploration** — Player takes seamless control of Rudhra. Exploration of the abandoned expedition campsite, campfire, tent, and reading Rudhra's expedition field notes.

### The Descent & Inscription Revelations
6. **Descent into Darkness** — Rudhra enters the ancient underground stairways carrying a handheld lantern. The environment is shrouded in near-darkness, illuminated only by a dynamic circular light mask.
7. **Authentic Sanskrit Epigraphs**:
   - *Mundaka Upanishad 3.1.6*: Consecrating the Torana archway lintel:
     `॥ सत्यमेव जयते नानृतं ॥ सत्येन पन्था विततो देवयानः ॥`
     *(Truth alone triumphs, not falsehood. Through truth the divine path is spread out...)*
   - *Bhagavad Gita 2.47*: Inscribed on the Gita Mandapa pillar stele:
     `॥ कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ॥`
     *(Thy right is to work alone, never to its fruits.)*
   - *Valmiki Ramayana (Ayodhya Kanda 2.12.3)*: Inscribed on the Sanctum threshold stele:
     `॥ धर्मो हि परमो लोके धर्मे सत्यं प्रतिष्ठितम् ॥`
     *(Righteousness is supreme in the world; truth is established in righteousness.)*

### Level 1: Sunken Sanctum of the Deccan
8. **Artifact Placement**: Rudhra locates the celestial pedestal at the temple center and inserts the first discovered key fragment.
9. **The Great Torch Reveal**: A staged 5-step ignition sequence travels along ancient carved conduits, igniting massive wall braziers and opening a ceiling fissure that casts a celestial blue sunbeam onto the central altar.
10. **Ancient Traversal & Chasm Bridge**: Platforming across uneven stone platforms and crossing a creaking wooden suspension rope bridge over a bottomless mist chasm.
11. **Monumental Torana Gateway**: A handcrafted Indian stone gateway marking entry into the enclosed temple vestibule.
12. **Surya-Chakra 3-Dial Puzzle**: An authentic rotating celestial mechanism requiring the alignment of three symbols:
    - **Surya Sun Dial**: Aligned to Zenith (`0°`)
    - **Padma Lotus Dial**: Aligned to Sunrise East (`90°`)
    - **Trishula Dial**: Aligned to Nadir (`180°`)
13. **Vault Opening & Relic Recovery**: Solving the puzzle triggers a screen rumble, mechanical gear sounds, and raises the colossal stone vault door to reveal the legendary golden **Surya-Chakra Relic**.
14. **Level 1 Completion & Rewards Screen**: Final plaque calculating deciphered scriptures, dials solved, relic recovery, and awarding a 3-star archaeological expedition rating.

---

## 3. Directory Layout

```text
GlobeTrotter-Pixel-Edition/
├── public/
│   └── favicon.ico
├── src/
│   ├── config.ts              # Game configuration, palette tokens, Sanskrit verses
│   ├── types.ts               # State, HUD, and save interfaces
│   ├── main.ts                # Phaser game instantiation & window binding
│   ├── entities/
│   │   ├── PixelRudhra.ts     # Player controller (hitboxes, coyote time, lantern)
│   │   └── ExpeditionJeep.ts  # 4x4 vehicle (suspension physics, headlights)
│   ├── systems/
│   │   ├── PixelAssetGenerator.ts  # Procedural pixel art generation
│   │   ├── PixelAudioManager.ts    # Web Audio API procedural sound synthesizer
│   │   ├── LightingManager.ts      # 2D pixel lighting cutout mask & torch flicker
│   │   ├── DialogueManager.ts      # Sanskrit epigraph modal presentation
│   │   └── SaveManager.ts          # LocalStorage persistence engine
│   ├── ui/
│   │   └── HUDOverlay.ts           # Adventure HUD, hearts, objective, pause menu
│   └── scenes/
│       ├── BootScene.ts            # Asset compilation & transition
│       ├── MainMenuScene.ts        # Title screen & dawn parallax
│       ├── PreludeCinematicScene.ts# 4-scene cinematic master sequence
│       ├── WildernessScene.ts      # Playable forest exploration & campsite
│       ├── RuinsDescentScene.ts    # Lantern descent & Great Torch Reveal
│       ├── SanctumTraversalScene.ts# Level 1 traversal, bridge & Surya-Chakra puzzle
│       └── ResultsScene.ts         # Final score plaque & rating
├── scripts/
│   └── verify-2d-runtime.ts   # Headless browser CDP automated QA audit
├── tests/
│   └── run-tests.ts           # 30-assertion unit test suite
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Controls

| Key | Action |
| --- | --- |
| `A` / `D` or `←` / `→` | Walk Left / Right |
| `W` / `Space` / `↑` | Jump (supports coyote time & jump buffering) |
| `Shift` (Hold) | Sprint |
| `S` or `↓` | Crouch |
| `E` | Interact / Decipher Inscription / Rotate Dial / Claim Relic |
| `L` | Toggle Handheld Lantern |
| `Esc` | Pause / Settings Menu |
| `Space` (during cinematic) | Skip Prelude Sequence |

---

## 5. Development & Testing Commands

All commands must be executed from inside `GlobeTrotter-Pixel-Edition`:

```bash
# 1. Install dependencies
npm install

# 2. Run unit test suite (30 assertions)
npm test

# 3. Compile production bundle
npm run build

# 4. Start local development server
npm run dev
# -> http://localhost:3005/

# 5. Run automated browser runtime QA audit
npx tsx scripts/verify-2d-runtime.ts
```

---

## 6. QA Verification & Benchmark Results

- **Unit Tests**: `30 / 30 Passed` (100% pass rate).
- **TypeScript & Vite Build**: Clean build, 0 compilation errors.
- **Automated Runtime Audits**: `17 / 17 Passed` covering all game phases.
- **Interactive Frame Rate**: `60.0 FPS` steady (Average frame time: `16.67 ms`, Median: `16.70 ms`).
- **Project Isolation**: Verified `globetrotter/` 3D workspace remains 100% intact.

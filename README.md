# GLOBETROTTER — THE LOST RELIC
### Full Production-Oriented 2.5D Cinematic Adventure Game
**"Beyond Borders. Beyond Time."**

GlobeTrotter: The Lost Relic is an epic, cinematic 2.5D action-adventure browser game built with **Phaser 3**, **TypeScript**, **HTML5/WebGL**, and **Tailwind CSS**. It is exclusively rooted in Hindu civilization, sacred rock-cut temple architecture inspired by Ellora and Hampi, Sanskrit astronomical ciphers, and a monumental subterranean expedition led by Dr. Harrison Vance.

---

## 🏛️ Master Creative Direction & Non-Negotiable Cultural Identity

- **Strictly Hindu Civilizational Identity**: Inspired exclusively by Dravidian, Nagara, and Vesara rock-cut temple traditions (Ellora Kailasa monoliths and Hampi Vijayanagara mandapas). Features carved lotus friezes, ornate torana arches, kalashas, Surya solar discs, sacred Trishulas, and respectful monumental golden statues of Hindu deities (Lord Shiva Nataraja, Lord Vishnu, Lord Ganesha, and Goddess Lakshmi).
- **Canonical Protagonist — Dr. Harrison Vance**: Styled directly after `protagonist_reference_f57facac.png`: weathered leather jacket, fedora felt hat, crimson neckerchief, khaki cargo pants, boots, satchel, and a swinging brass oil lantern.
- **Dynamic Real-Time Radial Lantern Lighting**: Dr. Vance's lantern emits an active radial amber-gold light beam with soft penumbra falloff, cutting through deep teal and obsidian subterranean shadows to illuminate ancient carved sandstone walls, wall niches, and hidden altars.
- **Expansive Showcase Level — Chapter I: The Sunken Tunnel**: Over 4,800 pixels of continuous, monumental rock-cut traversal across 7 distinct architectural spaces:
  1. *The Sanctum Threshold*: The ancient subterranean mountain crevice entrance.
  2. *The Hypostyle Mandapa of 1000 Lotus Pillars*: Towering carved columns and ornate toranas.
  3. *The Chasm of Broken Pillars & Sacred Water Tank*: A 400px abyss above an illuminated subterranean temple tank.
  4. *The Secret Elevated Vimana Alcove*: High vertical platforming with a carved lotus pedestal holding a glowing Vedic sapphire relic.
  5. *The Ceremonial Checkpoint Mandapa*: An ancient shrine niche with wall corner seated deity reliefs and flaming diya sconces.
  6. *The Crumbling Sandstone Span*: Traversal across shuddering, collapsing stone blocks and swinging pendulum blades.
  7. *The Grand Surya Vault Gate*: Colossal monolithic gateway inscribed with Sanskrit runes (`॥ ॐ तत्सत् · सूर्य मण्डल द्वारम् ॥`) and a rotating Surya solar disc mechanism.

---

## 🎨 Asset Pack Integration Manifest

The game directly preloads and renders the uploaded authentic modular Hindu temple assets located in `/public/assets/aistudio/`:

| Texture Key | Local File Path | Architectural Usage |
| :--- | :--- | :--- |
| `asset_platform_long` | `platform_long_01_8d7371b5.png` | Long carved sandstone platform beams with lotus frieze |
| `asset_platform_short` | `platform_short_01_acd7daba.png` | Short carved stepping blocks and elevated ledges |
| `asset_pillar_intact` | `pillar_intact_01_d1f3ed68.png` | Monumental rock-cut lotus columns in midground and foreground |
| `asset_pillar_broken` | `pillar_broken_01_e1a8864a.png` | Fractured stone pillars serving as chasm stepping stones |
| `asset_arch_ornate` | `arch_ornate_01_a528764f.png` | Sacred carved torana archways with concentric mandala motifs |
| `asset_arch_simple` | `arch_simple_01_02310f9e.png` | Ancient ceiling arches with trailing roots and vines |
| `asset_doorway` | `doorway_01_dce37c8c.png` | Carved shrine niches and sanctuary entrance thresholds |
| `asset_wall_panel` | `wall_panel_01_4fca1e59.png` | Bas-relief wall niches with lotus floral carvings |
| `asset_wall_corner` | `wall_corner_01_11addc0b.png` | Ancient inner corner masonry with seated deity relief |
| `asset_pedestal` | `base_decorative_01_06478c98.png` | Carved lotus altar pedestal for sacred relic placement |
| `asset_rubble` | `rubble_pile_01_b6db607b.png` | Tumbled capitals and weathered stone debris piles |
| `asset_torch` | `torch_fixture_01_908237a8.png` | Cast bronze wall sconces holding warm oil flame diyas |
| `asset_protagonist_ref` | `protagonist_reference_f57facac.png` | Canonical Dr. Harrison Vance visual reference |

---

## 🎮 Desktop & Mobile Controls

| Action | Primary Key | Secondary Key |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | `Left` / `Right` Arrow |
| **Jump** | `Space` | `W` / `Up` Arrow |
| **Crouch / Duck Cover** | `S` | `Down` Arrow |
| **Interact / Unseal / Claim** | `E` | Click Dial / Prompt |
| **Shoot (Combat)** | `J` | Left Mouse Click |
| **Vehicle Boost (Chase)** | `Shift` | `W` |
| **Pause Game** | `Escape` | On-Screen `❚❚` Icon |
| **Quick Chapter Select** | Top-Right Menu | Instant level jump |

---

## 🛠️ Architecture & Module Organization

```
├── src/
│   ├── main.tsx             # React mount
│   ├── App.tsx              # Game Shell & Quick Chapter Select
│   ├── config.ts            # Phaser 3 1280x720 canvas & Arcade physics config
│   ├── entities/
│   │   ├── Explorer.ts      # Dr. Harrison Vance controller (coyote time, lantern position)
│   │   ├── Enemy.ts         # Mercenary patrol AI, telegraphs & health
│   │   ├── Trap.ts          # Floor spikes, swinging blades, boulders, crumbling stone
│   │   └── Collectible.ts   # Gold coins, secret blue gems, ammo crates, totems
│   ├── scenes/
│   │   ├── BootScene.ts     # Preloads uploaded assets & initializes textures
│   │   ├── MainMenuScene.ts # Monumental Gopuram landscape, title lockup, settings
│   │   ├── IntroScene.ts    # Subterranean Ghats prologue & Sanskrit inscription
│   │   ├── TunnelScene.ts   # EXPANSIVE Chapter I: Sunken Tunnel (4800px monumental mandapa)
│   │   ├── PuzzleScene.ts   # Chapter II: Celestial Gear Lock (Surya, Padma, Trishula dials)
│   │   ├── ChaseScene.ts    # Chapter III: High-speed canyon jeep pursuit & gorge leap
│   │   ├── TimeFlashScene.ts# Era flash-cut montage connecting Vedic to cosmic epochs
│   │   ├── CombatScene.ts   # Chapter IV: The Last Stand outer sanctum standoff
│   │   ├── GrandRevealScene.ts # Chapter V: Sacred temple reveal & Lost Relic claim
│   │   ├── PauseScene.ts    # In-game pause overlay
│   │   └── ResultsScene.ts  # Expedition debriefing & rating
│   └── systems/
│       ├── AudioManager.ts  # Web Audio synthesizer for all SFX & ambient tracks
│       ├── SaveManager.ts   # LocalStorage persistent game state
│       └── TextureGenerator.ts # HD-2D procedural canvas texture generator
```

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Production Build**:
   ```bash
   npm run build
   ```

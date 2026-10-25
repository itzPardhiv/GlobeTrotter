# GlobeTrotter: The Lost Relic — Gameplay Pillars

## 1. The Tripartite Gameplay Balance

GlobeTrotter balances three core gameplay pillars in approximately equal proportion:

```
┌────────────────────────────────────────────────────────┐
│             GLOBETROTTER CORE GAMEPLAY                  │
├─────────────────┬───────────────────┬──────────────────┤
│   EXPLORATION   │    PLATFORMING    │      STORY &     │
│      (33%)      │   & ACTION (33%)  │  DISCOVERY (34%) │
├─────────────────┼───────────────────┼──────────────────┤
│ Clues & Tracks  │ Responsive Runs   │ Epigraphy & Murals│
│ Secret Shrines  │ Precision Jumps   │ Codex Translation │
│ Optional Relics │ Trap Navigation   │ Dialogue Standoff│
│ Map Reading     │ Crawlways/Crouch  │ Cosmic Revelation│
└─────────────────┴───────────────────┴──────────────────┘
```

---

## 2. Core Player Verbs & Controls

| Verb | Control (PC) | Functional Feedback & Animation |
|---|---|---|
| **Move Horizontal** | `[A / D]` or `[Arrow Keys]` | Smooth acceleration (35.0 m/s²), footstep audio, directional mesh turn |
| **Sprint** | `[Shift] + [A / D]` | Sprint speed (7.8 m/s²), trailing dust particles, wider camera lead |
| **Jump** | `[Space]` | Jump impulse (7.6 m/s), jump buffer (150ms), coyote time (120ms), landing impact sound |
| **Crouch** | `[C]` or `[Ctrl]` | Lowers collision height to 0.95m; enables traversal through 1.2m low crawlways |
| **Interact** | `[E]` | Triggers proximity interaction: examine clues, talk to NPC, pick up relics, rotate dials |
| **Inspect Journal** | `[J]` | Opens Archaeological Discovery Journal with 6 categorized tabbed archives |
| **Pause Menu** | `[Esc]` | Opens pause menu with restart checkpoint, replay level, and audio volume toggles |

---

## 3. Pacing & Flow Principles

- **No Pointless Emptiness**: Traversal corridors contain visual landmarks, environmental storytelling, or collectible ancient coins.
- **Fair Danger**: All hazards (spike pits, falling masonry, crumbling platforms) have telegraphing visual/audio cues (crumbling dust, audio warning, distinct silhouette).
- **Checkpoints**: Positioned directly before challenging platforming or major narrative beats to prevent frustrating repetition.
- **Reward Deduplication**: XP, relics, and achievements are awarded exactly once via `SaveManager` persistent event tracking.

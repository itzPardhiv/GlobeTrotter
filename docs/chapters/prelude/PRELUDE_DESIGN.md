# GlobeTrotter: The Lost Relic — Prelude Design Specification

## 1. Overview & Narrative Objective

The **Prelude** serves as the narrative and gameplay onboarding foundation for *GlobeTrotter: The Lost Relic*. It spans Sequences 1 through 6, transitioning from outdoor Deccan wilderness tracking into the subterranean ancient temple.

- **Protagonist Goal**: Apprehend target Vikram and collect the promised bounty.
- **Narrative Twist**: Vikram reveals he was following coordinates to a legendary fortune of one billion gold coins, but fled in terror after unearthing signs of a cosmic warning.
- **Gameplay Progression**: Establishes vehicle kinematics, footstep audio, ground collision, hazard hopping, clue inspection, dialogue interaction, map inventory inspection, and continuous level transitions.

---

## 2. Environmental Zones & Sequences

```
[X = -15m] ─── (Seq 1: Jeep Arrival) ───> [X = 5m]
     │
     └──> [X = 6m to 25m] (Seq 2: Bounty Tracking & Clues)
               │
               └──> [X = 30m to 38m] (Seq 3: Vikram Campsite & Dialogue)
                         │
                         └──> [X = 34m] (Seq 4: Ancient Map Discovery)
                                   │
                                   └──> [X = 45m to 75m] (Seq 5: Expedition Trail & Pit Gap)
                                             │
                                             └──> [X = 78m to 82m] (Seq 6: Temple Gates)
                                                       │
                                                       └──> [Transitions into Sanctum Interior]
```

---

## 3. Detailed Sequence Breakdown

### Sequence 1: Opening Jeep Arrival
- **Asset**: 3D military-style open-top jeep with rolling wheel cylinders, dual headlights with volumetric spot cones, roll cage, and front hood.
- **Animation**: Jeep moves from `X = -15m` to `X = 5m` with procedural suspension oscillation and distance-based wheel rotation.
- **Cinematic Flow**: Camera tracks the vehicle in Mode B wide landscape view, settling smoothly at `X = 5m`. Rudhra takes active control at `X = 6.0m`.

### Sequence 2: Tracking the Bounty
- **Terrain**: Weathered dirt road flanked by dense jungle trees, foliage, and scattered boulders.
- **Clues**:
  - Footprint impressions along the dirt path (`X = 18m to 28m`).
  - Discarded military canteen at `X = 24m` (`[E]` Inspect Canteen, +15 XP).
  - Abandoned expedition rucksack at `X = 31m` (`[E]` Inspect Pack, +15 XP).

### Sequence 3: Bounty Confrontation
- **NPC**: Vikram humanoid character standing at campsite with canvas tent, campfire with flickering point light, and supply crates.
- **Dialogue Engine**: 17-line confrontation via `DialogueSystem`. Typewriter text animation with speaker tags (`VIKRAM`, `RUDHRA`), stage directions, and auto/manual line advancing.
- **Outcome**: Vikram reveals the map to the one billion gold coins. +50 XP awarded, journal entry unlocked.

### Sequence 4: Map Discovery
- **Prop**: 3D aged parchment scroll prop hovering at `X = 34m` with pale gold point light glow.
- **Interaction**: Pressing `[E]` collects the map, updates objective, and opens the Cartography Modal.
- **Inspection Modal**: Weathered parchment rendering displaying coordinates `24°18'N 82°45'E`, compass rose, and ancient threat warning.

### Sequence 5: The Expedition Trail
- **Platforming**: Winding mountain trail with ancient carved sandstone blocks, stream bridge at `X = 56m`, and a 2.0m traversal pit gap at `X = 63m` requiring a jump.
- **Collectibles**: 10 golden coins placed along the path that spin with vertical bobbing and auto-collect on proximity.
- **Checkpoint**: Checkpoint registered at `X = 52m`.

### Sequence 6: Ancient Temple Gates
- **Architecture**: Monumental sandstone gateway at `X = 80m` with twin massive pillars, carved lotus lintel, hanging banyan vines, and descending stone stairs.
- **Transition**: Approaching the gateway displays `[E] Enter the Ancient Temple`. Interacting smoothly transitions the player and camera into the subterranean interior (`ForgottenSanctumLevel`).

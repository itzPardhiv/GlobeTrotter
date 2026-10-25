# GlobeTrotter: The Lost Relic — Scene Mapping

## 1. Mapping Master Prompt Sequences to Technical Implementation

The master prompt defines a 12-sequence cinematic journey. Below is the mapping to the actual code architecture in `PreludeLevel.ts`, `ForgottenSanctumLevel.ts`, and `ThreeGame.ts`.

| Master Prompt Sequence | Technical Class | Spatial Coordinates | Level Asset / Feature | State & Gameplay Transition |
|---|---|---|---|---|
| **Seq 1: Opening Jeep Arrival** | `PreludeLevel` | X: -15m → 5m | 3D military open-top jeep with rotating wheels, suspension, headlights | Camera Mode B tracks jeep arrival; player gains control at X=6m |
| **Seq 2: Tracking the Bounty** | `PreludeLevel` | X: 15m → 32m | Footprint indentations, broken branches, discarded canteen (X=24m), rucksack (X=31m) | Interaction inspection prompts award XP; campfire smoke & point light flicker |
| **Seq 3: Bounty Confrontation** | `PreludeLevel` + `DialogueSystem` | X: 38m | Vikram 3D humanoid NPC, campsite tent, supply crates | Interactive branching dialogue; reveals 1 billion gold coins legend |
| **Seq 4: Map Discovery** | `PreludeLevel` + `ThreeHUD` | X: 34m | Aged parchment 3D scroll prop with golden point light glow | Picking up map opens Cartography Inspection Modal with coordinates (24°18'N 82°45'E) |
| **Seq 5: The Expedition** | `PreludeLevel` | X: 45m → 75m | Weathered stone monoliths, stream bridge (X=56m), pit gap (X=63m), collectible coins | Traversal platforming, jump timing, coin auto-pickup, checkpoint at X=52m |
| **Seq 6: First View of Temple** | `PreludeLevel` | X: 78m → 82m | Monumental sandstone gateway facade, lotus carved lintel, banyan roots, descending steps | Wide reveal camera; pressing `[E]` transitions into subterranean sanctum |
| **Seq 7: Temple Exploration** | `ForgottenSanctumLevel` | X: 0m → 18m | Monolithic hypostyle entrance hall, Surya altar at X=6m, stepped descent | Recover Surya-Chakra relic prop; attached to Rudhra's back; descend into darkness |
| **Seq 8: The Ancient Murals** | `ForgottenSanctumLevel` | X: 20m → 42m | Carved stone wall reliefs with dynamic lantern distance GLSL shader | Relief carvings illuminate as Rudhra's lantern approaches; reveals cosmic event lore |
| **Seq 9: The Deeper Passage** | `ForgottenSanctumLevel` | X: 45m → 65m | Ancient archives, subterranean spike pits, Bhagavad Gita rock inscription tablets | Low crawlway passage (crouch height 0.95m), classical Sanskrit translation modals |
| **Seq 10: The Relic Chamber** | `ForgottenSanctumLevel` | X: 70m → 80m | Dormant celestial planetary mechanism, circular gear socket at X=76m | Installing carried Surya-Chakra into the mechanism triggers awakening |
| **Seq 11: The Sanctum Awakening** | `ThreeGame` Cinematic | X: 76m → 90m | 6-Beat cinematic sequence: relic pulse, sequential brazier ignition, rotating bronze gear rings, skylight shafts | Camera pans across awakening chamber; restores control for monumental bridge traversal |
| **Seq 12: The Final Crossing** | `ForgottenSanctumLevel` | X: 90m → 125m | High-altitude chasm bridge, archway, rotatable symbol dials, Grand Surya Vault portcullis | Cross chasm bridge, solve dial alignment, read Mundaka Upanishad lintel, cosmic revelation, results screen |

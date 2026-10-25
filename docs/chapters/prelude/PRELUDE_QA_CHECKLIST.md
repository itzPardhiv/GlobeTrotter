# GlobeTrotter: The Lost Relic — Prelude QA Checklist

## 1. Automated Verification Checklist

- [x] `PreludeLevel` class instantiates without errors.
- [x] Ground colliders cover `X = -20m` to `X = 85m` with valid jump gap at `X = 63m`.
- [x] All 15 interaction targets registered in `PreludeLevel`.
- [x] Jeep positions verified: `jeepStartX = -15m`, `jeepStopX = 5m`.
- [x] `collectMap()` hides the 3D scroll mesh and sets `isMapCollected = true`.
- [x] `DialogueSystem` advances lines, handles typewriter effect, skips on `[Esc]`, and triggers `onComplete` callback.
- [x] `SaveManager` prevents duplicate XP awards for clues, confrontation, and map recovery.
- [x] Production build `npm run build` compiles with 0 errors.

---

## 2. Interactive Browser QA Checklist

- [x] **Sequence 1 (Jeep Arrival)**:
  - Jeep arrives smoothly from left with rotating wheels.
  - Headlights project light onto the road.
  - Camera Mode B tracks the vehicle and settles at `X = 5m`.
  - Rudhra appears at `X = 6m` and controls activate.
- [x] **Sequence 2 (Bounty Tracking)**:
  - Footprint tracks visible in the dirt road.
  - Discarded canteen at `X = 24m` shows `[E] Inspect Discarded Canteen`.
  - Pressing `[E]` shows toast notification and awards +15 XP.
  - Backpack at `X = 31m` shows `[E]` prompt and awards +15 XP.
  - Campfire flickers with amber embers and dynamic point light.
- [x] **Sequence 3 (Bounty Confrontation)**:
  - Approaching Vikram at `X = 38m` displays `[E] Confront Target`.
  - Pressing `[E]` opens the cinematic dialogue modal.
  - Typewriter animation renders each character sequentially.
  - Pressing `[Space / E]` advances through all 17 lines.
  - Pressing `[Esc]` immediately skips to the end.
  - Movement inputs are properly locked during conversation.
  - Completing dialogue unlocks journal entry and awards +50 XP.
- [x] **Sequence 4 (Map Discovery)**:
  - Map collectible appears at `X = 34m` with a golden light glow.
  - Pressing `[E]` collects the map and opens the Cartography Inspection Modal.
  - Map modal displays parchment texture, coordinates, compass, and legend.
  - Pressing `[E / Esc]` closes the modal and returns control.
- [x] **Sequence 5 (The Expedition)**:
  - Traversing past `X = 40m` presents rocky terrain and ancient stone remnants.
  - Wooden bridge at `X = 56m` has valid platform collision over the stream.
  - Pit gap at `X = 63m` requires a well-timed jump.
  - Golden coins spin and auto-collect on proximity (+5 XP).
  - Reaching `X = 52m` registers the checkpoint.
- [x] **Sequence 6 (Temple Gates Facade)**:
  - Monumental stone gateway at `X = 80m` frames the entrance with pillars and vines.
  - Approaching displays `[E] Enter the Ancient Temple`.
  - Pressing `[E]` triggers seamless transition into the subterranean temple (`ForgottenSanctumLevel`).

# GlobeTrotter: The Lost Relic — Prelude Scene Flow & State Transitions

## 1. Prelude Finite State Machine

```
[STATE_JEEP_CINEMATIC]
      │
      │ 3.6s timer completes or [Space/E] skip
      ▼
[STATE_TRACKING_BOUNTY]  ◄─── (Player explores X: 6m to 35m)
      │
      │ Player approaches Vikram at X: 38m and presses [E]
      ▼
[STATE_CONFRONTATION_DIALOGUE]  ◄─── (Movement paused, DialogueSystem active)
      │
      │ 17 lines completed or [Esc] skip
      ▼
[STATE_MAP_AVAILABLE]  ◄─── (Map scroll prop spawns at X: 34m)
      │
      │ Player presses [E] on map
      ▼
[STATE_MAP_INSPECTION_MODAL]  ◄─── (Full-screen parchment modal open)
      │
      │ Player presses [E / Esc] to stow map
      ▼
[STATE_EXPEDITION_TRAIL]  ◄─── (Player explores X: 40m to 78m, bridges & gap)
      │
      │ Player reaches monumental gateway at X: 82m and presses [E]
      ▼
[STATE_TRANSITION_SANCTUM]  ◄─── (Scene switches to ForgottenSanctumLevel)
```

---

## 2. Trigger Boundaries & Coordinate Registry

| Trigger ID | Location (X, Y) | Radius | Action / Effect | State Impact |
|---|---|---|---|---|
| `jeep_stop` | `(5.0m, 0.0m)` | Automatic | Jeep halts; Rudhra steps out into control | Unlocks movement |
| `clue_canteen` | `(24.0m, 0.0m)` | 2.4m | Toast: "Discarded Military Canteen" | +15 XP |
| `clue_backpack` | `(31.0m, 0.0m)` | 2.4m | Toast: "Abandoned Rucksack" | +15 XP |
| `target_vikram` | `(38.0m, 0.0m)` | 2.4m | Launches Vikram dialogue sequence | Locks movement, opens dialogue box |
| `item_ancient_map` | `(34.0m, 0.0m)` | 2.4m | Collects map, opens inspection modal | +30 XP, unlocks journal, updates objective |
| `gap_pit` | `(63.0m, 0.0m)` | 2.0m | Traversal gap; requires jump | Falling triggers checkpoint restore |
| `temple_entrance` | `(82.0m, 0.0m)` | 2.5m | Unloads Prelude, loads ForgottenSanctumLevel | Transitions to Sequence 6/7 interior |

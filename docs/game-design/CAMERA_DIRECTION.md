# GlobeTrotter: The Lost Relic — Camera Direction & Cinematography

## 1. Cinematic Hybrid Philosophy

The primary camera maintains a responsive side-scrolling perspective that supports immediate, readable left-to-right gameplay, smoothly expanding into dramatic 3D cinematic framings to reveal environment scale, monumental architecture, and narrative milestones.

The camera never obstructs gameplay: precision jumping, hazard visibility, and landing targets always take precedence.

---

## 2. Four Logical Camera Modes

### Mode A: Gameplay Tracking (Default)
- **Framing**: Smooth horizontal tracking with directional lead (+2.5m ahead in player facing direction) to anticipate hazards and terrain.
- **Damping**: Spherical linear interpolation with lerp factor `0.08` for organic inertia without motion sickness.
- **Vertical Clamping**: Clamped to keep platforms and ground planes readable without disorienting vertical hops.
- **FOV**: Fixed 50° perspective for cinematic depth without fisheye edge distortion.

### Mode B: Establishing Shot
- **Usage**: Scene openings, arrival sequences, and initial reveals of grand spaces (e.g. Jeep approach in Sequence 1, facade entrance in Sequence 6).
- **Framing**: Elevated wide shot (`Z: 18m to 22m`, `Y: 3.5m to 5.0m`) capturing foreground silhouettes, middle-ground subject, and expansive backdrop.
- **Transition**: Smooth 3.2s to 3.6s ease-in-out curve into Mode A tracking.

### Mode C: Cinematic Reveal
- **Usage**:
  - Sequence 1: Vehicle arrival and braking.
  - Sequence 3: Bounty confrontation standoff.
  - Sequence 4: Map discovery inspection.
  - Sequence 11: 6-Beat Progressive Sanctum Awakening.
- **Pacing**: Deliberate camera movement directed along architectural lines; returns control cleanly to the player immediately upon conclusion.

### Mode D: Precision Traversal
- **Usage**: Narrow bridges, crumbling platform chains, and spike chasm crossings (e.g. Sequence 12 Chasm Crossing).
- **Framing**: Stabilized horizontal orientation, reduced vertical motion, and camera distance locked to ensure both the takeoff ledge and landing platform remain completely in view.

---

## 3. Transition Rules & Control Hand-off

1. **Uninterrupted Return of Control**: Cinematics must always restore keyboard and game state cleanly.
2. **Skip Option**: Any extended sequence provides an instant `[Space / E / Esc]` skip that snaps camera and player to valid grounded coordinates.
3. **No Blind Jumps**: Camera never positions landing surfaces outside the active viewport.
4. **Collision Clipping Prevention**: Camera path geometry maintains a minimum 2.5m buffer from ceiling and wall colliders.

# RUDHRA 3D CHARACTER MODEL SPECIFICATION & INTEGRATION GUIDE
## GlobeTrotter: The Lost Relic

### 1. Protagonist Visual Identity
- **Character Name:** Rudhra
- **Role:** Protagonist, archaeological explorer & treasure hunter
- **Aesthetic:** Rugged, cinematic Indian adventurer inspired by ancient Indian epics, Varanasi temple expedition lore, and Tollywood adventure heroes.
- **Visual Features:** Weathered explorer fedora hat, long wavy dark hair, full beard, open leather jacket with stitched pockets and brass buttons, terracotta/rust-red field scarf, pale expedition shirt, leather cross-body strap with field satchel, earthy olive cargo trousers, oiled leather combat boots, and handheld antique brass expedition lantern.

---

### 2. Available Model Assets & Hierarchy

The project provides two production-grade character assets:

| File Path | Description | Format | Vertices / Tris | Skeletons / Rig |
|---|---|---|---|---|
| `public/assets/characters/rudhra_pbr_hero.glb` | **Active Primary Character Asset:** Isolated high-fidelity PBR hero figure extracted from `base_basic_pbr.glb` | glTF 2.0 Binary (18.5 MB) | 136,207 verts / 183,152 tris | Static mesh; driven by Three.js procedural bipedal kinematics |
| `public/assets/characters/rudhra.glb` | **Rollback / Fallback Asset:** Full-rigged procedural character with 6 skeletal animation clips | glTF 2.0 Binary (195 KB) | 3,378 verts / 58 nodes | Hierarchical bone rig with 6 clips: idle, walk, run, jump, crouch, interact |
| `public/assets/characters/rudhra_procedural_backup.glb` | Verified pristine copy of `rudhra.glb` | glTF 2.0 Binary (195 KB) | 3,378 verts | Identical to `rudhra.glb` |

---

### 3. PBR Hero Isolation & Export Methodology (`rudhra_pbr_hero.glb`)

#### Source Candidate Inspection
The input candidate `base_basic_pbr.glb` (28.53 MB, 374,015 vertices, 500,000 triangles) is a photogrammetric / 3D neural reconstruction of a 5-figure 2D concept turnaround lineup:
- **Figure 1 (Intended Hero):** Far-left figure with handheld lantern in right hand, facing front. Bounds: $X \in [-0.900\text{m}, -0.3591\text{m}]$, $Y \in [0.00\text{m}, 1.1717\text{m}]$.
- **Figures 2–5 (Turnaround Duplicates):** Four turnaround duplicates located at $X \ge -0.2930\text{m}$, floating at $Y \ge 0.26\text{m}$.
- **Clearance Gap:** A 6.6 cm empty topological clearance exists between $X = -0.3591\text{m}$ and $X = -0.2930\text{m}$ where no vertices, edges, or triangles exist.

#### Isolation Script (`scripts/export_rudhra_hero.py`)
- Python glTF binary chunk parser reads `base_basic_pbr.glb` without requiring external 3D DCC tools or headless WebGL/Canvas dependencies.
- Filters all triangles whose vertices lie within the Hero envelope ($X < -0.34\text{m}$), collecting exactly 136,207 vertices and 183,152 triangles.
- Recalculates bounding box:
  - Width: 0.7605m
  - Height: 1.6500m (scaled by $1.40817\times$ to align with player collision cylinder)
  - Depth: 0.3392m
  - Feet grounded flush at $Y = 0.0000\text{m}$.
- Extracts and embeds the original bit-exact 2048x2048 PBR texture maps directly into the GLB binary buffer:
  - `texture_diffuse.png` (4.88 MB)
  - `texture_normal.png` (4.23 MB)
  - `texture_metallic-texture_roughness.png` (2.83 MB)

---

### 4. Animation Strategy & Motion Handling

#### Honest Rigging Assessment
- `base_basic_pbr.glb` contains **0 bones** and **0 skeletal animation clips**.
- Attempting automatic deformation without an articulated skeleton causes severe geometric tearing and crushing around complex clothing folds and lantern straps.
- In accordance with project instructions, **we do not pretend that rotating the entire character mesh constitutes skeletal animation**.

#### Procedural Bipedal Kinematics Implementation
In [RudhraPlayer.ts](file:///c:/Users/Pardhu/Downloads/globetrotter_visual_pass%20(2)/globetrotter/src/three/RudhraPlayer.ts), the static PBR hero is driven by safe, physically responsive bipedal kinematics:
1. **Yaw Facing Alignment:** Smooth lerp rotation to $\pm\pi/2$ upon traversal direction changes (smoothing factor 0.22).
2. **Smooth Crouch Compression:** Dynamic scale lerp to $Y = 0.58$ when pressing C, reducing player height from $1.65\text{m}$ to $0.95\text{m}$ to effortlessly clear $1.20\text{m}$ low stone tunnels.
3. **Cadence Bob & Lateral Sway:** Velocity-synchronized sinusoidal vertical bobbing ($10\text{Hz}$ run / $14\text{Hz}$ sprint) and subtle lateral hip shift.
4. **Acceleration Pitch Lean:** Dynamic forward pitch tilt into running velocity (up to $0.08\text{rad}$).
5. **Airborne Jump & Falling Tilt:** Pitch tilt responding to vertical velocity $v_y$ during jump rise and fall.
6. **Idle Respiration:** Subtle breathing oscillation ($2.2\text{Hz}$, $0.008\text{m}$ amplitude).

---

### 5. Handheld Lantern Integration & Subterranean Lighting

#### Handheld Position
The lantern is physically integrated into the right hand of the hero mesh at local position:
$$(-0.299\text{m}, 0.704\text{m}, 0.050\text{m})$$
relative to the model center.

#### Lighting Architecture
- **Lantern Light Anchor (`PBR_Lantern_Anchor`):** Parented to the model at the lantern coordinate.
- **Dynamic Point Light:** 3.6 intensity, 18.0m range, warm amber hue (`0xff9933`).
- **Internal Cage Shadowing Solution:** In dense PBR photogrammetric meshes, placing a point light inside the metal lantern cage caused extreme self-shadowing blotches across Rudhra's torso and face. By disabling self-shadow on the lantern point light (`lanternLight.castShadow = false`) and offsetting the emitter $+0.05\text{m}$ forward, light emanates smoothly into the temple environment.
- **Dielectric Clothing Tuning:** In subterranean ambient darkness, metallic PBR maps default to black reflections without cubemaps. Materials are configured with dielectric parameters (`metalness = 0.12`, `roughness = 0.80`), allowing leather, twill, and skin to respond naturally to torchlight and sunlight shafts.
- **Chest Fill Light:** A soft warm fill light (`0xffa533`, intensity 1.5, radius 3.5m) illuminates the beard, jacket lapels, and rust-red scarf.

---

### 6. Verification & Automated Audits
- `npm test`: 55+ audits pass cleanly with 0 failures, including automated Three.js `GLTFLoader` geometry and bounds verification (`scripts/validate-hero-glb.ts`).
- `npm run build`: Production bundle compiles with 0 errors in 1.17s.
- In-game live capture: [06_rudhra_pbr_hero_ingame.png](file:///c:/Users/Pardhu/Downloads/globetrotter_visual_pass%20(2)/globetrotter/public/screenshots/06_rudhra_pbr_hero_ingame.png) demonstrates Rudhra standing before the illuminated Sanskrit niche scripture inside the dark underground temple.

# GlobeTrotter: The Lost Relic — Visual Bible & Art Direction

## 1. Artistic Identity: Stylized-Realistic Cinematic 3D

GlobeTrotter marries real, detailed 3D geometry with an illustrative, painterly finish inspired by classical Indian architecture, natural rock weathering, and cinematic atmospheric lighting.

### Core Visual Principles
- **No Flat Backgrounds**: Environments consist of layered 3D depth, parallax silhouettes, foreground framing columns, and distant atmospheric mist.
- **Silhouette & Composition**: Major traversal paths maintain crisp character readability against darker architectural backdrops.
- **Purposeful Lighting**: Illumination serves narrative and gameplay purposes. Exterior areas feature golden hour warmth; interior caverns remain naturally pitch black, making Rudhra's lantern essential.
- **Material Restraint**: Avoid saturated neons, plastic metallics, excessive ungrounded bloom, or jarring anachronisms.

---

## 2. Color Palette Direction

Inspired by ancient Indian sandstone, weathered bronze, jungle moss, and celestial pale gold:

| Element | Hex Code | Purpose & Application |
|---|---|---|
| **Warm Sandstone** | `#B77A45` | Primary structural stone blocks, steps, carved friezes |
| **Aged Earth Brown** | `#302820` | Shaded stonework, rich soil, deep weathered corners |
| **Subterranean Teal** | `#173D3B` | Atmospheric ambient cavern fill, distant abyssal fog |
| **Lantern Amber** | `#D99A43` | Dynamic lantern flame, torch fire, warm practical light |
| **Weathered Bronze** | `#66513A` | Astronomical gears, mechanism rings, antique vessels |
| **Jungle Moss** | `#646D43` | Overgrowth on damp pillars, banyan roots, foliage |
| **Celestial Pale Gold** | `#E8D4A0` | Surya-Chakra relic core, awakened glyphs, starlight shafts |

---

## 3. Architectural Grammar

The structures built by the ancient civilization maintain rigorous coherence across all scenes:

- **Monumental Rock-Cut Gateways**: Monolithic jambs with tiered corbelled lintels and lotus (*padma*) medallion borders.
- **Pillars & Mandapas**: Square base (*upapitha*), octagonal transition shaft, fluted capital (*kalasa*), and corbel brackets.
- **Relief Murals**: Deeply carved stone bas-reliefs illustrating solar processions, celestial diagrams, and protective guardians.
- **Apertures & Skylights**: Stepped roof shafts that admit shafts of light only when awakened by celestial alignments.
- **Overgrowth & Decay**: Banyan roots (*Ficus benghalensis*) penetrating masonry joints, moss accumulating in lower damp recesses, crumbling edge fractures from seismic age.

---

## 4. Lighting & Shading Pipeline

- **Tone Mapping**: ACES Filmic Tone Mapping with exposure tuned to 1.1 for cinematic contrast range.
- **Dynamic Shadows**: PCF Soft Shadows enabled across directional sunlight and key spotlights.
- **Lantern Lighting**: Dynamic point light centered on Rudhra's brass lantern with custom GLSL attenuation, illuminating murals and reveal shaders as Rudhra approaches.
- **Atmospheric Fog**:
  - Outdoor Prelude: `THREE.FogExp2(0x3a5068, 0.006)` (golden hour haze).
  - Subterranean Sanctum: `THREE.FogExp2(0x020408, 0.028)` (dense cavern dark mist).

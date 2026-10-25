import * as THREE from 'three';

export interface MuralDefinition {
  id: string;
  epic: 'Ramayana' | 'Mahabharata';
  title: string;
  sanskritTitle: string;
  description: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
}

export class MuralSystem {
  public group: THREE.Group;
  private muralMaterials: THREE.ShaderMaterial[] = [];
  public murals: { mesh: THREE.Mesh; def: MuralDefinition; material: THREE.ShaderMaterial }[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Ramayana_Mahabharata_Murals_Group';
  }

  // ── Create Dynamic Lantern-Illuminated Mural ──────────────────────────────
  public createMural(def: MuralDefinition) {
    let texture: THREE.Texture;
    if (typeof document !== 'undefined') {
      const canvas = this.generateMuralCanvas(def);
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    } else {
      const data = new Uint8Array([50, 40, 30, 255, 60, 50, 40, 255, 40, 30, 20, 255, 55, 45, 35, 255]);
      texture = new THREE.DataTexture(data, 2, 2, THREE.RGBAFormat);
      texture.needsUpdate = true;
    }

    // Custom Dynamic Lantern Illumination Shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: texture },
        uLanternPos: { value: new THREE.Vector3(0, 0, 0) },
        uLanternRange: { value: 8.5 },
        uLanternIntensity: { value: 3.8 },
        uBaseDarkness: { value: 0.02 }, // Cavern darkness when light is away
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        uniform sampler2D tDiffuse;
        uniform vec3 uLanternPos;
        uniform float uLanternRange;
        uniform float uLanternIntensity;
        uniform float uBaseDarkness;

        void main() {
          vec4 texColor = texture2D(tDiffuse, vUv);

          // Distance from this point on the mural to Rudhra's moving lantern
          float dist = length(vWorldPosition - uLanternPos);

          // Hermite smoothstep attenuation curve
          float normDist = clamp(dist / uLanternRange, 0.0, 1.0);
          float atten = 1.0 - normDist;
          atten = atten * atten * (3.0 - 2.0 * atten); // Smooth cubic ease

          // In darkness, mural is virtually invisible ancient plaster.
          // In lantern light, rich mineral pigments, gold ochres and Sanskrit emerge!
          float illumination = uBaseDarkness + atten * uLanternIntensity * 0.38;

          // Warm amber candlelight tint (2800K glow)
          vec3 warmAmber = vec3(1.06, 0.94, 0.82);
          vec3 litColor = texColor.rgb * illumination * warmAmber;

          gl_FragColor = vec4(litColor, 1.0);
        }
      `,
      side: THREE.FrontSide,
      depthWrite: true,
    });

    const geometry = new THREE.PlaneGeometry(def.width, def.height);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(def.x, def.y, def.z);
    mesh.name = `Mural_${def.id}`;

    // Stone Border Frame around the mural
    const frameGeo = new THREE.BoxGeometry(def.width + 0.28, def.height + 0.28, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3a2e22,
      roughness: 0.92,
      metalness: 0.08,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(def.x, def.y, def.z - 0.06);
    this.group.add(frameMesh);

    this.group.add(mesh);
    this.muralMaterials.push(material);
    this.murals.push({ mesh, def, material });
  }

  // ── Update Lantern Position Every Frame ───────────────────────────────────
  public updateLanternIllumination(lanternWorldPos: THREE.Vector3, isLanternActive: boolean) {
    const intensity = isLanternActive ? 3.8 : 0.0;
    for (const mat of this.muralMaterials) {
      mat.uniforms.uLanternPos.value.copy(lanternWorldPos);
      mat.uniforms.uLanternIntensity.value = intensity;
    }
  }

  // ── Procedural Antique Mineral Fresco Canvas Generator ────────────────────
  private generateMuralCanvas(def: MuralDefinition): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    // 1. Aged Sandstone Plaster Base
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 400);
    bgGrad.addColorStop(0, '#2d2218');
    bgGrad.addColorStop(0.5, '#3b2f23');
    bgGrad.addColorStop(1, '#281e15');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 400);

    // Subtle stone craquelure noise
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * 640;
      const ry = Math.random() * 400;
      ctx.fillRect(rx, ry, Math.random() * 60 + 20, 2);
    }

    // 2. Ornate Ancient Indian Frieze Border
    ctx.strokeStyle = '#9e7d3b';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 608, 368);

    ctx.strokeStyle = '#5a2216';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 592, 352);

    // Corner Lotus Motifs
    const corners = [
      [36, 36],
      [604, 36],
      [36, 364],
      [604, 364],
    ];
    ctx.fillStyle = '#b88939';
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Central Painted Scene Based on Epic Episode
    if (def.id === 'mural_ramayana_forest') {
      this.drawRamaForestScene(ctx);
    } else if (def.id === 'mural_hanuman_leap') {
      this.drawHanumanLeapScene(ctx);
    } else if (def.id === 'mural_rama_setu') {
      this.drawRamaSetuScene(ctx);
    } else if (def.id === 'mural_gita_chariot') {
      this.drawKrishnaArjunaChariotScene(ctx);
    } else if (def.id === 'mural_arjuna_gandiva') {
      this.drawArjunaGandivaScene(ctx);
    } else {
      this.drawGenericTempleMural(ctx, def);
    }

    // 4. Header Sanskrit Inscription in Weathered Gold
    ctx.fillStyle = 'rgba(230, 195, 110, 0.92)';
    ctx.font = 'bold 22px "Cinzel", "Noto Sans Devanagari", serif';
    ctx.textAlign = 'center';
    ctx.fillText(def.sanskritTitle, 320, 60);

    // 5. English Subtitle & Epic Label
    ctx.fillStyle = 'rgba(200, 175, 130, 0.75)';
    ctx.font = '13px "Cinzel", sans-serif';
    ctx.fillText(`${def.epic.toUpperCase()} · ${def.title}`, 320, 84);

    return canvas;
  }

  // ── Scene 1: Rama, Sita and Lakshmana in Dandakaranya ─────────────────────
  private drawRamaForestScene(ctx: CanvasRenderingContext2D) {
    // Ancient banyan foliage silhouettes
    ctx.fillStyle = '#1e2b1d';
    ctx.beginPath();
    ctx.arc(140, 220, 70, 0, Math.PI * 2);
    ctx.arc(220, 180, 80, 0, Math.PI * 2);
    ctx.arc(500, 200, 75, 0, Math.PI * 2);
    ctx.fill();

    // Sacred deer silhouette in forest glade
    ctx.fillStyle = '#b8863b';
    ctx.beginPath();
    ctx.ellipse(470, 280, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Deer antlers
    ctx.strokeStyle = '#c49545';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(485, 270);
    ctx.lineTo(495, 245);
    ctx.lineTo(505, 238);
    ctx.stroke();

    // Three Hero Silhouettes (Lakshmana, Sita, Rama)
    // 1. Lakshmana with bow (left)
    this.drawEpicFigure(ctx, 230, 230, '#853222', '#c29344', true);

    // 2. Sita in saffron-red silk (center)
    this.drawEpicFigure(ctx, 310, 235, '#a63a26', '#d9a84e', false);

    // 3. Sri Rama with Kodanda bow & quivered arrows (right)
    this.drawEpicFigure(ctx, 390, 225, '#2b4d36', '#d4af37', true);

    // Lotus pond in foreground
    ctx.fillStyle = '#223838';
    ctx.fillRect(80, 310, 480, 35);
    ctx.fillStyle = '#bd5338';
    for (let l = 0; l < 4; l++) {
      ctx.beginPath();
      ctx.ellipse(140 + l * 90, 325, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Scene 2: Hanuman's Ocean Leap to Lanka ────────────────────────────────
  private drawHanumanLeapScene(ctx: CanvasRenderingContext2D) {
    // Ocean waves (stylized Ajanta waves)
    ctx.fillStyle = '#1b333a';
    ctx.fillRect(50, 270, 540, 75);

    ctx.strokeStyle = '#3d6770';
    ctx.lineWidth = 3;
    for (let w = 0; w < 6; w++) {
      ctx.beginPath();
      ctx.arc(90 + w * 85, 275, 26, Math.PI, 0);
      ctx.stroke();
    }

    // Distant Golden Lanka Peak (right)
    ctx.fillStyle = '#9e782f';
    ctx.beginPath();
    ctx.moveTo(480, 270);
    ctx.lineTo(540, 160);
    ctx.lineTo(600, 270);
    ctx.closePath();
    ctx.fill();

    // Sri Hanuman leaping through celestial clouds with golden mace
    ctx.fillStyle = '#b84628';
    ctx.beginPath();
    ctx.ellipse(300, 180, 38, 22, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Devotion Aura (Golden halo)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(330, 160, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Gada (Golden Mace) in hand
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(275, 205);
    ctx.lineTo(240, 235);
    ctx.stroke();
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(235, 240, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Scene 3: The Building of Rama Setu Causeway ───────────────────────────
  private drawRamaSetuScene(ctx: CanvasRenderingContext2D) {
    // Vast ocean backdrop
    ctx.fillStyle = '#182b33';
    ctx.fillRect(50, 220, 540, 125);

    // Monumental stone causeway spanning the ocean
    ctx.fillStyle = '#5c4835';
    ctx.beginPath();
    ctx.moveTo(60, 320);
    ctx.lineTo(280, 270);
    ctx.lineTo(580, 250);
    ctx.lineTo(580, 280);
    ctx.lineTo(280, 305);
    ctx.lineTo(60, 345);
    ctx.closePath();
    ctx.fill();

    // Floating inscribed rocks with Sri Rama's sacred name
    const stones = [
      [140, 300],
      [220, 280],
      [310, 265],
      [400, 255],
      [480, 248],
    ];
    for (const [sx, sy] of stones) {
      ctx.fillStyle = '#8a7052';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('राम', sx, sy + 3);
    }

    // Vanara builders on bridge
    this.drawEpicFigure(ctx, 190, 250, '#9e462b', '#b57a36', false);
    this.drawEpicFigure(ctx, 360, 230, '#8c3c23', '#b57a36', false);
  }

  // ── Scene 4: Krishna & Arjuna on the Chariot (Gitopadesha) ─────────────────
  private drawKrishnaArjunaChariotScene(ctx: CanvasRenderingContext2D) {
    // Golden Kurukshetra Battlefield Chariot
    ctx.fillStyle = '#a6802e';
    // Chariot body
    ctx.fillRect(240, 230, 140, 60);

    // Great Chariot Wheel (16 spokes)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(310, 290, 35, 0, Math.PI * 2);
    ctx.stroke();

    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(310 - Math.cos(a) * 35, 290 - Math.sin(a) * 35);
      ctx.lineTo(310 + Math.cos(a) * 35, 290 + Math.sin(a) * 35);
      ctx.stroke();
    }

    // Four White Celestial Horses (left)
    ctx.fillStyle = '#dcd6c8';
    for (let h = 0; h < 3; h++) {
      ctx.beginPath();
      ctx.ellipse(150 + h * 25, 260, 30, 16, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Divine Charioteer: Bhagavan Sri Krishna holding the reins (dark blue halo)
    ctx.fillStyle = '#1b3b5c'; // Shyamala Varna (cloud dark complexion)
    ctx.beginPath();
    ctx.arc(280, 210, 16, 0, Math.PI * 2);
    ctx.fill();
    // Peacock feather crown
    ctx.fillStyle = '#1f8558';
    ctx.beginPath();
    ctx.arc(280, 190, 7, 0, Math.PI * 2);
    ctx.fill();
    // Golden Halo
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(280, 205, 25, 0, Math.PI * 2);
    ctx.stroke();

    // Arjuna seated in contemplation listening with folded hands
    ctx.fillStyle = '#a84c2a';
    ctx.beginPath();
    ctx.arc(350, 220, 15, 0, Math.PI * 2);
    ctx.fill();

    // Hanuman Flag on Chariot Mast
    ctx.strokeStyle = '#b58333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(375, 230);
    ctx.lineTo(375, 130);
    ctx.stroke();

    ctx.fillStyle = '#c23b23';
    ctx.beginPath();
    ctx.moveTo(375, 130);
    ctx.lineTo(435, 150);
    ctx.lineTo(375, 170);
    ctx.closePath();
    ctx.fill();
  }

  // ── Scene 5: Arjuna with the Celestial Gandiva Bow ────────────────────────
  private drawArjunaGandivaScene(ctx: CanvasRenderingContext2D) {
    // Solar radiance burst
    const sunGrad = ctx.createRadialGradient(320, 230, 10, 320, 230, 140);
    sunGrad.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(150, 100, 340, 260);

    // Arjuna heroic stance
    this.drawEpicFigure(ctx, 320, 220, '#8c3522', '#e6b54a', true);

    // Monumental Gandiva Bow arc
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(280, 230, 65, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(300, 170);
    ctx.lineTo(300, 290);
    ctx.stroke();
  }

  private drawGenericTempleMural(ctx: CanvasRenderingContext2D, def: MuralDefinition) {
    ctx.fillStyle = '#c49545';
    ctx.beginPath();
    ctx.arc(320, 230, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1410';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(def.title, 320, 235);
  }

  private drawEpicFigure(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    robeColor: string,
    goldColor: string,
    hasBow: boolean
  ) {
    // Head / Crown
    ctx.fillStyle = goldColor;
    ctx.beginPath();
    ctx.arc(x, y - 28, 12, 0, Math.PI * 2);
    ctx.fill();

    // Robe / Body
    ctx.fillStyle = robeColor;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 14);
    ctx.lineTo(x + 14, y - 14);
    ctx.lineTo(x + 22, y + 55);
    ctx.lineTo(x - 22, y + 55);
    ctx.closePath();
    ctx.fill();

    // Gold sash & ornaments
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 10);
    ctx.lineTo(x + 14, y + 25);
    ctx.stroke();

    // Bow if warrior
    if (hasBow) {
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x - 18, y + 10, 35, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }
  }
}

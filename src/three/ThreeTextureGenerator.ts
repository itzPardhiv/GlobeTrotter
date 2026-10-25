/**
 * ThreeTextureGenerator.ts — GlobeTrotter: The Lost Relic
 * 
 * High-resolution procedural texture pipeline for 3D environments,
 * archaeological architecture, expedition vehicles, and natural terrain.
 * Runs in browser and gracefully provides fallback DataTextures in Node tests.
 */

import * as THREE from 'three';

export class ThreeTextureGenerator {
  private static cache: Map<string, THREE.Texture> = new Map();

  /** Helper to create or retrieve cached canvas texture */
  private static getOrCreate(
    key: string,
    width: number,
    height: number,
    drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  ): THREE.Texture {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (typeof document === 'undefined') {
      // Safe fallback for Node.js / unit tests
      const data = new Uint8Array([120, 100, 80, 255, 140, 120, 95, 255, 100, 85, 65, 255, 130, 110, 85, 255]);
      const tex = new THREE.DataTexture(data, 2, 2, THREE.RGBAFormat);
      tex.needsUpdate = true;
      this.cache.set(key, tex);
      return tex;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const tex = new THREE.Texture();
      this.cache.set(key, tex);
      return tex;
    }

    drawFn(ctx, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    this.cache.set(key, texture);
    return texture;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DIRT ROAD & EXPEDITION TRAIL
  // ═══════════════════════════════════════════════════════════════════════════

  public static getDirtRoadTexture(): THREE.Texture {
    return this.getOrCreate('dirt_road_diffuse', 1024, 512, (ctx, w, h) => {
      // Base earth gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#4a3b2a');
      grad.addColorStop(0.15, '#6a543e');
      grad.addColorStop(0.5, '#7d644b');
      grad.addColorStop(0.85, '#6a543e');
      grad.addColorStop(1, '#4a3b2a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Fine soil grain noise
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const noise = (Math.random() - 0.5) * 35;
        d[i] = Math.min(255, Math.max(0, d[i] + noise));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.85));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.65));
      }
      ctx.putImageData(imgData, 0, 0);

      // Vehicle tire tread impressions (two parallel ruts)
      const tireTracksY = [h * 0.32, h * 0.68];
      tireTracksY.forEach((trackY) => {
        // Darker compacted soil band
        const rutGrad = ctx.createLinearGradient(0, trackY - 35, 0, trackY + 35);
        rutGrad.addColorStop(0, 'rgba(45, 32, 20, 0)');
        rutGrad.addColorStop(0.3, 'rgba(40, 28, 16, 0.45)');
        rutGrad.addColorStop(0.7, 'rgba(40, 28, 16, 0.45)');
        rutGrad.addColorStop(1, 'rgba(45, 32, 20, 0)');
        ctx.fillStyle = rutGrad;
        ctx.fillRect(0, trackY - 35, w, 70);

        // Chevron / knobby tread marks along the rut
        ctx.strokeStyle = 'rgba(25, 18, 10, 0.35)';
        ctx.lineWidth = 3.5;
        for (let x = 0; x < w; x += 18) {
          ctx.beginPath();
          ctx.moveTo(x, trackY - 18);
          ctx.lineTo(x + 10, trackY);
          ctx.lineTo(x, trackY + 18);
          ctx.stroke();
        }
      });

      // Scattered pebbles and small gravel
      for (let p = 0; p < 350; p++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const pr = 1.2 + Math.random() * 3.5;
        const shade = 70 + Math.random() * 80;
        ctx.fillStyle = `rgb(${shade + 20}, ${shade + 10}, ${shade})`;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        // Pebble highlight
        ctx.fillStyle = 'rgba(255, 230, 200, 0.25)';
        ctx.beginPath();
        ctx.arc(px - 0.5, py - 0.5, pr * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Grassy verges at the outer edges
      const edgeGrassColors = ['#3d4d2a', '#4a5d32', '#2f3b1f'];
      for (let e = 0; e < 250; e++) {
        const side = Math.random() < 0.5 ? 0 : 1;
        const gx = Math.random() * w;
        const gy = side === 0 ? Math.random() * 45 : h - Math.random() * 45;
        ctx.fillStyle = edgeGrassColors[Math.floor(Math.random() * edgeGrassColors.length)];
        ctx.beginPath();
        ctx.ellipse(gx, gy, 8 + Math.random() * 12, 3 + Math.random() * 5, Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. WILDERNESS TERRAIN & SOIL
  // ═══════════════════════════════════════════════════════════════════════════

  public static getWildernessGroundTexture(): THREE.Texture {
    return this.getOrCreate('wilderness_ground_diffuse', 512, 512, (ctx, w, h) => {
      // Natural Deccan wilderness earth
      ctx.fillStyle = '#4e3f2d';
      ctx.fillRect(0, 0, w, h);

      // Noise grain
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 40;
        d[i] = Math.min(255, Math.max(0, d[i] + n));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n * 0.9));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n * 0.6));
      }
      ctx.putImageData(imgData, 0, 0);

      // Dried grass tufts & moss splotches
      const patches = 180;
      for (let i = 0; i < patches; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 6 + Math.random() * 18;
        const isMoss = Math.random() < 0.55;
        ctx.fillStyle = isMoss
          ? `rgba(${45 + Math.random() * 20}, ${65 + Math.random() * 25}, ${30 + Math.random() * 15}, 0.6)`
          : `rgba(${90 + Math.random() * 30}, ${75 + Math.random() * 20}, ${45 + Math.random() * 15}, 0.5)`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ANCIENT CARVED SANDSTONE & TEMPLE ARCHITECTURE
  // ═══════════════════════════════════════════════════════════════════════════

  public static getCarvedSandstoneTexture(): THREE.Texture {
    return this.getOrCreate('carved_sandstone_diffuse', 512, 512, (ctx, w, h) => {
      // Rich warm golden sandstone base
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#aa7e52');
      grad.addColorStop(0.5, '#b98b5e');
      grad.addColorStop(1, '#9b7147');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sedimentary horizontal strata layers
      for (let y = 0; y < h; y += 12 + Math.random() * 8) {
        ctx.fillStyle = `rgba(${50 + Math.random() * 20}, ${35 + Math.random() * 15}, ${20 + Math.random() * 10}, 0.22)`;
        ctx.fillRect(0, y, w, 2.5 + Math.random() * 3);
      }

      // Carved Indian Architectural Band / Frieze
      // Upper border: Lotus petal dentils
      ctx.fillStyle = 'rgba(60, 40, 20, 0.45)';
      ctx.fillRect(0, 30, w, 4);
      ctx.fillRect(0, 75, w, 4);
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.arc(x + 12, 52, 9, 0, Math.PI);
        ctx.fillStyle = 'rgba(70, 48, 25, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(230, 200, 160, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Center decorative Surya (Sun) disc motif
      for (let x = 40; x < w; x += 128) {
        // Outer carved solar disc
        ctx.strokeStyle = 'rgba(60, 42, 22, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, 256, 32, 0, Math.PI * 2);
        ctx.stroke();

        // Radiant petal rays
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * 32, 256 + Math.sin(a) * 32);
          ctx.lineTo(x + Math.cos(a) * 44, 256 + Math.sin(a) * 44);
          ctx.stroke();
        }

        // Inner lotus core
        ctx.fillStyle = 'rgba(90, 60, 30, 0.35)';
        ctx.beginPath();
        ctx.arc(x, 256, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lower border: Stepped Adhishthana plinth molding
      ctx.fillStyle = 'rgba(50, 32, 16, 0.45)';
      ctx.fillRect(0, h - 70, w, 6);
      ctx.fillRect(0, h - 35, w, 8);

      // Weathered moss in carved crevices
      for (let m = 0; m < 90; m++) {
        const mx = Math.random() * w;
        const my = Math.random() * h;
        ctx.fillStyle = 'rgba(55, 75, 35, 0.35)';
        ctx.beginPath();
        ctx.arc(mx, my, 4 + Math.random() * 12, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. WEATHERED BANYAN & SAL TREE BARK
  // ═══════════════════════════════════════════════════════════════════════════

  public static getTreeBarkTexture(): THREE.Texture {
    return this.getOrCreate('tree_bark_diffuse', 256, 512, (ctx, w, h) => {
      ctx.fillStyle = '#3a2818';
      ctx.fillRect(0, 0, w, h);

      // Deep vertical bark grooves
      for (let x = 0; x < w; x += 4 + Math.random() * 6) {
        ctx.strokeStyle = Math.random() < 0.5 ? '#24170d' : '#4d3722';
        ctx.lineWidth = 1.5 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        let cx = x;
        for (let y = 0; y < h; y += 40) {
          cx += (Math.random() - 0.5) * 6;
          ctx.lineTo(cx, y);
        }
        ctx.stroke();
      }

      // Lichen & moss patches
      for (let i = 0; i < 40; i++) {
        const lx = Math.random() * w;
        const ly = Math.random() * h;
        ctx.fillStyle = 'rgba(75, 95, 50, 0.35)';
        ctx.beginPath();
        ctx.ellipse(lx, ly, 4 + Math.random() * 8, 8 + Math.random() * 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. JEEP BODY ENAMEL & WEATHERING
  // ═══════════════════════════════════════════════════════════════════════════

  public static getJeepEnamelTexture(): THREE.Texture {
    return this.getOrCreate('jeep_enamel_diffuse', 512, 512, (ctx, w, h) => {
      // Expedition military olive-drab base
      ctx.fillStyle = '#3e4a32';
      ctx.fillRect(0, 0, w, h);

      // Subtle metallic highlight gradient
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.12)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Rivets along panel seam lines
      ctx.fillStyle = '#283020';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let y = 15; y < h; y += 32) {
        ctx.beginPath();
        ctx.arc(20, y, 2.5, 0, Math.PI * 2);
        ctx.arc(w - 20, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Lower mud and dirt spatter
      for (let s = 0; s < 120; s++) {
        const sx = Math.random() * w;
        const sy = h - Math.random() * (h * 0.45);
        ctx.fillStyle = 'rgba(95, 75, 48, 0.55)';
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. OFF-ROAD TREADED TIRE RUBBER
  // ═══════════════════════════════════════════════════════════════════════════

  public static getJeepTireTexture(): THREE.Texture {
    return this.getOrCreate('jeep_tire_diffuse', 256, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1c1e20';
      ctx.fillRect(0, 0, w, h);

      // Heavy knobby tire tread pattern
      ctx.fillStyle = '#121315';
      ctx.strokeStyle = '#2d3035';
      ctx.lineWidth = 2;

      for (let y = 0; y < h; y += 28) {
        // Center lug
        ctx.fillRect(w * 0.35, y, w * 0.3, 16);
        ctx.strokeRect(w * 0.35, y, w * 0.3, 16);

        // Left & right staggered shoulder lugs
        const offset = y % 56 === 0 ? 0 : 14;
        ctx.fillRect(w * 0.05, y + offset, w * 0.22, 14);
        ctx.strokeRect(w * 0.05, y + offset, w * 0.22, 14);
        ctx.fillRect(w * 0.73, y + offset, w * 0.22, 14);
        ctx.strokeRect(w * 0.73, y + offset, w * 0.22, 14);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EXPEDITION CANVAS TENT
  // ═══════════════════════════════════════════════════════════════════════════

  public static getCanvasTentTexture(): THREE.Texture {
    return this.getOrCreate('canvas_tent_diffuse', 512, 512, (ctx, w, h) => {
      // Natural weatherproof expedition canvas
      ctx.fillStyle = '#8f7e65';
      ctx.fillRect(0, 0, w, h);

      // Fine canvas weave
      ctx.strokeStyle = 'rgba(70, 58, 42, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Reinforcement webbing seams
      ctx.strokeStyle = '#63533e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();

      // Brass grommets along edges
      ctx.fillStyle = '#b89445';
      for (let x = 20; x < w; x += 60) {
        ctx.beginPath();
        ctx.arc(x, 15, 4, 0, Math.PI * 2);
        ctx.arc(x, h - 15, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. SUSPENSION BRIDGE WEATHERED WOOD
  // ═══════════════════════════════════════════════════════════════════════════

  public static getBridgeWoodTexture(): THREE.Texture {
    return this.getOrCreate('bridge_wood_diffuse', 512, 256, (ctx, w, h) => {
      // Weathered river teak planks
      ctx.fillStyle = '#523f2b';
      ctx.fillRect(0, 0, w, h);

      // Horizontal wood grain
      for (let y = 0; y < h; y += 3 + Math.random() * 4) {
        ctx.strokeStyle = Math.random() < 0.5 ? '#3a2b1c' : '#6b533a';
        ctx.lineWidth = 1 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (Math.random() - 0.5) * 4);
        ctx.stroke();
      }

      // Iron nail heads on plank ends
      ctx.fillStyle = '#26221e';
      for (let x of [25, w - 25]) {
        for (let y = 20; y < h; y += 45) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ANCIENT TREASURE MAP PARCHMENT
  // ═══════════════════════════════════════════════════════════════════════════

  public static getTreasureMapTexture(): THREE.Texture {
    return this.getOrCreate('treasure_map_diffuse', 1024, 768, (ctx, w, h) => {
      // Aged, weathered parchment with burned/charred edges
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.65);
      bgGrad.addColorStop(0, '#f2dcb6');
      bgGrad.addColorStop(0.65, '#dfc194');
      bgGrad.addColorStop(0.88, '#b88f58');
      bgGrad.addColorStop(1, '#5a3a1a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Stains, water rings, and foxing
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 10 + Math.random() * 45;
        ctx.fillStyle = `rgba(${130 + Math.random() * 40}, ${90 + Math.random() * 30}, ${50 + Math.random() * 20}, ${0.08 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Decorative double border
      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, w - 60, h - 60);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(38, 38, w - 76, h - 76);

      // Cartographic mountain ridges (hand-drawn pen style)
      ctx.strokeStyle = '#4a2c14';
      ctx.lineWidth = 2;
      for (let m = 0; m < 15; m++) {
        const mx = 120 + m * 55;
        const my = 280 + Math.sin(m * 0.8) * 60;
        ctx.beginPath();
        ctx.moveTo(mx - 25, my + 30);
        ctx.lineTo(mx, my);
        ctx.lineTo(mx + 25, my + 30);
        ctx.stroke();

        // Shading lines on mountain slope
        for (let s = 5; s <= 25; s += 5) {
          ctx.beginPath();
          ctx.moveTo(mx + s * 0.7, my + s);
          ctx.lineTo(mx + s, my + s * 1.2);
          ctx.stroke();
        }
      }

      // Winding river (Chambal / Betwa tributary)
      ctx.strokeStyle = '#385868';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(80, 520);
      ctx.bezierCurveTo(280, 480, 380, 580, 550, 510);
      ctx.bezierCurveTo(720, 440, 800, 460, 950, 410);
      ctx.stroke();

      // Sacred Dig-mandala Compass Rose
      const cx = 830;
      const cy = 180;
      const cr = 65;
      ctx.strokeStyle = '#7c2818';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal points (N, S, E, W)
      const points = [
        { label: 'उत्तर (N)', dx: 0, dy: -cr - 8 },
        { label: 'पूर्व (E)', dx: cr + 14, dy: 5 },
        { label: 'दक्षिण (S)', dx: 0, dy: cr + 18 },
        { label: 'पश्चिम (W)', dx: -cr - 24, dy: 5 },
      ];
      ctx.font = 'bold 13px serif';
      ctx.fillStyle = '#6b1c10';
      ctx.textAlign = 'center';
      points.forEach((p) => ctx.fillText(p.label, cx + p.dx, cy + p.dy));

      // 8-pointed compass star
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const len = i % 2 === 0 ? cr * 0.88 : cr * 0.52;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.strokeStyle = i % 2 === 0 ? '#7c2818' : '#a85830';
        ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
        ctx.stroke();
      }

      // Prominent Temple Destination Marker (Surya Mandala)
      const tx = 680;
      const ty = 340;
      ctx.strokeStyle = '#c02418';
      ctx.fillStyle = 'rgba(218, 50, 30, 0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tx, ty, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red 'X'
      ctx.strokeStyle = '#a81c10';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx - 18, ty - 18);
      ctx.lineTo(tx + 18, ty + 18);
      ctx.moveTo(tx + 18, ty - 18);
      ctx.lineTo(tx - 18, ty + 18);
      ctx.stroke();

      // Ancient Inscriptions & Coordinates
      ctx.font = 'bold 22px serif';
      ctx.fillStyle = '#4a2412';
      ctx.textAlign = 'left';
      ctx.fillText('॥ सुवर्ण कोटि कोश ॥ · THE SACRED SOLAR MANDALA', 80, 85);

      ctx.font = 'italic 16px serif';
      ctx.fillStyle = '#6b361a';
      ctx.fillText('Legend of One Billion Gold Coins · Deccan Ridge Expedition', 80, 115);

      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#8a2012';
      ctx.fillText('COORDINATES: 24°18\'N 82°45\'E', 80, 145);

      ctx.font = '14px serif';
      ctx.fillStyle = '#4a2e1c';
      ctx.fillText('WARNING: Beyond the chasm lies the Surya Gate. The treasure is guarded by eternal mechanisms.', 80, h - 70);
    });
  }
}

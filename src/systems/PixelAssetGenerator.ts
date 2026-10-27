import Phaser from 'phaser';

export class PixelAssetGenerator {
  public static generateAll(scene: Phaser.Scene) {
    if (scene.textures.exists('rudhra_sheet')) return;

    this.generateRudhraSpriteSheet(scene);
    this.generateJeepTextures(scene);
    this.generateEnvironmentTiles(scene);
    this.generateToranaGateway(scene);
    this.generatePuzzleDials(scene);
    this.generateProps(scene);
    this.generateParallaxLayers(scene);
    this.generateParticleTextures(scene);
  }

  // ── 1. RUDHRA CHARACTER SPRITESHEET (32x48 per frame, 26 frames total) ────
  private static generateRudhraSpriteSheet(scene: Phaser.Scene) {
    const fw = 32;
    const fh = 48;
    const frameCount = 26;
    const canvas = document.createElement('canvas');
    canvas.width = fw * frameCount;
    canvas.height = fh;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Palette for Rudhra (Varanasi / Telugu Cinema Leading-Man Explorer Aesthetic - Fair Complexion)
    const colSkin = '#e8be94'; // Fair, warm-neutral Indian complexion with peach and golden undertones
    const colSkinShadow = '#be8a58'; // Deep jaw, nose contour, and neck shadow
    const colSkinHighlight = '#f4d1a6'; // Subtle peach-golden cheekbone, forehead, and nose highlight
    const colHair = '#1c130d'; // Deep dark wavy hair
    const colHairHighlight = '#3a271a'; // Hair volume highlights
    const colBeard = '#160e08'; // Groomed full beard and moustache
    const colEye = '#0e0703'; // Deep-set dark brown eyes
    const colShirt = '#d5c4a1'; // Khaki-cream inner expedition shirt
    const colVest = '#826543'; // Weathered khaki-tan adventurer vest
    const colVestShadow = '#5c4328';
    const colVestPocket = '#6a4e30';
    const colJacket = colVest;
    const colJacketShadow = colVestShadow;
    const colPants = '#42533c'; // Olive utility cargo trousers
    const colPantsShadow = '#2d3b28';
    const colBoots = '#2a1c12'; // Dark laced leather boots
    const colSatchel = '#4c2e17'; // Cross-body leather satchel strap
    const colScarf = '#8f2018'; // Deep crimson explorer neckerchief
    const colBrass = '#d8a834'; // Brass buckle & lantern fittings
    const colLanternGlass = '#ffc848';

    for (let f = 0; f < frameCount; f++) {
      const ox = f * fw;
      ctx.save();
      ctx.translate(ox, 0);

      // Animation frame variations
      let bob = 0;
      let legL = 0;
      let legR = 0;
      let armL = 0;
      let armR = 0;
      let crouchY = 0;

      if (f >= 0 && f <= 3) {
        // Idle (4 frames: breathing)
        bob = f === 1 || f === 2 ? 1 : 0;
      } else if (f >= 4 && f <= 9) {
        // Walk (6 frames)
        const step = f - 4;
        bob = (step % 3 === 1) ? 1 : 0;
        legL = Math.sin((step / 6) * Math.PI * 2) * 5;
        legR = -legL;
        armL = -legL * 0.8;
        armR = legL * 0.5;
      } else if (f >= 10 && f <= 15) {
        // Sprint (6 frames)
        const step = f - 10;
        bob = (step % 3 === 1) ? 2 : 0;
        legL = Math.sin((step / 6) * Math.PI * 2) * 9;
        legR = -legL;
        armL = -legL * 1.2;
        armR = legL * 0.8;
      } else if (f === 16) {
        // Jump Ascent
        bob = -2;
        legL = -3;
        legR = -4;
        armL = -5;
        armR = -3;
      } else if (f === 17) {
        // Jump Apex
        bob = -1;
        legL = 0;
        legR = 0;
        armL = -3;
        armR = -2;
      } else if (f === 18) {
        // Jump Fall
        bob = 0;
        legL = 2;
        legR = 3;
        armL = -1;
        armR = 1;
      } else if (f === 19) {
        // Jump Land
        bob = 3;
        legL = 1;
        legR = 1;
      } else if (f === 20 || f === 21) {
        // Crouch
        crouchY = 8;
        bob = f === 21 ? 1 : 0;
      } else if (f === 22 || f === 23) {
        // Interact / Examine
        armL = -7;
        armR = -4;
      } else if (f >= 24) {
        // Place Artifact
        armL = -5;
        armR = -8;
      }

      const yBase = 12 + bob + crouchY;

      // ── LEGS & BOOTS ───────────────────────────────────────────────────────
      // Left leg
      ctx.fillStyle = colPants;
      ctx.fillRect(11 + legL * 0.5, yBase + 18, 4, 10 - crouchY * 0.5);
      ctx.fillStyle = colPantsShadow;
      ctx.fillRect(10 + legL * 0.5, yBase + 21, 2, 4); // Cargo pocket
      ctx.fillStyle = colBoots;
      ctx.fillRect(10 + legL * 0.6, yBase + 28 - crouchY * 0.5, 6, 4);

      // Right leg
      ctx.fillStyle = colPantsShadow;
      ctx.fillRect(17 + legR * 0.5, yBase + 18, 4, 10 - crouchY * 0.5);
      ctx.fillStyle = colBoots;
      ctx.fillRect(16 + legR * 0.6, yBase + 28 - crouchY * 0.5, 6, 4);

      // ── TORSO, SHIRT & ADVENTURER VEST ─────────────────────────────────────
      // Inner rolled-sleeve expedition shirt
      ctx.fillStyle = colShirt;
      ctx.fillRect(12, yBase + 7, 8, 12);

      // Khaki-tan expedition vest with pockets
      ctx.fillStyle = colVestShadow;
      ctx.fillRect(10, yBase + 8, 12, 11);
      ctx.fillStyle = colVest;
      ctx.fillRect(10, yBase + 8, 3, 11); // Left vest flap
      ctx.fillRect(19, yBase + 8, 3, 11); // Right vest flap
      ctx.fillRect(11, yBase + 16, 10, 3); // Vest lower hem
      ctx.fillStyle = colVestPocket;
      ctx.fillRect(10, yBase + 11, 2, 3); // Vest pocket L
      ctx.fillRect(20, yBase + 11, 2, 3); // Vest pocket R

      // Satchel strap (diagonal across torso)
      ctx.fillStyle = colSatchel;
      ctx.fillRect(12, yBase + 8, 2, 9);
      ctx.fillStyle = colBrass;
      ctx.fillRect(13, yBase + 13, 3, 3); // Brass buckle

      // Crimson expedition scarf
      ctx.fillStyle = colScarf;
      ctx.fillRect(13, yBase + 6, 6, 2);
      ctx.fillRect(14, yBase + 8, 2, 3); // Scarf knot

      // ── HEAD, FACIAL REFINEMENT & WAVY WINDSWEPT HAIR ──────────────────────
      // Voluminous dark wavy hair background / back curls
      ctx.fillStyle = colHair;
      ctx.fillRect(9, yBase - 2, 13, 8); // Hair mass
      ctx.fillStyle = colHairHighlight;
      ctx.fillRect(10, yBase - 3, 10, 2); // Top volume highlight
      ctx.fillRect(8, yBase, 2, 6); // Left flowing locks
      ctx.fillRect(7, yBase + 3, 2, 4); // Back neck curls

      // Chiseled face structure & fair Indian skin tone with peach-golden undertone
      ctx.fillStyle = colSkin;
      ctx.fillRect(12, yBase + 1, 8, 7);
      ctx.fillStyle = colSkinHighlight;
      ctx.fillRect(14, yBase + 2, 4, 3); // Forehead / cheekbone light
      ctx.fillStyle = colSkinShadow;
      ctx.fillRect(12, yBase + 6, 2, 2); // Jaw shadow

      // Expressive dark eyes & strong brows
      ctx.fillStyle = colHair;
      ctx.fillRect(15, yBase + 2, 4, 1); // Natural strong eyebrow
      ctx.fillStyle = colEye;
      ctx.fillRect(16, yBase + 3, 2, 1); // Deep-set dark brown eye
      ctx.fillStyle = colSkinShadow;
      ctx.fillRect(18, yBase + 3, 2, 2); // Defined nose bridge

      // Well-groomed full beard and moustache
      ctx.fillStyle = colBeard;
      ctx.fillRect(14, yBase + 5, 5, 1); // Moustache
      ctx.fillRect(12, yBase + 6, 8, 2); // Full jaw beard
      ctx.fillRect(14, yBase + 8, 4, 1); // Chin tuft

      // Windswept hair locks framing forehead
      ctx.fillStyle = colHair;
      ctx.fillRect(13, yBase - 2, 2, 2);

      // ── ARMS & LANTERN ─────────────────────────────────────────────────────
      // Left arm (swings naturally)
      ctx.fillStyle = colJacket;
      ctx.fillRect(8 + armL * 0.4, yBase + 9, 3, 9);
      ctx.fillStyle = colSkin;
      ctx.fillRect(8 + armL * 0.5, yBase + 17, 3, 3);

      // Right arm (holds handheld lantern)
      ctx.fillStyle = colJacketShadow;
      ctx.fillRect(20 + armR * 0.3, yBase + 9, 3, 8);
      ctx.fillStyle = colSkin;
      ctx.fillRect(21 + armR * 0.4, yBase + 16, 3, 3);

      // Lantern attached to right hand
      const lanternX = 21 + armR * 0.5;
      const lanternY = yBase + 18;
      ctx.fillStyle = colBrass;
      ctx.fillRect(lanternX, lanternY, 5, 2); // Cap
      ctx.fillStyle = colLanternGlass;
      ctx.fillRect(lanternX, lanternY + 2, 5, 4); // Glowing glass
      ctx.fillStyle = colBrass;
      ctx.fillRect(lanternX, lanternY + 6, 5, 2); // Base

      // Artifact in hand for placement frames (f >= 24)
      if (f >= 24) {
        ctx.fillStyle = '#ffb700';
        ctx.beginPath();
        ctx.arc(26, yBase + 14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(25, yBase + 13, 2, 2); // Solar gleam
      }

      ctx.restore();
    }

    scene.textures.addSpriteSheet('rudhra_sheet', canvas, {
      frameWidth: fw,
      frameHeight: fh,
    });
  }

  // ── 2. EXPEDITION JEEP & WHEEL TEXTURES ─────────────────────────────────────
  private static generateJeepTextures(scene: Phaser.Scene) {
    // 1. Jeep Body (110x55)
    const bodyCanvas = document.createElement('canvas');
    bodyCanvas.width = 110;
    bodyCanvas.height = 55;
    const bCtx = bodyCanvas.getContext('2d')!;
    bCtx.imageSmoothingEnabled = false;

    // Main Chassis Body (Khaki green)
    bCtx.fillStyle = '#3a4a32';
    bCtx.fillRect(15, 22, 85, 20);
    bCtx.fillStyle = '#2d3b26'; // Shadow crease
    bCtx.fillRect(15, 36, 85, 6);

    // Front Hood & Grill
    bCtx.fillStyle = '#45563c';
    bCtx.fillRect(78, 24, 24, 14);
    bCtx.fillStyle = '#1c2217';
    bCtx.fillRect(100, 26, 4, 12); // Front radiator grill
    bCtx.fillStyle = '#e8a834';
    bCtx.fillRect(94, 34, 4, 2); // Side amber reflector

    // Windshield & Safari Roll Cage
    bCtx.fillStyle = '#182015'; // Roll bars
    bCtx.fillRect(32, 4, 4, 20); // Rear upright
    bCtx.fillRect(72, 4, 4, 20); // Front upright
    bCtx.fillRect(32, 4, 44, 4);  // Roof rail

    // Tinted windshield glass
    bCtx.fillStyle = '#6d8e9e';
    bCtx.fillRect(68, 10, 6, 14);
    bCtx.fillStyle = '#a6cde0';
    bCtx.fillRect(70, 12, 2, 8); // Glass reflection highlight

    // Driver silhouette inside cabin
    bCtx.fillStyle = '#e8be94'; // Fair Indian skin tone
    bCtx.fillRect(48, 12, 6, 6);
    bCtx.fillStyle = '#1c130d'; // Wavy dark hair
    bCtx.fillRect(44, 9, 14, 4);
    bCtx.fillRect(43, 11, 4, 6); // Flowing hair locks

    // Roof Rack & Expedition Cargo
    bCtx.fillStyle = '#221a12';
    bCtx.fillRect(28, 0, 48, 4); // Roof basket
    bCtx.fillStyle = '#6a4e2c';
    bCtx.fillRect(32, -6 + 6, 14, 8); // Wooden crate 1
    bCtx.fillStyle = '#8a3424';
    bCtx.fillRect(48, -6 + 6, 12, 8); // Red expedition kit
    bCtx.fillStyle = '#9e8c68';
    bCtx.fillRect(62, -4 + 6, 12, 6); // Rolled canvas

    // Front Headlights
    bCtx.fillStyle = '#fff4cc';
    bCtx.fillRect(102, 26, 3, 5); // Right headlight
    bCtx.fillRect(102, 33, 3, 5); // Left headlight

    // Rear Spare Tire
    bCtx.fillStyle = '#1e2024';
    bCtx.fillRect(8, 20, 8, 16);
    bCtx.fillStyle = '#c89632';
    bCtx.fillRect(10, 24, 4, 8);

    // Front Steel Winch & Number Plate
    bCtx.fillStyle = '#22252a';
    bCtx.fillRect(103, 37, 6, 4);
    bCtx.fillStyle = '#f0c034';
    bCtx.fillRect(101, 39, 4, 2); // License plate

    scene.textures.addCanvas('jeep_body', bodyCanvas);

    // 2. Jeep Wheel (28x28)
    const wheelCanvas = document.createElement('canvas');
    wheelCanvas.width = 28;
    wheelCanvas.height = 28;
    const wCtx = wheelCanvas.getContext('2d')!;
    wCtx.imageSmoothingEnabled = false;

    // Outer rugged mud tire
    wCtx.fillStyle = '#1a1d22';
    wCtx.beginPath();
    wCtx.arc(14, 14, 13, 0, Math.PI * 2);
    wCtx.fill();

    // Tread knobbies
    wCtx.fillStyle = '#2b3038';
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      wCtx.fillRect(14 + Math.cos(ang) * 11 - 2, 14 + Math.sin(ang) * 11 - 2, 4, 4);
    }

    // Brass rim & hub
    wCtx.fillStyle = '#c89632';
    wCtx.beginPath();
    wCtx.arc(14, 14, 7, 0, Math.PI * 2);
    wCtx.fill();
    wCtx.fillStyle = '#111316';
    wCtx.beginPath();
    wCtx.arc(14, 14, 3, 0, Math.PI * 2);
    wCtx.fill();

    scene.textures.addCanvas('jeep_wheel', wheelCanvas);
  }

  // ── 3. ENVIRONMENT TILESETS (Jungle & Ancient Sandstone Ruins) ─────────────
  private static generateEnvironmentTiles(scene: Phaser.Scene) {
    // 1. Jungle Ground / Platform Tile (32x32)
    const jungleCanvas = document.createElement('canvas');
    jungleCanvas.width = 32;
    jungleCanvas.height = 32;
    const jCtx = jungleCanvas.getContext('2d')!;
    jCtx.imageSmoothingEnabled = false;

    // Weathered soil & moss
    jCtx.fillStyle = '#3a2b1d';
    jCtx.fillRect(0, 0, 32, 32);
    jCtx.fillStyle = '#261b11';
    jCtx.fillRect(0, 16, 32, 16);

    // Green moss & grass top layer
    jCtx.fillStyle = '#3a582c';
    jCtx.fillRect(0, 0, 32, 6);
    jCtx.fillStyle = '#5c8a3e';
    for (let x = 0; x < 32; x += 4) {
      jCtx.fillRect(x, 0, 2, (x % 3 === 0) ? 8 : 5);
    }
    // Soil pebbles
    jCtx.fillStyle = '#64523c';
    jCtx.fillRect(6, 12, 3, 2);
    jCtx.fillRect(20, 22, 4, 3);
    jCtx.fillRect(14, 26, 2, 2);

    scene.textures.addCanvas('tile_jungle_ground', jungleCanvas);

    // 2. Ancient Carved Temple Block (32x32)
    const ruinCanvas = document.createElement('canvas');
    ruinCanvas.width = 32;
    ruinCanvas.height = 32;
    const rCtx = ruinCanvas.getContext('2d')!;
    rCtx.imageSmoothingEnabled = false;

    // Sandstone block
    rCtx.fillStyle = '#9c7b4c';
    rCtx.fillRect(0, 0, 32, 32);
    rCtx.fillStyle = '#7a5e38'; // Shadow border
    rCtx.strokeRect(0.5, 0.5, 31, 31);
    rCtx.fillStyle = '#ba945e'; // Highlight bevel
    rCtx.fillRect(1, 1, 30, 2);
    rCtx.fillRect(1, 1, 2, 30);

    // Ancient carved relief lines
    rCtx.fillStyle = '#5c4526';
    rCtx.fillRect(4, 8, 24, 2);
    rCtx.fillRect(4, 22, 24, 2);
    rCtx.fillRect(14, 10, 4, 12); // Center lotus motif block

    scene.textures.addCanvas('tile_ruins_block', ruinCanvas);

    // 3. Ancient Wooden / Rope Bridge Plank (48x16)
    const bridgeCanvas = document.createElement('canvas');
    bridgeCanvas.width = 48;
    bridgeCanvas.height = 16;
    const bCtx = bridgeCanvas.getContext('2d')!;
    bCtx.imageSmoothingEnabled = false;

    bCtx.fillStyle = '#543b22';
    bCtx.fillRect(0, 2, 48, 12);
    bCtx.fillStyle = '#725130';
    bCtx.fillRect(2, 4, 44, 4); // Wood grain
    bCtx.fillStyle = '#2d1e11'; // Planking gaps & nails
    bCtx.fillRect(15, 2, 2, 12);
    bCtx.fillRect(31, 2, 2, 12);
    bCtx.fillStyle = '#a88544'; // Rope binding edge
    bCtx.fillRect(0, 0, 4, 16);
    bCtx.fillRect(44, 0, 4, 16);

    scene.textures.addCanvas('tile_bridge_plank', bridgeCanvas);
  }

  // ── 4. MONUMENTAL TORANA GATEWAY (160x180) ─────────────────────────────────
  private static generateToranaGateway(scene: Phaser.Scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Pillar Bases (Left & Right)
    ctx.fillStyle = '#5e482c';
    ctx.fillRect(12, 130, 28, 50); // Left base
    ctx.fillRect(120, 130, 28, 50); // Right base

    // Dvarapala Guardian Sculptures on Base
    ctx.fillStyle = '#8e6c42';
    ctx.fillRect(18, 136, 16, 38);
    ctx.fillRect(126, 136, 16, 38);
    ctx.fillStyle = '#d4af37'; // Guardian crowns & weapons
    ctx.fillRect(20, 138, 12, 4);
    ctx.fillRect(128, 138, 12, 4);

    // Fluted Vertical Pillars
    ctx.fillStyle = '#9e7b4e';
    ctx.fillRect(16, 40, 20, 90);
    ctx.fillRect(124, 40, 20, 90);
    ctx.fillStyle = '#785b34'; // Fluting grooves
    for (let y = 42; y < 130; y += 8) {
      ctx.fillRect(18, y, 16, 2);
      ctx.fillRect(126, y, 16, 2);
    }

    // Capital Bracket Figures (Makaras / Yali)
    ctx.fillStyle = '#b08b58';
    ctx.fillRect(6, 32, 34, 10);
    ctx.fillRect(120, 32, 34, 10);

    // Three Multi-Tiered Horizontal Architraves (Carved Beams)
    const tiers = [
      { y: 22, h: 8, w: 154, x: 3 },
      { y: 12, h: 7, w: 148, x: 6 },
      { y: 2, h: 8, w: 140, x: 10 },
    ];

    tiers.forEach((t) => {
      ctx.fillStyle = '#ba9560';
      ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.fillStyle = '#7a5a32';
      ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1);
      // Carved rosettes
      ctx.fillStyle = '#ffd54f';
      for (let rx = t.x + 14; rx < t.x + t.w - 14; rx += 20) {
        ctx.beginPath();
        ctx.arc(rx, t.y + t.h / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Central Sacred Sun Medallion (Surya Disc)
    ctx.fillStyle = '#e8a834';
    ctx.beginPath();
    ctx.arc(80, 18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff099';
    ctx.beginPath();
    ctx.arc(80, 18, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Inscription Plaque (Mundaka Upanishad 3.1.6 lintel)
    ctx.fillStyle = '#221910';
    ctx.fillRect(48, 25, 64, 14);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(52, 28, 56, 2); // Sanskrit inscription lines representation
    ctx.fillRect(56, 33, 48, 2);

    scene.textures.addCanvas('torana_gateway', canvas);
  }

  // ── 5. SURYA-CHAKRA PUZZLE DIALS (54x54 each) ──────────────────────────────
  private static generatePuzzleDials(scene: Phaser.Scene) {
    const dialTypes = ['sun', 'lotus', 'trishula'];

    dialTypes.forEach((type) => {
      const canvas = document.createElement('canvas');
      canvas.width = 54;
      canvas.height = 54;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Outer Bronze Gear Wheel
      ctx.fillStyle = '#724e2c';
      ctx.beginPath();
      ctx.arc(27, 27, 25, 0, Math.PI * 2);
      ctx.fill();

      // Outer notches
      ctx.fillStyle = '#3a2414';
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        ctx.fillRect(27 + Math.cos(ang) * 22 - 2, 27 + Math.sin(ang) * 22 - 2, 4, 4);
      }

      // Middle Ring
      ctx.fillStyle = '#9c6f3e';
      ctx.beginPath();
      ctx.arc(27, 27, 20, 0, Math.PI * 2);
      ctx.fill();

      // Center disc
      ctx.fillStyle = '#281a10';
      ctx.beginPath();
      ctx.arc(27, 27, 14, 0, Math.PI * 2);
      ctx.fill();

      // Emblem in Center
      ctx.fillStyle = '#ffd700';
      if (type === 'sun') {
        // Surya Sun Disc with 8 rays
        ctx.beginPath();
        ctx.arc(27, 27, 6, 0, Math.PI * 2);
        ctx.fill();
        for (let r = 0; r < 8; r++) {
          const ang = (r / 8) * Math.PI * 2;
          ctx.fillRect(27 + Math.cos(ang) * 9 - 1, 27 + Math.sin(ang) * 9 - 1, 3, 3);
        }
      } else if (type === 'lotus') {
        // Padma Lotus (8 petals)
        for (let p = 0; p < 8; p++) {
          const ang = (p / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(27 + Math.cos(ang) * 7, 27 + Math.sin(ang) * 7, 3, 6, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(27, 27, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Trishula (Divine Trident)
        ctx.fillRect(26, 17, 3, 18); // Center prong
        ctx.fillRect(21, 20, 2, 10); // Left prong
        ctx.fillRect(31, 20, 2, 10); // Right prong
        ctx.fillRect(21, 28, 12, 2); // Crossbar
      }

      // Indicator Gem at Top (Target marker)
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(27, 4, 3, 0, Math.PI * 2);
      ctx.fill();

      scene.textures.addCanvas(`puzzle_dial_${type}`, canvas);
    });
  }

  // ── 6. PROPS & INTERACTIVE OBJECTS ─────────────────────────────────────────
  private static generateProps(scene: Phaser.Scene) {
    // 1. Torch Wall Sconce (20x36)
    const torchCanvas = document.createElement('canvas');
    torchCanvas.width = 20;
    torchCanvas.height = 36;
    const tCtx = torchCanvas.getContext('2d')!;
    tCtx.imageSmoothingEnabled = false;

    // Iron wall bracket
    tCtx.fillStyle = '#1c1f24';
    tCtx.fillRect(2, 14, 8, 4); // Wall mount
    tCtx.fillRect(8, 10, 4, 18); // Arm
    tCtx.fillStyle = '#543b22';
    tCtx.fillRect(7, 6, 6, 8); // Wooden torch handle
    tCtx.fillStyle = '#22160d';
    tCtx.fillRect(6, 4, 8, 4); // Cloth soaked cup

    // Glowing Flame
    tCtx.fillStyle = '#ff781e';
    tCtx.beginPath();
    tCtx.arc(10, 5, 5, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.fillStyle = '#ffe066';
    tCtx.beginPath();
    tCtx.arc(10, 4, 2.5, 0, Math.PI * 2);
    tCtx.fill();

    scene.textures.addCanvas('prop_torch_sconce', torchCanvas);

    // 2. Sanskrit Stone Tablet (44x56)
    const tabCanvas = document.createElement('canvas');
    tabCanvas.width = 44;
    tabCanvas.height = 56;
    const sCtx = tabCanvas.getContext('2d')!;
    sCtx.imageSmoothingEnabled = false;

    sCtx.fillStyle = '#6e563a';
    sCtx.fillRect(2, 2, 40, 52);
    sCtx.fillStyle = '#483622';
    sCtx.strokeRect(2.5, 2.5, 39, 51);
    sCtx.fillStyle = '#ffd54f';
    // Carved script lines
    for (let y = 10; y < 48; y += 7) {
      sCtx.fillRect(8, y, 28, 2);
    }
    // Sacred om / lotus header
    sCtx.fillStyle = '#ff9900';
    sCtx.fillRect(19, 5, 6, 3);

    scene.textures.addCanvas('prop_sanskrit_tablet', tabCanvas);

    // 3. Campsite Tent & Fire (80x50)
    const campCanvas = document.createElement('canvas');
    campCanvas.width = 80;
    campCanvas.height = 50;
    const cCtx = campCanvas.getContext('2d')!;
    cCtx.imageSmoothingEnabled = false;

    // A-frame canvas tent
    cCtx.fillStyle = '#a68c64';
    cCtx.beginPath();
    cCtx.moveTo(25, 12);
    cCtx.lineTo(5, 46);
    cCtx.lineTo(55, 46);
    cCtx.closePath();
    cCtx.fill();

    cCtx.fillStyle = '#281a10'; // Tent interior opening
    cCtx.beginPath();
    cCtx.moveTo(25, 16);
    cCtx.lineTo(18, 46);
    cCtx.lineTo(34, 46);
    cCtx.closePath();
    cCtx.fill();

    // Campfire ring & embers
    cCtx.fillStyle = '#444850'; // Stones
    for (let r = 0; r < 6; r++) {
      const ang = (r / 6) * Math.PI * 2;
      cCtx.fillRect(66 + Math.cos(ang) * 8 - 2, 42 + Math.sin(ang) * 4 - 2, 4, 3);
    }
    cCtx.fillStyle = '#ff5500';
    cCtx.fillRect(64, 38, 5, 5); // Fire ember
    cCtx.fillStyle = '#ffcc00';
    cCtx.fillRect(65, 37, 3, 3);

    scene.textures.addCanvas('prop_campsite_tent', campCanvas);

    // 4. Carried Surya-Chakra Relic (28x28)
    const relicCanvas = document.createElement('canvas');
    relicCanvas.width = 28;
    relicCanvas.height = 28;
    const rCtx = relicCanvas.getContext('2d')!;
    rCtx.imageSmoothingEnabled = false;

    rCtx.fillStyle = '#dfaa34';
    rCtx.beginPath();
    rCtx.arc(14, 14, 11, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.fillStyle = '#8a5a2b';
    rCtx.beginPath();
    rCtx.arc(14, 14, 7, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.fillStyle = '#fff2a8';
    for (let r = 0; r < 8; r++) {
      const ang = (r / 8) * Math.PI * 2;
      rCtx.fillRect(14 + Math.cos(ang) * 11 - 1, 14 + Math.sin(ang) * 11 - 1, 3, 3);
    }
    scene.textures.addCanvas('prop_lost_relic', relicCanvas);

    // 5. Sliding Stone Vault Door (120x180)
    const doorCanvas = document.createElement('canvas');
    doorCanvas.width = 120;
    doorCanvas.height = 180;
    const dCtx = doorCanvas.getContext('2d')!;
    dCtx.imageSmoothingEnabled = false;

    dCtx.fillStyle = '#261f18';
    dCtx.fillRect(0, 0, 120, 180);
    dCtx.fillStyle = '#5c4832';
    dCtx.strokeRect(2.5, 2.5, 115, 175);

    // Celestial Lock Mandala Relief
    dCtx.fillStyle = '#c89632';
    dCtx.beginPath();
    dCtx.arc(60, 80, 42, 0, Math.PI * 2);
    dCtx.fill();
    dCtx.fillStyle = '#18120c';
    dCtx.beginPath();
    dCtx.arc(60, 80, 36, 0, Math.PI * 2);
    dCtx.fill();

    // Sanskrit Celestial Door Inscription
    dCtx.fillStyle = '#ffd700';
    dCtx.font = '16px serif';
    dCtx.textAlign = 'center';
    dCtx.fillText('॥ सूर्य चक्र ॥', 60, 86);

    scene.textures.addCanvas('prop_vault_door', doorCanvas);
  }

  // ── 7. PARALLAX BACKGROUND LAYERS (640x360 each) ───────────────────────────
  private static generateParallaxLayers(scene: Phaser.Scene) {
    // 1. Dawn Sky Horizon (640x360)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 640;
    skyCanvas.height = 360;
    const sCtx = skyCanvas.getContext('2d')!;
    const grad = sCtx.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, '#0d1322');     // Indigo space
    grad.addColorStop(0.35, '#241a34');  // Deep purple
    grad.addColorStop(0.65, '#5c2d32');  // Dawn crimson
    grad.addColorStop(0.85, '#b85e2e');  // Amber horizon
    grad.addColorStop(1.0, '#e8a846');   // Sunrise gold
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 640, 360);

    // Rising Sun Disc
    sCtx.fillStyle = '#fff4cc';
    sCtx.beginPath();
    sCtx.arc(420, 260, 24, 0, Math.PI * 2);
    sCtx.fill();

    scene.textures.addCanvas('bg_dawn_sky', skyCanvas);

    // 2. Distant Deccan Mountain Silhouettes (640x360)
    const mtnCanvas = document.createElement('canvas');
    mtnCanvas.width = 640;
    mtnCanvas.height = 360;
    const mCtx = mtnCanvas.getContext('2d')!;
    mCtx.fillStyle = '#1c1524';
    mCtx.beginPath();
    mCtx.moveTo(0, 360);
    mCtx.lineTo(0, 220);
    mCtx.lineTo(70, 180);
    mCtx.lineTo(130, 215);
    mCtx.lineTo(210, 160);
    mCtx.lineTo(280, 210);
    mCtx.lineTo(390, 140); // Highest peak
    mCtx.lineTo(460, 190);
    mCtx.lineTo(540, 165);
    mCtx.lineTo(640, 230);
    mCtx.lineTo(640, 360);
    mCtx.closePath();
    mCtx.fill();

    scene.textures.addCanvas('bg_distant_mountains', mtnCanvas);

    // 3. Middle Jungle Foothills with Morning Mist (640x360)
    const midCanvas = document.createElement('canvas');
    midCanvas.width = 640;
    midCanvas.height = 360;
    const mdCtx = midCanvas.getContext('2d')!;
    mdCtx.fillStyle = '#182420';
    mdCtx.beginPath();
    mdCtx.moveTo(0, 360);
    mdCtx.lineTo(0, 250);
    mdCtx.lineTo(110, 225);
    mdCtx.lineTo(240, 260);
    mdCtx.lineTo(360, 220);
    mdCtx.lineTo(500, 245);
    mdCtx.lineTo(640, 215);
    mdCtx.lineTo(640, 360);
    mdCtx.closePath();
    mdCtx.fill();

    // Morning mist ribbon
    mdCtx.fillStyle = 'rgba(215, 175, 130, 0.18)';
    mdCtx.fillRect(0, 240, 640, 25);

    scene.textures.addCanvas('bg_mid_hills', midCanvas);

    // 4. Subterranean Hypostyle Hall Background (640x360)
    const hallCanvas = document.createElement('canvas');
    hallCanvas.width = 640;
    hallCanvas.height = 360;
    const hCtx = hallCanvas.getContext('2d')!;
    // Ancient cavern ambient dark blue-grey gradient
    const hGrad = hCtx.createLinearGradient(0, 0, 0, 360);
    hGrad.addColorStop(0, '#060910');
    hGrad.addColorStop(0.5, '#0d131c');
    hGrad.addColorStop(1.0, '#141820');
    hCtx.fillStyle = hGrad;
    hCtx.fillRect(0, 0, 640, 360);

    // Colossal background hypostyle pillars
    hCtx.fillStyle = '#161c26';
    for (let px = 40; px < 640; px += 140) {
      hCtx.fillRect(px, 30, 36, 330);
      hCtx.fillRect(px - 8, 20, 52, 14); // Capitals
    }

    // High arched ceiling vaults
    hCtx.strokeStyle = '#222b38';
    hCtx.lineWidth = 4;
    for (let ax = 60; ax < 640; ax += 140) {
      hCtx.beginPath();
      hCtx.arc(ax + 40, 60, 48, Math.PI, 0);
      hCtx.stroke();
    }

    scene.textures.addCanvas('bg_hypostyle_hall', hallCanvas);
  }

  // ── 8. PARTICLE TEXTURES ───────────────────────────────────────────────────
  private static generateParticleTextures(scene: Phaser.Scene) {
    // 1. Dust Mote (4x4)
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 4;
    dCanvas.height = 4;
    const dCtx = dCanvas.getContext('2d')!;
    dCtx.fillStyle = 'rgba(235, 215, 180, 0.8)';
    dCtx.fillRect(1, 1, 2, 2);
    scene.textures.addCanvas('fx_dust', dCanvas);

    // 2. Fire Spark / Ember (4x4)
    const eCanvas = document.createElement('canvas');
    eCanvas.width = 4;
    eCanvas.height = 4;
    const eCtx = eCanvas.getContext('2d')!;
    eCtx.fillStyle = '#ff9922';
    eCtx.fillRect(1, 0, 2, 4);
    eCtx.fillStyle = '#ffffff';
    eCtx.fillRect(1, 1, 2, 2);
    scene.textures.addCanvas('fx_ember', eCanvas);

    // 3. Blue Sunlight Ray Mote (6x6)
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 6;
    rCanvas.height = 6;
    const rCtx = rCanvas.getContext('2d')!;
    rCtx.fillStyle = 'rgba(140, 200, 240, 0.7)';
    rCtx.beginPath();
    rCtx.arc(3, 3, 2.5, 0, Math.PI * 2);
    rCtx.fill();
    scene.textures.addCanvas('fx_sunbeam', rCanvas);
  }
}

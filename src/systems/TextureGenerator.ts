/**
 * GlobeTrotter: The Lost Relic - HD-2D Procedural Texture & Asset Pipeline
 * Generates rich, high-resolution illustrated game assets, character sprite sheets,
 * ancient temple architectures, golden Hindu deity statues, vehicles, and environmental fx.
 */

import Phaser from 'phaser';

export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene) {
    if (scene.textures.exists('explorer_sheet')) return;

    this.createExplorerSpriteSheet(scene);
    this.createEnemySpriteSheet(scene);
    this.createVehicleTextures(scene);
    this.createEnvironmentTextures(scene);
    this.createCollectiblesAndTraps(scene);
    this.createPuzzleTextures(scene);
    this.createGrandTempleTextures(scene);
    this.createParticlesAndFx(scene);
    this.createTunnelPanoramaTextures(scene);
  }

  /**
   * Generates a 64x64 multi-frame sprite sheet for the Explorer:
   * Frames 0-1: Idle breathing
   * Frames 2-5: Walk / Run cycle
   * Frame 6: Jump
   * Frame 7: Fall
   * Frame 8: Crouch
   * Frame 9: Shoot
   * Frame 10: Hurt
   */
  private static createExplorerSpriteSheet(scene: Phaser.Scene) {
    const frameW = 64;
    const frameH = 64;
    const frames = 11;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < frames; f++) {
      const ox = f * frameW;
      ctx.save();
      ctx.translate(ox, 0);

      // Animation offsets
      let legOffset = 0;
      let bobY = 0;
      let isCrouch = f === 8;
      let isJump = f === 6;
      let isFall = f === 7;
      let isShoot = f === 9;
      let isHurt = f === 10;

      if (f === 1) bobY = 1;
      if (f >= 2 && f <= 5) {
        legOffset = Math.sin(((f - 2) / 4) * Math.PI * 2) * 8;
        bobY = Math.abs(Math.cos(((f - 2) / 4) * Math.PI * 2)) * 3;
      }
      if (isCrouch) bobY = 10;
      if (isJump) { bobY = -4; legOffset = -5; }
      if (isFall) { bobY = 2; legOffset = 6; }

      const cx = 32;
      const cy = 34 + bobY;

      // Ground shadow
      if (!isJump) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, 59, 15, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. Boots & Cargo Pants (Rudhra: Olive Khaki field expedition wear)
      const bootL = isCrouch ? cy + 14 : 54 + (isJump ? -3 : 0);
      const bootR = isCrouch ? cy + 14 : 54 + (isJump ? -3 : 0);

      // Left leg
      ctx.fillStyle = '#525a42'; // Olive drab field expedition trousers
      ctx.fillRect(cx - 7 + (legOffset * 0.5), cy + 10, 5, isCrouch ? 8 : 12);
      ctx.fillStyle = '#3e2714'; // Laced leather archaeological trekking boots
      ctx.fillRect(cx - 8 + (legOffset * 0.5), bootL - 5, 7, 6);
      ctx.fillStyle = '#221408';
      ctx.fillRect(cx - 9 + (legOffset * 0.5), bootL - 1, 9, 2);

      // Right leg
      ctx.fillStyle = '#484f39';
      ctx.fillRect(cx + 2 - (legOffset * 0.5), cy + 10, 5, isCrouch ? 8 : 12);
      ctx.fillStyle = '#3e2714';
      ctx.fillRect(cx + 1 - (legOffset * 0.5), bootR - 5, 7, 6);
      ctx.fillStyle = '#221408';
      ctx.fillRect(cx + 1 - (legOffset * 0.5), bootR - 1, 9, 2);

      // Satchel Bag (Archaeological field messenger satchel on hip)
      ctx.fillStyle = '#4e2d13';
      ctx.fillRect(cx - 11, cy + 2, 7, 8);
      ctx.strokeStyle = '#2d1808';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 11, cy + 2, 7, 8);
      ctx.fillStyle = '#d4af37'; // Antique brass satchel clasp
      ctx.fillRect(cx - 8, cy + 5, 2, 2);

      // 2. Rugged Expedition Vest & Field Tunic
      ctx.fillStyle = '#483928'; // Weathered brown expedition field vest
      ctx.beginPath();
      ctx.roundRect(cx - 8, cy - 6, 16, 17, 3);
      ctx.fill();

      // Earthy khaki rolled-sleeve tunic
      ctx.fillStyle = '#d6c7b0';
      ctx.fillRect(cx - 3, cy - 6, 6, 8);

      // Rudhra's woven archaeological amulet cord
      ctx.strokeStyle = '#8b6528';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 3, 0, Math.PI);
      ctx.stroke();

      // Leather bandolier diagonal utility strap
      ctx.strokeStyle = '#2d1909';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 5);
      ctx.lineTo(cx + 5, cy + 8);
      ctx.stroke();

      // Belt with antique brass buckle
      ctx.fillStyle = '#24160c';
      ctx.fillRect(cx - 8, cy + 8, 16, 3);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(cx - 2, cy + 8, 4, 3);

      // 3. Head & Rugged Face (Rudhra: Original Indian Treasure Hunter)
      ctx.fillStyle = isHurt ? '#ff9999' : '#bd8654'; // Warm Indian skin tone
      ctx.beginPath();
      ctx.arc(cx, cy - 12, 7, 0, Math.PI * 2);
      ctx.fill();

      // Dark trimmed beard & rugged jawline
      ctx.fillStyle = '#1c130b';
      // Chin and jaw beard
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 6.5, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.fill();
      ctx.fillRect(cx - 5, cy - 11, 3, 4); // Sideburn
      ctx.fillRect(cx + 1, cy - 9, 4, 2);  // Stubble mustache
      // Dark focused eye & brow
      ctx.fillStyle = '#0f0905';
      ctx.fillRect(cx + 1, cy - 14, 3, 1.5); // Brow
      ctx.fillRect(cx + 2, cy - 13, 2, 2);   // Eye

      // 4. Rudhra's Long Wavy Hair (Original Indian Treasure Hunter)
      // Long dark wavy hair flowing over nape and shoulders
      ctx.fillStyle = '#170f08';
      // Forehead fringe & wave
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy - 17, 6, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Flowing wavy hair volume behind head and shoulders
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - 13, 5, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - 7, cy - 7, 4, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Wavy locks highlight
      ctx.fillStyle = '#2e1e12';
      ctx.fillRect(cx - 5, cy - 16, 2, 4);
      ctx.fillRect(cx - 8, cy - 11, 2, 5);
      // Archaeological leather hair-tie band
      ctx.fillStyle = '#7a5223';
      ctx.fillRect(cx - 7, cy - 14, 3, 2);

      // 5. Signature Brass Lantern (Held in hand or swinging)
      const lanternX = cx + 8 + (isShoot ? 12 : 0);
      const lanternY = cy + 4;
      // Brass handle & cap
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lanternX - 3, lanternY - 4, 6, 9);
      // Glowing warm oil flame mantle
      ctx.fillStyle = '#fff4a3';
      ctx.fillRect(lanternX - 2, lanternY - 2, 4, 5);
      // Radial halo around lantern
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(lanternX, lanternY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Arms & Weapon (if shooting)
      if (isShoot) {
        ctx.fillStyle = '#5c391e';
        ctx.fillRect(cx + 4, cy - 4, 14, 5);
        ctx.fillStyle = '#111'; // Revolver barrel
        ctx.fillRect(cx + 18, cy - 5, 7, 3);
        // Muzzle flash spark
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx + 27, cy - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#4f3018';
        ctx.fillRect(cx + 2 + (legOffset * 0.3), cy - 3, 5, 10);
        ctx.fillStyle = '#e2b38e'; // Hand
        ctx.fillRect(cx + 2 + (legOffset * 0.3), cy + 6, 4, 4);
      }

      ctx.restore();
    }

    scene.textures.addSpriteSheet('explorer_sheet', canvas as unknown as HTMLImageElement, {
      frameWidth: frameW,
      frameHeight: frameH,
    });
  }

  /**
   * Generates Enemy Mercenary / Temple Raider Sprite Sheet (64x64, 6 frames)
   * Frame 0: Idle, 1-2: Walk, 3: Aim/Shoot, 4: Hurt, 5: Defeated
   */
  private static createEnemySpriteSheet(scene: Phaser.Scene) {
    const frameW = 64;
    const frameH = 64;
    const frames = 6;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < frames; f++) {
      const ox = f * frameW;
      ctx.save();
      ctx.translate(ox, 0);

      const cx = 32;
      let cy = 34;
      let isWalk = f === 1 || f === 2;
      let isShoot = f === 3;
      let isHurt = f === 4;
      let isDead = f === 5;

      if (isDead) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.ellipse(cx, 58, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Collapsed figure
        ctx.fillStyle = '#222831';
        ctx.fillRect(cx - 16, 52, 28, 8);
        ctx.fillStyle = '#d43f3f';
        ctx.fillRect(cx + 12, 54, 4, 4);
        ctx.restore();
        continue;
      }

      let legWalk = isWalk ? (f === 1 ? 6 : -6) : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, 59, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tactical Pants & Boots
      ctx.fillStyle = '#1e242b';
      ctx.fillRect(cx - 6 + legWalk, cy + 10, 5, 12);
      ctx.fillRect(cx + 2 - legWalk, cy + 10, 5, 12);
      ctx.fillStyle = '#101317';
      ctx.fillRect(cx - 7 + legWalk, 54, 6, 5);
      ctx.fillRect(cx + 2 - legWalk, 54, 6, 5);

      // Body Armor / Vest
      ctx.fillStyle = isHurt ? '#ff4d4d' : '#2d3748';
      ctx.beginPath();
      ctx.roundRect(cx - 8, cy - 6, 16, 16, 3);
      ctx.fill();
      // Ammo pouches
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(cx - 6, cy + 2, 4, 5);
      ctx.fillRect(cx + 2, cy + 2, 4, 5);

      // Head & Tactical Visor
      ctx.fillStyle = '#1a202c'; // Helmet
      ctx.beginPath();
      ctx.arc(cx, cy - 12, 7, 0, Math.PI * 2);
      ctx.fill();
      // Red Visor
      ctx.fillStyle = '#ff2a2a';
      ctx.fillRect(cx - 1, cy - 13, 5, 3);

      // Weapon
      if (isShoot) {
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 16, cy - 4, 18, 5); // Rifle barrel
        ctx.fillStyle = '#ff2222';
        ctx.beginPath();
        ctx.arc(cx - 18, cy - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 8, cy - 1, 10, 4);
      }

      ctx.restore();
    }

    scene.textures.addSpriteSheet('enemy_sheet', canvas as unknown as HTMLImageElement, {
      frameWidth: frameW,
      frameHeight: frameH,
    });
  }

  /**
   * Generates Expedition Jeep and Enemy Chase Trucks (Level 3)
   */
  private static createVehicleTextures(scene: Phaser.Scene) {
    // Player Expedition Jeep (140x70)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 140;
    pCanvas.height = 70;
    const pCtx = pCanvas.getContext('2d')!;

    // Jeep Body (Desert Khaki with Roll Cage and Gold Accents)
    pCtx.fillStyle = '#8b6f4e'; // Khaki body
    pCtx.beginPath();
    pCtx.roundRect(15, 25, 105, 26, 4);
    pCtx.fill();

    // Hood & Grill
    pCtx.fillStyle = '#5c4832';
    pCtx.fillRect(95, 30, 25, 18);
    pCtx.fillStyle = '#ffea75'; // Headlight
    pCtx.fillRect(118, 34, 4, 8);

    // Roll Cage
    pCtx.strokeStyle = '#222';
    pCtx.lineWidth = 4;
    pCtx.beginPath();
    pCtx.moveTo(30, 25);
    pCtx.lineTo(45, 8);
    pCtx.lineTo(85, 8);
    pCtx.lineTo(95, 25);
    pCtx.stroke();

    // Windshield
    pCtx.fillStyle = 'rgba(100, 200, 255, 0.4)';
    pCtx.beginPath();
    pCtx.moveTo(82, 10);
    pCtx.lineTo(94, 25);
    pCtx.lineTo(75, 25);
    pCtx.closePath();
    pCtx.fill();

    // Explorer sitting inside
    pCtx.fillStyle = '#7a4b27';
    pCtx.fillRect(52, 16, 12, 10);
    pCtx.fillStyle = '#4a2f1b'; // Hat
    pCtx.beginPath();
    pCtx.ellipse(58, 14, 8, 3, 0, 0, Math.PI * 2);
    pCtx.fill();

    // Wheels
    const drawWheel = (x: number, y: number) => {
      pCtx.fillStyle = '#1c1b18';
      pCtx.beginPath();
      pCtx.arc(x, y, 14, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillStyle = '#555';
      pCtx.beginPath();
      pCtx.arc(x, y, 7, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillStyle = '#d4af37';
      pCtx.beginPath();
      pCtx.arc(x, y, 3, 0, Math.PI * 2);
      pCtx.fill();
    };
    drawWheel(35, 52);
    drawWheel(100, 52);

    scene.textures.addCanvas('player_jeep', pCanvas);

    // Enemy Pursuit Buggy (140x70) - Armored Black & Red
    const eCanvas = document.createElement('canvas');
    eCanvas.width = 140;
    eCanvas.height = 70;
    const eCtx = eCanvas.getContext('2d')!;

    eCtx.fillStyle = '#1a1f26';
    eCtx.beginPath();
    eCtx.roundRect(15, 22, 105, 28, 4);
    eCtx.fill();

    eCtx.fillStyle = '#9b1c1c'; // Red war stripe
    eCtx.fillRect(20, 32, 95, 6);

    // Spiked bumper
    eCtx.fillStyle = '#silver';
    eCtx.beginPath();
    eCtx.moveTo(120, 30);
    eCtx.lineTo(135, 38);
    eCtx.lineTo(120, 46);
    eCtx.fill();

    // Red Headlights
    eCtx.fillStyle = '#ff2b2b';
    eCtx.fillRect(115, 26, 5, 8);

    // Heavy Rollcage
    eCtx.strokeStyle = '#111';
    eCtx.lineWidth = 4;
    eCtx.beginPath();
    eCtx.moveTo(35, 22);
    eCtx.lineTo(48, 6);
    eCtx.lineTo(82, 6);
    eCtx.lineTo(92, 22);
    eCtx.stroke();

    // Heavy Wheels
    const drawEnemyWheel = (x: number, y: number) => {
      eCtx.fillStyle = '#111';
      eCtx.beginPath();
      eCtx.arc(x, y, 15, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.fillStyle = '#7b1113';
      eCtx.beginPath();
      eCtx.arc(x, y, 7, 0, Math.PI * 2);
      eCtx.fill();
    };
    drawEnemyWheel(38, 52);
    drawEnemyWheel(98, 52);

    scene.textures.addCanvas('enemy_jeep', eCanvas);
  }

  /**
   * Environmental textures:
   * Stone platforms, carved ruins, brick patterns, torch sconce, pillars
   */
  private static createEnvironmentTextures(scene: Phaser.Scene) {
    // Ancient Stone Tile (64x64)
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 64;
    tileCanvas.height = 64;
    const tCtx = tileCanvas.getContext('2d')!;

    // Base sandstone gradient
    const grad = tCtx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#42372d');
    grad.addColorStop(1, '#2c231b');
    tCtx.fillStyle = grad;
    tCtx.fillRect(0, 0, 64, 64);

    // Stone brick borders and cracks
    tCtx.strokeStyle = '#1b140e';
    tCtx.lineWidth = 2;
    tCtx.strokeRect(1, 1, 62, 62);
    tCtx.beginPath();
    tCtx.moveTo(0, 32);
    tCtx.lineTo(64, 32);
    tCtx.moveTo(32, 0);
    tCtx.lineTo(32, 32);
    tCtx.stroke();

    // Antique golden carved filigree motif on stone
    tCtx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    tCtx.lineWidth = 1.5;
    tCtx.beginPath();
    tCtx.arc(16, 16, 7, 0, Math.PI * 2);
    tCtx.arc(48, 48, 7, 0, Math.PI * 2);
    tCtx.stroke();

    scene.textures.addCanvas('stone_tile', tileCanvas);

    // Weathered Stone Platform Top (192x32)
    const platCanvas = document.createElement('canvas');
    platCanvas.width = 192;
    platCanvas.height = 32;
    const pCtx = platCanvas.getContext('2d')!;

    const pGrad = pCtx.createLinearGradient(0, 0, 0, 32);
    pGrad.addColorStop(0, '#534538');
    pGrad.addColorStop(0.3, '#3e3227');
    pGrad.addColorStop(1, '#261e16');
    pCtx.fillStyle = pGrad;
    pCtx.beginPath();
    pCtx.roundRect(0, 0, 192, 32, [4, 4, 0, 0]);
    pCtx.fill();

    // Top gold rim trim
    pCtx.fillStyle = '#bfa15f';
    pCtx.fillRect(0, 0, 192, 3);

    // Carved reliefs along edge
    pCtx.fillStyle = '#1c150e';
    for (let x = 8; x < 192; x += 24) {
      pCtx.fillRect(x, 10, 16, 14);
      pCtx.fillStyle = '#7a6448';
      pCtx.fillRect(x + 2, 12, 12, 10);
      pCtx.fillStyle = '#1c150e';
    }

    scene.textures.addCanvas('platform_stone', platCanvas);

    // Ancient Pillar (64x300)
    const pilCanvas = document.createElement('canvas');
    pilCanvas.width = 64;
    pilCanvas.height = 300;
    const pilCtx = pilCanvas.getContext('2d')!;

    const pilGrad = pilCtx.createLinearGradient(0, 0, 64, 0);
    pilGrad.addColorStop(0, '#241c14');
    pilGrad.addColorStop(0.5, '#4f4031');
    pilGrad.addColorStop(1, '#1b140e');
    pilCtx.fillStyle = pilGrad;
    pilCtx.fillRect(8, 0, 48, 300);

    // Capital & Base
    pilCtx.fillStyle = '#b89858';
    pilCtx.fillRect(2, 0, 60, 18);
    pilCtx.fillRect(2, 282, 60, 18);

    // Fluted grooves
    pilCtx.strokeStyle = 'rgba(20, 15, 10, 0.6)';
    pilCtx.lineWidth = 2;
    for (let x = 16; x <= 48; x += 8) {
      pilCtx.beginPath();
      pilCtx.moveTo(x, 20);
      pilCtx.lineTo(x, 280);
      pilCtx.stroke();
    }

    scene.textures.addCanvas('temple_pillar', pilCanvas);

    // Torch Sconce (32x48)
    const torchCanvas = document.createElement('canvas');
    torchCanvas.width = 32;
    torchCanvas.height = 48;
    const torCtx = torchCanvas.getContext('2d')!;

    // Bronze bracket
    torCtx.fillStyle = '#8b6528';
    torCtx.fillRect(13, 20, 6, 24);
    torCtx.beginPath();
    torCtx.roundRect(8, 16, 16, 8, 2);
    torCtx.fill();

    // Flame (warm animated look)
    torCtx.fillStyle = '#ff4500';
    torCtx.beginPath();
    torCtx.arc(16, 12, 9, 0, Math.PI * 2);
    torCtx.fill();
    torCtx.fillStyle = '#ffaa00';
    torCtx.beginPath();
    torCtx.arc(16, 10, 6, 0, Math.PI * 2);
    torCtx.fill();
    torCtx.fillStyle = '#ffffbb';
    torCtx.beginPath();
    torCtx.arc(16, 8, 3, 0, Math.PI * 2);
    torCtx.fill();

    scene.textures.addCanvas('torch_sconce', torchCanvas);

    // Checkpoint Obelisk Totem (40x90)
    const obCanvas = document.createElement('canvas');
    obCanvas.width = 40;
    obCanvas.height = 90;
    const oCtx = obCanvas.getContext('2d')!;

    oCtx.fillStyle = '#362b20';
    oCtx.beginPath();
    oCtx.moveTo(20, 2);
    oCtx.lineTo(36, 20);
    oCtx.lineTo(32, 88);
    oCtx.lineTo(8, 88);
    oCtx.lineTo(4, 20);
    oCtx.closePath();
    oCtx.fill();

    // Glowing cyan runic glyph on totem
    oCtx.strokeStyle = '#00f7ff';
    oCtx.lineWidth = 3;
    oCtx.beginPath();
    oCtx.arc(20, 45, 10, 0, Math.PI * 2);
    oCtx.moveTo(20, 25);
    oCtx.lineTo(20, 65);
    oCtx.stroke();

    scene.textures.addCanvas('checkpoint_totem', obCanvas);
  }

  /**
   * Collectibles (Gold Coin, Blue Gem, Ammo) & Traps (Spikes, Blade, Boulder)
   */
  private static createCollectiblesAndTraps(scene: Phaser.Scene) {
    // Gold Medallion Coin (32x32)
    const coinCanvas = document.createElement('canvas');
    coinCanvas.width = 32;
    coinCanvas.height = 32;
    const cCtx = coinCanvas.getContext('2d')!;

    cCtx.fillStyle = '#ffd700';
    cCtx.beginPath();
    cCtx.arc(16, 16, 13, 0, Math.PI * 2);
    cCtx.fill();

    cCtx.strokeStyle = '#b8860b';
    cCtx.lineWidth = 2;
    cCtx.stroke();

    // Sun symbol on coin
    cCtx.fillStyle = '#b8860b';
    cCtx.beginPath();
    cCtx.arc(16, 16, 6, 0, Math.PI * 2);
    cCtx.fill();

    scene.textures.addCanvas('coin_gold', coinCanvas);

    // Glowing Blue Secret Relic Gem (32x32)
    const gemCanvas = document.createElement('canvas');
    gemCanvas.width = 32;
    gemCanvas.height = 32;
    const gCtx = gemCanvas.getContext('2d')!;

    // Faceted diamond shape
    gCtx.fillStyle = '#00f2fe';
    gCtx.beginPath();
    gCtx.moveTo(16, 4);
    gCtx.lineTo(28, 14);
    gCtx.lineTo(16, 28);
    gCtx.lineTo(4, 14);
    gCtx.closePath();
    gCtx.fill();

    // Inner facet highlights
    gCtx.fillStyle = '#ffffff';
    gCtx.beginPath();
    gCtx.moveTo(16, 7);
    gCtx.lineTo(22, 14);
    gCtx.lineTo(16, 20);
    gCtx.lineTo(10, 14);
    gCtx.closePath();
    gCtx.fill();

    scene.textures.addCanvas('gem_blue', gemCanvas);

    // Ammo Box (32x24)
    const ammoCanvas = document.createElement('canvas');
    ammoCanvas.width = 32;
    ammoCanvas.height = 24;
    const aCtx = ammoCanvas.getContext('2d')!;

    aCtx.fillStyle = '#4b5320'; // Military olive
    aCtx.fillRect(2, 4, 28, 18);
    aCtx.strokeStyle = '#282d11';
    aCtx.lineWidth = 2;
    aCtx.strokeRect(2, 4, 28, 18);

    aCtx.fillStyle = '#ffd700';
    aCtx.fillRect(10, 10, 4, 8);
    aCtx.fillRect(16, 10, 4, 8);

    scene.textures.addCanvas('ammo_box', ammoCanvas);

    // Floor Spikes (64x32)
    const spikeCanvas = document.createElement('canvas');
    spikeCanvas.width = 64;
    spikeCanvas.height = 32;
    const sCtx = spikeCanvas.getContext('2d')!;

    sCtx.fillStyle = '#8a95a5';
    for (let x = 0; x < 64; x += 16) {
      sCtx.beginPath();
      sCtx.moveTo(x + 2, 32);
      sCtx.lineTo(x + 8, 4);
      sCtx.lineTo(x + 14, 32);
      sCtx.closePath();
      sCtx.fill();

      // Blood / rust tip
      sCtx.fillStyle = '#8a2121';
      sCtx.beginPath();
      sCtx.moveTo(x + 6, 12);
      sCtx.lineTo(x + 8, 4);
      sCtx.lineTo(x + 10, 12);
      sCtx.closePath();
      sCtx.fill();
      sCtx.fillStyle = '#8a95a5';
    }

    scene.textures.addCanvas('trap_spikes', spikeCanvas);

    // Swinging Pendulum Blade (64x120)
    const bladeCanvas = document.createElement('canvas');
    bladeCanvas.width = 64;
    bladeCanvas.height = 120;
    const bCtx = bladeCanvas.getContext('2d')!;

    // Chain
    bCtx.strokeStyle = '#555';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.moveTo(32, 0);
    bCtx.lineTo(32, 80);
    bCtx.stroke();

    // Crescent Axe Blade
    bCtx.fillStyle = '#d0d7de';
    bCtx.beginPath();
    bCtx.arc(32, 95, 26, Math.PI * 0.15, Math.PI * 0.85, false);
    bCtx.arc(32, 75, 20, Math.PI * 0.85, Math.PI * 0.15, true);
    bCtx.closePath();
    bCtx.fill();

    bCtx.fillStyle = '#949ea8';
    bCtx.beginPath();
    bCtx.arc(32, 90, 8, 0, Math.PI * 2);
    bCtx.fill();

    scene.textures.addCanvas('swinging_blade', bladeCanvas);

    // Falling Rock / Boulder (48x48)
    const rockCanvas = document.createElement('canvas');
    rockCanvas.width = 48;
    rockCanvas.height = 48;
    const rCtx = rockCanvas.getContext('2d')!;

    rCtx.fillStyle = '#4d3d2e';
    rCtx.beginPath();
    rCtx.moveTo(24, 4);
    rCtx.lineTo(44, 16);
    rCtx.lineTo(40, 40);
    rCtx.lineTo(12, 44);
    rCtx.lineTo(4, 20);
    rCtx.closePath();
    rCtx.fill();

    rCtx.strokeStyle = '#2b2118';
    rCtx.lineWidth = 2;
    rCtx.stroke();

    scene.textures.addCanvas('boulder', rockCanvas);
  }

  /**
   * Level 2 Puzzle Chamber Textures:
   * 3 Interactive Rotating Stone Relic Dials (Sun, Lotus, Trishula)
   */
  private static createPuzzleTextures(scene: Phaser.Scene) {
    const symbols = [
      { id: 'sun', label: 'Surya Sun' },
      { id: 'lotus', label: 'Padma Lotus' },
      { id: 'trishula', label: 'Sacred Trident' },
    ];

    symbols.forEach((sym) => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext('2d')!;
      const cx = 48;
      const cy = 48;

      // Outer Carved Stone Ring
      ctx.fillStyle = '#3a2f23';
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.fill();

      // Gold Bronze Trim
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Dial
      ctx.fillStyle = '#211912';
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;

      if (sym.id === 'sun') {
        // Sun disc with 8 flaming rays
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * 16, cy + Math.sin(ang) * 16);
          ctx.lineTo(cx + Math.cos(ang) * 28, cy + Math.sin(ang) * 28);
          ctx.stroke();
        }
      } else if (sym.id === 'lotus') {
        // Blooming 8-petal sacred lotus
        for (let p = 0; p < 6; p++) {
          const ang = (p / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(ang) * 12, cy + Math.sin(ang) * 12, 10, 5, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (sym.id === 'trishula') {
        // Trishula Trident Symbol
        ctx.beginPath();
        // Central spear
        ctx.moveTo(cx, cy + 22);
        ctx.lineTo(cx, cy - 22);
        // Left curved blade
        ctx.moveTo(cx - 16, cy - 10);
        ctx.quadraticCurveTo(cx - 16, cy + 6, cx, cy + 6);
        // Right curved blade
        ctx.moveTo(cx + 16, cy - 10);
        ctx.quadraticCurveTo(cx + 16, cy + 6, cx, cy + 6);
        ctx.stroke();
      }

      scene.textures.addCanvas(`puzzle_dial_${sym.id}`, canvas);
    });

    // Wall Clue Tablet (140x180)
    const clueCanvas = document.createElement('canvas');
    clueCanvas.width = 140;
    clueCanvas.height = 180;
    const clCtx = clueCanvas.getContext('2d')!;

    clCtx.fillStyle = '#2c2219';
    clCtx.beginPath();
    clCtx.roundRect(4, 4, 132, 172, 6);
    clCtx.fill();

    clCtx.strokeStyle = '#d4af37';
    clCtx.lineWidth = 2;
    clCtx.strokeRect(8, 8, 124, 164);

    clCtx.fillStyle = '#f3e5ab';
    clCtx.font = 'bold 12px Cinzel, serif';
    clCtx.textAlign = 'center';
    clCtx.fillText('SACRED TRIAD', 70, 28);

    clCtx.font = '10px Rajdhani, sans-serif';
    clCtx.fillStyle = '#c5a059';
    clCtx.fillText('ALIGN THE THREE SEALS', 70, 44);

    // Draw miniature clues
    clCtx.fillStyle = '#ffd700';
    clCtx.fillText('I. THE RISING SUN (0°)', 70, 78);
    clCtx.fillText('II. THE BLOOMING LOTUS (90°)', 70, 114);
    clCtx.fillText('III. THE SACRED TRIDENT (180°)', 70, 150);

    scene.textures.addCanvas('puzzle_clue_tablet', clueCanvas);
  }

  /**
   * Level 5 - The Grand Reveal:
   * Sacred Hindu Temple Chamber, Monumental Golden Statues (Shiva Nataraja, Vishnu, Ganesha, Lakshmi),
   * and the central celestial hovering Lost Relic with rotating golden rings!
   */
  private static createGrandTempleTextures(scene: Phaser.Scene) {
    // 1. Lord Shiva / Nataraja Golden Statue (160x280)
    const shivaCanvas = document.createElement('canvas');
    shivaCanvas.width = 160;
    shivaCanvas.height = 280;
    const sCtx = shivaCanvas.getContext('2d')!;

    const sGrad = sCtx.createLinearGradient(0, 0, 160, 280);
    sGrad.addColorStop(0, '#fff0a6');
    sGrad.addColorStop(0.3, '#d4af37');
    sGrad.addColorStop(0.7, '#aa820a');
    sGrad.addColorStop(1, '#5a4200');

    sCtx.fillStyle = sGrad;
    sCtx.strokeStyle = '#fff5b8';
    sCtx.lineWidth = 3;

    // Prabhavali (Cosmic circular ring of flame)
    sCtx.beginPath();
    sCtx.arc(80, 120, 65, 0, Math.PI * 2);
    sCtx.stroke();
    // Flame points on ring
    for (let f = 0; f < 16; f++) {
      const ang = (f / 16) * Math.PI * 2;
      sCtx.beginPath();
      sCtx.arc(80 + Math.cos(ang) * 65, 120 + Math.sin(ang) * 65, 4, 0, Math.PI * 2);
      sCtx.fill();
    }

    // Majestic Crown & Head
    sCtx.beginPath();
    sCtx.roundRect(70, 65, 20, 22, [6, 6, 2, 2]);
    sCtx.fill();
    // Jatamukuta (high braided crown with crescent)
    sCtx.beginPath();
    sCtx.moveTo(68, 65);
    sCtx.lineTo(80, 32);
    sCtx.lineTo(92, 65);
    sCtx.closePath();
    sCtx.fill();

    // Four Arms (Ananda Tandava gesture: Damaru drum, Agni fire, Abhaya mudra, Gajahasta)
    sCtx.fillRect(66, 88, 28, 55); // Torso

    // Upper right arm (Damaru)
    sCtx.fillRect(90, 80, 42, 8);
    sCtx.fillRect(126, 70, 12, 18);
    // Upper left arm (Flame of purification)
    sCtx.fillRect(28, 80, 42, 8);
    sCtx.beginPath();
    sCtx.arc(26, 78, 8, 0, Math.PI * 2);
    sCtx.fill();
    // Lower right arm (Abhaya blessing mudra)
    sCtx.fillRect(90, 102, 26, 8);
    sCtx.fillRect(112, 92, 8, 16);
    // Lower left arm (Graceful downward sweep)
    sCtx.fillRect(44, 102, 26, 8);

    // Dynamic Dancing Legs
    // Right leg planted on lotus pedestal
    sCtx.fillRect(72, 142, 12, 70);
    // Left leg lifted in graceful cross
    sCtx.beginPath();
    sCtx.moveTo(80, 150);
    sCtx.lineTo(40, 190);
    sCtx.lineTo(50, 196);
    sCtx.lineTo(84, 162);
    sCtx.closePath();
    sCtx.fill();

    // Lotus Pedestal
    sCtx.beginPath();
    sCtx.roundRect(25, 215, 110, 40, [10, 10, 4, 4]);
    sCtx.fill();
    sCtx.fillStyle = '#3a2d04';
    sCtx.fillRect(20, 255, 120, 20);

    scene.textures.addCanvas('statue_shiva', shivaCanvas);

    // 2. Lord Vishnu Golden Statue (160x280)
    const vishnuCanvas = document.createElement('canvas');
    vishnuCanvas.width = 160;
    vishnuCanvas.height = 280;
    const vCtx = vishnuCanvas.getContext('2d')!;

    vCtx.fillStyle = sGrad;
    vCtx.strokeStyle = '#fff5b8';
    vCtx.lineWidth = 3;

    // Kiritamukuta (Towering Ornate Royal Crown)
    vCtx.beginPath();
    vCtx.moveTo(68, 65);
    vCtx.lineTo(72, 20);
    vCtx.lineTo(88, 20);
    vCtx.lineTo(92, 65);
    vCtx.closePath();
    vCtx.fill();

    // Serene Face
    vCtx.beginPath();
    vCtx.roundRect(70, 65, 20, 22, [4, 4, 2, 2]);
    vCtx.fill();

    // Regal Torso with Kaustubha gem & garland
    vCtx.fillRect(66, 88, 28, 65);

    // 4 Arms holding Sudarshana Chakra, Panchajanya Shankha, Gada mace, Lotus
    // Upper Right: Spinning Chakra
    vCtx.fillRect(92, 82, 38, 8);
    vCtx.beginPath();
    vCtx.arc(135, 78, 14, 0, Math.PI * 2);
    vCtx.stroke();
    // Upper Left: Conch Shell
    vCtx.fillRect(30, 82, 38, 8);
    vCtx.beginPath();
    vCtx.ellipse(26, 78, 8, 14, 0, 0, Math.PI * 2);
    vCtx.fill();
    // Lower Right: Lotus blossom
    vCtx.fillRect(92, 110, 26, 8);
    // Lower Left: Gada mace resting on ground
    vCtx.fillRect(42, 110, 12, 100);

    // Legs standing in Samabhanga (peaceful dignity)
    vCtx.fillRect(68, 150, 11, 75);
    vCtx.fillRect(81, 150, 11, 75);

    // Base Pedestal
    vCtx.beginPath();
    vCtx.roundRect(30, 225, 100, 35, 8);
    vCtx.fill();

    scene.textures.addCanvas('statue_vishnu', vishnuCanvas);

    // 3. Lord Ganesha Golden Statue (160x280)
    const ganeshaCanvas = document.createElement('canvas');
    ganeshaCanvas.width = 160;
    ganeshaCanvas.height = 280;
    const gCtx = ganeshaCanvas.getContext('2d')!;

    gCtx.fillStyle = sGrad;
    gCtx.strokeStyle = '#fff5b8';
    gCtx.lineWidth = 3;

    // Crown
    gCtx.beginPath();
    gCtx.moveTo(68, 65);
    gCtx.lineTo(80, 28);
    gCtx.lineTo(92, 65);
    gCtx.closePath();
    gCtx.fill();

    // Elephant Head with gentle curved trunk
    gCtx.beginPath();
    gCtx.arc(80, 78, 22, 0, Math.PI * 2);
    gCtx.fill();
    // Ears
    gCtx.beginPath();
    gCtx.ellipse(54, 75, 14, 18, 0.2, 0, Math.PI * 2);
    gCtx.ellipse(106, 75, 14, 18, -0.2, 0, Math.PI * 2);
    gCtx.fill();
    // Curved trunk holding modaka sweet
    gCtx.beginPath();
    gCtx.moveTo(80, 85);
    gCtx.quadraticCurveTo(80, 125, 105, 115);
    gCtx.lineWidth = 10;
    gCtx.strokeStyle = '#aa820a';
    gCtx.stroke();
    gCtx.lineWidth = 3;

    // Round Auspicious Belly (Lambodara)
    gCtx.beginPath();
    gCtx.arc(80, 145, 32, 0, Math.PI * 2);
    gCtx.fill();

    // Four Arms (Axe, Noose, Blessing, Sweet)
    gCtx.fillRect(36, 120, 25, 8);
    gCtx.fillRect(99, 120, 25, 8);

    // Seated in Lalitasana on lotus
    gCtx.beginPath();
    gCtx.roundRect(35, 175, 90, 45, 12);
    gCtx.fill();

    // Pedestal
    gCtx.beginPath();
    gCtx.roundRect(25, 220, 110, 40, 8);
    gCtx.fill();

    scene.textures.addCanvas('statue_ganesha', ganeshaCanvas);

    // 4. The Radiant Lost Relic (128x128)
    // Central artifact with celestial concentric rings and glowing sapphire-gold core
    const relicCanvas = document.createElement('canvas');
    relicCanvas.width = 128;
    relicCanvas.height = 128;
    const rCtx = relicCanvas.getContext('2d')!;
    const rcx = 64;
    const rcy = 64;

    // Outer Aura Glow
    const rGlow = rCtx.createRadialGradient(rcx, rcy, 10, rcx, rcy, 60);
    rGlow.addColorStop(0, 'rgba(255, 235, 130, 0.9)');
    rGlow.addColorStop(0.4, 'rgba(0, 240, 255, 0.5)');
    rGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    rCtx.fillStyle = rGlow;
    rCtx.fillRect(0, 0, 128, 128);

    // Concentric Golden Astrological Rings
    rCtx.strokeStyle = '#ffe066';
    rCtx.lineWidth = 3;
    rCtx.beginPath();
    rCtx.arc(rcx, rcy, 46, 0, Math.PI * 2);
    rCtx.stroke();

    rCtx.strokeStyle = '#d4af37';
    rCtx.lineWidth = 2;
    rCtx.beginPath();
    rCtx.arc(rcx, rcy, 36, 0, Math.PI * 2);
    rCtx.stroke();

    // Sacred Geometric Nodes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rCtx.fillStyle = '#00f7ff';
      rCtx.beginPath();
      rCtx.arc(rcx + Math.cos(a) * 36, rcy + Math.sin(a) * 36, 3, 0, Math.PI * 2);
      rCtx.fill();
    }

    // Core Radiant Diamond Prism
    rCtx.fillStyle = '#ffffff';
    rCtx.beginPath();
    rCtx.moveTo(rcx, rcy - 20);
    rCtx.lineTo(rcx + 18, rcy);
    rCtx.lineTo(rcx, rcy + 20);
    rCtx.lineTo(rcx - 18, rcy);
    rCtx.closePath();
    rCtx.fill();

    rCtx.fillStyle = '#00d0ff';
    rCtx.beginPath();
    rCtx.arc(rcx, rcy, 9, 0, Math.PI * 2);
    rCtx.fill();

    scene.textures.addCanvas('lost_relic', relicCanvas);

    // Altar Pedestal for Relic (96x64)
    const altarCanvas = document.createElement('canvas');
    altarCanvas.width = 96;
    altarCanvas.height = 64;
    const alCtx = altarCanvas.getContext('2d')!;

    const alGrad = alCtx.createLinearGradient(0, 0, 0, 64);
    alGrad.addColorStop(0, '#d4af37');
    alGrad.addColorStop(0.3, '#5c4620');
    alGrad.addColorStop(1, '#1f1609');
    alCtx.fillStyle = alGrad;
    alCtx.beginPath();
    alCtx.moveTo(16, 8);
    alCtx.lineTo(80, 8);
    alCtx.lineTo(92, 60);
    alCtx.lineTo(4, 60);
    alCtx.closePath();
    alCtx.fill();

    alCtx.strokeStyle = '#ffd700';
    alCtx.lineWidth = 2;
    alCtx.stroke();

    scene.textures.addCanvas('relic_altar', altarCanvas);

    // Volumetric Sunlight Shaft (200x500)
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 200;
    sunCanvas.height = 500;
    const snCtx = sunCanvas.getContext('2d')!;

    const sBeam = snCtx.createLinearGradient(0, 0, 100, 500);
    sBeam.addColorStop(0, 'rgba(255, 230, 140, 0.55)');
    sBeam.addColorStop(0.4, 'rgba(255, 215, 0, 0.25)');
    sBeam.addColorStop(1, 'rgba(255, 215, 0, 0.02)');
    snCtx.fillStyle = sBeam;

    snCtx.beginPath();
    snCtx.moveTo(70, 0);
    snCtx.lineTo(130, 0);
    snCtx.lineTo(195, 500);
    snCtx.lineTo(5, 500);
    snCtx.closePath();
    snCtx.fill();

    scene.textures.addCanvas('sunlight_shaft', sunCanvas);
  }

  /**
   * Particles, bullets, speedlines, and UI icons
   */
  private static createParticlesAndFx(scene: Phaser.Scene) {
    // Bullet Projectile (16x8)
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 16;
    bCanvas.height = 8;
    const bCtx = bCanvas.getContext('2d')!;

    bCtx.fillStyle = '#ffdf70';
    bCtx.beginPath();
    bCtx.ellipse(8, 4, 7, 3, 0, 0, Math.PI * 2);
    bCtx.fill();

    scene.textures.addCanvas('bullet', bCanvas);

    // Gold Spark Particle (12x12)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 12;
    pCanvas.height = 12;
    const pCtx = pCanvas.getContext('2d')!;

    pCtx.fillStyle = '#ffd700';
    pCtx.beginPath();
    pCtx.arc(6, 6, 4, 0, Math.PI * 2);
    pCtx.fill();

    scene.textures.addCanvas('particle_gold', pCanvas);

    // Smoke / Dust particle (16x16)
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 16;
    sCanvas.height = 16;
    const sCtx = sCanvas.getContext('2d')!;

    sCtx.fillStyle = 'rgba(200, 180, 150, 0.6)';
    sCtx.beginPath();
    sCtx.arc(8, 8, 6, 0, Math.PI * 2);
    sCtx.fill();

    scene.textures.addCanvas('particle_dust', sCanvas);

    // Blue Magic Sparkle (12x12)
    const mCanvas = document.createElement('canvas');
    mCanvas.width = 12;
    mCanvas.height = 12;
    const mCtx = mCanvas.getContext('2d')!;

    mCtx.fillStyle = '#00f7ff';
    mCtx.beginPath();
    mCtx.arc(6, 6, 4, 0, Math.PI * 2);
    mCtx.fill();

    scene.textures.addCanvas('particle_blue', mCanvas);

    // Dynamic Handheld Lantern Radial Light Glow (280x280)
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 280;
    lCanvas.height = 280;
    const lCtx = lCanvas.getContext('2d')!;
    const lGrad = lCtx.createRadialGradient(140, 140, 10, 140, 140, 140);
    lGrad.addColorStop(0, 'rgba(255, 230, 140, 0.95)');
    lGrad.addColorStop(0.25, 'rgba(255, 175, 45, 0.7)');
    lGrad.addColorStop(0.65, 'rgba(180, 110, 20, 0.25)');
    lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lCtx.fillStyle = lGrad;
    lCtx.fillRect(0, 0, 280, 280);
    scene.textures.addCanvas('light_radial_warm', lCanvas);

    // Wall Torch Radial Light Glow (200x200)
    const tCanvas = document.createElement('canvas');
    tCanvas.width = 200;
    tCanvas.height = 200;
    const tCtx = tCanvas.getContext('2d')!;
    const tGrad = tCtx.createRadialGradient(100, 100, 8, 100, 100, 100);
    tGrad.addColorStop(0, 'rgba(255, 190, 80, 0.9)');
    tGrad.addColorStop(0.3, 'rgba(255, 120, 20, 0.55)');
    tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    tCtx.fillStyle = tGrad;
    tCtx.fillRect(0, 0, 200, 200);
    scene.textures.addCanvas('light_radial_torch', tCanvas);

    // Celestial Relic Cyan Glow (220x220)
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 220;
    cCanvas.height = 220;
    const cCtx = cCanvas.getContext('2d')!;
    const cGrad = cCtx.createRadialGradient(110, 110, 10, 110, 110, 110);
    cGrad.addColorStop(0, 'rgba(200, 250, 255, 0.95)');
    cGrad.addColorStop(0.35, 'rgba(0, 230, 255, 0.6)');
    cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cCtx.fillStyle = cGrad;
    cCtx.fillRect(0, 0, 220, 220);
    scene.textures.addCanvas('light_radial_cyan', cCanvas);
  }

  /**
   * Generates continuous panoramic multi-layer backgrounds for Chapter I:
   * 1. 'bg_tunnel_far' (2560x720): Distant Ellora rock-cut silhouettes, Dravidian Gopurams, Vimanas, Kalasha finials, and subterranean Kalyani reservoir horizon. (Parallax: 0.25)
   * 2. 'bg_tunnel_mid' (3400x720): Weathered sandstone colonnades, carved wall relief panels, stepped tank ghats, torana arches, and monumental lintels. (Parallax: 0.55)
   * 3. 'bg_tunnel_ceiling' (3800x150): Monolithic rock ceiling strata, hanging stalactites, stone corbel brackets, and lotus friezes. (Parallax: 0.70)
   */
  private static createTunnelPanoramaTextures(scene: Phaser.Scene) {
    if (scene.textures.exists('bg_tunnel_far')) return;

    // --- 1. FAR PANORAMA (2560x720) ---
    const farCanvas = document.createElement('canvas');
    farCanvas.width = 2560;
    farCanvas.height = 720;
    const fCtx = farCanvas.getContext('2d')!;

    // Atmospheric subterranean basalt sky/void gradient
    const skyGrad = fCtx.createLinearGradient(0, 0, 0, 720);
    skyGrad.addColorStop(0, '#060911');      // Deep subterranean cavern ceiling
    skyGrad.addColorStop(0.35, '#0b101a');   // Distant basalt mist
    skyGrad.addColorStop(0.65, '#16121b');   // Warm earthen sepia horizon
    skyGrad.addColorStop(0.85, '#221812');   // Muted sandstone ambient glow
    skyGrad.addColorStop(1.0, '#0a080d');    // Deep floor basalt shadow
    fCtx.fillStyle = skyGrad;
    fCtx.fillRect(0, 0, 2560, 720);

    // Far Distant Cavern Basalt Wall Formations (Silhouettes)
    fCtx.fillStyle = '#0a0f1b';
    fCtx.beginPath();
    fCtx.moveTo(0, 720);
    for (let x = 0; x <= 2560; x += 40) {
      const rockH = 280 + Math.sin(x * 0.003) * 60 + Math.cos(x * 0.008) * 35;
      fCtx.lineTo(x, 720 - rockH);
    }
    fCtx.lineTo(2560, 720);
    fCtx.closePath();
    fCtx.fill();

    // Distant Dravidian Temple Architecture & Landmarks along the 2560px panorama
    const drawDistantTower = (cx: number, baseW: number, topW: number, topY: number, baseY: number, kalashaCount: number) => {
      // Main stepped pyramid tower
      fCtx.fillStyle = '#0d1424';
      fCtx.beginPath();
      fCtx.moveTo(cx - baseW / 2, baseY);
      fCtx.lineTo(cx - topW / 2, topY);
      fCtx.lineTo(cx + topW / 2, topY);
      fCtx.lineTo(cx + baseW / 2, baseY);
      fCtx.closePath();
      fCtx.fill();

      // Tiered horizontal cornice bands
      const tiers = 6;
      fCtx.strokeStyle = 'rgba(26, 36, 56, 0.7)';
      fCtx.lineWidth = 2.5;
      for (let t = 1; t < tiers; t++) {
        const factor = t / tiers;
        const tierY = topY + factor * (baseY - topY);
        const wAtTier = topW + factor * (baseW - topW);
        fCtx.beginPath();
        fCtx.moveTo(cx - wAtTier / 2 - 4, tierY);
        fCtx.lineTo(cx + wAtTier / 2 + 4, tierY);
        fCtx.stroke();
      }

      // Kalasha Finials (Sacred urn pot with finial spike)
      fCtx.fillStyle = '#1c263b';
      const kStep = topW / (kalashaCount + 1);
      for (let k = 1; k <= kalashaCount; k++) {
        const kx = cx - topW / 2 + k * kStep;
        fCtx.fillRect(kx - 4, topY - 22, 8, 22);
        fCtx.beginPath();
        fCtx.arc(kx, topY - 26, 6, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.beginPath();
        fCtx.moveTo(kx, topY - 36);
        fCtx.lineTo(kx - 2, topY - 26);
        fCtx.lineTo(kx + 2, topY - 26);
        fCtx.closePath();
        fCtx.fill();
      }
    };

    // Zone 1: Entry rock portal & modest vimana tower
    drawDistantTower(120, 110, 40, 240, 520, 1);

    // Zone 2: Hypostyle Mandapa distant towers
    drawDistantTower(320, 150, 50, 190, 530, 3);
    drawDistantTower(410, 120, 45, 230, 530, 2);

    // Zone 3: Kalyani Temple Tank / Chasm reservoir horizon (x: 460 - 680)
    fCtx.fillStyle = '#080d17';
    fCtx.fillRect(450, 540, 240, 180);
    // Reservoir water surface reflection
    const tankWaterGrad = fCtx.createLinearGradient(450, 560, 450, 640);
    tankWaterGrad.addColorStop(0, 'rgba(0, 247, 255, 0.22)');
    tankWaterGrad.addColorStop(0.4, 'rgba(2, 30, 45, 0.6)');
    tankWaterGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.85)');
    fCtx.fillStyle = tankWaterGrad;
    fCtx.fillRect(460, 570, 220, 70);

    // Distant monolithic rock arch bridging the chasm
    fCtx.strokeStyle = '#0e1626';
    fCtx.lineWidth = 28;
    fCtx.beginPath();
    fCtx.arc(570, 580, 130, Math.PI, 0, false);
    fCtx.stroke();

    // Zone 4: Secret Vimana Spire (x: 760)
    drawDistantTower(760, 160, 55, 150, 520, 3);
    // Subtle celestial shaft of light filtering from cavern fissure
    const beamGrad = fCtx.createLinearGradient(760, 0, 760, 450);
    beamGrad.addColorStop(0, 'rgba(255, 235, 170, 0.12)');
    beamGrad.addColorStop(0.5, 'rgba(255, 215, 100, 0.05)');
    beamGrad.addColorStop(1, 'rgba(255, 215, 100, 0)');
    fCtx.fillStyle = beamGrad;
    fCtx.beginPath();
    fCtx.moveTo(730, 0);
    fCtx.lineTo(790, 0);
    fCtx.lineTo(840, 460);
    fCtx.lineTo(680, 460);
    fCtx.closePath();
    fCtx.fill();

    // Zone 5: Ceremonial Mandapa Grand Pavilion (x: 980)
    drawDistantTower(980, 190, 70, 170, 530, 4);

    // Zone 6: Crumbling Sandstone Span / Aqueduct Piers (x: 1140 - 1320)
    fCtx.fillStyle = '#0c1322';
    fCtx.fillRect(1120, 420, 200, 30);
    for (let px = 1140; px <= 1300; px += 45) {
      fCtx.fillRect(px - 10, 450, 20, 140);
    }
    // Broken bridge gap
    fCtx.clearRect(1210, 410, 45, 50);

    // Zone 7: Surya Sanctuary Portal (x: 1450)
    const sunHalo = fCtx.createRadialGradient(1450, 340, 20, 1450, 340, 260);
    sunHalo.addColorStop(0, 'rgba(255, 215, 0, 0.28)');
    sunHalo.addColorStop(0.3, 'rgba(255, 170, 30, 0.16)');
    sunHalo.addColorStop(0.7, 'rgba(180, 100, 20, 0.06)');
    sunHalo.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    fCtx.fillStyle = sunHalo;
    fCtx.fillRect(1200, 100, 500, 480);

    drawDistantTower(1450, 230, 80, 130, 530, 5);

    // Continuous architectural buffer (x: 1600 - 2560)
    for (let bx = 1700; bx < 2560; bx += 320) {
      drawDistantTower(bx, 150, 50, 200, 540, 3);
    }

    scene.textures.addCanvas('bg_tunnel_far', farCanvas);

    // --- 2. MIDGROUND ARCHITECTURE (3400x720) ---
    const midCanvas = document.createElement('canvas');
    midCanvas.width = 3400;
    midCanvas.height = 720;
    const mCtx = midCanvas.getContext('2d')!;

    // Continuous carved rock-cut stone architrave / beam along top midground
    mCtx.fillStyle = '#2a221b';
    mCtx.fillRect(0, 180, 3400, 26);
    mCtx.strokeStyle = '#4a3c2e';
    mCtx.lineWidth = 2;
    mCtx.beginPath();
    mCtx.moveTo(0, 180);
    mCtx.lineTo(3400, 180);
    mCtx.moveTo(0, 206);
    mCtx.lineTo(3400, 206);
    mCtx.stroke();

    // Carved lotus medallions along the continuous architrave frieze
    mCtx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    mCtx.lineWidth = 1.5;
    for (let lx = 30; lx < 3400; lx += 60) {
      mCtx.beginPath();
      mCtx.arc(lx, 193, 7, 0, Math.PI * 2);
      mCtx.stroke();
    }

    // Helper to draw a midground sandstone pillar with carved lotus capital & base
    const drawMidPillar = (x: number, yTop: number, yBottom: number, width: number) => {
      const pGrad = mCtx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
      pGrad.addColorStop(0, '#2b2118');
      pGrad.addColorStop(0.35, '#483829');
      pGrad.addColorStop(0.7, '#5b4735');
      pGrad.addColorStop(1, '#231b14');
      mCtx.fillStyle = pGrad;
      mCtx.fillRect(x - width / 2, yTop, width, yBottom - yTop);

      // Fluted vertical grooves
      mCtx.strokeStyle = 'rgba(15, 12, 8, 0.6)';
      mCtx.lineWidth = 1.5;
      const step = width / 5;
      for (let s = 1; s <= 4; s++) {
        mCtx.beginPath();
        mCtx.moveTo(x - width / 2 + s * step, yTop + 24);
        mCtx.lineTo(x - width / 2 + s * step, yBottom - 24);
        mCtx.stroke();
      }

      // Stepped Lotus Capital (Pushpapotika corbel)
      mCtx.fillStyle = '#6e563d';
      mCtx.beginPath();
      mCtx.moveTo(x - width / 2 - 12, yTop);
      mCtx.lineTo(x + width / 2 + 12, yTop);
      mCtx.lineTo(x + width / 2 + 6, yTop + 14);
      mCtx.lineTo(x + width / 2, yTop + 24);
      mCtx.lineTo(x - width / 2, yTop + 24);
      mCtx.lineTo(x - width / 2 - 6, yTop + 14);
      mCtx.closePath();
      mCtx.fill();

      // Carved Base Plinth
      mCtx.fillStyle = '#3a2c1e';
      mCtx.fillRect(x - width / 2 - 8, yBottom - 20, width + 16, 20);
      mCtx.strokeStyle = '#5a4632';
      mCtx.strokeRect(x - width / 2 - 8, yBottom - 20, width + 16, 20);
    };

    // Helper to draw a midground cusped torana arch between two x positions
    const drawMidArch = (x1: number, x2: number, ySpring: number, yCrown: number) => {
      const cx = (x1 + x2) / 2;
      mCtx.strokeStyle = '#544230';
      mCtx.lineWidth = 8;
      mCtx.beginPath();
      mCtx.moveTo(x1, ySpring);
      mCtx.quadraticCurveTo(x1 + 10, yCrown + 20, cx, yCrown);
      mCtx.quadraticCurveTo(x2 - 10, yCrown + 20, x2, ySpring);
      mCtx.stroke();

      // Inner decorative trim
      mCtx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      mCtx.lineWidth = 2;
      mCtx.beginPath();
      mCtx.moveTo(x1 + 4, ySpring);
      mCtx.quadraticCurveTo(x1 + 12, yCrown + 25, cx, yCrown + 6);
      mCtx.quadraticCurveTo(x2 - 12, yCrown + 25, x2 - 4, ySpring);
      mCtx.stroke();
    };

    // Helper to draw a midground carved wall relief panel
    const drawMidWallPanel = (x: number, y: number, w: number, h: number) => {
      mCtx.fillStyle = '#32271d';
      mCtx.fillRect(x, y, w, h);
      mCtx.strokeStyle = '#4e3d2d';
      mCtx.lineWidth = 2;
      mCtx.strokeRect(x, y, w, h);

      mCtx.strokeStyle = '#221912';
      mCtx.strokeRect(x + 6, y + 6, w - 12, h - 12);

      // Deity bas-relief silhouette (seated in Padmasana lotus posture)
      const cx = x + w / 2;
      const cy = y + h / 2;
      mCtx.fillStyle = '#4c3b2c';
      mCtx.beginPath();
      mCtx.arc(cx, cy - 14, 16, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.fillStyle = '#5d4937';
      mCtx.beginPath();
      mCtx.arc(cx, cy - 12, 9, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.fillRect(cx - 3, cy - 26, 6, 12);
      mCtx.beginPath();
      mCtx.moveTo(cx - 16, cy + 8);
      mCtx.lineTo(cx + 16, cy + 8);
      mCtx.lineTo(cx + 12, cy - 4);
      mCtx.lineTo(cx - 12, cy - 4);
      mCtx.closePath();
      mCtx.fill();
      mCtx.beginPath();
      mCtx.ellipse(cx, cy + 14, 20, 8, 0, 0, Math.PI * 2);
      mCtx.fill();
    };

    // Zone 1: Threshold Corridor (x: 0 - 550)
    for (let x = 60; x < 500; x += 140) {
      drawMidWallPanel(x, 240, 90, 160);
      drawMidPillar(x + 115, 206, 560, 32);
    }

    // Zone 2: Hypostyle Mandapa Colonnade (x: 550 - 1100)
    for (let x = 580; x < 1100; x += 130) {
      drawMidPillar(x, 206, 580, 38);
      if (x + 130 < 1100) {
        drawMidArch(x + 19, x + 130 - 19, 230, 206);
      }
    }

    // Zone 3: Kalyani Temple Tank Stepped Ghats (x: 1100 - 1650)
    mCtx.fillStyle = '#221a14';
    mCtx.strokeStyle = '#3d2e22';
    mCtx.lineWidth = 2;
    for (let step = 0; step < 7; step++) {
      const stepW = 260 - step * 25;
      const stepY = 480 + step * 24;
      mCtx.fillRect(1120 + step * 12, stepY, stepW, 24);
      mCtx.strokeRect(1120 + step * 12, stepY, stepW, 24);

      mCtx.fillRect(1630 - step * 12 - stepW, stepY, stepW, 24);
      mCtx.strokeRect(1630 - step * 12 - stepW, stepY, stepW, 24);
    }
    drawMidArch(1180, 1560, 340, 210);

    // Zone 4: Secret Vimana Sanctuary Alcove (x: 1650 - 2150)
    drawMidWallPanel(1720, 220, 110, 180);
    drawMidWallPanel(1880, 180, 120, 220);
    drawMidPillar(1700, 206, 560, 36);
    drawMidPillar(2020, 206, 560, 36);
    drawMidArch(1718, 2002, 230, 206);

    // Zone 5: Ceremonial Mandapa Colonnaded Hall (x: 2150 - 2650)
    for (let x = 2180; x < 2650; x += 120) {
      drawMidPillar(x, 206, 580, 36);
      drawMidWallPanel(x + 22, 260, 76, 140);
    }

    // Zone 6: Crumbling Sandstone Span / Ruined Bridge (x: 2650 - 3050)
    drawMidPillar(2690, 206, 540, 34);
    drawMidPillar(2840, 260, 560, 34);
    drawMidPillar(3010, 206, 560, 34);
    mCtx.strokeStyle = '#423425';
    mCtx.lineWidth = 7;
    mCtx.beginPath();
    mCtx.moveTo(2707, 230);
    mCtx.quadraticCurveTo(2750, 215, 2780, 225);
    mCtx.stroke();

    // Zone 7: Surya Vault Antechamber (x: 3050 - 3400)
    drawMidPillar(3100, 206, 600, 46);
    drawMidPillar(3320, 206, 600, 46);
    drawMidArch(3123, 3297, 240, 206);
    drawMidWallPanel(3160, 240, 100, 180);

    scene.textures.addCanvas('bg_tunnel_mid', midCanvas);

    // --- 3. CEILING STRATA (3800x150) ---
    const ceilCanvas = document.createElement('canvas');
    ceilCanvas.width = 3800;
    ceilCanvas.height = 150;
    const cCtx = ceilCanvas.getContext('2d')!;

    const cGrad = cCtx.createLinearGradient(0, 0, 0, 150);
    cGrad.addColorStop(0, '#04060b');
    cGrad.addColorStop(0.5, '#131822');
    cGrad.addColorStop(0.85, '#221b14');
    cGrad.addColorStop(1.0, 'rgba(34, 27, 20, 0)');
    cCtx.fillStyle = cGrad;
    cCtx.fillRect(0, 0, 3800, 150);

    // Hanging rock stalactites
    cCtx.fillStyle = '#181e28';
    for (let cx = 0; cx < 3800; cx += 28) {
      const hStalactite = 35 + Math.sin(cx * 0.05) * 25 + Math.cos(cx * 0.02) * 20;
      cCtx.beginPath();
      cCtx.moveTo(cx, 0);
      cCtx.lineTo(cx + 28, 0);
      cCtx.lineTo(cx + 14, hStalactite);
      cCtx.closePath();
      cCtx.fill();
    }

    // Carved rock-cut cornice brackets every 120px
    cCtx.fillStyle = '#34291f';
    cCtx.strokeStyle = '#524131';
    cCtx.lineWidth = 1.5;
    for (let bx = 40; bx < 3800; bx += 120) {
      cCtx.beginPath();
      cCtx.moveTo(bx - 12, 0);
      cCtx.lineTo(bx + 12, 0);
      cCtx.lineTo(bx + 8, 45);
      cCtx.lineTo(bx, 60);
      cCtx.lineTo(bx - 8, 45);
      cCtx.closePath();
      cCtx.fill();
      cCtx.stroke();
    }

    scene.textures.addCanvas('bg_tunnel_ceiling', ceilCanvas);
  }
}

import Phaser from 'phaser';

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
  active: boolean;
}

export class LightingManager {
  private scene: Phaser.Scene;
  private darknessMask: Phaser.GameObjects.RenderTexture;
  private lights: LightSource[] = [];
  private ambientDarkness: number = 0.92; // 0 = full light, 1 = pitch black
  private playerLight: LightSource | null = null;
  private flickerTimer: number = 0;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    // Create darkness render texture overlaying the entire world view
    this.darknessMask = scene.add.renderTexture(0, 0, width, height);
    this.darknessMask.setOrigin(0, 0);
    this.darknessMask.setDepth(50);
    this.darknessMask.setScrollFactor(0);
  }

  public setAmbientDarkness(val: number) {
    this.ambientDarkness = Math.max(0, Math.min(1, val));
  }

  public getAmbientDarkness(): number {
    return this.ambientDarkness;
  }

  public registerPlayerLantern(x: number, y: number, radius = 95): LightSource {
    this.playerLight = {
      id: 'player_lantern',
      x,
      y,
      radius,
      intensity: 1.0,
      color: '#ffc848',
      active: true,
    };
    this.lights.push(this.playerLight);
    return this.playerLight;
  }

  public addTorchLight(id: string, x: number, y: number, radius = 80): LightSource {
    const light: LightSource = {
      id,
      x,
      y,
      radius,
      intensity: 1.0,
      color: '#ff9922',
      active: false,
    };
    this.lights.push(light);
    return light;
  }

  public updatePlayerPosition(x: number, y: number) {
    if (this.playerLight) {
      this.playerLight.x = x;
      this.playerLight.y = y;
    }
  }

  public setLightActive(id: string, active: boolean, radius?: number) {
    const l = this.lights.find((light) => light.id === id);
    if (l) {
      l.active = active;
      if (radius !== undefined) l.radius = radius;
    }
  }

  public update(time: number, delta: number) {
    this.flickerTimer += delta * 0.008;

    // Clear and fill with ambient darkness
    this.darknessMask.clear();
    if (this.ambientDarkness <= 0.01) {
      // Full daylight, no mask needed
      this.darknessMask.setVisible(false);
      return;
    }
    this.darknessMask.setVisible(true);

    const darkAlpha = this.ambientDarkness;
    const darkHex = 0x060912;

    this.darknessMask.fill(darkHex, darkAlpha, 0, 0, 640, 360);

    // Camera view offset
    const cam = this.scene.cameras.main;
    const camX = cam.scrollX;
    const camY = cam.scrollY;

    // Cut out light circles for active lights
    this.lights.forEach((l) => {
      if (!l.active) return;

      const screenX = l.x - camX;
      const screenY = l.y - camY;

      // Check if light is within screen bounds + padding
      if (
        screenX < -l.radius ||
        screenX > cam.width + l.radius ||
        screenY < -l.radius ||
        screenY > cam.height + l.radius
      ) {
        return;
      }

      // Organic subtle flicker
      const flick = 1.0 + Math.sin(this.flickerTimer * 4.0 + l.x) * 0.05 + Math.cos(this.flickerTimer * 7.0) * 0.03;
      const rad = l.radius * flick;

      // Draw radial gradient cutout
      this.darknessMask.erase(
        this.createLightMaskSprite(rad),
        screenX,
        screenY
      );
    });
  }

  // Cached canvas texture for smooth radial light cutout
  private lightSpriteCache: Map<number, Phaser.GameObjects.Image> = new Map();

  private createLightMaskSprite(radius: number): Phaser.GameObjects.Image {
    const roundedRad = Math.round(radius);
    if (!this.scene.textures.exists(`light_mask_${roundedRad}`)) {
      const size = roundedRad * 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createRadialGradient(roundedRad, roundedRad, 0, roundedRad, roundedRad, roundedRad);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.35, 'rgba(255, 240, 200, 0.85)');
      grad.addColorStop(0.7, 'rgba(255, 200, 120, 0.35)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      this.scene.textures.addCanvas(`light_mask_${roundedRad}`, canvas);
    }

    if (!this.lightSpriteCache.has(roundedRad)) {
      const img = this.scene.make.image({
        key: `light_mask_${roundedRad}`,
        add: false,
      });
      img.setOrigin(0.5);
      this.lightSpriteCache.set(roundedRad, img);
    }

    return this.lightSpriteCache.get(roundedRad)!;
  }

  public destroy() {
    this.darknessMask.destroy();
    this.lightSpriteCache.clear();
    this.lights = [];
  }
}

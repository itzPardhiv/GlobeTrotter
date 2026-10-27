import Phaser from 'phaser';
import { audioManager } from '../systems/PixelAudioManager';

export class ExpeditionJeep extends Phaser.GameObjects.Container {
  private bodySprite: Phaser.GameObjects.Image;
  private wheelRear: Phaser.GameObjects.Image;
  private wheelFront: Phaser.GameObjects.Image;
  private headlightBeam: Phaser.GameObjects.Polygon;
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  public velocityX: number = 0;
  private wheelAngle: number = 0;
  private suspensionPhase: number = 0;
  private isSettled: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(20);

    // 1. Headlight Volumetric Light Cone
    // Origin at front bumper (x: 52, y: 10), projects forward 140px with soft opacity
    const conePoints = [
      { x: 50, y: 8 },
      { x: 190, y: -20 },
      { x: 190, y: 35 },
      { x: 50, y: 15 },
    ];
    this.headlightBeam = scene.add.polygon(0, 0, conePoints, 0xfff2b8, 0.22);
    this.headlightBeam.setOrigin(0, 0);

    // 2. Wheels (Rear at x: -28, y: 16; Front at x: 32, y: 16)
    this.wheelRear = scene.add.image(-28, 16, 'jeep_wheel');
    this.wheelFront = scene.add.image(32, 16, 'jeep_wheel');

    // 3. Main Chassis Body (Origin centered slightly above axles)
    this.bodySprite = scene.add.image(0, 0, 'jeep_body');

    this.add([this.headlightBeam, this.bodySprite, this.wheelRear, this.wheelFront]);

    // 4. Tire Dust Particles
    if (scene.textures.exists('fx_dust')) {
      this.dustEmitter = scene.add.particles(0, 0, 'fx_dust', {
        lifespan: 450,
        speedX: { min: -50, max: -20 },
        speedY: { min: -18, max: -4 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.7, end: 0 },
        emitting: false,
      });
      this.dustEmitter.setDepth(15);
    }
  }

  public updateJeep(time: number, delta: number) {
    const dt = delta * 0.001;
    this.x += this.velocityX * dt;

    if (Math.abs(this.velocityX) > 2) {
      // Rotate wheels proportionally to linear travel speed
      const radius = 14;
      const angularVelocity = (this.velocityX / radius) * (180 / Math.PI);
      this.wheelAngle += angularVelocity * dt;
      this.wheelRear.setAngle(this.wheelAngle);
      this.wheelFront.setAngle(this.wheelAngle);

      // Suspension spring bounce over dirt ruts
      this.suspensionPhase += dt * (Math.abs(this.velocityX) * 0.12);
      const bounce = Math.sin(this.suspensionPhase * 8.0) * 1.5 + Math.cos(this.suspensionPhase * 13.0) * 0.8;
      this.bodySprite.y = bounce;

      // Dust emission behind rear tire
      if (this.dustEmitter) {
        this.dustEmitter.explode(1, this.x - 36, this.y + 24);
      }

      audioManager.updateJeepThrottle(Math.min(1, Math.abs(this.velocityX) / 140));
    } else if (!this.isSettled) {
      // Settle suspension gently to zero
      this.bodySprite.y = Phaser.Math.Linear(this.bodySprite.y, 0, 0.1);
      if (Math.abs(this.bodySprite.y) < 0.05) {
        this.bodySprite.y = 0;
        this.isSettled = true;
      }
    }
  }

  public stopAndSettle(onComplete?: () => void) {
    this.scene.tweens.add({
      targets: this,
      velocityX: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        audioManager.stopJeepSound();
        audioManager.playStoneGrind();
        // Subtle chassis dip as brakes catch
        this.scene.tweens.add({
          targets: this.bodySprite,
          y: 2.5,
          duration: 150,
          yoyo: true,
          onComplete: () => {
            this.isSettled = true;
            if (onComplete) onComplete();
          },
        });
      },
    });
  }
}

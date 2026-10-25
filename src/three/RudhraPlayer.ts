import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { audioManager } from '../systems/AudioManager';

export interface RudhraState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  facing: 1 | -1;
  isDead: boolean;
  canMove: boolean;
  isLanternActive: boolean;
  isCarryingRelic: boolean;
}

export class RudhraPlayer {
  public mesh: THREE.Group;
  public lanternLight!: THREE.PointLight;
  public lanternFlame!: THREE.Mesh;
  public state: RudhraState = {
    x: 2.0,
    y: 0.0,
    vx: 0.0,
    vy: 0.0,
    isGrounded: true,
    isCrouching: false,
    isSprinting: false,
    facing: 1,
    isDead: false,
    canMove: true,
    isLanternActive: true,
    isCarryingRelic: false,
  };

  // Dimensions (meters)
  public readonly STAND_HEIGHT = 1.65;
  public readonly CROUCH_HEIGHT = 0.95;
  public readonly RADIUS = 0.32;

  // Kinematic parameters
  private readonly RUN_SPEED = 5.2;
  private readonly SPRINT_SPEED = 7.8;
  private readonly ACCEL = 35.0;
  private readonly FRICTION = 28.0;
  private readonly JUMP_SPEED = 7.6;
  private readonly GRAVITY = 19.5;

  // GLTF Model & Skinned Character
  public gltfModel: THREE.Group | null = null;
  public skinnedMesh: THREE.SkinnedMesh | null = null;
  public skeleton: THREE.Skeleton | null = null;
  private bones: Record<string, THREE.Bone> = {};
  private isGlbLoaded: boolean = false;
  private isSkinned: boolean = false;

  // Carried Surya-Chakra 3D Prop
  private carriedRelicMesh: THREE.Group | null = null;

  // Procedural Fallback Meshes (Node tests & pre-load)
  private bodyGroup: THREE.Group;
  private headGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private lanternGroup: THREE.Group;

  // Animation Timers & State
  private coyoteTimer = 0.0;
  private jumpBufferTimer = 0.0;
  private footstepTimer = 0.0;
  private animTimer = 0.0;
  private walkPhase = 0.0;
  private crouchProgress = 0.0; // 0 (standing) to 1 (full crouch)
  private interactTimer = 0.0;
  private isInteracting = false;

  constructor() {
    this.mesh = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // ── Build Rudhra's Baseline 3D Model & Procedural Fallback ──────────────
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xc68b59,
      roughness: 0.65,
      metalness: 0.05,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1a120b,
      roughness: 0.9,
    });
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x6e5233,
      roughness: 0.75,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x2b3842,
      roughness: 0.8,
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.6,
      metalness: 0.1,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb98a3c,
      roughness: 0.42,
      metalness: 0.68,
    });
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0x743027, roughness: 0.92 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xc8b99a, roughness: 0.92 });

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.58, 8);
    this.torsoMesh = new THREE.Mesh(torsoGeo, jacketMat);
    this.torsoMesh.position.y = 0.92;
    this.bodyGroup.add(this.torsoMesh);

    // Shirt & Scarf
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.48, 0.035), shirtMat);
    shirt.position.set(0, 0.94, 0.207);
    this.bodyGroup.add(shirt);

    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.045, 8, 16), scarfMat);
    scarf.position.set(0, 1.18, 0.035);
    scarf.rotation.x = Math.PI / 2;
    this.bodyGroup.add(scarf);

    // Head & Hat
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.34, 0);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skinMat);
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), hairMat);
    hairMesh.scale.set(1.05, 1.15, 1.15);
    hairMesh.position.set(0, 0.04, -0.04);
    const beardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.14), hairMat);
    beardMesh.position.set(0, -0.09, 0.09);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x4a3021, roughness: 0.96 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.30, 0.045, 20), hatMat);
    brim.position.set(0, 0.19, 0.005);
    brim.scale.z = 0.82;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.205, 0.20, 16), hatMat);
    crown.position.set(0, 0.30, -0.005);
    this.headGroup.add(headMesh, hairMesh, beardMesh, brim, crown);
    this.bodyGroup.add(this.headGroup);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.54, 6);
    const bootGeo = new THREE.BoxGeometry(0.12, 0.14, 0.22);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(0.11, 0.58, 0);
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.position.y = -0.25;
    const lBootMesh = new THREE.Mesh(bootGeo, leatherMat);
    lBootMesh.position.set(0, -0.50, 0.04);
    this.leftLeg.add(lLegMesh, lBootMesh);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(-0.11, 0.58, 0);
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.position.y = -0.25;
    const rBootMesh = new THREE.Mesh(bootGeo, leatherMat);
    rBootMesh.position.set(0, -0.50, 0.04);
    this.rightLeg.add(rLegMesh, rBootMesh);
    this.bodyGroup.add(this.leftLeg, this.rightLeg);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.48, 6);
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(0.28, 1.15, 0);
    const lArmMesh = new THREE.Mesh(armGeo, jacketMat);
    lArmMesh.position.y = -0.22;
    this.leftArm.add(lArmMesh);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(-0.28, 1.15, 0);
    const rArmMesh = new THREE.Mesh(armGeo, jacketMat);
    rArmMesh.position.y = -0.22;
    this.rightArm.add(rArmMesh);

    // Handheld Vintage Brass Lantern
    this.lanternGroup = new THREE.Group();
    this.lanternGroup.position.set(0, -0.48, 0.22);

    const lCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 8), brassMat);
    const lGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.14, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe088, transparent: true, opacity: 0.65 })
    );
    lGlass.position.y = -0.09;
    const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.05, 8), brassMat);
    lBase.position.y = -0.18;

    this.lanternFlame = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff6600 })
    );
    this.lanternFlame.position.y = -0.09;

    this.lanternLight = new THREE.PointLight(0xff9933, 3.8, 16.0, 1.4);
    this.lanternLight.position.set(0, -0.09, 0);
    this.lanternLight.castShadow = false; // Prevent harsh self-shadow cages

    this.lanternGroup.add(lCap, lGlass, lBase, this.lanternFlame, this.lanternLight);
    this.rightArm.add(this.lanternGroup);

    this.bodyGroup.add(this.leftArm, this.rightArm);
    this.bodyGroup.rotation.y = Math.PI / 2;

    // Build the 3D Carried Surya-Chakra Artifact Prop
    this.buildCarriedRelicProp();

    // Asynchronously load and rig the high-fidelity binary GLTF model
    this.loadGlbModel();
  }

  // ── Build the 3D Carried Surya-Chakra Relic Prop ───────────────────────────
  private buildCarriedRelicProp() {
    this.carriedRelicMesh = new THREE.Group();
    this.carriedRelicMesh.name = 'Carried_Surya_Chakra';

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xdfaa34,
      roughness: 0.38,
      metalness: 0.82,
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x8a5a2b,
      roughness: 0.52,
      metalness: 0.65,
    });

    // Central solar disc with radial rays
    const coreDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 16), goldMat);
    coreDisc.rotation.x = Math.PI / 2;

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 24), bronzeMat);

    // 8 solar rays
    const rayGroup = new THREE.Group();
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 4), goldMat);
      ray.position.set(Math.cos(angle) * 0.17, Math.sin(angle) * 0.17, 0);
      ray.rotation.z = angle - Math.PI / 2;
      rayGroup.add(ray);
    }

    // Gentle warm relic core illumination
    const relicGlow = new THREE.PointLight(0xffb700, 1.2, 2.5, 2.0);
    relicGlow.position.set(0, 0, 0.04);

    this.carriedRelicMesh.add(coreDisc, outerRing, rayGroup, relicGlow);
    this.carriedRelicMesh.scale.set(0.85, 0.85, 0.85);
    this.carriedRelicMesh.visible = false;
    this.mesh.add(this.carriedRelicMesh);
  }

  public setCarryingRelic(carrying: boolean) {
    this.state.isCarryingRelic = carrying;
    if (this.carriedRelicMesh) {
      this.carriedRelicMesh.visible = carrying;
    }
  }

  public isCarryingRelic(): boolean {
    return this.state.isCarryingRelic;
  }

  // ── High-Fidelity PBR Hero Rigging & Skeleton Integration ──────────────────
  private loadGlbModel() {
    if (typeof window === 'undefined') return; // Guard for Node/unit tests
    const loader = new GLTFLoader();

    const primaryUrl = '/assets/characters/rudhra_pbr_hero.glb';
    const fallbackUrl = '/assets/characters/rudhra.glb';

    loader.load(
      primaryUrl,
      (gltf) => {
        try {
          this.setupSkinnedPbrHero(gltf);
        } catch (err) {
          console.warn('[RudhraPlayer] Failed to skin PBR hero, loading fallback:', err);
          this.loadFallbackGlb(fallbackUrl, loader);
        }
      },
      undefined,
      (pbrErr) => {
        console.warn(`[RudhraPlayer] Could not load ${primaryUrl}, trying fallback:`, pbrErr);
        this.loadFallbackGlb(fallbackUrl, loader);
      }
    );
  }

  private loadFallbackGlb(url: string, loader: GLTFLoader) {
    loader.load(
      url,
      (fallbackGltf) => {
        const model = fallbackGltf.scene;
        model.name = 'Rudhra_Fallback_Model';
        this.bodyGroup.visible = false;
        this.gltfModel = model;
        this.mesh.add(model);
        model.position.set(0, 0, 0);
        model.rotation.y = Math.PI / 2;
        this.isGlbLoaded = true;
        console.log('[RudhraPlayer] Rigged fallback model loaded.');
      },
      undefined,
      (err) => {
        console.warn('[RudhraPlayer] Could not load fallback GLB, using procedural primitives:', err);
      }
    );
  }

  private setupSkinnedPbrHero(gltf: any) {
    let heroMesh: THREE.Mesh | null = null;
    gltf.scene.traverse((child: any) => {
      if (child.isMesh && !heroMesh) {
        heroMesh = child as THREE.Mesh;
      }
    });

    if (!heroMesh) {
      throw new Error('No mesh found in rudhra_pbr_hero.glb');
    }

    const srcMesh = heroMesh as THREE.Mesh;
    const geom = srcMesh.geometry.clone();
    const mat = srcMesh.material;

    // Configure PBR material properties: dielectric expedition clothing
    if (mat) {
      if (Array.isArray(mat)) {
        mat.forEach((m) => {
          m.metalness = 0.12;
          m.roughness = 0.80;
          m.needsUpdate = true;
        });
      } else {
        mat.metalness = 0.12;
        mat.roughness = 0.80;
        mat.needsUpdate = true;
      }
    }

    // ── Build Articulated 14-Bone Bipedal Skeleton ──────────────────────────
    // Root / Hips at (0, 0.76, 0)
    const rootBone = new THREE.Bone();
    rootBone.name = 'Hips';
    rootBone.position.set(0, 0.76, 0);

    const spineBone = new THREE.Bone();
    spineBone.name = 'Spine';
    spineBone.position.set(0, 0.22, 0); // world y: 0.98
    rootBone.add(spineBone);

    const chestBone = new THREE.Bone();
    chestBone.name = 'Chest';
    chestBone.position.set(0, 0.22, 0); // world y: 1.20
    spineBone.add(chestBone);

    const headBone = new THREE.Bone();
    headBone.name = 'Head';
    headBone.position.set(0, 0.25, 0); // world y: 1.45
    chestBone.add(headBone);

    // Left Leg (Facing right = player screen right, model +X in rest pose)
    const leftUpLeg = new THREE.Bone();
    leftUpLeg.name = 'LeftUpLeg';
    leftUpLeg.position.set(0.12, -0.02, 0); // world: (0.12, 0.74, 0)
    rootBone.add(leftUpLeg);

    const leftLeg = new THREE.Bone();
    leftLeg.name = 'LeftLeg';
    leftLeg.position.set(0, -0.36, 0); // world: (0.12, 0.38, 0)
    leftUpLeg.add(leftLeg);

    const leftFoot = new THREE.Bone();
    leftFoot.name = 'LeftFoot';
    leftFoot.position.set(0, -0.30, 0.04); // world: (0.12, 0.08, 0.04)
    leftLeg.add(leftFoot);

    // Right Leg
    const rightUpLeg = new THREE.Bone();
    rightUpLeg.name = 'RightUpLeg';
    rightUpLeg.position.set(-0.12, -0.02, 0); // world: (-0.12, 0.74, 0)
    rootBone.add(rightUpLeg);

    const rightLeg = new THREE.Bone();
    rightLeg.name = 'RightLeg';
    rightLeg.position.set(0, -0.36, 0); // world: (-0.12, 0.38, 0)
    rightUpLeg.add(rightLeg);

    const rightFoot = new THREE.Bone();
    rightFoot.name = 'RightFoot';
    rightFoot.position.set(0, -0.30, 0.04); // world: (-0.12, 0.08, 0.04)
    rightLeg.add(rightFoot);

    // Left Arm (Counter-swinging)
    const leftArm = new THREE.Bone();
    leftArm.name = 'LeftArm';
    leftArm.position.set(0.24, -0.10, 0); // world: (0.24, 1.10, 0)
    chestBone.add(leftArm);

    const leftForearm = new THREE.Bone();
    leftForearm.name = 'LeftForearm';
    leftForearm.position.set(0.04, -0.28, 0.02); // world: (0.28, 0.82, 0.02)
    leftArm.add(leftForearm);

    // Right Arm (Holding Lantern)
    const rightArm = new THREE.Bone();
    rightArm.name = 'RightArm';
    rightArm.position.set(-0.24, -0.10, 0); // world: (-0.24, 1.10, 0)
    chestBone.add(rightArm);

    const rightForearm = new THREE.Bone();
    rightForearm.name = 'RightForearm';
    rightForearm.position.set(-0.06, -0.28, 0.05); // world: (-0.30, 0.82, 0.05)
    rightArm.add(rightForearm);

    const bones = [
      rootBone,     // 0: Hips
      spineBone,    // 1: Spine
      chestBone,    // 2: Chest
      headBone,     // 3: Head
      leftUpLeg,    // 4: LeftUpLeg
      leftLeg,      // 5: LeftLeg
      leftFoot,     // 6: LeftFoot
      rightUpLeg,   // 7: RightUpLeg
      rightLeg,     // 8: RightLeg
      rightFoot,    // 9: RightFoot
      leftArm,      // 10: LeftArm
      leftForearm,  // 11: LeftForearm
      rightArm,     // 12: RightArm
      rightForearm, // 13: RightForearm
    ];

    this.bones = {
      Hips: rootBone,
      Spine: spineBone,
      Chest: chestBone,
      Head: headBone,
      LeftUpLeg: leftUpLeg,
      LeftLeg: leftLeg,
      LeftFoot: leftFoot,
      RightUpLeg: rightUpLeg,
      RightLeg: rightLeg,
      RightFoot: rightFoot,
      LeftArm: leftArm,
      LeftForearm: leftForearm,
      RightArm: rightArm,
      RightForearm: rightForearm,
    };

    // ── Generate Precise Anatomical Skin Weights ─────────────────────────────
    const pos = geom.getAttribute('position');
    const skinIndices = new Uint16Array(pos.count * 4);
    const skinWeights = new Float32Array(pos.count * 4);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      if (y < 0.74) {
        // Legs & Boots
        if (x >= 0) {
          // Left Leg
          if (y < 0.12) {
            skinIndices[i * 4] = 6; // LeftFoot
            skinWeights[i * 4] = 1.0;
          } else if (y < 0.38) {
            const t = (y - 0.12) / (0.38 - 0.12);
            skinIndices[i * 4] = 5; // LeftLeg
            skinWeights[i * 4] = 1.0 - (1 - t) * 0.4;
            skinIndices[i * 4 + 1] = 6;
            skinWeights[i * 4 + 1] = (1 - t) * 0.4;
          } else {
            const t = (y - 0.38) / (0.74 - 0.38);
            skinIndices[i * 4] = 4; // LeftUpLeg
            skinWeights[i * 4] = 1.0 - t * 0.35;
            skinIndices[i * 4 + 1] = 0; // Hips
            skinWeights[i * 4 + 1] = t * 0.35;
          }
        } else {
          // Right Leg
          if (y < 0.12) {
            skinIndices[i * 4] = 9; // RightFoot
            skinWeights[i * 4] = 1.0;
          } else if (y < 0.38) {
            const t = (y - 0.12) / (0.38 - 0.12);
            skinIndices[i * 4] = 8; // RightLeg
            skinWeights[i * 4] = 1.0 - (1 - t) * 0.4;
            skinIndices[i * 4 + 1] = 9;
            skinWeights[i * 4 + 1] = (1 - t) * 0.4;
          } else {
            const t = (y - 0.38) / (0.74 - 0.38);
            skinIndices[i * 4] = 7; // RightUpLeg
            skinWeights[i * 4] = 1.0 - t * 0.35;
            skinIndices[i * 4 + 1] = 0; // Hips
            skinWeights[i * 4 + 1] = t * 0.35;
          }
        }
      } else if (y >= 0.74 && y < 0.95) {
        // Pelvis, Belt, Satchel & Lower Torso
        skinIndices[i * 4] = 0; // Hips
        skinWeights[i * 4] = 0.75;
        skinIndices[i * 4 + 1] = 1; // Spine
        skinWeights[i * 4 + 1] = 0.25;
      } else if (y >= 0.95 && y < 1.25) {
        // Upper Torso & Arms
        if (x > 0.22) {
          if (y > 1.08) {
            skinIndices[i * 4] = 10; // LeftArm
            skinWeights[i * 4] = 0.85;
            skinIndices[i * 4 + 1] = 2; // Chest
            skinWeights[i * 4 + 1] = 0.15;
          } else {
            skinIndices[i * 4] = 11; // LeftForearm
            skinWeights[i * 4] = 1.0;
          }
        } else if (x < -0.22) {
          if (y > 1.08) {
            skinIndices[i * 4] = 12; // RightArm
            skinWeights[i * 4] = 0.85;
            skinIndices[i * 4 + 1] = 2; // Chest
            skinWeights[i * 4 + 1] = 0.15;
          } else {
            skinIndices[i * 4] = 13; // RightForearm
            skinWeights[i * 4] = 1.0;
          }
        } else {
          const t = (y - 0.95) / (1.25 - 0.95);
          skinIndices[i * 4] = 1; // Spine
          skinWeights[i * 4] = 1.0 - t;
          skinIndices[i * 4 + 1] = 2; // Chest
          skinWeights[i * 4 + 1] = t;
        }
      } else {
        // Neck, Beard, Hair, Head, Wide-Brimmed Hat
        skinIndices[i * 4] = 3; // Head
        skinWeights[i * 4] = 1.0;
      }
    }

    geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    // Construct SkinnedMesh and bind Skeleton
    this.skinnedMesh = new THREE.SkinnedMesh(geom, mat);
    this.skinnedMesh.name = 'Rudhra_PBR_Hero_Skinned';
    this.skinnedMesh.castShadow = true;
    this.skinnedMesh.receiveShadow = true;

    this.skeleton = new THREE.Skeleton(bones);
    this.skinnedMesh.add(rootBone);
    this.skinnedMesh.bind(this.skeleton);

    // Group container for the model
    const heroGroup = new THREE.Group();
    heroGroup.name = 'Rudhra_PBR_Hero_Group';
    heroGroup.add(this.skinnedMesh);

    // Hide procedural primitives and mount the high-detail articulated character
    this.bodyGroup.visible = false;
    this.gltfModel = heroGroup;
    this.mesh.add(heroGroup);

    // Set initial model orientation
    heroGroup.position.set(0, 0, 0);
    heroGroup.rotation.y = Math.PI / 2;

    // Attach Lantern Point Light and Flame to Right Forearm (lantern hand)
    const lanternAnchor = new THREE.Group();
    lanternAnchor.name = 'PBR_Lantern_Anchor';
    // Offset relative to RightForearm to place emitter at lantern glass
    lanternAnchor.position.set(0, -0.12, 0.08);
    rightForearm.add(lanternAnchor);

    lanternAnchor.add(this.lanternLight);
    this.lanternLight.position.set(0, 0, 0);

    lanternAnchor.add(this.lanternFlame);
    this.lanternFlame.position.set(0, 0, 0);
    this.lanternFlame.scale.set(0.65, 0.85, 0.65);

    // Soft warm chest fill light for jacket & beard
    const chestFill = new THREE.PointLight(0xffa533, 1.4, 3.2, 1.6);
    chestFill.name = 'Chest_Fill_Light';
    chestFill.position.set(0, 0.12, 0.15);
    chestBone.add(chestFill);

    this.isSkinned = true;
    this.isGlbLoaded = true;
    console.log('[RudhraPlayer] High-fidelity PBR Hero successfully rigged with 14 articulated bones!');
  }

  public playInteract() {
    this.isInteracting = true;
    this.interactTimer = 0.0;
  }

  public setPosition(x: number, y: number) {
    this.state.x = x;
    this.state.y = y;
    this.mesh.position.set(x, y, 0);
  }

  public getLanternWorldPosition(target: THREE.Vector3): THREE.Vector3 {
    if (this.isGlbLoaded && this.gltfModel) {
      const pbrAnchor = this.gltfModel.getObjectByName('PBR_Lantern_Anchor');
      if (pbrAnchor) {
        pbrAnchor.getWorldPosition(target);
        return target;
      }
    }
    this.lanternGroup.getWorldPosition(target);
    return target;
  }

  // ── Kinematics & Physics Integration ──────────────────────────────────────
  public update(
    dt: number,
    inputs: { left: boolean; right: boolean; jump: boolean; crouch: boolean; sprint: boolean },
    colliders: { yMin: number; yMax: number; xMin: number; xMax: number; isPlatform?: boolean }[],
  ) {
    if (this.state.isDead || !this.state.canMove) {
      this.state.vx = 0;
      this.updateAnimations(dt);
      return;
    }

    // 1. Input Processing
    const moveX = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
    this.state.isCrouching = inputs.crouch;
    this.state.isSprinting = inputs.sprint && !inputs.crouch && moveX !== 0;

    const targetSpeed = this.state.isCrouching
      ? this.RUN_SPEED * 0.45
      : this.state.isSprinting
        ? this.SPRINT_SPEED
        : this.RUN_SPEED;

    // Horizontal acceleration & friction
    if (moveX !== 0) {
      this.state.vx = THREE.MathUtils.damp(this.state.vx, moveX * targetSpeed, this.ACCEL, dt);
      this.state.facing = moveX > 0 ? 1 : -1;
    } else {
      this.state.vx = THREE.MathUtils.damp(this.state.vx, 0, this.FRICTION, dt);
    }

    // Jump buffering and coyote time
    if (this.state.isGrounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (inputs.jump) {
      this.jumpBufferTimer = 0.12;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Jump execution
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.state.isCrouching) {
      this.state.vy = this.JUMP_SPEED;
      this.state.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      audioManager.playJump();
    }

    // Variable jump cut (releasing Space early produces a controlled shorter hop)
    if (!inputs.jump && this.state.vy > 1.5) {
      this.state.vy *= 0.65;
    }

    // Gravity
    if (!this.state.isGrounded) {
      this.state.vy -= this.GRAVITY * dt;
    }

    // 2. Physics Integration & AABB Collision
    const oldX = this.state.x;
    const oldY = this.state.y;
    const nextX = oldX + this.state.vx * dt;
    const nextY = oldY + this.state.vy * dt;

    const currentHeight = this.state.isCrouching ? this.CROUCH_HEIGHT : this.STAND_HEIGHT;

    // Horizontal check
    let resolvedX = nextX;
    for (const box of colliders) {
      if (box.isPlatform) continue;
      if (oldY + currentHeight > box.yMin && oldY < box.yMax) {
        if (oldX + this.RADIUS <= box.xMin && nextX + this.RADIUS > box.xMin) {
          resolvedX = box.xMin - this.RADIUS;
          this.state.vx = 0;
        } else if (oldX - this.RADIUS >= box.xMax && nextX - this.RADIUS < box.xMax) {
          resolvedX = box.xMax + this.RADIUS;
          this.state.vx = 0;
        }
      }
    }
    this.state.x = resolvedX;

    // Vertical check (floors, ceilings, platforms)
    let resolvedY = nextY;
    let groundedThisFrame = false;

    for (const box of colliders) {
      const overlapsX = this.state.x + this.RADIUS > box.xMin && this.state.x - this.RADIUS < box.xMax;
      if (!overlapsX) continue;

      // Landing on floor or platform top
      if (this.state.vy <= 0 && oldY >= box.yMax - 0.25 && nextY <= box.yMax) {
        resolvedY = box.yMax;
        this.state.vy = 0;
        groundedThisFrame = true;
      }
      // Hitting ceiling (solid only, not one-way platforms)
      else if (!box.isPlatform && this.state.vy > 0 && oldY + currentHeight <= box.yMin + 0.18 && nextY + currentHeight >= box.yMin) {
        resolvedY = box.yMin - currentHeight;
        this.state.vy = 0;
      }
    }

    // Step-down snapping for stairs and gentle slopes (preserves grounded state walking down steps)
    if (this.state.isGrounded && !inputs.jump && this.state.vy <= 0 && !groundedThisFrame) {
      let bestStepY = -Infinity;
      for (const box of colliders) {
        const overlapsX = this.state.x + this.RADIUS > box.xMin && this.state.x - this.RADIUS < box.xMax;
        if (!overlapsX) continue;
        if (box.yMax <= oldY + 0.05 && box.yMax >= oldY - 0.50) {
          if (box.yMax > bestStepY) {
            bestStepY = box.yMax;
          }
        }
      }
      if (bestStepY > -Infinity) {
        resolvedY = bestStepY;
        this.state.vy = 0;
        groundedThisFrame = true;
      }
    }

    if (!this.state.isGrounded && groundedThisFrame) {
      audioManager.playLand();
    }
    this.state.isGrounded = groundedThisFrame;
    this.state.y = resolvedY;

    // Update 3D mesh position
    this.mesh.position.set(this.state.x, this.state.y, 0);

    // Footstep audio timing synced with cadence
    if (this.state.isGrounded && Math.abs(this.state.vx) > 0.4) {
      const stepFreq = this.state.isSprinting ? 1.5 : 1.0;
      this.footstepTimer += dt * stepFreq;
      if (this.footstepTimer >= 0.32) {
        this.footstepTimer = 0;
        audioManager.playFootstep();
      }
    } else {
      this.footstepTimer = 0.25;
    }

    // 3. Update Articulated Animations & Lantern
    this.updateAnimations(dt);
  }

  // ── Articulated Bipedal Animation Engine ──────────────────────────────────
  private updateAnimations(dt: number) {
    this.animTimer += dt;

    // Update interaction timer
    if (this.isInteracting) {
      this.interactTimer += dt;
      if (this.interactTimer > 1.4) {
        this.isInteracting = false;
        this.interactTimer = 0;
      }
    }

    // Smooth crouch blend (0 = standing, 1 = crouching)
    const targetCrouch = this.state.isCrouching ? 1.0 : 0.0;
    this.crouchProgress = THREE.MathUtils.damp(this.crouchProgress, targetCrouch, 10.0, dt);

    // Traversal speed and normalized cadence
    const speed = Math.abs(this.state.vx);
    const isMoving = this.state.isGrounded && speed > 0.3;
    const strideFreq = this.state.isSprinting ? 12.5 : 8.8;

    if (isMoving) {
      // Step phase advances strictly proportionally to forward movement velocity
      this.walkPhase += dt * strideFreq * (speed / (this.state.isSprinting ? this.SPRINT_SPEED : this.RUN_SPEED));
    } else {
      // Settle walk phase smoothly toward nearest idle contact
      this.walkPhase = THREE.MathUtils.damp(this.walkPhase, Math.round(this.walkPhase / Math.PI) * Math.PI, 6.0, dt);
    }

    // ── Update Carried Surya-Chakra Relic Prop ─────────────────────────────
    if (this.carriedRelicMesh && this.carriedRelicMesh.visible) {
      // Mount relic at chest / front satchel position, facing camera
      const relicOffsetY = this.STAND_HEIGHT * 0.58 - this.crouchProgress * 0.28;
      const facingOffset = this.state.facing * 0.16;
      this.carriedRelicMesh.position.set(facingOffset, relicOffsetY, 0.18);
      // Subtle organic levitation / wobble
      this.carriedRelicMesh.rotation.z = Math.sin(this.animTimer * 3.0) * 0.08;
      this.carriedRelicMesh.rotation.y = this.state.facing > 0 ? 0.2 : -0.2;
    }

    // ── Path A: Articulated Skinned PBR Hero Model ─────────────────────────
    if (this.isSkinned && this.gltfModel && this.skeleton) {
      const b = this.bones;

      // 1. Facing Orientation (smooth turn to +X or -X)
      const targetRotY = this.state.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.gltfModel.rotation.y = THREE.MathUtils.damp(this.gltfModel.rotation.y, targetRotY, 12.0, dt);

      // 2. Base Idle & Breathing Cycle
      const breathe = Math.sin(this.animTimer * 2.2) * 0.02;

      // 3. Crouching Height & Posture Adjustment
      // Drop hips by 0.32m when crouching so Rudhra's head drops to 0.95m
      const hipHeight = 0.76 - this.crouchProgress * 0.32;
      let hipOffsetY = 0.0;
      let hipOffsetZ = 0.0;

      // Joint angles
      let lUpLegRotX = 0.0;
      let lLegRotX = 0.0;
      let lFootRotX = 0.0;

      let rUpLegRotX = 0.0;
      let rLegRotX = 0.0;
      let rFootRotX = 0.0;

      let spineRotX = 0.0;
      let chestRotX = 0.0;
      let headRotX = 0.0;

      let lArmRotX = 0.0;
      let rArmRotX = 0.0;

      if (!this.state.isGrounded) {
        // ── AIRBORNE (Jumping & Falling) ──────────────────────────────────
        const vy = this.state.vy;
        if (vy > 0.5) {
          // Takeoff & Rise: Tuck legs, arms reach up slightly
          lUpLegRotX = -0.45;
          lLegRotX = -0.50;
          rUpLegRotX = -0.30;
          rLegRotX = -0.40;
          spineRotX = -0.08;
          chestRotX = -0.05;
          lArmRotX = -0.55;
          rArmRotX = -0.25;
        } else {
          // Apex & Falling: Extend legs toward contact, flare arms
          lUpLegRotX = -0.20;
          lLegRotX = -0.25;
          rUpLegRotX = -0.20;
          rLegRotX = -0.25;
          spineRotX = 0.12;
          chestRotX = 0.08;
          lArmRotX = -0.30;
          rArmRotX = -0.20;
        }
      } else if (isMoving) {
        // ── GROUNDED ARTICULATED LOCOMOTION (Walk & Run) ───────────────────
        const strideAngle = this.state.isSprinting ? 0.68 : 0.46;
        const leftCycle = Math.sin(this.walkPhase);
        const rightCycle = Math.sin(this.walkPhase + Math.PI);

        // Alternating Thigh Swing
        lUpLegRotX = leftCycle * strideAngle;
        rUpLegRotX = rightCycle * strideAngle;

        // Knee Flexion (bends backward during swing phase, straightens on stance)
        // Knee flex is always <= 0 (backward bend)
        lLegRotX = Math.min(0, -Math.sin(this.walkPhase + 0.4) * (strideAngle * 1.3));
        rLegRotX = Math.min(0, -Math.sin(this.walkPhase + Math.PI + 0.4) * (strideAngle * 1.3));

        // Ankle / Foot Pitch for Believable Ground Contact
        lFootRotX = -leftCycle * 0.25;
        rFootRotX = -rightCycle * 0.25;

        // Hip Vertical Dip & Cadence Bob
        hipOffsetY = -Math.abs(Math.sin(this.walkPhase * 2.0)) * (this.state.isSprinting ? 0.04 : 0.025);
        // Hip Lateral Sway
        hipOffsetZ = Math.sin(this.walkPhase) * 0.018;

        // Torso Forward Pitch Lean into Speed
        const forwardLean = (speed / this.SPRINT_SPEED) * 0.14;
        spineRotX = forwardLean + breathe;
        chestRotX = forwardLean * 0.5;

        // Left Arm Natural Counter-Swing
        lArmRotX = -leftCycle * (strideAngle * 0.85);

        // Right Arm (Lantern Hand) Controlled Stabilization
        // Holds lantern steadily forward-down, subtle organic swing
        rArmRotX = -0.20 + Math.sin(this.walkPhase * 0.5) * 0.08;
      } else {
        // ── IDLE POSTURE ──────────────────────────────────────────────────
        spineRotX = breathe;
        chestRotX = breathe * 0.5;
        headRotX = -breathe * 0.3;
        lArmRotX = -0.15 + breathe;
        rArmRotX = -0.25; // Resting lantern grip
      }

      // Apply Crouching Pose Modifiers
      if (this.crouchProgress > 0.01) {
        const cp = this.crouchProgress;
        // Hips tuck, knees bend forward, spine leans down
        lUpLegRotX += cp * -0.75;
        lLegRotX += cp * -1.05;
        rUpLegRotX += cp * -0.75;
        rLegRotX += cp * -1.05;
        spineRotX += cp * 0.48;
        chestRotX += cp * 0.25;
        headRotX += cp * -0.35; // Head looks forward under low passage
        rArmRotX += cp * 0.20;  // Lower lantern near ground
      }

      // Interaction Pose
      if (this.isInteracting) {
        const progress = Math.sin((this.interactTimer / 1.4) * Math.PI);
        spineRotX += progress * 0.22;
        headRotX += progress * 0.30;
        rArmRotX += progress * -0.65; // Reach right arm forward toward socket/altar
      }

      // Apply bone positions and rotations smoothly with damp
      b.Hips.position.y = THREE.MathUtils.damp(b.Hips.position.y, hipHeight + hipOffsetY, 12.0, dt);
      b.Hips.position.z = THREE.MathUtils.damp(b.Hips.position.z, hipOffsetZ, 12.0, dt);

      b.Spine.rotation.x = THREE.MathUtils.damp(b.Spine.rotation.x, spineRotX, 12.0, dt);
      b.Chest.rotation.x = THREE.MathUtils.damp(b.Chest.rotation.x, chestRotX, 12.0, dt);
      b.Head.rotation.x = THREE.MathUtils.damp(b.Head.rotation.x, headRotX, 12.0, dt);

      b.LeftUpLeg.rotation.x = THREE.MathUtils.damp(b.LeftUpLeg.rotation.x, lUpLegRotX, 16.0, dt);
      b.LeftLeg.rotation.x = THREE.MathUtils.damp(b.LeftLeg.rotation.x, lLegRotX, 16.0, dt);
      b.LeftFoot.rotation.x = THREE.MathUtils.damp(b.LeftFoot.rotation.x, lFootRotX, 16.0, dt);

      b.RightUpLeg.rotation.x = THREE.MathUtils.damp(b.RightUpLeg.rotation.x, rUpLegRotX, 16.0, dt);
      b.RightLeg.rotation.x = THREE.MathUtils.damp(b.RightLeg.rotation.x, rLegRotX, 16.0, dt);
      b.RightFoot.rotation.x = THREE.MathUtils.damp(b.RightFoot.rotation.x, rFootRotX, 16.0, dt);

      b.LeftArm.rotation.x = THREE.MathUtils.damp(b.LeftArm.rotation.x, lArmRotX, 14.0, dt);
      b.RightArm.rotation.x = THREE.MathUtils.damp(b.RightArm.rotation.x, rArmRotX, 14.0, dt);

      // Organic subtle lantern flame flicker
      const flicker = 1.0 + Math.sin(this.animTimer * 18.0) * 0.08 + Math.cos(this.animTimer * 31.0) * 0.05;
      this.lanternLight.intensity = (this.state.isLanternActive ? 3.8 : 0.0) * flicker;
      if (this.lanternFlame) {
        this.lanternFlame.scale.set(flicker * 0.65, flicker * 0.85, flicker * 0.65);
      }
      return;
    }

    // ── Path B: Procedural Primitives Fallback (Node tests & pre-load) ─────
    const targetRotY = this.state.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    this.bodyGroup.rotation.y = THREE.MathUtils.damp(this.bodyGroup.rotation.y, targetRotY, 12.0, dt);

    const targetScaleY = this.state.isCrouching ? 0.65 : 1.0;
    this.bodyGroup.scale.y = THREE.MathUtils.damp(this.bodyGroup.scale.y, targetScaleY, 10.0, dt);

    if (this.state.isGrounded && Math.abs(this.state.vx) > 0.3) {
      const angle = Math.sin(this.walkPhase) * (this.state.isSprinting ? 0.65 : 0.45);
      this.leftLeg.rotation.x = angle;
      this.rightLeg.rotation.x = -angle;
      this.leftArm.rotation.x = -angle * 0.8;
      this.rightArm.rotation.x = -0.35 + Math.sin(this.walkPhase * 0.5) * 0.12;
      this.torsoMesh.position.y = 0.92 + Math.abs(Math.sin(this.walkPhase)) * 0.04;
    } else if (!this.state.isGrounded) {
      this.leftLeg.rotation.x = 0.35;
      this.rightLeg.rotation.x = -0.25;
      this.leftArm.rotation.x = -0.65;
      this.rightArm.rotation.x = -0.45;
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0, 8.0, dt);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0, 8.0, dt);
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 8.0, dt);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, -0.3, 8.0, dt);
      this.torsoMesh.position.y = 0.92 + Math.sin(this.animTimer * 2.2) * 0.015;
    }

    const flicker = 1.0 + Math.sin(this.animTimer * 18.0) * 0.08 + Math.cos(this.animTimer * 31.0) * 0.05;
    this.lanternLight.intensity = (this.state.isLanternActive ? 3.8 : 0.0) * flicker;
    this.lanternFlame.scale.set(flicker, flicker * 1.2, flicker);
  }
}

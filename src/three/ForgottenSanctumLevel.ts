import * as THREE from 'three';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';
import { MuralSystem } from './MuralSystem';

export interface LevelCollider {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  isPlatform?: boolean;
}

export interface InteractionTarget {
  id: string;
  type: 'artifact' | 'inscription' | 'mechanism' | 'checkpoint' | 'dial' | 'exit_gate' | 'secret_gem' | 'story_altar';
  x: number;
  y: number;
  prompt: string;
  data?: Record<string, unknown>;
}

export interface TorchData {
  light: THREE.PointLight;
  flameMesh: THREE.Mesh;
  baseX: number;
  baseY: number;
  baseZ: number;
  isIgnited: boolean;
}

export class ForgottenSanctumLevel {
  public group: THREE.Group;
  public colliders: LevelCollider[] = [];
  public interactionTargets: InteractionTarget[] = [];
  public torches: TorchData[] = [];
  public godRays: THREE.Mesh[] = [];

  // Mural System with Dynamic Lantern Illumination
  public muralSystem: MuralSystem;

  // Scene 01 Entities: The Forgotten Entrance & Surya-Chakra
  public artifactMesh?: THREE.Group;
  public hasArtifact: boolean = false;

  // Scene 05 Entities: The Sealed Celestial Mechanism
  public mechanismGroup?: THREE.Group;
  public mechanismRings?: THREE.Mesh;
  public mechanismGlow?: THREE.PointLight;
  public isMechanismSolved: boolean = false;

  // Scene 07 Traversal & Bridge Entities
  public crumblingPlatformMesh?: THREE.Mesh;
  public crumblingTimer: number = -1;
  public isCrumblingCollapsed: boolean = false;
  private crumblingInitialPos = new THREE.Vector3(99.5, -7.2, 0);

  public pendulumBlade?: THREE.Group;
  public pendulumHitBox?: { x: number; y: number; radius: number };

  public secretGemMesh?: THREE.Group;
  public isGemCollected: boolean = false;

  // Inner Sanctum Obstacles (Beyond Bridge Archway)
  public arrowTrapActive = false;
  public arrowMesh?: THREE.Mesh;
  public arrowPressurePlate?: { xMin: number; xMax: number; triggered: boolean };

  public fireballMesh?: THREE.Mesh;
  public fireballActive = true;
  private fireballTimer = 0;

  public puzzleDials: { mesh: THREE.Mesh; symbol: string; angle: number; correctAngle: number }[] = [];
  public isPuzzleSolved: boolean = false;

  public vaultGateLeft?: THREE.Mesh;
  public vaultGateRight?: THREE.Mesh;
  public isVaultOpened: boolean = false;

  public waterMesh?: THREE.Mesh;

  // Materials Cache
  private stoneMat!: THREE.MeshStandardMaterial;
  private darkStoneMat!: THREE.MeshStandardMaterial;
  private mossStoneMat!: THREE.MeshStandardMaterial;
  private goldMat!: THREE.MeshStandardMaterial;
  private bronzeMat!: THREE.MeshStandardMaterial;
  private woodMat!: THREE.MeshStandardMaterial;

  private animTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.muralSystem = new MuralSystem();
    this.group.add(this.muralSystem.group);

    this.initMaterials();
    this.buildLevel();
  }

  private initMaterials() {
    this.stoneMat = new THREE.MeshStandardMaterial({
      color: 0x9e8362,
      roughness: 0.88,
      metalness: 0.05,
    });
    this.darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x241d16,
      roughness: 0.92,
      metalness: 0.02,
    });
    this.mossStoneMat = new THREE.MeshStandardMaterial({
      color: 0x48583c,
      roughness: 0.85,
      metalness: 0.02,
    });
    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.85,
    });
    this.bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x8a6332,
      roughness: 0.55,
      metalness: 0.70,
    });
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2919,
      roughness: 0.90,
    });
  }

  private buildLevel() {
    this.hasArtifact = saveManager.hasRelic('relic_sun_disc_fragment');
    this.isMechanismSolved = saveManager.isEventAwarded('mech_artifact_socket');
    this.isGemCollected = saveManager.hasRelic('relic_vedic_sapphire');

    // ── Build All 7 Connected Scenes in Seamless Continuous Progression ─────
    this.buildScene01_ForgottenEntrance();
    this.buildScene02_DescentStaircase();
    this.buildScene03_WordsOfTheAncients();
    this.buildScene04_DeeperPassage();
    this.buildScene05_SealedMechanism();
    this.buildScene06_SanctumAwakens();
    this.buildScene07_MonumentalCrossing();

    this.buildFarBackgroundScenery();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 01 — THE FORGOTTEN ENTRANCE (X = -5m to 14m, Y = 0m)
  // ═══════════════════════════════════════════════════════════════════════════
  private buildScene01_ForgottenEntrance() {
    // 1. Walkable Temple Entrance Floor
    const floorGeo = new THREE.BoxGeometry(19.0, 1.5, 6.0);
    const floorMesh = new THREE.Mesh(floorGeo, this.mossStoneMat);
    floorMesh.position.set(4.5, -0.75, 0);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    this.colliders.push({
      xMin: -5.0,
      xMax: 14.0,
      yMin: -1.5,
      yMax: 0.0,
    });

    // 2. Monolithic Left Boundary Wall & Cliff
    const cliffGeo = new THREE.BoxGeometry(2.0, 12.0, 7.0);
    const cliff = new THREE.Mesh(cliffGeo, this.darkStoneMat);
    cliff.position.set(-5.5, 5.0, 0);
    this.group.add(cliff);

    this.colliders.push({
      xMin: -6.5,
      xMax: -4.5,
      yMin: 0.0,
      yMax: 10.0,
    });

    // 3. Ancient Temple Entrance Portal Arch (X = 1.0m)
    this.createMonumentalArch(1.0, 0.0, -1.2, true);

    // Fluted Temple Pillars
    this.createPillar(4.0, 0.0, -1.2);
    this.createPillar(9.0, 0.0, -1.2);
    this.createPillar(13.0, 0.0, -1.2);

    // Foreground Framing Pillars
    this.createForegroundPillar(2.5, 0.0);
    this.createForegroundPillar(12.5, 0.0);

    // Overgrown Banyan Roots framing the entrance
    for (let r = 0; r < 5; r++) {
      const rootX = -1.0 + r * 2.8;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.5, 6), this.woodMat);
      root.position.set(rootX, 2.5, -1.6 + (r % 2) * 0.4);
      root.rotation.z = (r % 2 === 0 ? 0.12 : -0.15);
      this.group.add(root);
    }

    // 4. Ancient Ceremonial Altar Pedestal with Surya-Chakra Relic (X = 6.0m)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(6.0, 0.0, 0);

    const baseGeo = new THREE.BoxGeometry(0.9, 0.8, 0.9);
    const baseMesh = new THREE.Mesh(baseGeo, this.stoneMat);
    baseMesh.position.y = 0.4;
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    pedestalGroup.add(baseMesh);

    // Carved capital rim
    const rimGeo = new THREE.BoxGeometry(1.05, 0.12, 1.05);
    const rimMesh = new THREE.Mesh(rimGeo, this.bronzeMat);
    rimMesh.position.y = 0.86;
    pedestalGroup.add(rimMesh);

    // The Surya-Chakra Relic resting on the altar
    this.artifactMesh = new THREE.Group();
    this.artifactMesh.position.set(0, 1.15, 0);

    const coreDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 20), this.goldMat);
    coreDisc.rotation.x = Math.PI / 2;

    const ringGeo = new THREE.TorusGeometry(0.32, 0.03, 10, 28);
    const ringMesh = new THREE.Mesh(ringGeo, this.bronzeMat);

    // 8 Solar Rays
    const rays = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.10, 4), this.goldMat);
      ray.position.set(Math.cos(angle) * 0.36, Math.sin(angle) * 0.36, 0);
      ray.rotation.z = angle - Math.PI / 2;
      rays.add(ray);
    }

    const relicLight = new THREE.PointLight(0xffb700, 2.8, 6.0, 1.6);
    this.artifactMesh.add(coreDisc, ringMesh, rays, relicLight);

    if (this.hasArtifact) {
      this.artifactMesh.visible = false;
    }
    pedestalGroup.add(this.artifactMesh);
    this.group.add(pedestalGroup);

    this.interactionTargets.push({
      id: 'target_artifact',
      type: 'artifact',
      x: 6.0,
      y: 0.6,
      prompt: '[E] TAKE SURYA-CHAKRA RELIC',
    });

    // Rear jungle temple cliff wall
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(19.0, 10.0, 1.0), this.darkStoneMat);
    rearWall.position.set(4.5, 4.5, -2.4);
    this.group.add(rearWall);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 02 — DESCENT INTO DARKNESS (X = 14m to 48m, Y = 0m to -7.2m)
  // Genuinely long, multi-flight enclosed staircase with Ramayana & Mahabharata murals
  // ═══════════════════════════════════════════════════════════════════════════
  private buildScene02_DescentStaircase() {
    // ── Flight 1: 8 Steps (X = 14.0m to 21.2m, Y = 0.0m to -2.4m) ─────────
    this.buildStairFlight(14.0, 0.0, 8, 0.9, 0.3);

    // ── Landing 1: Upper Terrace (X = 21.2m to 25.0m, Y = -2.4m) ──────────
    this.buildLandingSlab(23.1, -2.4, 3.8);

    // Mural 1: Ramayana — Sri Rama, Sita, and Lakshmana in Dandakaranya
    this.muralSystem.createMural({
      id: 'mural_ramayana_forest',
      epic: 'Ramayana',
      title: 'Dandakaranya Forest Journey',
      sanskritTitle: '॥ श्रीराम सीता लक्ष्मण वनवास गमनम् ॥',
      description: 'Sri Rama, Sita, and Lakshmana traversing the sacred wilderness with unwavering devotion to dharma.',
      x: 23.1,
      y: -0.9,
      z: -1.82,
      width: 3.4,
      height: 2.1,
    });

    // Pillars flanking Landing 1
    this.createPillar(21.4, -2.4, -1.2);
    this.createPillar(24.8, -2.4, -1.2);

    // ── Flight 2: 8 Steps (X = 25.0m to 32.2m, Y = -2.4m to -4.8m) ────────
    this.buildStairFlight(25.0, -2.4, 8, 0.9, 0.3);

    // ── Landing 2: Central Mandapa (X = 32.2m to 36.5m, Y = -4.8m) ────────
    this.buildLandingSlab(34.35, -4.8, 4.3);

    // Mural 2: Ramayana — Hanuman's Ocean Leap to Lanka
    this.muralSystem.createMural({
      id: 'mural_hanuman_leap',
      epic: 'Ramayana',
      title: "Hanuman's Oceanic Leap",
      sanskritTitle: '॥ श्री भक्त हनुमान समुद्र तरणम् ॥',
      description: 'Sri Hanuman leaping across the roaring ocean toward Lanka, buoyed by peerless courage and devotion.',
      x: 34.35,
      y: -3.3,
      z: -1.82,
      width: 3.4,
      height: 2.1,
    });

    // ── Flight 3: 8 Steps (X = 36.5m to 43.7m, Y = -4.8m to -7.2m) ────────
    this.buildStairFlight(36.5, -4.8, 8, 0.9, 0.3);

    // ── Landing 3: Foot of the Monumental Descent (X = 43.7m to 48.0m, Y = -7.2m)
    this.buildLandingSlab(45.85, -7.2, 4.3);

    // Mural 4: Mahabharata — Krishna & Arjuna Chariot (Gitopadesha)
    this.muralSystem.createMural({
      id: 'mural_gita_chariot',
      epic: 'Mahabharata',
      title: 'Gitopadesha on Kurukshetra',
      sanskritTitle: '॥ कुरुक्षेत्रे श्रीमद्भगवद्गीता उपदेशः ॥',
      description: 'Bhagavan Sri Krishna imparting eternal wisdom to Arjuna on the sacred chariot amidst two armies.',
      x: 45.85,
      y: -5.7,
      z: -1.82,
      width: 3.4,
      height: 2.1,
    });

    // Additional Wall Murals along Flights:
    // Mural 3: Rama Setu Causeway (above flight 2 transition)
    this.muralSystem.createMural({
      id: 'mural_rama_setu',
      epic: 'Ramayana',
      title: 'Building of the Rama Setu',
      sanskritTitle: '॥ श्रीराम सेतु निर्माणम् ॥',
      description: 'The heroic Vanaras inscribing Rama on stone boulders and building the causeway to victory.',
      x: 28.6,
      y: -2.1,
      z: -1.82,
      width: 3.0,
      height: 1.8,
    });

    // Mural 5: Arjuna with Gandiva Bow (above flight 3 transition)
    this.muralSystem.createMural({
      id: 'mural_arjuna_gandiva',
      epic: 'Mahabharata',
      title: 'Arjuna and the Celestial Gandiva',
      sanskritTitle: '॥ गाण्डीवधारी अर्जुनः ॥',
      description: 'Arjuna standing resolute with the Gandiva bow, defender of righteous truth and cosmic balance.',
      x: 40.1,
      y: -4.5,
      z: -1.82,
      width: 3.0,
      height: 1.8,
    });

    // ── Continuous Monolithic Retaining Walls & Flanking Balustrades ────────
    // Continuous Rear Wall (X = 14m to 48m, Z = -2.25m)
    const stairWallGeo = new THREE.BoxGeometry(34.5, 14.0, 0.8);
    const stairWall = new THREE.Mesh(stairWallGeo, this.darkStoneMat);
    stairWall.position.set(31.0, -1.0, -2.25);
    stairWall.receiveShadow = true;
    this.group.add(stairWall);

    // Continuous Front & Back Balustrades with Carved Newel Posts
    for (const zSide of [-1.75, 1.75]) {
      const balustradeGeo = new THREE.BoxGeometry(33.0, 0.45, 0.25);
      const balustrade = new THREE.Mesh(balustradeGeo, this.stoneMat);
      balustrade.position.set(30.5, -3.4, zSide);
      balustrade.rotation.z = -Math.atan2(7.2, 29.0);
      balustrade.castShadow = true;
      balustrade.receiveShadow = true;
      this.group.add(balustrade);

      // Newel posts at key landings
      for (const px of [14.0, 21.2, 25.0, 32.2, 36.5, 43.7, 48.0]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.35, 0.42), this.stoneMat);
        const py = -((px - 14.0) / (44.0 - 14.0)) * 7.2;
        post.position.set(px, py + 0.6, zSide);
        this.group.add(post);
      }
    }

    // Continuous Arched Enclosed Cavern Ceiling (descending over the staircase)
    const stairCeilGeo = new THREE.BoxGeometry(34.5, 1.4, 5.5);
    const stairCeil = new THREE.Mesh(stairCeilGeo, this.darkStoneMat);
    stairCeil.position.set(31.0, 1.6, 0);
    stairCeil.rotation.z = -Math.atan2(7.0, 32.0);
    this.group.add(stairCeil);
  }

  private buildStairFlight(startX: number, startY: number, count: number, run: number, rise: number) {
    for (let i = 0; i < count; i++) {
      const stepX = startX + i * run;
      const stepY = startY - (i + 1) * rise;

      // Tread slab
      const tread = new THREE.Mesh(new THREE.BoxGeometry(run + 0.05, 0.35, 3.8), this.stoneMat);
      tread.position.set(stepX + run / 2, stepY + 0.175, 0);
      tread.receiveShadow = true;
      tread.castShadow = true;
      this.group.add(tread);

      // Solid stone bedrock foundation extending down to Y = -12.0m (NO HOLLOW VOID!)
      const fHeight = Math.max(0.5, stepY - (-12.0));
      const foundation = new THREE.Mesh(new THREE.BoxGeometry(run + 0.05, fHeight, 3.8), this.darkStoneMat);
      foundation.position.set(stepX + run / 2, -12.0 + fHeight / 2, 0);
      foundation.receiveShadow = true;
      this.group.add(foundation);

      this.colliders.push({
        xMin: stepX,
        xMax: stepX + run,
        yMin: stepY,
        yMax: stepY + 0.3,
        isPlatform: true,
      });
    }
  }

  private buildLandingSlab(centerX: number, topY: number, width: number) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, 3.8), this.darkStoneMat);
    slab.position.set(centerX, topY - 0.4, 0);
    slab.receiveShadow = true;
    this.group.add(slab);

    // Deep bedrock foundation
    const fHeight = Math.max(0.5, (topY - 0.8) - (-12.0));
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(width, fHeight, 3.8), this.darkStoneMat);
    foundation.position.set(centerX, -12.0 + fHeight / 2, 0);
    this.group.add(foundation);

    this.colliders.push({
      xMin: centerX - width / 2,
      xMax: centerX + width / 2,
      yMin: topY - 1.2,
      yMax: topY,
      isPlatform: true,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 03 — THE WORDS OF THE ANCIENTS (X = 48m to 60m, Y = -7.2m)
  // Verified sacred Sanskrit tablets and cosmic solar clue
  // ═══════════════════════════════════════════════════════════════════════════
  private buildScene03_WordsOfTheAncients() {
    const floorGeo = new THREE.BoxGeometry(12.0, 1.2, 5.0);
    const floor = new THREE.Mesh(floorGeo, this.stoneMat);
    floor.position.set(54.0, -7.8, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    this.colliders.push({
      xMin: 48.0,
      xMax: 60.0,
      yMin: -8.5,
      yMax: -7.2,
      isPlatform: true,
    });

    // Vaulted Ceiling over Scene 03
    const ceilGeo = new THREE.BoxGeometry(12.0, 1.2, 5.0);
    const ceil = new THREE.Mesh(ceilGeo, this.darkStoneMat);
    ceil.position.set(54.0, -2.4, 0);
    this.group.add(ceil);

    this.colliders.push({
      xMin: 48.0,
      xMax: 60.0,
      yMin: -3.0,
      yMax: -1.8,
    });

    // Chamber rear wall
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(12.0, 6.5, 0.8), this.darkStoneMat);
    rearWall.position.set(54.0, -5.0, -2.1);
    this.group.add(rearWall);

    // Fluted Hypostyle Pillars
    this.createPillar(50.0, -7.2, -1.2);
    this.createPillar(58.0, -7.2, -1.2);

    // ── Tablet 1: Bhagavad Gita 2.47 (Verified Sanskrit) ────────────────────
    this.createSanskritTablet(
      51.5,
      -5.6,
      -1.75,
      '॥ कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ॥\n॥ मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
      'target_gita_karma',
      '[E] DECIPHER SACRED GITA SCRIPTURE (2.47)',
      'Sanctuary Epigraph: Karma Yoga',
      'Bhagavad Gita 2.47 · Classical Sanskrit Inscription',
      'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never let the fruits of action be your motive, nor be attached to inaction.',
      'Engraved upon the ancient Mandapa threshold to remind the explorer that righteousness in pursuit of truth is its own reward.'
    );

    // ── Tablet 2: Valmiki Ramayana, Ayodhya Kanda 2.12.3 (Verified Sanskrit) ─
    this.createSanskritTablet(
      56.5,
      -5.6,
      -1.75,
      '॥ आहुः सत्यं हि परमं धर्मं धर्मविदो जनाः ॥\n॥ सत्यमाश्रित्य हि मया त्वं च धर्मं प्रचोदितः ॥',
      'target_ramayana_satya',
      '[E] TRANSLATE VALMIKI RAMAYANA SCRIPTURE',
      'Sanctuary Epigraph: The Supremacy of Truth & Dharma',
      'Valmiki Ramayana · Ayodhya Kanda 2.12.3',
      'Those who know dharma proclaim that truth is the supreme righteousness. It is by taking refuge in truth that I have urged you toward dharma.',
      'Carved into the stone niche to inspire the seeker that truth alone unlocks the ancient mechanisms of the sanctum.'
    );

    // Optional Discovery: Antique Temple Urn (X = 58.5m)
    const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.45, 10), this.bronzeMat);
    urn.position.set(58.5, -6.95, -0.6);
    this.group.add(urn);

    this.interactionTargets.push({
      id: 'target_gold_urn',
      type: 'story_altar',
      x: 58.5,
      y: -6.8,
      prompt: '[E] INSPECT ANTIQUE TEMPLE URN',
      data: { relicId: 'treasure_gold_urn' },
    });

    // Solar Clue Carved Relief above Doorway (X = 60.0m)
    const solarClue = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 24), this.goldMat);
    solarClue.position.set(59.8, -4.5, -1.8);
    this.group.add(solarClue);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 04 — THE SURYA-CHAKRA & DEEPER PASSAGE (X = 60m to 70m, Y = -7.2m)
  // Solar trail connecting the ancient archives to the sealed mechanism chamber
  // ═══════════════════════════════════════════════════════════════════════════
  private buildScene04_DeeperPassage() {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10.0, 1.2, 4.5), this.darkStoneMat);
    floor.position.set(65.0, -7.8, 0);
    this.group.add(floor);

    this.colliders.push({
      xMin: 60.0,
      xMax: 70.0,
      yMin: -8.5,
      yMax: -7.2,
      isPlatform: true,
    });

    // Enclosing ceiling
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(10.0, 1.2, 4.5), this.darkStoneMat);
    ceil.position.set(65.0, -2.4, 0);
    this.group.add(ceil);

    this.colliders.push({
      xMin: 60.0,
      xMax: 70.0,
      yMin: -3.0,
      yMax: -1.8,
    });

    // Carved Solar Trail along flagstones
    for (let s = 0; s < 5; s++) {
      const sunDecal = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.02, 12), this.goldMat);
      sunDecal.position.set(61.5 + s * 1.8, -7.19, 0);
      this.group.add(sunDecal);
    }

    // Checkpoint 1 (X = 61.0m)
    this.createCheckpointTotem(61.0, -7.2, 'Ancient Archives (Scene 04)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 05 — THE SEALED CELESTIAL MECHANISM (X = 70m to 82m, Y = -7.2m)
  // Dormant celestial mechanism with matching Surya-Chakra central socket
  // ═══════════════════════════════════════════════════════════════════════════
  private buildScene05_SealedMechanism() {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(12.0, 1.2, 5.0), this.stoneMat);
    floor.position.set(76.0, -7.8, 0);
    this.group.add(floor);

    this.colliders.push({
      xMin: 70.0,
      xMax: 82.0,
      yMin: -8.5,
      yMax: -7.2,
      isPlatform: true,
    });

    // High Grand Chamber Ceiling
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(12.0, 1.2, 5.0), this.darkStoneMat);
    ceil.position.set(76.0, -0.5, 0);
    this.group.add(ceil);

    this.colliders.push({
      xMin: 70.0,
      xMax: 82.0,
      yMin: -1.0,
      yMax: 0.5,
    });

    // Monumental Rear Wall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(12.0, 8.5, 0.8), this.darkStoneMat);
    wall.position.set(76.0, -4.0, -2.1);
    this.group.add(wall);

    // ── Monumental Ancient Mechanism Assembly (X = 76.0m, Y = -5.4m) ────────
    this.mechanismGroup = new THREE.Group();
    this.mechanismGroup.position.set(76.0, -5.4, -1.4);

    // Monumental stone frame
    const frameGeo = new THREE.BoxGeometry(3.6, 4.0, 0.25);
    const frame = new THREE.Mesh(frameGeo, this.darkStoneMat);
    this.mechanismGroup.add(frame);

    // Concentric Bronze Gear Discs
    const ringGeo = new THREE.TorusGeometry(1.25, 0.14, 12, 32);
    this.mechanismRings = new THREE.Mesh(ringGeo, this.isMechanismSolved ? this.goldMat : this.bronzeMat);
    this.mechanismGroup.add(this.mechanismRings);

    // Outer Gear Teeth
    for (let g = 0; g < 12; g++) {
      const angle = (g / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), this.bronzeMat);
      tooth.position.set(Math.cos(angle) * 1.42, Math.sin(angle) * 1.42, 0);
      tooth.rotation.z = angle;
      this.mechanismRings.add(tooth);
    }

    // Central Matching Socket for the Surya-Chakra
    const socketGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.18, 20);
    socketGeo.rotateX(Math.PI / 2);
    const socket = new THREE.Mesh(socketGeo, this.isMechanismSolved ? this.goldMat : this.darkStoneMat);
    this.mechanismGroup.add(socket);

    // Glowing core light (dormant before activation!)
    this.mechanismGlow = new THREE.PointLight(0xffb700, this.isMechanismSolved ? 4.5 : 0.0, 9.0);
    this.mechanismGlow.position.set(0, 0, 0.35);
    this.mechanismGroup.add(this.mechanismGlow);

    // Sacred Lintel Inscription
    let lintelMat: THREE.Material = this.darkStoneMat;
    if (typeof document !== 'undefined') {
      const lintelCanvas = document.createElement('canvas');
      lintelCanvas.width = 512;
      lintelCanvas.height = 64;
      const lCtx = lintelCanvas.getContext('2d')!;
      lCtx.fillStyle = '#0f1422';
      lCtx.fillRect(0, 0, 512, 64);
      lCtx.fillStyle = '#ffd700';
      lCtx.font = 'bold 20px "Cinzel", serif';
      lCtx.textAlign = 'center';
      lCtx.fillText('॥ ॐ तत्सत् · सूर्य मण्डल द्वारम् ॥', 256, 42);

      const lintelTex = new THREE.CanvasTexture(lintelCanvas);
      lintelMat = new THREE.MeshBasicMaterial({ map: lintelTex });
    }
    const lintelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.45), lintelMat);
    lintelMesh.position.set(0, 1.85, 0.14);
    this.mechanismGroup.add(lintelMesh);

    this.group.add(this.mechanismGroup);

    this.interactionTargets.push({
      id: 'target_mechanism',
      type: 'mechanism',
      x: 76.0,
      y: -6.4,
      prompt: '[E] INSERT SURYA-CHAKRA INTO MECHANISM',
    });

    // Sequential Braziers (initially unlit/dormant until awakening!)
    this.addTorch(72.0, -5.2, -1.6, this.isMechanismSolved);
    this.addTorch(74.0, -5.2, -1.6, this.isMechanismSolved);
    this.addTorch(78.0, -5.2, -1.6, this.isMechanismSolved);
    this.addTorch(80.5, -5.2, -1.6, this.isMechanismSolved);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 06 — THE SANCTUM AWAKENS
  // Progressive awakening braziers & volumetric blue sunlight shafts
  // ═══════════════════════════════════════════════════════════════════════════
  private buildScene06_SanctumAwakens() {
    // Additional sequential braziers extending across bridge threshold
    this.addTorch(82.5, -5.2, -1.6, this.isMechanismSolved);
    this.addTorch(85.5, -5.2, -1.6, this.isMechanismSolved);
    this.addTorch(92.0, -5.2, -1.6, this.isMechanismSolved);
    this.addTorch(104.0, -5.2, -1.6, this.isMechanismSolved);

    // Volumetric Blue Sunbeams descending from high ceiling fissures
    this.createGodRay(77.0, 0.5, 75.0, -7.2);
    this.createGodRay(85.0, 0.5, 87.0, -7.2);
    this.createGodRay(95.0, 0.5, 93.0, -7.2);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 07 — THE MONUMENTAL CROSSING (X = 82m to 118m)
  // Monumental stone bridge spanning deep chasm with fair traversal
  // ═══════════════════════════════════════════════════════════════════════════
  private buildScene07_MonumentalCrossing() {
    // ── 1. Subterranean Abyss Reservoir Water (Y = -14.5m) ──────────────────
    const waterGeo = new THREE.PlaneGeometry(36.0, 10.0, 16, 16);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x003d52,
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(96.0, -14.5, 0);
    this.group.add(this.waterMesh);

    // ── 2. Monumental Bridge Pier Spans (Y = -7.2m) ─────────────────────────
    // Span 1: Wide, solid entrance span (X = 82.0m to 88.0m)
    this.createBridgePier(85.0, -7.2, 6.0, 8.0);

    // Gap 1: 1.2m gap from 88.0m to 89.2m (Forgiving introductory jump)

    // Span 2: Intermediate Pier (X = 89.2m to 94.0m)
    this.createBridgePier(91.6, -7.2, 4.8, 8.0);

    // Gap 2: 1.6m gap from 94.0m to 95.6m (Readable jump)

    // Span 3: Central Ruined Span (X = 95.6m to 98.2m)
    this.createBridgePier(96.9, -7.2, 2.6, 8.0);

    // ── Crumbling Stone Platform (X = 98.6m to 101.4m) ─────────────────────
    // Shakes and drops after stepping, providing dynamic physical traversal
    const crumbGeo = new THREE.BoxGeometry(2.6, 0.4, 2.6);
    this.crumblingPlatformMesh = new THREE.Mesh(crumbGeo, this.stoneMat);
    this.crumblingPlatformMesh.position.copy(this.crumblingInitialPos);
    this.crumblingPlatformMesh.receiveShadow = true;
    this.group.add(this.crumblingPlatformMesh);

    this.colliders.push({
      xMin: 98.2,
      xMax: 101.8,
      yMin: -7.6,
      yMax: -7.2,
      isPlatform: true,
    });

    // Gap 3: 1.4m gap from 101.8m to 103.2m

    // Span 4: Safe Bridge Landing & Abutment (X = 103.2m to 110.0m)
    this.createBridgePier(106.6, -7.2, 6.8, 8.0);

    // Carved Bridge Balustrades on Span 1 and Span 4
    this.createBridgeBalustrade(85.0, -7.2, 5.8);
    this.createBridgeBalustrade(106.6, -7.2, 6.6);

    // ── High Secret Route: Elevated Vimana Shrine (X = 93.5m, Y = -4.8m) ────
    const vimanaPlat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.2), this.stoneMat);
    vimanaPlat.position.set(93.5, -5.0, -0.6);
    this.group.add(vimanaPlat);
    this.colliders.push({
      xMin: 92.3,
      xMax: 94.7,
      yMin: -5.4,
      yMax: -4.8,
      isPlatform: true,
    });

    // The Vedic Star Sapphire Shrine
    this.secretGemMesh = new THREE.Group();
    this.secretGemMesh.position.set(93.5, -4.4, -0.6);
    const gemMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24),
      new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x0055cc,
        emissiveIntensity: 0.9,
      })
    );
    const gemLight = new THREE.PointLight(0x00aaff, 2.2, 5.0);
    this.secretGemMesh.add(gemMesh, gemLight);

    if (this.isGemCollected) {
      this.secretGemMesh.visible = false;
    }
    this.group.add(this.secretGemMesh);

    this.interactionTargets.push({
      id: 'target_secret_gem',
      type: 'secret_gem',
      x: 93.5,
      y: -4.6,
      prompt: '[E] RECOVER VEDIC STAR SAPPHIRE',
    });

    // Checkpoint 2 on Safe Bridge Landing (X = 107.0m)
    this.createCheckpointTotem(107.0, -7.2, 'Bridge Abutment (Scene 07)');

    // ── Root-Covered Stone Archway Threshold (X = 112.0m) ───────────────────
    this.createMonumentalArch(112.0, -7.2, -1.0, true);

    // ── Beyond Archway: Inner Sanctum Passage (X = 114m to 125m) ────────────
    const innerFloor = new THREE.Mesh(new THREE.BoxGeometry(14.0, 1.2, 4.0), this.mossStoneMat);
    innerFloor.position.set(119.0, -7.8, 0);
    this.group.add(innerFloor);
    this.colliders.push({ xMin: 112.0, xMax: 126.0, yMin: -8.5, yMax: -7.2, isPlatform: true });

    // Low Crawlway requiring crouching (1.2m clearance: floor -7.2, ceiling -6.0)
    // Standing height 1.65m blocked, crouching 0.95m passes!
    const crawlCeil = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.2, 3.0), this.darkStoneMat);
    crawlCeil.position.set(115.5, -5.4, 0);
    this.group.add(crawlCeil);
    this.colliders.push({ xMin: 113.5, xMax: 117.5, yMin: -6.0, yMax: -4.8 });

    // Rotating Symbol Dials Puzzle (X = 119.5m)
    const dialSymbols = [
      { id: 'dial_surya', label: 'Surya (Sun)', target: 0 },
      { id: 'dial_padma', label: 'Padma (Lotus)', target: Math.PI },
      { id: 'dial_trishula', label: 'Trishula (Trident)', target: Math.PI / 2 },
    ];
    dialSymbols.forEach((s, idx) => {
      const dialX = 118.5 + idx * 1.1;
      const dialGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 16);
      dialGeo.rotateX(Math.PI / 2);
      const dialMesh = new THREE.Mesh(dialGeo, this.bronzeMat);
      dialMesh.position.set(dialX, -5.9, -1.35);
      this.group.add(dialMesh);

      const ptr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.20, 0.14), this.goldMat);
      ptr.position.set(0, 0.20, 0.02);
      dialMesh.add(ptr);

      this.puzzleDials.push({
        mesh: dialMesh,
        symbol: s.id,
        angle: 0,
        correctAngle: s.target,
      });

      this.interactionTargets.push({
        id: `target_${s.id}`,
        type: 'dial',
        x: dialX,
        y: -6.4,
        prompt: `[E] ROTATE ${s.label.toUpperCase()} DIAL`,
        data: { dialIndex: idx },
      });
    });

    // Monumental Exit Gate at X = 124.0m
    const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 5.6, 0.6), this.darkStoneMat);
    gateFrame.position.set(124.0, -4.6, 0);
    this.group.add(gateFrame);

    const doorGeo = new THREE.BoxGeometry(1.6, 4.6, 0.4);
    this.vaultGateLeft = new THREE.Mesh(doorGeo, this.stoneMat);
    this.vaultGateLeft.position.set(123.1, -4.8, 0);

    this.vaultGateRight = new THREE.Mesh(doorGeo, this.stoneMat);
    this.vaultGateRight.position.set(124.9, -4.8, 0);

    const mandala = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.08, 24), this.goldMat);
    mandala.rotateX(Math.PI / 2);
    mandala.position.set(124.0, -4.8, 0.22);
    this.group.add(this.vaultGateLeft, this.vaultGateRight, mandala);

    this.interactionTargets.push({
      id: 'target_exit_gate',
      type: 'exit_gate',
      x: 124.0,
      y: -6.2,
      prompt: '[E] UNSEAL MONUMENTAL SANCTUM GATE',
    });

    const exitLight = new THREE.PointLight(0xffd700, 3.5, 12.0);
    exitLight.position.set(124.0, -4.6, 0.5);
    this.group.add(exitLight);

    this.colliders.push({
      xMin: 125.0,
      xMax: 126.0,
      yMin: -7.2,
      yMax: 2.0,
    });
  }

  private createBridgePier(centerX: number, topY: number, width: number, height: number) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(width, height, 3.4), this.stoneMat);
    pier.position.set(centerX, topY - height / 2, 0);
    pier.receiveShadow = true;
    pier.castShadow = true;
    this.group.add(pier);

    this.colliders.push({
      xMin: centerX - width / 2,
      xMax: centerX + width / 2,
      yMin: topY - height,
      yMax: topY,
      isPlatform: true,
    });
  }

  private createBridgeBalustrade(centerX: number, topY: number, width: number) {
    for (const zSide of [-1.55, 1.55]) {
      const balustrade = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, 0.22), this.stoneMat);
      balustrade.position.set(centerX, topY + 0.225, zSide);
      balustrade.receiveShadow = true;
      balustrade.castShadow = true;
      this.group.add(balustrade);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS: ARCHITECTURE & LIGHTING
  // ═══════════════════════════════════════════════════════════════════════════
  private createPillar(x: number, y: number, z: number) {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, y, z);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), this.darkStoneMat);
    base.position.y = 0.175;

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 4.4, 12), this.stoneMat);
    shaft.position.y = 2.55;
    shaft.castShadow = true;
    shaft.receiveShadow = true;

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 0.75), this.stoneMat);
    cap.position.y = 4.95;

    pGroup.add(base, shaft, cap);
    this.group.add(pGroup);
  }

  private createForegroundPillar(x: number, y: number) {
    const fPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 7.0, 10), this.darkStoneMat);
    fPillar.position.set(x, y + 3.0, 2.2);
    this.group.add(fPillar);
  }

  private createSanskritTablet(
    x: number,
    y: number,
    z: number,
    sanskritText: string,
    targetId: string,
    prompt: string,
    title: string,
    source: string,
    translation: string,
    loreNote: string
  ) {
    const inscrPanelGeo = new THREE.BoxGeometry(2.6, 1.2, 0.12);
    const inscrPanel = new THREE.Mesh(inscrPanelGeo, this.stoneMat);
    inscrPanel.position.set(x, y, z);
    inscrPanel.receiveShadow = true;
    this.group.add(inscrPanel);

    let tabletMat: THREE.Material = this.darkStoneMat;
    if (typeof document !== 'undefined') {
      const tabletCanvas = document.createElement('canvas');
      tabletCanvas.width = 512;
      tabletCanvas.height = 140;
      const tCtx = tabletCanvas.getContext('2d')!;
      tCtx.fillStyle = '#140e09';
      tCtx.fillRect(0, 0, 512, 140);
      tCtx.strokeStyle = '#d4af37';
      tCtx.lineWidth = 4;
      tCtx.strokeRect(6, 6, 500, 128);
      tCtx.fillStyle = '#ffd700';
      tCtx.font = 'bold 20px "Cinzel", "Noto Sans Devanagari", serif';
      tCtx.textAlign = 'center';
      const lines = sanskritText.split('\n');
      if (lines.length > 1) {
        tCtx.fillText(lines[0], 256, 52);
        tCtx.fillText(lines[1], 256, 92);
      } else {
        tCtx.fillText(sanskritText, 256, 75);
      }

      const tabletTex = new THREE.CanvasTexture(tabletCanvas);
      tabletMat = new THREE.MeshBasicMaterial({ map: tabletTex });
    }

    const tabletFace = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.05), tabletMat);
    tabletFace.position.set(x, y, z + 0.07);
    this.group.add(tabletFace);

    this.interactionTargets.push({
      id: targetId,
      type: 'inscription',
      x,
      y: y - 0.4,
      prompt,
      data: {
        recordId: targetId,
        title,
        source,
        translation,
        loreNote,
      },
    });
  }

  private createMonumentalArch(x: number, y: number, z: number, ornate: boolean) {
    const aGroup = new THREE.Group();
    aGroup.position.set(x, y, z);

    const jL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), this.stoneMat);
    jL.position.set(-1.8, 2.1, 0);
    const jR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), this.stoneMat);
    jR.position.set(1.8, 2.1, 0);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.6, 0.6), this.stoneMat);
    lintel.position.set(0, 4.5, 0);

    if (ornate) {
      const crestGeo = new THREE.TorusGeometry(1.4, 0.18, 8, 24, Math.PI);
      const crest = new THREE.Mesh(crestGeo, this.goldMat);
      crest.position.set(0, 4.8, 0.05);
      aGroup.add(crest);
    }

    aGroup.add(jL, jR, lintel);
    this.group.add(aGroup);
  }

  private createCheckpointTotem(x: number, y: number, label: string) {
    const totemGroup = new THREE.Group();
    totemGroup.position.set(x, y, -0.8);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), this.darkStoneMat);
    base.position.y = 0.2;

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.8, 8), this.stoneMat);
    pillar.position.y = 1.3;

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), this.goldMat);
    orb.position.y = 2.4;

    const light = new THREE.PointLight(0x00f7ff, 2.2, 5.0);
    light.position.y = 2.4;

    totemGroup.add(base, pillar, orb, light);
    this.group.add(totemGroup);

    this.interactionTargets.push({
      id: `checkpoint_${Math.round(x)}`,
      type: 'checkpoint',
      x,
      y,
      prompt: `[E] ATTAIN SANCTUARY (${label})`,
      data: { checkpointName: label },
    });
  }

  public addTorch(x: number, y: number, z: number, isIgnited: boolean) {
    const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), this.bronzeMat);
    sconce.rotation.z = Math.PI / 4;
    sconce.position.set(x, y, z);
    this.group.add(sconce);

    const flameMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
    flameMesh.position.set(x + 0.12, y + 0.14, z + 0.05);
    flameMesh.visible = isIgnited;
    this.group.add(flameMesh);

    const light = new THREE.PointLight(0xff8822, isIgnited ? 2.8 : 0.0, 10.0, 1.5);
    light.position.copy(flameMesh.position);
    this.group.add(light);

    this.torches.push({
      light,
      flameMesh,
      baseX: x,
      baseY: y,
      baseZ: z,
      isIgnited,
    });
  }

  private createGodRay(topX: number, topY: number, botX: number, botY: number) {
    const rayGeo = new THREE.CylinderGeometry(0.1, 1.6, 9.0, 12);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rayMesh = new THREE.Mesh(rayGeo, rayMat);
    rayMesh.position.set((topX + botX) / 2, (topY + botY) / 2, -1.0);
    rayMesh.rotation.z = Math.atan2(botX - topX, topY - botY);
    this.godRays.push(rayMesh);
    this.group.add(rayMesh);
  }

  private buildFarBackgroundScenery() {
    const farMat = new THREE.MeshStandardMaterial({ color: 0x101d28, roughness: 1.0, metalness: 0.0 });
    const midMat = new THREE.MeshStandardMaterial({ color: 0x35404a, roughness: 0.96, metalness: 0.02 });

    for (let s = 0; s < 18; s++) {
      const x = s * 7.5;
      const h = 8.0 + Math.sin(s * 1.5) * 4.0;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.0, h, 7), farMat);
      spire.position.set(x, h / 2 - 4.0, -25.0);
      this.group.add(spire);
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 1.0), farMat);
      base.position.set(x, -3.0, -24.5);
      this.group.add(base);
    }

    for (let i = 0; i < 10; i++) {
      const x = 4.0 + i * 13.0;
      const z = -13.5 - (i % 3) * 1.1;
      const platform = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.55, 2.0), midMat);
      platform.position.set(x, -3.0, z);
      this.group.add(platform);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAME UPDATE: MURAL LIGHTING, HAZARDS, PLATFORMS
  // ═══════════════════════════════════════════════════════════════════════════
  public update(
    dt: number,
    playerX: number,
    playerY: number,
    playerCrouching: boolean,
    lanternPos?: THREE.Vector3,
    isLanternActive: boolean = true
  ): { hitHazard: boolean; hazardName?: string } {
    this.animTime += dt;
    let hitHazard = false;
    let hazardName = '';

    // 1. Update Dynamic Lantern Illumination on all Ramayana & Mahabharata Murals
    if (lanternPos) {
      this.muralSystem.updateLanternIllumination(lanternPos, isLanternActive);
    }

    // 2. Relic disc rotation on altar
    if (this.artifactMesh && this.artifactMesh.visible) {
      this.artifactMesh.rotation.y += dt * 1.5;
      this.artifactMesh.position.y = 1.15 + Math.sin(this.animTime * 3.0) * 0.04;
    }

    // 3. Secret Sapphire floating
    if (this.secretGemMesh && this.secretGemMesh.visible) {
      this.secretGemMesh.rotation.y += dt * 2.0;
      this.secretGemMesh.position.y = -4.4 + Math.sin(this.animTime * 2.5) * 0.04;
    }

    // 4. Torch flickers
    this.torches.forEach((t) => {
      if (t.isIgnited) {
        const f = 1.0 + Math.sin(this.animTime * 15.0 + t.baseX) * 0.08;
        t.light.intensity = 2.8 * f;
      }
    });

    // 5. Crumbling Stone Platform Traversal on Bridge (Scene 07)
    if (this.crumblingPlatformMesh) {
      if (playerX >= 98.2 && playerX <= 101.8 && Math.abs(playerY - (-7.2)) < 0.28) {
        if (this.crumblingTimer < 0) {
          this.crumblingTimer = 0.55; // 550ms before drop
        }
      }

      if (this.crumblingTimer > 0) {
        this.crumblingTimer -= dt;
        this.crumblingPlatformMesh.position.x = this.crumblingInitialPos.x + (Math.random() - 0.5) * 0.08;
        if (this.crumblingTimer <= 0) {
          this.isCrumblingCollapsed = true;
          audioManager.playHit();
        }
      } else if (this.isCrumblingCollapsed) {
        this.crumblingPlatformMesh.position.y -= dt * 9.8;
        const idx = this.colliders.findIndex((c) => c.xMin === 98.2 && c.xMax === 101.8);
        if (idx !== -1) this.colliders.splice(idx, 1);
      }
    }

    // 6. Chasm Pit Fall Death (Scene 07)
    if (playerX >= 88.0 && playerX <= 104.0 && playerY < -10.5) {
      hitHazard = true;
      hazardName = 'Abyss Reservoir Chasm';
    }

    return { hitHazard, hazardName };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CINEMATIC REVEAL & MECHANISM TRIGGERS
  // ═══════════════════════════════════════════════════════════════════════════
  public activateSequentialTorches() {
    this.torches.forEach((t) => {
      t.isIgnited = true;
      t.flameMesh.visible = true;
      t.light.intensity = 3.2;
    });
  }

  public openVaultGate() {
    this.isVaultOpened = true;
    if (this.vaultGateLeft && this.vaultGateRight) {
      this.vaultGateLeft.position.x = 121.8;
      this.vaultGateRight.position.x = 126.2;
    }
  }

  public rotateDial(dialIndex: number): boolean {
    const dial = this.puzzleDials[dialIndex];
    if (!dial) return false;

    dial.angle = (dial.angle + Math.PI / 2) % (Math.PI * 2);
    dial.mesh.rotation.z = dial.angle;
    audioManager.playCoin();

    const allAligned = this.puzzleDials.every((d) => Math.abs(d.angle - d.correctAngle) < 0.1);
    if (allAligned && !this.isPuzzleSolved) {
      this.isPuzzleSolved = true;
      audioManager.playPuzzleSolve();
      return true;
    }
    return false;
  }
}

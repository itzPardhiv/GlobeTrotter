/**
 * PreludeLevel.ts — GlobeTrotter: The Lost Relic
 * 
 * Cinematic 3D outdoor wilderness environment for Prelude Sequences 1-6:
 *   Seq 1: Jeep Arrival — Detailed overland vehicle arriving on a rugged dirt road
 *   Seq 2: Bounty Tracking — Physical clues (tire tracks, canteen, rucksack)
 *   Seq 3: Bounty Confrontation — Vikram's campsite encounter
 *   Seq 4: Map Discovery — Authentic aged cartographic parchment with legend of 1,000,000,000 gold coins
 *   Seq 5: Expedition Trail — Natural ravine, suspension rope bridge, rocky ledge traversal
 *   Seq 6: Ancient Temple Reveal — Monumental Indian Torana gateway with carved guardian statues
 * 
 * Built with procedural high-resolution PBR textures, atmospheric lighting,
 * and cinematic adventure game composition.
 */

import * as THREE from 'three';
import { ThreeTextureGenerator } from './ThreeTextureGenerator';

export interface PreludeCollider {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  isPlatform?: boolean;
}

export interface PreludeInteraction {
  id: string;
  type: 'clue' | 'map' | 'bounty_target' | 'coin' | 'checkpoint' | 'temple_entrance';
  x: number;
  y: number;
  prompt: string;
  data?: Record<string, unknown>;
  collected?: boolean;
}

export class PreludeLevel {
  public group: THREE.Group;
  public colliders: PreludeCollider[] = [];
  public interactionTargets: PreludeInteraction[] = [];

  // ── Jeep Cinematic ────────────────────────────────────────────────────────
  public jeepGroup: THREE.Group;
  private jeepBody!: THREE.Mesh;
  private jeepWheels: THREE.Group[] = [];
  private jeepHeadlightSpotL!: THREE.SpotLight;
  private jeepHeadlightSpotR!: THREE.SpotLight;
  private jeepDustParticles!: THREE.Points;
  public jeepStartX = -15;
  public jeepStopX = 5;

  // ── Bounty Target NPC (Vikram) ─────────────────────────────────────────────
  public vikramGroup: THREE.Group;
  public vikramX = 38;
  public vikramY = 0;
  private vikramHead?: THREE.Mesh;
  private vikramTorso?: THREE.Mesh;

  // ── Map Collectible ────────────────────────────────────────────────────────
  public mapMesh: THREE.Group | null = null;
  public isMapCollected = false;

  // ── Collectibles (Punch-Marked Ancient Gold Mohurs) ────────────────────────
  private coinMeshes: THREE.Group[] = [];
  private coinAngle = 0;

  // ── Environment Entities ───────────────────────────────────────────────────
  private trees: THREE.Group[] = [];
  private rocks: THREE.Mesh[] = [];
  private campfire: THREE.Group | null = null;
  private campfireLight: THREE.PointLight | null = null;
  private campfireFlameMesh: THREE.Mesh | null = null;
  private bridgeGroup: THREE.Group | null = null;
  private streamWaterMesh: THREE.Mesh | null = null;
  private dustGeo: THREE.BufferGeometry | null = null;

  // ── Materials ──────────────────────────────────────────────────────────────
  private groundMat!: THREE.MeshStandardMaterial;
  private roadMat!: THREE.MeshStandardMaterial;
  private sandstoneMat!: THREE.MeshStandardMaterial;
  private treeBarkMat!: THREE.MeshStandardMaterial;
  private leafMat!: THREE.MeshStandardMaterial;
  private darkLeafMat!: THREE.MeshStandardMaterial;
  private tentMat!: THREE.MeshStandardMaterial;
  private jeepBodyMat!: THREE.MeshStandardMaterial;
  private tireRubberMat!: THREE.MeshStandardMaterial;
  private rimMat!: THREE.MeshStandardMaterial;
  private chromeMat!: THREE.MeshStandardMaterial;
  private bridgeWoodMat!: THREE.MeshStandardMaterial;
  private ropeMat!: THREE.MeshStandardMaterial;
  private goldCoinMat!: THREE.MeshStandardMaterial;

  private animTime = 0;

  // Level layout constants (meters)
  private readonly GROUND_Y = 0;
  private readonly LEVEL_START = -20;
  private readonly LEVEL_END = 85;

  constructor() {
    this.group = new THREE.Group();
    this.jeepGroup = new THREE.Group();
    this.vikramGroup = new THREE.Group();

    this.initMaterials();
    this.buildTerrain();
    this.buildVegetation();
    this.buildJeep();
    this.buildBountyArea();
    this.buildExpeditionPath();
    this.buildTempleApproach();
    this.buildLighting();
    this.buildSkybox();
    this.setupColliders();
    this.setupInteractions();
  }

  private initMaterials(): void {
    // 1. Natural Deccan wilderness earth with organic grass tufts
    const groundTex = ThreeTextureGenerator.getWildernessGroundTexture();
    groundTex.repeat.set(16, 6);
    this.groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.90,
      metalness: 0.02,
    });

    // 2. Dirt road with tire track impressions and soil ruts
    const roadTex = ThreeTextureGenerator.getDirtRoadTexture();
    roadTex.repeat.set(6, 1);
    this.roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.88,
      metalness: 0.01,
    });

    // 3. Ancient carved sandstone
    const sandstoneTex = ThreeTextureGenerator.getCarvedSandstoneTexture();
    sandstoneTex.repeat.set(2, 2);
    this.sandstoneMat = new THREE.MeshStandardMaterial({
      map: sandstoneTex,
      roughness: 0.78,
      metalness: 0.04,
    });

    // 4. Tree bark
    const barkTex = ThreeTextureGenerator.getTreeBarkTexture();
    barkTex.repeat.set(1, 4);
    this.treeBarkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.92,
      metalness: 0.0,
    });

    // 5. Foliage (Lush tropical jungle canopy)
    this.leafMat = new THREE.MeshStandardMaterial({
      color: 0x4d6c2d,
      roughness: 0.65,
      metalness: 0.05,
      flatShading: false,
    });

    this.darkLeafMat = new THREE.MeshStandardMaterial({
      color: 0x334a1e,
      roughness: 0.70,
      metalness: 0.05,
    });

    // 6. Expedition Ridge Tent Canvas
    const tentTex = ThreeTextureGenerator.getCanvasTentTexture();
    this.tentMat = new THREE.MeshStandardMaterial({
      map: tentTex,
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    // 7. Overland Expedition Jeep
    const enamelTex = ThreeTextureGenerator.getJeepEnamelTexture();
    this.jeepBodyMat = new THREE.MeshStandardMaterial({
      map: enamelTex,
      roughness: 0.45,
      metalness: 0.35,
    });

    const tireTex = ThreeTextureGenerator.getJeepTireTexture();
    this.tireRubberMat = new THREE.MeshStandardMaterial({
      map: tireTex,
      roughness: 0.88,
      metalness: 0.10,
    });

    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x2b2e32,
      roughness: 0.50,
      metalness: 0.75,
    });

    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8e0e8,
      roughness: 0.20,
      metalness: 0.92,
    });

    // 8. Suspension Bridge Wood & Hemp Rope
    const woodTex = ThreeTextureGenerator.getBridgeWoodTexture();
    this.bridgeWoodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85,
      metalness: 0.02,
    });

    this.ropeMat = new THREE.MeshStandardMaterial({
      color: 0x826d4b,
      roughness: 0.95,
      metalness: 0.0,
    });

    // 9. Ancient Mauryan Punch-Marked Gold Mohurs
    this.goldCoinMat = new THREE.MeshStandardMaterial({
      color: 0xf6be32,
      emissive: 0x7a5508,
      emissiveIntensity: 0.35,
      roughness: 0.32,
      metalness: 0.88,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. TERRAIN & NATURAL HORIZONS
  // ═══════════════════════════════════════════════════════════════════════════

  private buildTerrain(): void {
    // ── Main Layered Earthen Ground Plinth ────────────────────────────────────
    const groundGeo = new THREE.BoxGeometry(130, 2.5, 34);
    const ground = new THREE.Mesh(groundGeo, this.groundMat);
    ground.position.set(32, -1.25, 0);
    ground.receiveShadow = true;
    this.group.add(ground);

    // ── Dirt Road Surface (Slightly crowned with berms) ────────────────────────
    const roadGeo = new THREE.BoxGeometry(50, 0.12, 5.2);
    const road = new THREE.Mesh(roadGeo, this.roadMat);
    road.position.set(0, 0.06, 0);
    road.receiveShadow = true;
    this.group.add(road);

    // Road continuation toward the ravine and campsite
    const roadExt = new THREE.Mesh(
      new THREE.BoxGeometry(45, 0.12, 4.4),
      this.roadMat
    );
    roadExt.position.set(45, 0.06, 0);
    roadExt.receiveShadow = true;
    this.group.add(roadExt);

    // ── Roadside Earth Embankments & Natural Berms ────────────────────────────
    const bermMat = new THREE.MeshStandardMaterial({ color: 0x58442f, roughness: 0.95 });
    for (let x = -15; x < 65; x += 8) {
      // North verge berm
      const bermGeo = new THREE.CylinderGeometry(0.8, 1.6, 7.5, 6);
      const bermN = new THREE.Mesh(bermGeo, bermMat);
      bermN.rotation.z = Math.PI / 2;
      bermN.position.set(x + 4, -0.2, -3.2);
      bermN.receiveShadow = true;
      this.group.add(bermN);

      // South verge berm
      const bermS = bermN.clone();
      bermS.position.z = 3.2;
      this.group.add(bermS);
    }

    // ── Multi-Layered Deccan Mountain Ridges & Horizons ───────────────────────
    this.buildPanoramicMountains();

    // ── Natural Cliff Walls at Temple Approach ────────────────────────────────
    // Towering rock-cut ravine walls flanking the temple entrance
    const cliffGeo = new THREE.BoxGeometry(12, 16, 12);
    const cliffL = new THREE.Mesh(cliffGeo, this.sandstoneMat);
    cliffL.position.set(84, 6.5, -8.0);
    cliffL.castShadow = true;
    cliffL.receiveShadow = true;
    this.group.add(cliffL);

    const cliffR = new THREE.Mesh(cliffGeo, this.sandstoneMat);
    cliffR.position.set(84, 6.5, 8.0);
    cliffR.castShadow = true;
    cliffR.receiveShadow = true;
    this.group.add(cliffR);

    // Natural stone archway above the entrance path
    const naturalArch = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 16),
      this.sandstoneMat
    );
    naturalArch.position.set(84, 14.5, 0);
    naturalArch.castShadow = true;
    this.group.add(naturalArch);
  }

  private buildPanoramicMountains(): void {
    // 3 Atmospheric Mountain Layers (Vindhya/Deccan Ridge Silhouette)
    const layers = [
      { z: -38, y: 14, h: 22, color: 0x22323a, opacity: 0.9 }, // Distant misty range
      { z: -28, y: 9, h: 16, color: 0x2d4234, opacity: 0.95 }, // Mid-range forested hills
      { z: -18, y: 4, h: 10, color: 0x3d4a2d, opacity: 1.0 },  // Foreground jungle ridge
    ];

    layers.forEach((layer) => {
      const ridgeGroup = new THREE.Group();
      const numPeaks = 18;
      const spacing = 10;
      const startX = -35;

      const mat = new THREE.MeshStandardMaterial({
        color: layer.color,
        roughness: 0.95,
        metalness: 0.0,
      });

      for (let i = 0; i < numPeaks; i++) {
        const peakH = layer.h * (0.75 + Math.sin(i * 0.9) * 0.35);
        const peakW = 12 + Math.cos(i * 0.6) * 5;
        const peakGeo = new THREE.ConeGeometry(peakW, peakH, 5);
        const peak = new THREE.Mesh(peakGeo, mat);
        peak.position.set(startX + i * spacing, layer.y + peakH * 0.45, 0);
        peak.scale.z = 0.4;
        ridgeGroup.add(peak);
      }

      ridgeGroup.position.z = layer.z;
      this.group.add(ridgeGroup);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. VEGETATION — Organic Banyan & Sal Trees, Shrubs & Grass
  // ═══════════════════════════════════════════════════════════════════════════

  private buildVegetation(): void {
    // Authentic Indian wilderness tree positions along road and trail
    const treePositions = [
      // Arrival Zone
      { x: -14, z: -6.5, s: 1.2 }, { x: -10, z: 6.8, s: 1.4 },
      { x: -6, z: -6.0, s: 1.1 }, { x: 0, z: 7.2, s: 1.3 },
      { x: 6, z: -6.8, s: 1.5 },
      // Approach to Campsite
      { x: 14, z: -6.2, s: 1.3 }, { x: 19, z: 6.5, s: 1.2 },
      { x: 23, z: -6.5, s: 1.4 }, { x: 28, z: 7.0, s: 1.5 },
      // Post-Campsite Trail
      { x: 44, z: -6.0, s: 1.3 }, { x: 47, z: 6.2, s: 1.2 },
      { x: 50, z: -6.5, s: 1.5 }, { x: 53, z: 6.8, s: 1.4 },
      // Near Bridge & Chasm
      { x: 58, z: -6.2, s: 1.3 }, { x: 61, z: 6.5, s: 1.2 },
      { x: 66, z: -6.5, s: 1.4 }, { x: 70, z: 6.8, s: 1.5 },
      // Near Temple Approach
      { x: 73, z: -5.5, s: 1.3 }, { x: 75, z: 5.8, s: 1.4 },
      { x: 77, z: -5.0, s: 1.2 },
    ];

    treePositions.forEach((tp) => {
      const tree = this.createAncientBanyanTree(tp.s);
      tree.position.set(tp.x, 0, tp.z);
      tree.rotation.y = (tp.x * 1.7) % (Math.PI * 2);
      this.group.add(tree);
      this.trees.push(tree);
    });

    // ── Tropical Undergrowth Shrubs & Sword Grass Tufts ───────────────────────
    const shrubPositions = [
      { x: -8, z: -3.8 }, { x: -2, z: 3.5 }, { x: 4, z: -3.6 },
      { x: 11, z: 3.6 }, { x: 16, z: -3.5 }, { x: 22, z: 3.8 },
      { x: 27, z: -3.4 }, { x: 33, z: 4.2 }, { x: 46, z: -3.5 },
      { x: 51, z: 3.6 }, { x: 60, z: -3.4 }, { x: 68, z: 3.8 },
      { x: 72, z: -3.2 },
    ];

    shrubPositions.forEach((sp) => {
      const shrub = this.createTropicalShrubCluster();
      shrub.position.set(sp.x, 0, sp.z);
      this.group.add(shrub);
    });

    // ── Scattered Basalt & Sandstone Boulders ─────────────────────────────────
    const boulderPositions = [
      { x: -5, z: -2.8, s: 0.7 }, { x: 8, z: 2.8, s: 0.9 },
      { x: 17, z: -2.6, s: 0.8 }, { x: 25, z: 2.6, s: 1.1 },
      { x: 41, z: -2.7, s: 1.0 }, { x: 52, z: 2.5, s: 0.8 },
      { x: 63, z: -2.6, s: 1.3 }, { x: 71, z: 2.7, s: 1.2 },
    ];

    boulderPositions.forEach((bp) => {
      const rockGeo = new THREE.DodecahedronGeometry(bp.s, 1);
      const rock = new THREE.Mesh(rockGeo, this.sandstoneMat);
      rock.position.set(bp.x, bp.s * 0.45, bp.z);
      rock.rotation.set(bp.x * 0.5, bp.z * 0.3, 0.4);
      rock.scale.set(1.1, 0.75, 1.0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
      this.rocks.push(rock);
    });
  }

  /** Constructs an organic ancient Banyan tree with buttress roots and multi-tiered canopy */
  private createAncientBanyanTree(scale = 1.0): THREE.Group {
    const tree = new THREE.Group();
    tree.scale.set(scale, scale, scale);

    // 1. Gnarled Tapered Trunk
    const trunkH = 4.2;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, trunkH, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.treeBarkMat);
    trunk.position.y = trunkH * 0.5;
    trunk.castShadow = true;
    tree.add(trunk);

    // 2. Buttress Roots gripping the earth
    for (let r = 0; r < 4; r++) {
      const angle = (r * Math.PI) / 2 + 0.3;
      const rootGeo = new THREE.CylinderGeometry(0.08, 0.28, 1.8, 5);
      const root = new THREE.Mesh(rootGeo, this.treeBarkMat);
      root.position.set(Math.cos(angle) * 0.65, 0.7, Math.sin(angle) * 0.65);
      root.rotation.z = Math.cos(angle) * 0.45;
      root.rotation.x = Math.sin(angle) * 0.45;
      root.castShadow = true;
      tree.add(root);
    }

    // 3. Multi-Tiered Organic Canopy Clusters
    const clusterPositions = [
      { x: 0, y: trunkH + 0.8, z: 0, r: 1.8, mat: this.leafMat },
      { x: 0.9, y: trunkH + 0.3, z: 0.7, r: 1.4, mat: this.leafMat },
      { x: -0.8, y: trunkH + 0.4, z: -0.6, r: 1.5, mat: this.darkLeafMat },
      { x: 0.7, y: trunkH + 0.9, z: -0.8, r: 1.3, mat: this.leafMat },
      { x: -0.7, y: trunkH + 0.2, z: 0.8, r: 1.4, mat: this.darkLeafMat },
    ];

    clusterPositions.forEach((cp) => {
      const leafGeo = new THREE.IcosahedronGeometry(cp.r, 2);
      const leaves = new THREE.Mesh(leafGeo, cp.mat);
      leaves.position.set(cp.x, cp.y, cp.z);
      leaves.scale.set(1.2, 0.75, 1.1);
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      tree.add(leaves);
    });

    // 4. Hanging aerial roots
    for (let a = 0; a < 3; a++) {
      const aerialRootGeo = new THREE.CylinderGeometry(0.02, 0.04, 2.5, 4);
      const aerial = new THREE.Mesh(aerialRootGeo, this.treeBarkMat);
      aerial.position.set(
        (Math.random() - 0.5) * 1.6,
        trunkH * 0.55,
        (Math.random() - 0.5) * 1.6
      );
      aerial.rotation.z = (Math.random() - 0.5) * 0.2;
      tree.add(aerial);
    }

    return tree;
  }

  /** Creates realistic sword-fern and tropical bush cluster */
  private createTropicalShrubCluster(): THREE.Group {
    const cluster = new THREE.Group();

    // 5-6 broadleaf fronds radiating outward
    for (let f = 0; f < 6; f++) {
      const ang = (f * Math.PI) / 3 + Math.random() * 0.3;
      const frondGeo = new THREE.BoxGeometry(0.18, 0.85, 0.04);
      const frond = new THREE.Mesh(frondGeo, this.leafMat);
      frond.position.set(Math.cos(ang) * 0.45, 0.4, Math.sin(ang) * 0.45);
      frond.rotation.y = ang;
      frond.rotation.z = 0.55;
      frond.castShadow = true;
      cluster.add(frond);
    }

    // Dense leafy base
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
    const core = new THREE.Mesh(coreGeo, this.darkLeafMat);
    core.position.y = 0.35;
    core.scale.set(1.1, 0.65, 1.1);
    cluster.add(core);

    return cluster;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. EXPEDITION JEEP (Mahindra Thar / Willys Overland 3D Model)
  // ═══════════════════════════════════════════════════════════════════════════

  private buildJeep(): void {
    // ── A. Steel Boxed Chassis & Axles ─────────────────────────────────────────
    const chassisGeo = new THREE.BoxGeometry(3.6, 0.22, 1.35);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.7, metalness: 0.8 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    this.jeepGroup.add(chassis);

    // Front & rear solid live axles
    const axleMat = chassisMat;
    const axleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.85, 8);

    const frontAxle = new THREE.Mesh(axleGeo, axleMat);
    frontAxle.rotation.x = Math.PI / 2;
    frontAxle.position.set(1.2, 0.38, 0);
    this.jeepGroup.add(frontAxle);

    const rearAxle = frontAxle.clone();
    rearAxle.position.x = -1.2;
    this.jeepGroup.add(rearAxle);

    // Differential pumpkin cases
    const diffGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const frontDiff = new THREE.Mesh(diffGeo, axleMat);
    frontDiff.position.set(1.2, 0.38, 0.15);
    this.jeepGroup.add(frontDiff);

    const rearDiff = frontDiff.clone();
    rearDiff.position.x = -1.2;
    this.jeepGroup.add(rearDiff);

    // ── B. Main Overland Body Tub ──────────────────────────────────────────────
    // Lower body tub
    const tubGeo = new THREE.BoxGeometry(3.4, 0.72, 1.75);
    this.jeepBody = new THREE.Mesh(tubGeo, this.jeepBodyMat);
    this.jeepBody.position.set(-0.1, 0.88, 0);
    this.jeepBody.castShadow = true;
    this.jeepBody.receiveShadow = true;
    this.jeepGroup.add(this.jeepBody);

    // Hood / Engine Cowl (tapered front)
    const hoodGeo = new THREE.BoxGeometry(1.4, 0.52, 1.45);
    const hood = new THREE.Mesh(hoodGeo, this.jeepBodyMat);
    hood.position.set(1.15, 1.05, 0);
    hood.castShadow = true;
    this.jeepGroup.add(hood);

    // Front Grille with vertical radiator slots
    const grilleGeo = new THREE.BoxGeometry(0.12, 0.58, 1.35);
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x1e241c, roughness: 0.6, metalness: 0.5 });
    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.position.set(1.86, 1.05, 0);
    this.jeepGroup.add(grille);

    // Grille vertical slots
    for (let s = -0.45; s <= 0.45; s += 0.15) {
      const slotGeo = new THREE.BoxGeometry(0.14, 0.42, 0.05);
      const slot = new THREE.Mesh(slotGeo, chassisMat);
      slot.position.set(1.86, 1.05, s);
      this.jeepGroup.add(slot);
    }

    // Front Fender Flares
    const fenderGeo = new THREE.BoxGeometry(1.2, 0.14, 0.28);
    const fenderL = new THREE.Mesh(fenderGeo, this.jeepBodyMat);
    fenderL.position.set(1.2, 0.88, 0.95);
    this.jeepGroup.add(fenderL);
    const fenderR = fenderL.clone();
    fenderR.position.z = -0.95;
    this.jeepGroup.add(fenderR);

    // Heavy-Duty Front Steel Bumper & Winch
    const bumperGeo = new THREE.BoxGeometry(0.25, 0.22, 2.1);
    const bumper = new THREE.Mesh(bumperGeo, chassisMat);
    bumper.position.set(1.95, 0.52, 0);
    bumper.castShadow = true;
    this.jeepGroup.add(bumper);

    // Winch drum & recovery cable
    const winchDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.35, 12), this.chromeMat);
    winchDrum.rotation.x = Math.PI / 2;
    winchDrum.position.set(2.02, 0.62, 0);
    this.jeepGroup.add(winchDrum);

    // ── C. Safari Tubular Roll Cage & Folded Windshield ────────────────────────
    const rollBarMat = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.5, metalness: 0.8 });
    const cageGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8);

    // 4 upright roll cage posts
    const postPositions = [
      { x: 0.3, z: 0.8 }, { x: 0.3, z: -0.8 },
      { x: -1.4, z: 0.8 }, { x: -1.4, z: -0.8 },
    ];
    postPositions.forEach((pos) => {
      const post = new THREE.Mesh(cageGeo, rollBarMat);
      post.position.set(pos.x, 1.78, pos.z);
      this.jeepGroup.add(post);
    });

    // Top roof roll bar hoop
    const roofHoopGeo = new THREE.BoxGeometry(1.75, 0.06, 1.65);
    const roofHoop = new THREE.Mesh(roofHoopGeo, rollBarMat);
    roofHoop.position.set(-0.55, 2.35, 0);
    this.jeepGroup.add(roofHoop);

    // Rolled khaki canvas safari sun-top strapped to roof
    const canvasRollGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.55, 8);
    const canvasRoll = new THREE.Mesh(canvasRollGeo, this.tentMat);
    canvasRoll.rotation.x = Math.PI / 2;
    canvasRoll.position.set(-1.35, 2.40, 0);
    this.jeepGroup.add(canvasRoll);

    // Windshield Frame & Tinted Glass
    const frameGeo = new THREE.BoxGeometry(0.08, 0.75, 1.6);
    const wsFrame = new THREE.Mesh(frameGeo, rollBarMat);
    wsFrame.position.set(0.45, 1.60, 0);
    wsFrame.rotation.z = -0.18;
    this.jeepGroup.add(wsFrame);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x90b8d0,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.45,
    });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 1.45), glassMat);
    glass.position.set(0.45, 1.60, 0);
    glass.rotation.z = -0.18;
    this.jeepGroup.add(glass);

    // ── D. Interior Cockpit Details ────────────────────────────────────────────
    // Dashboard & Steering Wheel
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 1.45), chassisMat);
    dash.position.set(0.28, 1.30, 0);
    this.jeepGroup.add(dash);

    const wheelCol = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), chassisMat);
    wheelCol.position.set(0.18, 1.40, 0.35);
    wheelCol.rotation.z = 0.55;
    this.jeepGroup.add(wheelCol);

    const steering = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 16), rollBarMat);
    steering.position.set(0.08, 1.52, 0.35);
    steering.rotation.y = Math.PI / 2;
    steering.rotation.x = 0.55;
    this.jeepGroup.add(steering);

    // High-back expedition seats
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x2b2218, roughness: 0.85 });
    const seatGeo = new THREE.BoxGeometry(0.48, 0.55, 0.45);
    const seatL = new THREE.Mesh(seatGeo, seatMat);
    seatL.position.set(-0.25, 1.35, 0.35);
    this.jeepGroup.add(seatL);
    const seatR = seatL.clone();
    seatR.position.z = -0.35;
    this.jeepGroup.add(seatR);

    // ── E. Overland Expedition Accessories ─────────────────────────────────────
    // Rear Tailgate mounted Spare Tire
    const spareWheel = this.createTireWheelAssembly();
    spareWheel.position.set(-1.85, 1.05, 0);
    spareWheel.rotation.y = Math.PI / 2;
    this.jeepGroup.add(spareWheel);

    // Heavy-duty steel Jerrycan in rear bracket
    const jerrycanMat = new THREE.MeshStandardMaterial({ color: 0x8a241c, roughness: 0.6, metalness: 0.4 });
    const jerrycan = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.35), jerrycanMat);
    jerrycan.position.set(-1.65, 0.95, -0.65);
    this.jeepGroup.add(jerrycan);

    // Safari Snorkel along passenger A-pillar
    const snorkel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), rollBarMat);
    snorkel.position.set(0.55, 1.65, -0.85);
    this.jeepGroup.add(snorkel);

    // ── F. 4 Knobby Off-Road Traversal Wheels ──────────────────────────────────
    const wheelPositions = [
      { x: 1.2, z: 0.96 }, { x: 1.2, z: -0.96 },
      { x: -1.2, z: 0.96 }, { x: -1.2, z: -0.96 },
    ];

    wheelPositions.forEach((wp) => {
      const wheelGroup = this.createTireWheelAssembly();
      wheelGroup.position.set(wp.x, 0.38, wp.z);
      this.jeepGroup.add(wheelGroup);
      this.jeepWheels.push(wheelGroup);
    });

    // ── G. Chrome Round Headlights & High-Power Forward Spotlights ──────────────
    const headlightGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.12, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xfffaea,
      emissive: 0xffe899,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });

    const headlightL = new THREE.Mesh(headlightGeo, this.chromeMat);
    headlightL.rotation.z = Math.PI / 2;
    headlightL.position.set(1.92, 1.05, 0.52);
    const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), lensMat);
    lensL.position.set(0.065, 0, 0);
    lensL.rotation.y = Math.PI / 2;
    headlightL.add(lensL);
    this.jeepGroup.add(headlightL);

    const headlightR = headlightL.clone();
    headlightR.position.z = -0.52;
    this.jeepGroup.add(headlightR);

    // High-Intensity Forward Spotlights (Warm late afternoon beams)
    this.jeepHeadlightSpotL = new THREE.SpotLight(0xffeedd, 3.2, 24, Math.PI / 7, 0.45);
    this.jeepHeadlightSpotL.position.set(2.0, 1.05, 0.52);
    this.jeepHeadlightSpotL.target.position.set(16, 0.4, 0.52);
    this.jeepGroup.add(this.jeepHeadlightSpotL);
    this.jeepGroup.add(this.jeepHeadlightSpotL.target);

    this.jeepHeadlightSpotR = new THREE.SpotLight(0xffeedd, 3.2, 24, Math.PI / 7, 0.45);
    this.jeepHeadlightSpotR.position.set(2.0, 1.05, -0.52);
    this.jeepHeadlightSpotR.target.position.set(16, 0.4, -0.52);
    this.jeepGroup.add(this.jeepHeadlightSpotR);
    this.jeepGroup.add(this.jeepHeadlightSpotR.target);

    // ── H. Ground Dust Particles ───────────────────────────────────────────────
    const dustCount = 80;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 1.5;
      dustPos[i * 3 + 1] = Math.random() * 0.8;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }
    this.dustGeo = new THREE.BufferGeometry();
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xab9273,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
      blending: THREE.NormalBlending,
    });
    this.jeepDustParticles = new THREE.Points(this.dustGeo, dustMat);
    this.jeepDustParticles.position.set(-1.8, 0.2, 0);
    this.jeepGroup.add(this.jeepDustParticles);

    // Initial off-screen left position
    this.jeepGroup.position.set(this.jeepStartX, 0, 0);
    this.group.add(this.jeepGroup);
  }

  /** Constructs detailed treaded tire with 5-lug steel rim */
  private createTireWheelAssembly(): THREE.Group {
    const wheel = new THREE.Group();

    // Knobby outer tire
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 20);
    const tire = new THREE.Mesh(tireGeo, this.tireRubberMat);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    wheel.add(tire);

    // Steel wheel rim
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.265, 16);
    const rim = new THREE.Mesh(rimGeo, this.rimMat);
    rim.rotation.x = Math.PI / 2;
    wheel.add(rim);

    // Central hub & lug nuts
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.28, 8), this.chromeMat);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);

    for (let l = 0; l < 5; l++) {
      const a = (l * Math.PI * 2) / 5;
      const lug = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), this.chromeMat);
      lug.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.14);
      wheel.add(lug);
    }

    return wheel;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. BOUNTY AREA — Authentic Campsite, Vikram NPC, Clues & Treasure Map
  // ═══════════════════════════════════════════════════════════════════════════

  private buildBountyArea(): void {
    // ── A. Authentic Expedition Ridge A-Frame Tent (X = 35) ────────────────────
    const tentGroup = new THREE.Group();
    tentGroup.position.set(35, 0, -2.8);

    // Two sloping canvas roof panels
    const roofPanelGeo = new THREE.BoxGeometry(2.4, 0.04, 2.0);
    const roofL = new THREE.Mesh(roofPanelGeo, this.tentMat);
    roofL.position.set(-0.7, 1.1, 0);
    roofL.rotation.z = 0.78;
    roofL.castShadow = true;
    tentGroup.add(roofL);

    const roofR = new THREE.Mesh(roofPanelGeo, this.tentMat);
    roofR.position.set(0.7, 1.1, 0);
    roofR.rotation.z = -0.78;
    roofR.castShadow = true;
    tentGroup.add(roofR);

    // Ridge pole & upright poles
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x483827, roughness: 0.9 });
    const ridgePole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), poleMat);
    ridgePole.rotation.x = Math.PI / 2;
    ridgePole.position.set(0, 1.95, 0);
    tentGroup.add(ridgePole);

    const uprightL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 6), poleMat);
    uprightL.position.set(0, 1.0, 1.0);
    tentGroup.add(uprightL);
    const uprightR = uprightL.clone();
    uprightR.position.z = -1.0;
    tentGroup.add(uprightR);

    // Sleeping bedroll inside tent
    const bedrollMat = new THREE.MeshStandardMaterial({ color: 0x3d3024, roughness: 0.85 });
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8), bedrollMat);
    bedroll.rotation.x = Math.PI / 2;
    bedroll.position.set(0, 0.18, 0);
    tentGroup.add(bedroll);

    this.group.add(tentGroup);

    // ── B. Stacked River Stone Campfire & Embers (X = 33) ──────────────────────
    this.campfire = new THREE.Group();
    this.campfire.position.set(33, 0, -1.0);

    // Basalt river stones in a ring
    for (let s = 0; s < 10; s++) {
      const stoneGeo = new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.06, 1);
      const stone = new THREE.Mesh(stoneGeo, this.sandstoneMat);
      const ang = (s / 10) * Math.PI * 2;
      stone.position.set(Math.cos(ang) * 0.65, 0.12, Math.sin(ang) * 0.65);
      stone.scale.set(1.1, 0.7, 1.0);
      stone.castShadow = true;
      this.campfire.add(stone);
    }

    // Charred firewood logs in teepee arrangement
    const logMat = new THREE.MeshStandardMaterial({ color: 0x1c140d, roughness: 0.95 });
    for (let l = 0; l < 4; l++) {
      const la = (l * Math.PI) / 2 + 0.3;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.7, 6), logMat);
      log.position.set(Math.cos(la) * 0.22, 0.22, Math.sin(la) * 0.22);
      log.rotation.z = Math.cos(la) * 0.55;
      log.rotation.x = Math.sin(la) * 0.55;
      log.castShadow = true;
      this.campfire.add(log);
    }

    // Glowing charcoal embers
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff4400,
      emissiveIntensity: 1.2,
      roughness: 0.4,
    });
    this.campfireFlameMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), emberMat);
    this.campfireFlameMesh.position.y = 0.18;
    this.campfireFlameMesh.scale.set(1.2, 0.65, 1.2);
    this.campfire.add(this.campfireFlameMesh);

    // Warm flickering point light casting dancing shadows across the camp
    this.campfireLight = new THREE.PointLight(0xff6622, 3.2, 9.0, 1.6);
    this.campfireLight.position.set(0, 0.45, 0);
    this.campfireLight.castShadow = true;
    this.campfire.add(this.campfireLight);

    this.group.add(this.campfire);

    // ── C. Expedition Crates & Supply Stash ────────────────────────────────────
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x58442e, roughness: 0.85 });
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.55), crateMat);
    crate1.position.set(36.8, 0.28, -1.4);
    crate1.castShadow = true;
    this.group.add(crate1);

    const crate2 = crate1.clone();
    crate2.position.set(37.2, 0.28, -2.1);
    crate2.rotation.y = 0.4;
    this.group.add(crate2);

    // ── D. Vikram Bounty Target NPC (X = 38) ──────────────────────────────────
    this.buildVikramNPC();

    // ── E. The Ancient Treasure Map (X = 34) ───────────────────────────────────
    this.buildMapCollectible();

    // ── F. Physical Bounty Clues (Tire tracks, canteen, rucksack) ──────────────
    this.buildPhysicalBountyClues();
  }

  /** Constructs realistic adventurer NPC model for Vikram */
  private buildVikramNPC(): void {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xb58055, roughness: 0.68 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x483220, roughness: 0.75, metalness: 0.1 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x8a7e6b, roughness: 0.85 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b3438, roughness: 0.82 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1f1710, roughness: 0.70 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.95 });

    // 1. Torso with rugged field vest
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.62, 8);
    this.vikramTorso = new THREE.Mesh(torsoGeo, shirtMat);
    this.vikramTorso.position.y = 1.05;
    this.vikramTorso.castShadow = true;
    this.vikramGroup.add(this.vikramTorso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.56, 0.42), vestMat);
    vest.position.y = 1.08;
    this.vikramGroup.add(vest);

    // 2. Head with facial hair & headband
    this.vikramHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skinMat);
    this.vikramHead.position.y = 1.54;
    this.vikramHead.castShadow = true;
    this.vikramGroup.add(this.vikramHead);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), hairMat);
    hair.position.set(0, 1.58, -0.04);
    hair.scale.set(1.05, 1.0, 1.15);
    this.vikramGroup.add(hair);

    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.025, 6, 16), new THREE.MeshStandardMaterial({ color: 0x882418 }));
    headband.position.set(0, 1.58, 0);
    headband.rotation.x = Math.PI / 2;
    this.vikramGroup.add(headband);

    // 3. Legs & Trekking Boots
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.70, 8);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.13, 0.45, 0);
    this.vikramGroup.add(legL);

    const legR = legL.clone();
    legR.position.x = 0.13;
    this.vikramGroup.add(legR);

    const bootGeo = new THREE.BoxGeometry(0.14, 0.16, 0.26);
    const bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(-0.13, 0.08, 0.04);
    bootL.castShadow = true;
    this.vikramGroup.add(bootL);

    const bootR = bootL.clone();
    bootR.position.x = 0.13;
    this.vikramGroup.add(bootR);

    // 4. Arms in cautious watchful pose
    const armGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.58, 8);
    const armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(-0.32, 1.0, 0);
    armL.rotation.z = -0.25;
    this.vikramGroup.add(armL);

    const armR = armL.clone();
    armR.position.x = 0.32;
    armR.rotation.z = 0.25;
    this.vikramGroup.add(armR);

    // Position at hideout
    this.vikramGroup.position.set(this.vikramX, 0, 0);
    this.group.add(this.vikramGroup);
  }

  /** Constructs physical 3D aged parchment map object */
  private buildMapCollectible(): void {
    this.mapMesh = new THREE.Group();

    // Stone table / carved plinth holding the map
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.45, 0.65),
      this.sandstoneMat
    );
    plinth.position.set(0, 0.22, 0);
    plinth.castShadow = true;
    this.mapMesh.add(plinth);

    // Aged parchment with hand-drawn cartography
    const mapTex = ThreeTextureGenerator.getTreasureMapTexture();
    const mapGeo = new THREE.PlaneGeometry(0.65, 0.48);
    const mapMat = new THREE.MeshStandardMaterial({
      map: mapTex,
      roughness: 0.85,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const parchment = new THREE.Mesh(mapGeo, mapMat);
    parchment.position.set(0, 0.46, 0);
    parchment.rotation.x = -Math.PI / 2;
    this.mapMesh.add(parchment);

    // Subtle warm golden archaeological gleam
    const gleam = new THREE.PointLight(0xffbe32, 1.5, 3.5, 2.0);
    gleam.position.set(0, 0.65, 0);
    this.mapMesh.add(gleam);

    this.mapMesh.position.set(34, 0, 0.5);
    this.group.add(this.mapMesh);
  }

  /** Builds physical tracking clues (tire tracks, canteen, rucksack) */
  private buildPhysicalBountyClues(): void {
    // 1. Indented vehicle tire tracks pressed into the mud trail (X = 18 to 28)
    for (let i = 0; i < 8; i++) {
      const trackGeo = new THREE.BoxGeometry(0.18, 0.02, 0.38);
      const trackMat = new THREE.MeshStandardMaterial({ color: 0x3d2d1e, roughness: 1.0 });
      const trackL = new THREE.Mesh(trackGeo, trackMat);
      trackL.position.set(18 + i * 1.8, 0.01, -0.65);
      this.group.add(trackL);

      const trackR = trackL.clone();
      trackR.position.z = 0.65;
      this.group.add(trackR);
    }

    // 2. Discarded military canteen on rock (X = 24)
    const canteenGroup = new THREE.Group();
    canteenGroup.position.set(24, 0.35, -1.2);

    const rockBase = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 1), this.sandstoneMat);
    rockBase.scale.set(1.2, 0.6, 1.0);
    canteenGroup.add(rockBase);

    // Brass/aluminum canteen body with leather strap
    const canteenMat = new THREE.MeshStandardMaterial({ color: 0x7a8a82, roughness: 0.45, metalness: 0.65 });
    const canteenFlask = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12), canteenMat);
    canteenFlask.position.set(0, 0.26, 0);
    canteenFlask.rotation.z = Math.PI / 2.3;
    canteenGroup.add(canteenFlask);

    // Cap with chain
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8), this.chromeMat);
    cap.position.set(0.12, 0.32, 0);
    canteenGroup.add(cap);

    this.group.add(canteenGroup);

    // 3. Abandoned archaeological rucksack (X = 31)
    const rucksackGroup = new THREE.Group();
    rucksackGroup.position.set(31, 0, 1.4);

    const packMat = new THREE.MeshStandardMaterial({ color: 0x48523c, roughness: 0.85 });
    const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.32), packMat);
    packBody.position.set(0, 0.26, 0);
    packBody.rotation.y = -0.35;
    packBody.castShadow = true;
    rucksackGroup.add(packBody);

    // Rolled bedroll on top
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.44, 8), this.tentMat);
    bedroll.position.set(0, 0.56, 0);
    bedroll.rotation.x = Math.PI / 2;
    rucksackGroup.add(bedroll);

    // Brass buckles
    const buckleMat = this.chromeMat;
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), buckleMat);
    buckle.position.set(0, 0.32, 0.17);
    rucksackGroup.add(buckle);

    this.group.add(rucksackGroup);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EXPEDITION TRAIL, SUSPENSION BRIDGE & ROCKY CHASM
  // ═══════════════════════════════════════════════════════════════════════════

  private buildExpeditionPath(): void {
    // ── A. Deep Rocky Ravine & Mountain Stream (X = 54 to 65) ───────────────────
    const ravineDepth = 4.2;
    const ravineGeo = new THREE.BoxGeometry(11, ravineDepth, 8);
    const ravineMat = new THREE.MeshStandardMaterial({ color: 0x1f1914, roughness: 0.95 });
    const ravine = new THREE.Mesh(ravineGeo, ravineMat);
    ravine.position.set(59.5, -ravineDepth * 0.5, 0);
    this.group.add(ravine);

    // Flowing mountain stream water at the ravine floor
    const streamGeo = new THREE.PlaneGeometry(12, 6);
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x24556a,
      roughness: 0.15,
      metalness: 0.25,
      transparent: true,
      opacity: 0.75,
    });
    this.streamWaterMesh = new THREE.Mesh(streamGeo, streamMat);
    this.streamWaterMesh.rotation.x = -Math.PI / 2;
    this.streamWaterMesh.position.set(59.5, -ravineDepth + 0.35, 0);
    this.group.add(this.streamWaterMesh);

    // ── B. Weathered Timber & Hemp Rope Suspension Bridge (X = 54.5 to 57.5) ───
    this.bridgeGroup = new THREE.Group();
    this.bridgeGroup.position.set(56.0, 0.08, 0);

    // 4 sturdy timber anchor posts on the ravine banks
    const postGeo = new THREE.CylinderGeometry(0.10, 0.12, 1.4, 8);
    const postW = this.bridgeWoodMat;
    const posts = [
      { x: -1.45, z: 1.6 }, { x: -1.45, z: -1.6 },
      { x: 1.45, z: 1.6 }, { x: 1.45, z: -1.6 },
    ];
    posts.forEach((p) => {
      const post = new THREE.Mesh(postGeo, postW);
      post.position.set(p.x, 0.7, p.z);
      post.castShadow = true;
      this.bridgeGroup!.add(post);
    });

    // Twin twisted hemp suspension cables
    const cableMat = this.ropeMat;
    const cableL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.1, 6), cableMat);
    cableL.rotation.z = Math.PI / 2;
    cableL.position.set(0, 0.95, 1.6);
    this.bridgeGroup.add(cableL);

    const cableR = cableL.clone();
    cableR.position.z = -1.6;
    this.bridgeGroup.add(cableR);

    // Individual weathered teak wooden planks spanning the bridge
    const numPlanks = 9;
    for (let p = 0; p < numPlanks; p++) {
      const px = -1.35 + (p / (numPlanks - 1)) * 2.7;
      const plankGeo = new THREE.BoxGeometry(0.24, 0.08, 3.4);
      const plank = new THREE.Mesh(plankGeo, this.bridgeWoodMat);
      // Subtle vertical sag in the middle of suspension bridge
      const sag = Math.sin((p / (numPlanks - 1)) * Math.PI) * 0.08;
      plank.position.set(px, -sag, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      this.bridgeGroup.add(plank);
    }

    this.group.add(this.bridgeGroup);

    // ── C. Ancient Fallen Stone Column Jump Gap (X = 62 to 64) ─────────────────
    // An ancient carved sandstone pillar has collapsed across the rock chasm
    const fallenColumnGeo = new THREE.CylinderGeometry(0.38, 0.45, 3.8, 12);
    const fallenColumn = new THREE.Mesh(fallenColumnGeo, this.sandstoneMat);
    fallenColumn.rotation.z = Math.PI / 2.15;
    fallenColumn.position.set(63.0, -0.65, 0);
    fallenColumn.castShadow = true;
    this.group.add(fallenColumn);

    // ── D. Collectible Ancient Indian Punch-Marked Gold Mohurs ──────────────────
    this.buildPunchMarkedGoldCoins();
  }

  private buildPunchMarkedGoldCoins(): void {
    const coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16);

    const coinPositions = [
      { x: 14, y: 0.5 }, { x: 16, y: 0.5 }, { x: 18, y: 0.5 },
      { x: 46, y: 0.5 }, { x: 48, y: 0.5 },
      { x: 59, y: 0.5 }, { x: 61, y: 0.5 },
      { x: 67, y: 0.5 }, { x: 69, y: 0.5 }, { x: 71, y: 0.5 },
    ];

    coinPositions.forEach((pos) => {
      const coinHolder = new THREE.Group();
      coinHolder.position.set(pos.x, pos.y, 0);

      // Carved terracotta offering bowl holding the punch-marked mohur
      const urnGeo = new THREE.CylinderGeometry(0.16, 0.10, 0.14, 8);
      const urnMat = new THREE.MeshStandardMaterial({ color: 0x824424, roughness: 0.9 });
      const urn = new THREE.Mesh(urnGeo, urnMat);
      urn.position.y = -0.12;
      coinHolder.add(urn);

      // Stamped golden Surya disc
      const coin = new THREE.Mesh(coinGeo, this.goldCoinMat);
      coin.rotation.x = Math.PI / 2;
      coin.castShadow = true;
      coinHolder.add(coin);

      this.group.add(coinHolder);
      this.coinMeshes.push(coinHolder);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. MONUMENTAL ANCIENT INDIAN TEMPLE REVEAL (Torana Gateway & Dvarapalas)
  // ═══════════════════════════════════════════════════════════════════════════

  private buildTempleApproach(): void {
    const templeGateGroup = new THREE.Group();
    templeGateGroup.position.set(80, 0, 0);

    // ── A. Grand Stepped Adhishthana (Carved Plinth Base) ──────────────────────
    const plinthMat = this.sandstoneMat;
    const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 9.5), plinthMat);
    plinth1.position.set(0, 0.22, 0);
    plinth1.receiveShadow = true;
    templeGateGroup.add(plinth1);

    const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.40, 8.5), plinthMat);
    plinth2.position.set(0, 0.65, 0);
    plinth2.receiveShadow = true;
    templeGateGroup.add(plinth2);

    // ── B. Monumental Carved Stone Pillars (Stambhas) ──────────────────────────
    // Fluted multi-tiered shafts with Purna-kalasha capitals
    const buildPillar = (z: number) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(0, 0.85, z);

      // Square plinth block
      const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), plinthMat);
      baseBlock.position.y = 0.4;
      baseBlock.castShadow = true;
      pGroup.add(baseBlock);

      // Fluted column shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 4.8, 16), plinthMat);
      shaft.position.y = 3.2;
      shaft.castShadow = true;
      pGroup.add(shaft);

      // Purna-kalasha (sacred vase) capital
      const kalasha = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), plinthMat);
      kalasha.position.y = 5.8;
      kalasha.scale.set(1.0, 0.75, 1.0);
      kalasha.castShadow = true;
      pGroup.add(kalasha);

      // Stepped bracket capital supporting lintel
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), plinthMat);
      bracket.position.y = 6.4;
      bracket.castShadow = true;
      pGroup.add(bracket);

      return pGroup;
    };

    const pillarN = buildPillar(-2.8);
    templeGateGroup.add(pillarN);
    const pillarS = buildPillar(2.8);
    templeGateGroup.add(pillarS);

    // ── C. Monumental Carved Torana Lintel & Relief Friezes ────────────────────
    // Main architrave beam
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 7.8), plinthMat);
    lintel.position.set(0, 7.8, 0);
    lintel.castShadow = true;
    templeGateGroup.add(lintel);

    // Stepped upper shikhara crest
    const crest = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 6.2), plinthMat);
    crest.position.set(0, 8.75, 0);
    crest.castShadow = true;
    templeGateGroup.add(crest);

    // Sacred Sanskrit Inscription Plaque above doorway
    const plaqueMat = new THREE.MeshStandardMaterial({
      color: 0x2d1a0e,
      emissive: 0xd4af37,
      emissiveIntensity: 0.28,
      roughness: 0.5,
      metalness: 0.8,
    });
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 3.8), plaqueMat);
    plaque.position.set(-0.78, 7.8, 0);
    templeGateGroup.add(plaque);

    // ── D. Ancient Stone Guardian Statues (Dvarapalas) ─────────────────────────
    const buildDvarapala = (z: number) => {
      const dvarGroup = new THREE.Group();
      dvarGroup.position.set(-0.85, 0.85, z);

      // Lotus pedestal base
      const lotusPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 12), plinthMat);
      lotusPedestal.position.y = 0.25;
      dvarGroup.add(lotusPedestal);

      // Guardian torso & crown
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.42), plinthMat);
      torso.position.y = 1.1;
      torso.castShadow = true;
      dvarGroup.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), plinthMat);
      head.position.y = 1.9;
      head.castShadow = true;
      dvarGroup.add(head);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 6), plinthMat);
      crown.position.y = 2.35;
      dvarGroup.add(crown);

      // Ceremonial stone mace (Gada)
      const mace = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 1.6, 8), plinthMat);
      mace.position.set(0.28, 1.0, 0.22);
      dvarGroup.add(mace);

      return dvarGroup;
    };

    const dvarL = buildDvarapala(-4.2);
    templeGateGroup.add(dvarL);
    const dvarR = buildDvarapala(4.2);
    templeGateGroup.add(dvarR);

    // ── E. Stepped Grand Threshold (Sopana) ────────────────────────────────────
    // Descending stone steps into the dark rock-cut interior sanctum
    for (let st = 0; st < 6; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 4.8), plinthMat);
      step.position.set(1.5 + st * 0.75, 0.65 - st * 0.28, 0);
      step.receiveShadow = true;
      templeGateGroup.add(step);
    }

    // ── F. Hanging Ancient Jungle Roots & Creepers ─────────────────────────────
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x3d4e28, roughness: 0.9 });
    for (let v = 0; v < 6; v++) {
      const vine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.05, 4.5 + Math.random() * 2, 4),
        vineMat
      );
      vine.position.set(-0.6 + (Math.random() - 0.5) * 0.4, 5.5, -3.2 + v * 1.3);
      vine.rotation.z = (Math.random() - 0.5) * 0.3;
      templeGateGroup.add(vine);
    }

    this.group.add(templeGateGroup);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. LIGHTING & VOLUMETRIC ATMOSPHERE
  // ═══════════════════════════════════════════════════════════════════════════

  private buildLighting(): void {
    // Warm golden-hour late afternoon sun
    const sunLight = new THREE.DirectionalLight(0xffdfb0, 2.2);
    sunLight.position.set(28, 28, -14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0004;
    this.group.add(sunLight);

    // Atmospheric skylight bounce (cool blue sky fill)
    const skyFill = new THREE.HemisphereLight(0x7da4d4, 0x5a4835, 0.75);
    this.group.add(skyFill);

    // Warm ambient fill for shadows
    const ambientFill = new THREE.AmbientLight(0x382c20, 0.40);
    this.group.add(ambientFill);

    // Temple portal dramatic warm threshold light
    const portalWarmLight = new THREE.PointLight(0xffaa44, 2.0, 14, 1.8);
    portalWarmLight.position.set(80, 4.5, 0);
    this.group.add(portalWarmLight);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. SKYBOX GRADIENT
  // ═══════════════════════════════════════════════════════════════════════════

  private buildSkybox(): void {
    const skyGeo = new THREE.PlaneGeometry(350, 120);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        zenithColor: { value: new THREE.Color(0x285584) },
        horizonColor: { value: new THREE.Color(0xffd499) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 zenithColor;
        uniform vec3 horizonColor;
        varying vec2 vUv;
        void main() {
          float t = pow(clamp(vUv.y, 0.0, 1.0), 0.65);
          gl_FragColor = vec4(mix(horizonColor, zenithColor, t), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(30, 25, -45);
    this.group.add(sky);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. COLLIDERS & PHYSICAL PLATFORMS
  // ═══════════════════════════════════════════════════════════════════════════

  private setupColliders(): void {
    // 1. Main trail ground (from level start to ravine)
    this.colliders.push({
      xMin: this.LEVEL_START,
      xMax: 62.0,
      yMin: -0.8,
      yMax: 0.0,
    });

    // 2. Trail after jump gap to temple entrance
    this.colliders.push({
      xMin: 64.0,
      xMax: this.LEVEL_END + 5.0,
      yMin: -0.8,
      yMax: 0.0,
    });

    // 3. Suspension bridge platform
    this.colliders.push({
      xMin: 54.5,
      xMax: 57.5,
      yMin: -0.1,
      yMax: 0.18,
      isPlatform: true,
    });

    // 4. Fallen column jump ledge
    this.colliders.push({
      xMin: 62.2,
      xMax: 63.8,
      yMin: -0.9,
      yMax: -0.35,
      isPlatform: true,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. INTERACTION TARGETS
  // ═══════════════════════════════════════════════════════════════════════════

  private setupInteractions(): void {
    // Sequence 2: Tracking Clues
    this.interactionTargets.push({
      id: 'clue_canteen',
      type: 'clue',
      x: 24,
      y: 0,
      prompt: '[E] Inspect Discarded Canteen',
      data: {
        title: 'Discarded Military Canteen',
        description: 'Stamped with Deccan Survey markings. Still wet. Someone passed through here recently.',
      },
    });

    this.interactionTargets.push({
      id: 'clue_backpack',
      type: 'clue',
      x: 31,
      y: 0,
      prompt: '[E] Inspect Abandoned Pack',
      data: {
        title: 'Abandoned Field Rucksack',
        description: 'Geological maps, rations, and archaeological chisels. This bounty target was hunting the ancient temple.',
      },
    });

    // Sequence 3: Bounty Target Confrontation (Vikram)
    this.interactionTargets.push({
      id: 'target_vikram',
      type: 'bounty_target',
      x: this.vikramX,
      y: 0,
      prompt: '[E] Confront Target',
    });

    // Sequence 4: Ancient Map Discovery
    this.interactionTargets.push({
      id: 'item_ancient_map',
      type: 'map',
      x: 34,
      y: 0,
      prompt: '[E] Pick Up Ancient Map',
    });

    // Sequence 5: Punch-Marked Gold Mohurs along trail
    const coinXPositions = [14, 16, 18, 46, 48, 59, 61, 67, 69, 71];
    coinXPositions.forEach((x, i) => {
      this.interactionTargets.push({
        id: `coin_path_${i}`,
        type: 'coin',
        x,
        y: 0.5,
        prompt: '',
      });
    });

    // Sequence 6: Temple Entrance Transition
    this.interactionTargets.push({
      id: 'temple_entrance',
      type: 'temple_entrance',
      x: 82,
      y: 0,
      prompt: '[E] Enter the Ancient Temple',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. UPDATE & ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  public update(delta: number, playerX: number, playerY: number): void {
    this.animTime += delta;

    // 1. Rotate punch-marked gold mohurs
    this.coinAngle += delta * 2.2;
    this.coinMeshes.forEach((coinHolder) => {
      coinHolder.rotation.y = this.coinAngle;
    });

    // 2. Campfire flickering illumination & ember pulsation
    if (this.campfireLight) {
      this.campfireLight.intensity =
        2.8 + Math.sin(this.animTime * 9.5) * 0.55 + Math.sin(this.animTime * 15.2) * 0.35;
    }
    if (this.campfireFlameMesh) {
      this.campfireFlameMesh.scale.y = 0.65 + Math.sin(this.animTime * 8.0) * 0.15;
    }

    // 3. Map collectible subtle floating sheen
    if (this.mapMesh && !this.isMapCollected) {
      this.mapMesh.position.y = Math.sin(this.animTime * 1.8) * 0.02;
    }

    // 4. Trees gentle natural sway
    this.trees.forEach((tree, i) => {
      tree.rotation.z = Math.sin(this.animTime * 0.75 + i * 0.6) * 0.012;
    });

    // 5. Vikram NPC subtle breathing and idle stance
    if (this.vikramTorso) {
      this.vikramTorso.scale.y = 1.0 + Math.sin(this.animTime * 2.2) * 0.02;
    }
    if (this.vikramHead) {
      this.vikramHead.rotation.y = Math.sin(this.animTime * 1.1) * 0.12;
    }

    // 6. Suspension bridge subtle creak when player is crossing
    if (this.bridgeGroup) {
      const onBridge = playerX >= 54.0 && playerX <= 58.0;
      const targetSag = onBridge ? 0.03 : 0.0;
      this.bridgeGroup.position.y = THREE.MathUtils.lerp(
        this.bridgeGroup.position.y,
        0.08 - targetSag + (onBridge ? Math.sin(this.animTime * 4.0) * 0.008 : 0),
        0.1
      );
    }

    // 7. Auto-collect coins on proximity
    this.checkCoinProximity(playerX, playerY);
  }

  private checkCoinProximity(px: number, py: number): void {
    this.interactionTargets.forEach((target) => {
      if (target.type === 'coin' && !target.collected) {
        const dist = Math.hypot(px - target.x, py - target.y);
        if (dist < 1.35) {
          target.collected = true;
          const coinIdx = [14, 16, 18, 46, 48, 59, 61, 67, 69, 71].indexOf(target.x);
          if (coinIdx >= 0 && coinIdx < this.coinMeshes.length) {
            this.coinMeshes[coinIdx].visible = false;
          }
        }
      }
    });
  }

  /** Animate jeep arrival (called during opening cinematic) */
  public updateJeepPosition(progress: number): void {
    const x = THREE.MathUtils.lerp(this.jeepStartX, this.jeepStopX, progress);
    this.jeepGroup.position.x = x;

    // Wheel rotation based on distance traveled (2*PI*R where R=0.38 -> circum=2.38m)
    const distanceTraveled = x - this.jeepStartX;
    const wheelAngle = (distanceTraveled / 0.38);
    this.jeepWheels.forEach((wheel) => {
      wheel.rotation.z = -wheelAngle;
    });

    // Realistic suspension pitch and roll bounce while traversing dirt road
    const bounce = Math.sin(progress * Math.PI * 8) * 0.035 * (1.0 - progress);
    this.jeepGroup.position.y = bounce;
    this.jeepGroup.rotation.z = Math.sin(progress * Math.PI * 10) * 0.015 * (1.0 - progress);

    // Dust particles active while vehicle is in motion
    if (this.jeepDustParticles) {
      this.jeepDustParticles.visible = progress < 0.98;
    }
  }

  /** Hide map collectible after collection */
  public collectMap(): void {
    this.isMapCollected = true;
    if (this.mapMesh) {
      this.mapMesh.visible = false;
    }
  }

  /** Get collected coin count */
  public getCollectedCoins(): number {
    return this.interactionTargets.filter(
      (t) => t.type === 'coin' && t.collected
    ).length;
  }

  /** Dispose all geometries and materials on cleanup */
  public dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

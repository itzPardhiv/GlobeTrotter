import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

// Node.js FileReader polyfill for Three.js GLTFExporter binary writer
class NodeFileReader {
  result: ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: any) {
    blob.arrayBuffer().then((buf: ArrayBuffer) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
(globalThis as any).FileReader = NodeFileReader;

// Helper to write raw PNG file using Node built-in zlib
function createPngBuffer(width: number, height: number, rgba: Uint8Array): Buffer {
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const raw = Buffer.alloc(height * (width * 4 + 1));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    raw[pos++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      raw[pos++] = rgba[idx];
      raw[pos++] = rgba[idx + 1];
      raw[pos++] = rgba[idx + 2];
      raw[pos++] = rgba[idx + 3];
    }
  }

  const idat = zlib.deflateSync(raw);
  return Buffer.concat([signature, makeChunk('IHDR', ihdr), makeChunk('IDAT', idat), makeChunk('IEND', Buffer.alloc(0))]);
}

console.log('=== GLOBETROTTER: RUDHRA 3D CHARACTER MODEL GENERATION ===');
const baseDir = path.resolve(process.cwd(), 'public/assets/characters');
const texturesDir = path.join(baseDir, 'textures');
fs.mkdirSync(texturesDir, { recursive: true });

// ── 1. GENERATE PBR TEXTURE ASSETS ──────────────────────────────────────────
console.log('1. Generating PBR texture maps...');

// A. Skin & Beard Texture (128x128)
const skinTexBuf = new Uint8Array(128 * 128 * 4);
for (let y = 0; y < 128; y++) {
  for (let x = 0; x < 128; x++) {
    const idx = (y * 128 + x) * 4;
    // Base warm brown/tan skin
    let r = 196 + ((x * y) % 9) - 4;
    let g = 138 + ((x * 7) % 7) - 3;
    let b = 92 + ((y * 5) % 7) - 3;
    // Lower half has rugged stubble beard grain
    if (y > 64) {
      const stubble = ((x * 13 + y * 19) % 17 < 6) ? 0.65 : 0.95;
      r = Math.floor(r * stubble);
      g = Math.floor(g * stubble);
      b = Math.floor(b * stubble);
    }
    skinTexBuf[idx] = Math.min(255, Math.max(0, r));
    skinTexBuf[idx + 1] = Math.min(255, Math.max(0, g));
    skinTexBuf[idx + 2] = Math.min(255, Math.max(0, b));
    skinTexBuf[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'rudhra_skin_face.png'), createPngBuffer(128, 128, skinTexBuf));

// B. Weathered Brown Leather Jacket Texture (128x128)
const jacketTexBuf = new Uint8Array(128 * 128 * 4);
for (let y = 0; y < 128; y++) {
  for (let x = 0; x < 128; x++) {
    const idx = (y * 128 + x) * 4;
    // Rich weathered brown leather with micro grain
    const grain = ((x * 23 + y * 31) % 11) - 5;
    let r = 104 + grain;
    let g = 66 + Math.floor(grain * 0.7);
    let b = 38 + Math.floor(grain * 0.4);
    // Stitched seams
    if (x === 16 || x === 112 || y === 32 || y === 96) {
      r = 145; g = 110; b = 65; // Lighter seam thread
    }
    jacketTexBuf[idx] = Math.min(255, Math.max(0, r));
    jacketTexBuf[idx + 1] = Math.min(255, Math.max(0, g));
    jacketTexBuf[idx + 2] = Math.min(255, Math.max(0, b));
    jacketTexBuf[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'rudhra_jacket_diffuse.png'), createPngBuffer(128, 128, jacketTexBuf));

// C. Earthy Olive Cargo Pants Texture (128x128)
const pantsTexBuf = new Uint8Array(128 * 128 * 4);
for (let y = 0; y < 128; y++) {
  for (let x = 0; x < 128; x++) {
    const idx = (y * 128 + x) * 4;
    // Rugged olive drab twill
    const twill = ((x + y) % 3 === 0) ? 6 : -6;
    let r = 74 + twill;
    let g = 86 + twill;
    let b = 58 + twill;
    // Cargo pocket flap seam
    if (y === 50 && (x > 20 && x < 108)) {
      r = 50; g = 58; b = 40;
    }
    pantsTexBuf[idx] = Math.min(255, Math.max(0, r));
    pantsTexBuf[idx + 1] = Math.min(255, Math.max(0, g));
    pantsTexBuf[idx + 2] = Math.min(255, Math.max(0, b));
    pantsTexBuf[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'rudhra_pants_diffuse.png'), createPngBuffer(128, 128, pantsTexBuf));

// D. Boots & Straps Oiled Dark Leather (128x128)
const bootTexBuf = new Uint8Array(128 * 128 * 4);
for (let y = 0; y < 128; y++) {
  for (let x = 0; x < 128; x++) {
    const idx = (y * 128 + x) * 4;
    const n = ((x * 17 + y * 29) % 7) - 3;
    let r = 52 + n;
    let g = 32 + n;
    let b = 20 + n;
    // Brass eyelets and buckles
    if ((x === 40 || x === 88) && (y % 16 === 8)) {
      r = 185; g = 145; b = 60;
    }
    bootTexBuf[idx] = Math.min(255, Math.max(0, r));
    bootTexBuf[idx + 1] = Math.min(255, Math.max(0, g));
    bootTexBuf[idx + 2] = Math.min(255, Math.max(0, b));
    bootTexBuf[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'rudhra_leather_boots.png'), createPngBuffer(128, 128, bootTexBuf));

// E. Terracotta Red Scarf & Khaki Shirt (128x128)
const fabricTexBuf = new Uint8Array(128 * 128 * 4);
for (let y = 0; y < 128; y++) {
  for (let x = 0; x < 128; x++) {
    const idx = (y * 128 + x) * 4;
    if (y < 64) {
      // Rust/red Varanasi scarf weave
      const fold = Math.sin((x + y * 2) * 0.15) * 16;
      fabricTexBuf[idx] = Math.min(255, Math.max(0, Math.floor(138 + fold)));
      fabricTexBuf[idx + 1] = Math.min(255, Math.max(0, Math.floor(52 + fold * 0.4)));
      fabricTexBuf[idx + 2] = Math.min(255, Math.max(0, Math.floor(40 + fold * 0.3)));
    } else {
      // Warm khaki expedition shirt
      const weave = ((x * 3 + y * 5) % 4) * 4;
      fabricTexBuf[idx] = 204 + weave;
      fabricTexBuf[idx + 1] = 188 + weave;
      fabricTexBuf[idx + 2] = 158 + weave;
    }
    fabricTexBuf[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'rudhra_scarf_diffuse.png'), createPngBuffer(128, 128, fabricTexBuf));

// F. Antique Brass Lantern Texture (128x128)
const brassTexBuf = new Uint8Array(128 * 128 * 4);
for (let y = 0; y < 128; y++) {
  for (let x = 0; x < 128; x++) {
    const idx = (y * 128 + x) * 4;
    const patina = ((x * 19 + y * 23) % 9) - 4;
    brassTexBuf[idx] = Math.min(255, Math.max(0, 182 + patina));
    brassTexBuf[idx + 1] = Math.min(255, Math.max(0, 138 + patina));
    brassTexBuf[idx + 2] = Math.min(255, Math.max(0, 58 + patina));
    brassTexBuf[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'rudhra_brass_lantern.png'), createPngBuffer(128, 128, brassTexBuf));

console.log('Textures written to:', texturesDir);

// ── 2. BUILD 3D RUDHRA CHARACTER MESH HIERARCHY ─────────────────────────────
console.log('2. Constructing high-fidelity Rudhra 3D character mesh...');

// Create Three.js Materials using physically based parameters
const matSkin = new THREE.MeshStandardMaterial({
  color: 0xc48b5c,
  roughness: 0.65,
  metalness: 0.05,
  name: 'Mat_Rudhra_Skin',
});
const matHair = new THREE.MeshStandardMaterial({
  color: 0x1d140e,
  roughness: 0.92,
  metalness: 0.02,
  name: 'Mat_Rudhra_Hair',
});
const matHat = new THREE.MeshStandardMaterial({
  color: 0x4e331e,
  roughness: 0.78,
  metalness: 0.08,
  name: 'Mat_Rudhra_Hat',
});
const matHatBand = new THREE.MeshStandardMaterial({
  color: 0x22160d,
  roughness: 0.5,
  metalness: 0.3,
  name: 'Mat_Rudhra_HatBand',
});
const matJacket = new THREE.MeshStandardMaterial({
  color: 0x614126,
  roughness: 0.72,
  metalness: 0.12,
  name: 'Mat_Rudhra_Jacket',
});
const matScarf = new THREE.MeshStandardMaterial({
  color: 0x8c3426,
  roughness: 0.9,
  metalness: 0.0,
  name: 'Mat_Rudhra_Scarf',
});
const matShirt = new THREE.MeshStandardMaterial({
  color: 0xcfc0a2,
  roughness: 0.88,
  metalness: 0.0,
  name: 'Mat_Rudhra_Shirt',
});
const matPants = new THREE.MeshStandardMaterial({
  color: 0x48563a, // Olive-drab cargo trousers
  roughness: 0.82,
  metalness: 0.05,
  name: 'Mat_Rudhra_CargoPants',
});
const matBoots = new THREE.MeshStandardMaterial({
  color: 0x362115, // Dark oiled leather boots
  roughness: 0.6,
  metalness: 0.15,
  name: 'Mat_Rudhra_Boots',
});
const matBrass = new THREE.MeshStandardMaterial({
  color: 0xb5893d,
  roughness: 0.38,
  metalness: 0.75,
  name: 'Mat_Rudhra_Brass',
});
const matLanternGlass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 0.85,
  opacity: 1,
  transparent: true,
  roughness: 0.1,
  ior: 1.5,
  name: 'Mat_Rudhra_Glass',
});
const matFlame = new THREE.MeshBasicMaterial({
  color: 0xff7700,
  name: 'Mat_Rudhra_Flame',
});

// Root character group
const characterRoot = new THREE.Group();
characterRoot.name = 'Rudhra_Root';

// --- HIPS (Pivot at Y = 0.76m) ---
const hipsNode = new THREE.Group();
hipsNode.name = 'Hips';
hipsNode.position.set(0, 0.76, 0);
characterRoot.add(hipsNode);

// Pelvis & Lower Waist
const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.16, 12);
const pelvisMesh = new THREE.Mesh(pelvisGeo, matPants);
pelvisMesh.name = 'Mesh_Pelvis';
pelvisMesh.castShadow = true;
hipsNode.add(pelvisMesh);

// Utility Belt with Brass Buckle
const beltGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.07, 14);
const beltMesh = new THREE.Mesh(beltGeo, matBoots);
beltMesh.position.y = 0.06;
const buckleGeo = new THREE.BoxGeometry(0.08, 0.065, 0.03);
const buckleMesh = new THREE.Mesh(buckleGeo, matBrass);
buckleMesh.position.set(0, 0.06, 0.19);
hipsNode.add(beltMesh, buckleMesh);

// Messenger Satchel on Left Hip
const satchelGeo = new THREE.BoxGeometry(0.16, 0.18, 0.11);
const satchelMesh = new THREE.Mesh(satchelGeo, matBoots);
satchelMesh.position.set(-0.21, -0.05, 0.0);
satchelMesh.rotation.z = -0.15;
const satchelFlap = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.10, 0.02), matJacket);
satchelFlap.position.set(-0.21, 0.02, 0.055);
satchelFlap.rotation.z = -0.15;
hipsNode.add(satchelMesh, satchelFlap);

// --- SPINE & CHEST (Pivot at Y = 0.10 relative to Hips) ---
const spineNode = new THREE.Group();
spineNode.name = 'Spine';
spineNode.position.set(0, 0.10, 0);
hipsNode.add(spineNode);

// Torso / Jacket
const torsoGeo = new THREE.CylinderGeometry(0.23, 0.19, 0.38, 14);
const torsoMesh = new THREE.Mesh(torsoGeo, matJacket);
torsoMesh.position.y = 0.19;
torsoMesh.name = 'Mesh_Torso';
torsoMesh.castShadow = true;
spineNode.add(torsoMesh);

// Open V-neck Shirt Center
const shirtGeo = new THREE.BoxGeometry(0.16, 0.32, 0.04);
const shirtMesh = new THREE.Mesh(shirtGeo, matShirt);
shirtMesh.position.set(0, 0.20, 0.19);
spineNode.add(shirtMesh);

// Jacket Lapels (Left and Right)
const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.05), matJacket);
lapelL.position.set(-0.11, 0.20, 0.20);
lapelL.rotation.y = 0.2;
const lapelR = lapelL.clone();
lapelR.position.x = 0.11;
lapelR.rotation.y = -0.2;
spineNode.add(lapelL, lapelR);

// Stitched Chest Pockets with Flaps
for (const s of [-1, 1]) {
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.025), matJacket);
  pocket.position.set(s * 0.11, 0.24, 0.22);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.03, 0.03), matJacket);
  flap.position.set(s * 0.11, 0.295, 0.23);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), matBrass);
  button.position.set(s * 0.11, 0.28, 0.245);
  spineNode.add(pocket, flap, button);
}

// Diagonal Crossbody Leather Shoulder Strap
const strapGeo = new THREE.BoxGeometry(0.055, 0.54, 0.02);
const strapMesh = new THREE.Mesh(strapGeo, matBoots);
strapMesh.position.set(-0.06, 0.20, 0.205);
strapMesh.rotation.z = -0.42;
spineNode.add(strapMesh);

// --- NECK & HEAD (Pivot at Y = 0.38 relative to Spine) ---
const neckNode = new THREE.Group();
neckNode.name = 'Neck';
neckNode.position.set(0, 0.38, 0);
spineNode.add(neckNode);

// Terracotta Scarf around Neck
const scarfTorus = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.042, 10, 20), matScarf);
scarfTorus.rotation.x = Math.PI / 2;
scarfTorus.position.set(0, 0.02, 0.02);
const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.03), matScarf);
scarfTail.position.set(0.06, -0.10, 0.16);
scarfTail.rotation.z = -0.2;
neckNode.add(scarfTorus, scarfTail);

// Head Group
const headNode = new THREE.Group();
headNode.name = 'Head';
headNode.position.set(0, 0.10, 0);
neckNode.add(headNode);

// Anatomical Sculpted Head / Face
const headGeo = new THREE.CylinderGeometry(0.12, 0.105, 0.21, 14);
const headMesh = new THREE.Mesh(headGeo, matSkin);
headMesh.name = 'Mesh_Head';
headMesh.castShadow = true;
headNode.add(headMesh);

// Strong Nose Bridge
const noseGeo = new THREE.ConeGeometry(0.028, 0.075, 4);
noseGeo.rotateX(Math.PI / 2);
const noseMesh = new THREE.Mesh(noseGeo, matSkin);
noseMesh.position.set(0, 0.01, 0.125);
headNode.add(noseMesh);

// Brow Ridge
const browGeo = new THREE.BoxGeometry(0.16, 0.035, 0.04);
const browMesh = new THREE.Mesh(browGeo, matSkin);
browMesh.position.set(0, 0.05, 0.115);
headNode.add(browMesh);

// Sculpted Beard & Moustache (Dark masculine stubble/full beard)
const beardJawGeo = new THREE.CylinderGeometry(0.125, 0.108, 0.11, 14, 1, false, 0, Math.PI);
beardJawGeo.rotateY(-Math.PI / 2);
const beardJaw = new THREE.Mesh(beardJawGeo, matHair);
beardJaw.position.set(0, -0.05, 0.015);
const moustache = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.028, 0.035), matHair);
moustache.position.set(0, -0.025, 0.12);
headNode.add(beardJaw, moustache);

// Wavy Hair Volume flowing around sides and nape
const hairBackGeo = new THREE.SphereGeometry(0.138, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
const hairBack = new THREE.Mesh(hairBackGeo, matHair);
hairBack.position.set(0, 0.02, -0.02);
headNode.add(hairBack);

// Side hair locks framing face
for (const side of [-1, 1]) {
  const lock = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 6), matHair);
  lock.position.set(side * 0.12, -0.04, 0.04);
  lock.rotation.z = side * 0.2;
  headNode.add(lock);
}

// Wide-Brimmed Explorer Fedora Hat
const hatGroup = new THREE.Group();
hatGroup.name = 'Fedora_Hat';
hatGroup.position.set(0, 0.11, 0.01);

// Pinched Crown with Center Crease
const crownGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.13, 16);
const crownMesh = new THREE.Mesh(crownGeo, matHat);
crownMesh.position.y = 0.065;
crownMesh.scale.set(0.92, 1.0, 1.08); // Oval head fit

// Crown Top Crease / Pinch
const creaseGeo = new THREE.BoxGeometry(0.04, 0.05, 0.20);
const creaseMesh = new THREE.Mesh(creaseGeo, matHat);
creaseMesh.position.set(0, 0.11, 0);
hatGroup.add(crownMesh, creaseMesh);

// Dark Leather Hatband
const bandGeo = new THREE.CylinderGeometry(0.142, 0.142, 0.035, 16);
const bandMesh = new THREE.Mesh(bandGeo, matHatBand);
bandMesh.position.y = 0.02;
bandMesh.scale.set(0.93, 1.0, 1.09);
const hatBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.015), matBrass);
hatBuckle.position.set(0.135, 0.02, 0);
hatGroup.add(bandMesh, hatBuckle);

// Curved Wide Brim
const brimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 24);
const brimMesh = new THREE.Mesh(brimGeo, matHat);
brimMesh.position.y = 0.01;
brimMesh.scale.set(0.88, 1.0, 1.05); // Explorer wide silhouette
hatGroup.add(brimMesh);

headNode.add(hatGroup);

// --- LEFT ARM (Pivot at Shoulder) ---
const leftShoulderNode = new THREE.Group();
leftShoulderNode.name = 'LeftShoulder';
leftShoulderNode.position.set(-0.25, 0.30, 0);
spineNode.add(leftShoulderNode);

// Upper Arm with Rolled Sleeve
const leftUpperArmGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.24, 10);
const leftUpperArm = new THREE.Mesh(leftUpperArmGeo, matJacket);
leftUpperArm.position.y = -0.12;
leftUpperArm.name = 'Mesh_LeftUpperArm';
leftUpperArm.castShadow = true;
leftShoulderNode.add(leftUpperArm);

// Rolled Sleeve Cuff
const cuffL = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.02, 8, 14), matJacket);
cuffL.rotation.x = Math.PI / 2;
cuffL.position.y = -0.22;
leftShoulderNode.add(cuffL);

// Left Forearm Node (Elbow Pivot at Y = -0.24)
const leftForearmNode = new THREE.Group();
leftForearmNode.name = 'LeftForearm';
leftForearmNode.position.set(0, -0.24, 0);
leftShoulderNode.add(leftForearmNode);

// Bare Muscular Skin Forearm
const leftForearmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.22, 10);
const leftForearm = new THREE.Mesh(leftForearmGeo, matSkin);
leftForearm.position.y = -0.11;
leftForearm.name = 'Mesh_LeftForearm';
leftForearm.castShadow = true;
leftForearmNode.add(leftForearm);

// Left Hand with Fingerless Glove
const leftHandNode = new THREE.Group();
leftHandNode.name = 'LeftHand';
leftHandNode.position.set(0, -0.22, 0);
leftForearmNode.add(leftHandNode);

const leftHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.045), matBoots);
leftHandMesh.position.y = -0.045;
leftHandNode.add(leftHandMesh);

// --- RIGHT ARM & LANTERN (Pivot at Shoulder) ---
const rightShoulderNode = new THREE.Group();
rightShoulderNode.name = 'RightShoulder';
rightShoulderNode.position.set(0.25, 0.30, 0);
spineNode.add(rightShoulderNode);

const rightUpperArmGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.24, 10);
const rightUpperArm = new THREE.Mesh(rightUpperArmGeo, matJacket);
rightUpperArm.position.y = -0.12;
rightUpperArm.name = 'Mesh_RightUpperArm';
rightUpperArm.castShadow = true;
rightShoulderNode.add(rightUpperArm);

const cuffR = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.02, 8, 14), matJacket);
cuffR.rotation.x = Math.PI / 2;
cuffR.position.y = -0.22;
rightShoulderNode.add(cuffR);

const rightForearmNode = new THREE.Group();
rightForearmNode.name = 'RightForearm';
rightForearmNode.position.set(0, -0.24, 0);
rightShoulderNode.add(rightForearmNode);

const rightForearmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.22, 10);
const rightForearm = new THREE.Mesh(rightForearmGeo, matSkin);
rightForearm.position.y = -0.11;
rightForearm.name = 'Mesh_RightForearm';
rightForearm.castShadow = true;
rightForearmNode.add(rightForearm);

const rightHandNode = new THREE.Group();
rightHandNode.name = 'RightHand';
rightHandNode.position.set(0, -0.22, 0);
rightForearmNode.add(rightHandNode);

const rightHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.045), matBoots);
rightHandMesh.position.y = -0.045;
rightHandNode.add(rightHandMesh);

// --- VINTAGE BRASS EXPEDITION LANTERN (Attached to Right Hand) ---
const lanternNode = new THREE.Group();
lanternNode.name = 'Lantern';
lanternNode.position.set(0.02, -0.16, 0.12);
rightHandNode.add(lanternNode);

// Lantern Wire Bail Handle
const bailGeo = new THREE.TorusGeometry(0.07, 0.008, 6, 16, Math.PI);
const bailMesh = new THREE.Mesh(bailGeo, matBrass);
bailMesh.rotation.z = Math.PI;
bailMesh.position.y = 0.12;
lanternNode.add(bailMesh);

// Brass Top Cap with Vents
const capGeo = new THREE.CylinderGeometry(0.04, 0.065, 0.05, 10);
const capMesh = new THREE.Mesh(capGeo, matBrass);
capMesh.position.y = 0.09;
lanternNode.add(capMesh);

// Glass Combustion Chamber
const glassGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12);
const glassMesh = new THREE.Mesh(glassGeo, matLanternGlass);
glassMesh.position.y = 0.01;
lanternNode.add(glassMesh);

// Protective Cage Wire Struts (4 ribs)
for (let r = 0; r < 4; r++) {
  const angle = (r / 4) * Math.PI * 2;
  const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), matBrass);
  rib.position.set(Math.cos(angle) * 0.068, 0.01, Math.sin(angle) * 0.068);
  lanternNode.add(rib);
}

// Brass Base Reservoir
const baseGeo = new THREE.CylinderGeometry(0.075, 0.08, 0.06, 12);
const baseMesh = new THREE.Mesh(baseGeo, matBrass);
baseMesh.position.y = -0.075;
lanternNode.add(baseMesh);

// Internal Faceted Flame Core (Emissive Orange/Yellow)
const flameGeo = new THREE.OctahedronGeometry(0.035, 1);
flameGeo.scale(0.8, 1.4, 0.8);
const flameMesh = new THREE.Mesh(flameGeo, matFlame);
flameMesh.name = 'Mesh_Flame';
flameMesh.position.y = 0.01;
lanternNode.add(flameMesh);

// --- LEGS & BOOTS (Pivots at Hips Y = 0.76) ---
// Left Leg Node
const leftUpLegNode = new THREE.Group();
leftUpLegNode.name = 'LeftUpLeg';
leftUpLegNode.position.set(-0.11, -0.04, 0);
hipsNode.add(leftUpLegNode);

// Thigh in Cargo Pants
const thighGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.36, 10);
const leftThigh = new THREE.Mesh(thighGeo, matPants);
leftThigh.position.y = -0.18;
leftThigh.name = 'Mesh_LeftThigh';
leftThigh.castShadow = true;
leftUpLegNode.add(leftThigh);

// 3D Cargo Pocket on Outer Thigh
const cargoPockGeo = new THREE.BoxGeometry(0.035, 0.13, 0.10);
const leftCargoPocket = new THREE.Mesh(cargoPockGeo, matPants);
leftCargoPocket.position.set(-0.085, -0.18, 0.01);
leftUpLegNode.add(leftCargoPocket);

// Left Knee Node (Pivot at Y = -0.36)
const leftLegNode = new THREE.Group();
leftLegNode.name = 'LeftLeg';
leftLegNode.position.set(0, -0.36, 0);
leftUpLegNode.add(leftLegNode);

// Lower Leg in Cargo Pants
const leftShinGeo = new THREE.CylinderGeometry(0.072, 0.06, 0.28, 10);
const leftShin = new THREE.Mesh(leftShinGeo, matPants);
leftShin.position.y = -0.14;
leftShin.name = 'Mesh_LeftShin';
leftShin.castShadow = true;
leftLegNode.add(leftShin);

// Left Foot & Boot Node (Pivot at Y = -0.28)
const leftFootNode = new THREE.Group();
leftFootNode.name = 'LeftFoot';
leftFootNode.position.set(0, -0.28, 0);
leftLegNode.add(leftFootNode);

// Boot Shaft & Tongue
const bootShaftGeo = new THREE.CylinderGeometry(0.075, 0.07, 0.14, 10);
const leftBootShaft = new THREE.Mesh(bootShaftGeo, matBoots);
leftBootShaft.position.y = 0.04;
leftBootShaft.name = 'Mesh_LeftBoot';
leftFootNode.add(leftBootShaft);

// Boot Foot & Treaded Sole
const bootFootGeo = new THREE.BoxGeometry(0.11, 0.08, 0.24);
const leftBootFoot = new THREE.Mesh(bootFootGeo, matBoots);
leftBootFoot.position.set(0, -0.04, 0.04);
leftFootNode.add(leftBootFoot);

// Right Leg Node
const rightUpLegNode = new THREE.Group();
rightUpLegNode.name = 'RightUpLeg';
rightUpLegNode.position.set(0.11, -0.04, 0);
hipsNode.add(rightUpLegNode);

const rightThigh = new THREE.Mesh(thighGeo, matPants);
rightThigh.position.y = -0.18;
rightThigh.name = 'Mesh_RightThigh';
rightThigh.castShadow = true;
rightUpLegNode.add(rightThigh);

const rightCargoPocket = new THREE.Mesh(cargoPockGeo, matPants);
rightCargoPocket.position.set(0.085, -0.18, 0.01);
rightUpLegNode.add(rightCargoPocket);

const rightLegNode = new THREE.Group();
rightLegNode.name = 'RightLeg';
rightLegNode.position.set(0, -0.36, 0);
rightUpLegNode.add(rightLegNode);

const rightShin = new THREE.Mesh(leftShinGeo, matPants);
rightShin.position.y = -0.14;
rightShin.name = 'Mesh_RightShin';
rightShin.castShadow = true;
rightLegNode.add(rightShin);

const rightFootNode = new THREE.Group();
rightFootNode.name = 'RightFoot';
rightFootNode.position.set(0, -0.28, 0);
rightLegNode.add(rightFootNode);

const rightBootShaft = new THREE.Mesh(bootShaftGeo, matBoots);
rightBootShaft.position.y = 0.04;
rightBootShaft.name = 'Mesh_RightBoot';
rightFootNode.add(rightBootShaft);

const rightBootFoot = new THREE.Mesh(bootFootGeo, matBoots);
rightBootFoot.position.set(0, -0.04, 0.04);
rightFootNode.add(rightBootFoot);

// ── 3. CREATE ANIMATION CLIPS ───────────────────────────────────────────────
console.log('3. Authoring keyframed animation clips...');

// Helper for VectorKeyframeTrack / QuaternionKeyframeTrack
function createEulerTracks(prefix: string, times: number[], eulerAngles: [number, number, number][]) {
  const qValues: number[] = [];
  const euler = new THREE.Euler();
  const q = new THREE.Quaternion();
  for (const [x, y, z] of eulerAngles) {
    euler.set(x, y, z);
    q.setFromEuler(euler);
    qValues.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${prefix}.quaternion`, times, qValues);
}

function createPosTrack(prefix: string, times: number[], positions: [number, number, number][]) {
  const pValues: number[] = [];
  for (const [x, y, z] of positions) {
    pValues.push(x, y, z);
  }
  return new THREE.VectorKeyframeTrack(`${prefix}.position`, times, pValues);
}

// 1. IDLE CLIP (2.0s loop)
const idleTimes = [0.0, 1.0, 2.0];
const idleTracks = [
  // Hips subtle breathing bob
  createPosTrack('Hips', idleTimes, [
    [0, 0.76, 0],
    [0, 0.75, 0],
    [0, 0.76, 0],
  ]),
  // Spine gentle expansion
  createEulerTracks('Spine', idleTimes, [
    [0, 0, 0],
    [-0.04, 0, 0],
    [0, 0, 0],
  ]),
  // Head subtle glance
  createEulerTracks('Head', idleTimes, [
    [0, 0, 0],
    [0.03, 0.08, 0],
    [0, 0, 0],
  ]),
  // Left arm natural hang
  createEulerTracks('LeftShoulder', idleTimes, [
    [0.05, 0, -0.05],
    [0.02, 0, -0.03],
    [0.05, 0, -0.05],
  ]),
  // Right arm carrying lantern steady
  createEulerTracks('RightShoulder', idleTimes, [
    [0.15, 0, 0.08],
    [0.12, 0, 0.06],
    [0.15, 0, 0.08],
  ]),
  // Lantern gentle organic sway
  createEulerTracks('Lantern', idleTimes, [
    [0, 0, 0.05],
    [0, 0, -0.05],
    [0, 0, 0.05],
  ]),
];
const clipIdle = new THREE.AnimationClip('idle', 2.0, idleTracks);

// 2. WALK CLIP (1.2s loop)
const walkTimes = [0.0, 0.3, 0.6, 0.9, 1.2];
const walkTracks = [
  // Hips bob and sway
  createPosTrack('Hips', walkTimes, [
    [0, 0.76, 0],
    [0, 0.74, 0],
    [0, 0.76, 0],
    [0, 0.74, 0],
    [0, 0.76, 0],
  ]),
  // Spine slight rotation opposite legs
  createEulerTracks('Spine', walkTimes, [
    [0, 0.06, 0],
    [0, 0, 0],
    [0, -0.06, 0],
    [0, 0, 0],
    [0, 0.06, 0],
  ]),
  // Left Leg swing
  createEulerTracks('LeftUpLeg', walkTimes, [
    [-0.45, 0, 0],
    [0.0, 0, 0],
    [0.45, 0, 0],
    [0.1, 0, 0],
    [-0.45, 0, 0],
  ]),
  createEulerTracks('LeftLeg', walkTimes, [
    [0.0, 0, 0],
    [-0.55, 0, 0],
    [0.0, 0, 0],
    [-0.2, 0, 0],
    [0.0, 0, 0],
  ]),
  // Right Leg swing (180 deg out of phase)
  createEulerTracks('RightUpLeg', walkTimes, [
    [0.45, 0, 0],
    [0.1, 0, 0],
    [-0.45, 0, 0],
    [0.0, 0, 0],
    [0.45, 0, 0],
  ]),
  createEulerTracks('RightLeg', walkTimes, [
    [0.0, 0, 0],
    [-0.2, 0, 0],
    [0.0, 0, 0],
    [-0.55, 0, 0],
    [0.0, 0, 0],
  ]),
  // Arm counter swings
  createEulerTracks('LeftShoulder', walkTimes, [
    [0.35, 0, -0.05],
    [0.0, 0, -0.05],
    [-0.30, 0, -0.05],
    [0.0, 0, -0.05],
    [0.35, 0, -0.05],
  ]),
  createEulerTracks('RightShoulder', walkTimes, [
    [-0.20, 0, 0.08],
    [0.0, 0, 0.08],
    [0.30, 0, 0.08],
    [0.0, 0, 0.08],
    [-0.20, 0, 0.08],
  ]),
  // Lantern stabilizing motion
  createEulerTracks('Lantern', walkTimes, [
    [-0.15, 0, 0],
    [0.0, 0, 0],
    [0.15, 0, 0],
    [0.0, 0, 0],
    [-0.15, 0, 0],
  ]),
];
const clipWalk = new THREE.AnimationClip('walk', 1.2, walkTracks);

// 3. RUN CLIP (0.8s loop)
const runTimes = [0.0, 0.2, 0.4, 0.6, 0.8];
const runTracks = [
  // Hips energetic bounce & forward lean
  createPosTrack('Hips', runTimes, [
    [0, 0.74, 0],
    [0, 0.78, 0],
    [0, 0.74, 0],
    [0, 0.78, 0],
    [0, 0.74, 0],
  ]),
  // Spine forward lean
  createEulerTracks('Spine', runTimes, [
    [0.22, 0.08, 0],
    [0.22, 0, 0],
    [0.22, -0.08, 0],
    [0.22, 0, 0],
    [0.22, 0.08, 0],
  ]),
  // Left Leg vigorous stride
  createEulerTracks('LeftUpLeg', runTimes, [
    [-0.75, 0, 0],
    [0.0, 0, 0],
    [0.70, 0, 0],
    [0.2, 0, 0],
    [-0.75, 0, 0],
  ]),
  createEulerTracks('LeftLeg', runTimes, [
    [0.0, 0, 0],
    [-0.95, 0, 0],
    [0.0, 0, 0],
    [-0.3, 0, 0],
    [0.0, 0, 0],
  ]),
  // Right Leg vigorous stride
  createEulerTracks('RightUpLeg', runTimes, [
    [0.70, 0, 0],
    [0.2, 0, 0],
    [-0.75, 0, 0],
    [0.0, 0, 0],
    [0.70, 0, 0],
  ]),
  createEulerTracks('RightLeg', runTimes, [
    [0.0, 0, 0],
    [-0.3, 0, 0],
    [0.0, 0, 0],
    [-0.95, 0, 0],
    [0.0, 0, 0],
  ]),
  // Arms driving
  createEulerTracks('LeftShoulder', runTimes, [
    [0.75, 0, -0.1],
    [0.0, 0, -0.1],
    [-0.65, 0, -0.1],
    [0.0, 0, -0.1],
    [0.75, 0, -0.1],
  ]),
  createEulerTracks('RightShoulder', runTimes, [
    [-0.45, 0, 0.1],
    [0.0, 0, 0.1],
    [0.55, 0, 0.1],
    [0.0, 0, 0.1],
    [-0.45, 0, 0.1],
  ]),
];
const clipRun = new THREE.AnimationClip('run', 0.8, runTracks);

// 4. JUMP CLIP (1.0s)
const jumpTimes = [0.0, 0.2, 0.5, 0.8, 1.0];
const jumpTracks = [
  // Hips launch and tuck
  createPosTrack('Hips', jumpTimes, [
    [0, 0.70, 0], // Anticipation crouch
    [0, 0.82, 0], // Launch
    [0, 0.88, 0], // Apex tuck
    [0, 0.74, 0], // Fall
    [0, 0.70, 0], // Land compression
  ]),
  createEulerTracks('Spine', jumpTimes, [
    [0.15, 0, 0],
    [-0.10, 0, 0],
    [0.12, 0, 0],
    [0.05, 0, 0],
    [0.20, 0, 0],
  ]),
  createEulerTracks('LeftUpLeg', jumpTimes, [
    [-0.35, 0, 0],
    [-0.10, 0, 0],
    [-0.65, 0, 0],
    [-0.20, 0, 0],
    [-0.40, 0, 0],
  ]),
  createEulerTracks('LeftLeg', jumpTimes, [
    [-0.5, 0, 0],
    [0.0, 0, 0],
    [-0.8, 0, 0],
    [-0.2, 0, 0],
    [-0.6, 0, 0],
  ]),
  createEulerTracks('RightUpLeg', jumpTimes, [
    [-0.35, 0, 0],
    [-0.10, 0, 0],
    [-0.55, 0, 0],
    [-0.20, 0, 0],
    [-0.40, 0, 0],
  ]),
  createEulerTracks('RightLeg', jumpTimes, [
    [-0.5, 0, 0],
    [0.0, 0, 0],
    [-0.7, 0, 0],
    [-0.2, 0, 0],
    [-0.6, 0, 0],
  ]),
  createEulerTracks('LeftShoulder', jumpTimes, [
    [-0.2, 0, 0],
    [0.8, 0, -0.2],
    [0.9, 0, -0.3],
    [0.3, 0, -0.1],
    [-0.1, 0, 0],
  ]),
  createEulerTracks('RightShoulder', jumpTimes, [
    [-0.1, 0, 0],
    [0.5, 0, 0.2],
    [0.6, 0, 0.2],
    [0.2, 0, 0.1],
    [0.0, 0, 0],
  ]),
];
const clipJump = new THREE.AnimationClip('jump', 1.0, jumpTracks);

// 5. CROUCH / CRAWL CLIP (1.2s loop)
// Clearance height drops to ~0.92m (well below 1.2m tunnel ceiling!)
const crouchTimes = [0.0, 0.6, 1.2];
const crouchTracks = [
  createPosTrack('Hips', crouchTimes, [
    [0, 0.48, 0],
    [0, 0.46, 0],
    [0, 0.48, 0],
  ]),
  createEulerTracks('Spine', crouchTimes, [
    [0.55, 0, 0],
    [0.52, 0, 0],
    [0.55, 0, 0],
  ]),
  createEulerTracks('Head', crouchTimes, [
    [-0.45, 0, 0], // Look forward under low ceiling
    [-0.42, 0, 0],
    [-0.45, 0, 0],
  ]),
  createEulerTracks('LeftUpLeg', crouchTimes, [
    [-0.95, 0, -0.1],
    [-0.85, 0, -0.1],
    [-0.95, 0, -0.1],
  ]),
  createEulerTracks('LeftLeg', crouchTimes, [
    [-1.25, 0, 0],
    [-1.15, 0, 0],
    [-1.25, 0, 0],
  ]),
  createEulerTracks('RightUpLeg', crouchTimes, [
    [-0.85, 0, 0.1],
    [-0.95, 0, 0.1],
    [-0.85, 0, 0.1],
  ]),
  createEulerTracks('RightLeg', crouchTimes, [
    [-1.15, 0, 0],
    [-1.25, 0, 0],
    [-1.15, 0, 0],
  ]),
  // Right hand holds lantern low to illuminate crawlway
  createEulerTracks('RightShoulder', crouchTimes, [
    [0.45, 0, 0.1],
    [0.40, 0, 0.1],
    [0.45, 0, 0.1],
  ]),
];
const clipCrouch = new THREE.AnimationClip('crouch', 1.2, crouchTracks);

// 6. INTERACT CLIP (1.5s)
const interactTimes = [0.0, 0.6, 1.2, 1.5];
const interactTracks = [
  createEulerTracks('Spine', interactTimes, [
    [0, 0, 0],
    [0.18, 0.1, 0],
    [0.18, 0.1, 0],
    [0, 0, 0],
  ]),
  createEulerTracks('Head', interactTimes, [
    [0, 0, 0],
    [0.25, 0.1, 0], // Focus down on altar/mechanism
    [0.25, 0.1, 0],
    [0, 0, 0],
  ]),
  // Right arm reaches forward and places artifact
  createEulerTracks('RightShoulder', interactTimes, [
    [0.15, 0, 0.08],
    [0.85, -0.2, 0.15],
    [0.85, -0.2, 0.15],
    [0.15, 0, 0.08],
  ]),
  createEulerTracks('RightForearm', interactTimes, [
    [0, 0, 0],
    [-0.45, 0, 0],
    [-0.45, 0, 0],
    [0, 0, 0],
  ]),
];
const clipInteract = new THREE.AnimationClip('interact', 1.5, interactTracks);

// Attach animations to root group
characterRoot.animations = [clipIdle, clipWalk, clipRun, clipJump, clipCrouch, clipInteract];

// ── 4. EXPORT TO BINARY GLTF (.GLB) ─────────────────────────────────────────
console.log('4. Exporting Rudhra to binary GLB format...');
const glbOutputPath = path.join(baseDir, 'rudhra.glb');

const exporter = new GLTFExporter();
exporter.parse(
  characterRoot,
  (result) => {
    const glbBuffer = Buffer.from(result as ArrayBuffer);
    fs.writeFileSync(glbOutputPath, glbBuffer);
    console.log(`✓ rudhra.glb successfully created (${glbBuffer.length} bytes) at: ${glbOutputPath}`);
  },
  (error) => {
    console.error('GLTF Export Failed:', error);
    process.exit(1);
  },
  {
    binary: true,
    animations: characterRoot.animations,
    includeCustomExtensions: true,
  }
);

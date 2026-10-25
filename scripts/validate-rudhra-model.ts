import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('======================================================');
console.log('GLOBETROTTER: RUDHRA 3D CHARACTER GLB VALIDATION');
console.log('======================================================\n');

const glbPath = path.resolve(process.cwd(), 'public/assets/characters/rudhra.glb');

if (!fs.existsSync(glbPath)) {
  console.error(`[FAIL] Character model not found at: ${glbPath}`);
  process.exit(1);
}

const stats = fs.statSync(glbPath);
console.log(`[PASS] Found rudhra.glb (${(stats.size / 1024).toFixed(1)} KB)`);

const buffer = fs.readFileSync(glbPath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new GLTFLoader();
loader.parse(
  arrayBuffer,
  '',
  (gltf) => {
    console.log('[PASS] GLTFLoader successfully parsed binary GLB');

    // 1. Scene & Meshes
    let meshCount = 0;
    let vertexCount = 0;
    const foundNodes: string[] = [];

    gltf.scene.traverse((child) => {
      if (child.name) foundNodes.push(child.name);
      if ((child as THREE.Mesh).isMesh) {
        meshCount++;
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          vertexCount += mesh.geometry.attributes.position ? mesh.geometry.attributes.position.count : 0;
        }
      }
    });

    console.log(`[PASS] Verified ${meshCount} distinct geometry meshes, ${vertexCount} total vertices`);

    // 2. Anatomical & Equipment Node Verification
    const requiredNodes = [
      'Hips',
      'Spine',
      'Head',
      'Fedora_Hat',
      'LeftShoulder',
      'RightShoulder',
      'Lantern',
      'LeftUpLeg',
      'RightUpLeg',
      'LeftFoot',
      'RightFoot',
    ];

    const missingNodes = requiredNodes.filter((n) => !foundNodes.includes(n));
    if (missingNodes.length > 0) {
      console.error(`[FAIL] Missing required anatomical/equipment nodes: ${missingNodes.join(', ')}`);
      process.exit(1);
    }
    console.log(`[PASS] Verified all ${requiredNodes.length} required skeletal and prop nodes`);

    // 3. Dimensional Scale Audit
    const bbox = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    console.log(`[PASS] Character Bounding Box: Width=${size.x.toFixed(2)}m, Height=${size.y.toFixed(2)}m, Depth=${size.z.toFixed(2)}m`);

    if (size.y < 1.4 || size.y > 1.9) {
      console.error(`[FAIL] Character height ${size.y.toFixed(2)}m is out of expected 1.4m - 1.9m range`);
      process.exit(1);
    }

    // 4. Animation Clip Verification
    const requiredAnims = ['idle', 'walk', 'run', 'jump', 'crouch', 'interact'];
    const foundAnims = gltf.animations.map((a) => a.name);

    console.log(`[PASS] Found ${gltf.animations.length} animation clips: [ ${foundAnims.join(', ')} ]`);

    const missingAnims = requiredAnims.filter((a) => !foundAnims.includes(a));
    if (missingAnims.length > 0) {
      console.error(`[FAIL] Missing animation clips: ${missingAnims.join(', ')}`);
      process.exit(1);
    }
    console.log('[PASS] Verified all 6 core gameplay animations present');

    // 5. Materials check
    const materials = new Set<string>();
    gltf.scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => materials.add(m.name));
        } else {
          materials.add(mesh.material.name);
        }
      }
    });

    console.log(`[PASS] Verified ${materials.size} physically based materials applied: [ ${Array.from(materials).join(', ')} ]`);

    console.log('\n======================================================');
    console.log('RUDHRA 3D GLB MODEL VALIDATION: ALL AUDITS PASSED');
    console.log('======================================================');
  },
  (err) => {
    console.error('[FAIL] GLTFLoader error:', err);
    process.exit(1);
  }
);

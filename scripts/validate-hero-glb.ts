import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(globalThis as any).self = globalThis;
(globalThis as any).window = globalThis;
(globalThis as any).createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} });

if (typeof globalThis.FileReader === 'undefined') {
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
}

const targetPath = path.resolve(__dirname, '../public/assets/characters/rudhra_pbr_hero.glb');
console.log('Validating:', targetPath);

const buf = fs.readFileSync(targetPath);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const loader = new GLTFLoader();

loader.parse(ab, '', (gltf) => {
  console.log('[PASS] GLTFLoader parsed rudhra_pbr_hero.glb successfully!');
  const scene = gltf.scene;
  let meshCount = 0;
  let vertCount = 0;
  let triCount = 0;
  scene.traverse((c: any) => {
    if (c.isMesh) {
      meshCount++;
      const pos = c.geometry.getAttribute('position');
      vertCount += pos.count;
      if (c.geometry.index) triCount += c.geometry.index.count / 3;
      console.log('Mesh name:', c.name, 'material name:', c.material.name, 'type:', c.material.type);
    }
  });

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log(`Bounds: Width: ${size.x.toFixed(4)}m, Height: ${size.y.toFixed(4)}m, Depth: ${size.z.toFixed(4)}m`);
  console.log(`Min: [${box.min.x.toFixed(4)}, ${box.min.y.toFixed(4)}, ${box.min.z.toFixed(4)}]`);
  console.log(`Max: [${box.max.x.toFixed(4)}, ${box.max.y.toFixed(4)}, ${box.max.z.toFixed(4)}]`);
  console.log(`Total Meshes: ${meshCount}, Vertices: ${vertCount.toLocaleString()}, Triangles: ${triCount.toLocaleString()}`);

  if (meshCount === 1 && vertCount === 136207 && Math.abs(size.y - 1.65) < 0.01) {
    console.log('[ALL CHECKS PASSED] rudhra_pbr_hero.glb is ready for game integration!');
  } else {
    console.error('[FAIL] Unexpected properties');
    process.exit(1);
  }
}, (err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});

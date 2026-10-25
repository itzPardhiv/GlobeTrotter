import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(globalThis as any).self = globalThis;
(globalThis as any).window = globalThis;

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

if (typeof globalThis.ImageBitmap === 'undefined') {
  (globalThis as any).createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} });
}

async function inspectDepth() {
  const glbPath = path.resolve(__dirname, '../../e57776c6-b85e-49ef-b2a4-9a1ba58a656a/base_basic_pbr.glb');
  const buf = fs.readFileSync(glbPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();

  loader.parse(arrayBuffer, '', (gltf) => {
    const scene = gltf.scene;
    let mainMesh: THREE.Mesh | null = null;

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && !mainMesh) {
        mainMesh = obj as THREE.Mesh;
      }
    });

    if (!mainMesh) {
      console.log('No mesh found');
      return;
    }

    const geom = (mainMesh as THREE.Mesh).geometry;
    const pos = geom.getAttribute('position');
    const uvs = geom.getAttribute('uv');
    const normals = geom.getAttribute('normal');

    console.log('Total vertices:', pos.count);

    // Let's sample vertices along X
    // X ranges from -0.8991 to 0.9107
    // Let's divide into 5 segments corresponding to the 5 figures:
    // 1. Far Left (Hero pose with lantern): X in [-0.90, -0.35]
    // 2. Middle Left (Front A-pose): X in [-0.35, -0.05]
    // 3. Center (Side Profile): X in [-0.05, 0.20]
    // 4. Middle Right (Back View): X in [0.20, 0.55]
    // 5. Far Right (Side Profile 2): X in [0.55, 0.91]

    const segments = [
      { name: '1. Far-Left Hero Pose (with Lantern)', minX: -0.90, maxX: -0.35 },
      { name: '2. Front A-Pose Figure', minX: -0.35, maxX: -0.05 },
      { name: '3. Left Profile Figure', minX: -0.05, maxX: 0.20 },
      { name: '4. Rear View Figure', minX: 0.20, maxX: 0.55 },
      { name: '5. Right Profile Figure', minX: 0.55, maxX: 0.91 },
    ];

    for (const seg of segments) {
      let count = 0;
      let minZ = Infinity, maxZ = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        if (x >= seg.minX && x < seg.maxX) {
          count++;
          const y = pos.getY(i);
          const z = pos.getZ(i);
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
      }
      console.log(`\nSegment: ${seg.name}`);
      console.log(`  Vertices: ${count.toLocaleString()}`);
      console.log(`  Height (Y): ${(maxY - minY).toFixed(4)}m (Y range: ${minY.toFixed(4)} to ${maxY.toFixed(4)})`);
      console.log(`  Thickness/Depth (Z): ${(maxZ - minZ).toFixed(4)}m (Z range: ${minZ.toFixed(4)} to ${maxZ.toFixed(4)})`);
    }

    // Check if the 5 figures are physically connected in the mesh or separate components
    // We can check connected components by traversing triangles
    const index = geom.getIndex();
    if (index) {
      console.log('\nChecking mesh topology (index triangles):', index.count / 3);
      // Let's check triangles that span across segments
      let crossSegmentTris = 0;
      for (let t = 0; t < index.count; t += 3) {
        const i0 = index.getX(t);
        const i1 = index.getX(t + 1);
        const i2 = index.getX(t + 2);
        const x0 = pos.getX(i0);
        const x1 = pos.getX(i1);
        const x2 = pos.getX(i2);
        // If triangle spans more than 0.1m along X, it might be a connecting bridge or background
        if (Math.abs(x0 - x1) > 0.1 || Math.abs(x1 - x2) > 0.1 || Math.abs(x0 - x2) > 0.1) {
          crossSegmentTris++;
        }
      }
      console.log('Triangles spanning wide X gaps (>0.1m):', crossSegmentTris);
    }
  });
}

inspectDepth().catch(console.error);

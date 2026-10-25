import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(globalThis as any).self = globalThis;
(globalThis as any).window = globalThis;

// Polyfill Node FileReader for GLTFExporter / GLTFLoader
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

async function exportHeroModel() {
  console.log('=== GLOBETROTTER: EXPORTING ISOLATED RUDHRA PBR HERO MODEL ===\n');

  const sourceGlbPath = path.resolve(__dirname, '../../e57776c6-b85e-49ef-b2a4-9a1ba58a656a/base_basic_pbr.glb');
  const targetGlbPath = path.resolve(__dirname, '../public/assets/characters/rudhra_pbr_hero.glb');

  if (!fs.existsSync(sourceGlbPath)) {
    throw new Error(`Source model not found at ${sourceGlbPath}`);
  }

  const buf = fs.readFileSync(sourceGlbPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();

  const gltf = await new Promise<any>((resolve, reject) => {
    loader.parse(arrayBuffer, '', resolve, reject);
  });

  let originalMesh: THREE.Mesh | null = null;
  gltf.scene.traverse((c: any) => {
    if (c.isMesh && !originalMesh) originalMesh = c;
  });

  if (!originalMesh) throw new Error('No mesh found in source GLB');

  const geom = (originalMesh as THREE.Mesh).geometry;
  const pos = geom.getAttribute('position');
  const normal = geom.getAttribute('normal');
  const uv = geom.getAttribute('uv');
  const index = geom.getIndex();

  if (!index) throw new Error('Source geometry has no index buffer');

  console.log(`Source geometry: ${pos.count.toLocaleString()} vertices, ${(index.count / 3).toLocaleString()} triangles.`);

  // 1. Isolate Hero Triangles (All vertices X <= -0.34m)
  const heroCutoffX = -0.34;
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newUvs: number[] = [];
  const newIndices: number[] = [];
  const vertMap = new Map<number, number>();

  let isolatedTris = 0;
  for (let t = 0; t < index.count; t += 3) {
    const i0 = index.getX(t);
    const i1 = index.getX(t + 1);
    const i2 = index.getX(t + 2);

    const x0 = pos.getX(i0);
    const x1 = pos.getX(i1);
    const x2 = pos.getX(i2);

    if (x0 <= heroCutoffX && x1 <= heroCutoffX && x2 <= heroCutoffX) {
      isolatedTris++;
      const getNewIdx = (oldIdx: number) => {
        if (vertMap.has(oldIdx)) return vertMap.get(oldIdx)!;
        const nextIdx = newPositions.length / 3;
        newPositions.push(pos.getX(oldIdx), pos.getY(oldIdx), pos.getZ(oldIdx));
        if (normal) newNormals.push(normal.getX(oldIdx), normal.getY(oldIdx), normal.getZ(oldIdx));
        if (uv) newUvs.push(uv.getX(oldIdx), uv.getY(oldIdx));
        vertMap.set(oldIdx, nextIdx);
        return nextIdx;
      };

      newIndices.push(getNewIdx(i0), getNewIdx(i1), getNewIdx(i2));
    }
  }

  const numHeroVerts = newPositions.length / 3;
  console.log(`Isolated Hero: ${numHeroVerts.toLocaleString()} vertices, ${isolatedTris.toLocaleString()} triangles.`);

  // 2. Measure Raw Hero Bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < numHeroVerts; i++) {
    const x = newPositions[i * 3];
    const y = newPositions[i * 3 + 1];
    const z = newPositions[i * 3 + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const rawDepth = maxZ - minZ;
  const rawCenterX = (minX + maxX) / 2;
  const rawCenterZ = (minZ + maxZ) / 2;

  console.log(`Raw Hero Bounding Box:`);
  console.log(`  Width: ${rawWidth.toFixed(4)}m | Height: ${rawHeight.toFixed(4)}m | Depth: ${rawDepth.toFixed(4)}m`);
  console.log(`  X Center: ${rawCenterX.toFixed(4)}m | Y Min: ${minY.toFixed(4)}m | Z Center: ${rawCenterZ.toFixed(4)}m`);

  // 3. Scale and Center Transformations
  // Target height is 1.65m (standing height matching player collider and head clearance)
  const targetHeight = 1.65;
  const scaleFactor = targetHeight / rawHeight;
  console.log(`Scaling Factor: ${scaleFactor.toFixed(5)}x to achieve ${targetHeight}m standing height.`);

  for (let i = 0; i < numHeroVerts; i++) {
    // Center on X and Z, align feet to Y=0, then scale
    const centeredX = (newPositions[i * 3] - rawCenterX) * scaleFactor;
    const groundedY = (newPositions[i * 3 + 1] - minY) * scaleFactor;
    const centeredZ = (newPositions[i * 3 + 2] - rawCenterZ) * scaleFactor;

    newPositions[i * 3] = centeredX;
    newPositions[i * 3 + 1] = groundedY;
    newPositions[i * 3 + 2] = centeredZ;
  }

  const heroGeom = new THREE.BufferGeometry();
  heroGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  if (newNormals.length > 0) {
    heroGeom.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
  } else {
    heroGeom.computeVertexNormals();
  }
  if (newUvs.length > 0) {
    heroGeom.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
  }
  heroGeom.setIndex(newIndices);

  // 4. Construct PBR Material with Extracted Textures
  const heroMesh = new THREE.Mesh(heroGeom, (originalMesh as THREE.Mesh).material);
  heroMesh.name = 'Rudhra_Hero_Mesh';
  heroMesh.castShadow = true;
  heroMesh.receiveShadow = true;

  // Root Scene
  const exportScene = new THREE.Scene();
  exportScene.name = 'Rudhra_PBR_Character';
  exportScene.add(heroMesh);

  // Measure final transformed bounds
  const finalBox = new THREE.Box3().setFromObject(exportScene);
  const finalSize = new THREE.Vector3();
  finalBox.getSize(finalSize);
  console.log(`\nFinal Transformed Character Bounds:`);
  console.log(`  Width (X): ${finalSize.x.toFixed(4)}m`);
  console.log(`  Height (Y): ${finalSize.y.toFixed(4)}m`);
  console.log(`  Depth (Z): ${finalSize.z.toFixed(4)}m`);
  console.log(`  Y Range: [${finalBox.min.y.toFixed(4)}, ${finalBox.max.y.toFixed(4)}]`);

  // 5. Export to GLB
  const exporter = new GLTFExporter();
  console.log('\nExporting to binary GLB via GLTFExporter...');

  const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      exportScene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('GLTFExporter did not return an ArrayBuffer'));
        }
      },
      (err) => reject(err),
      {
        binary: true,
        embedImages: true,
      }
    );
  });

  fs.writeFileSync(targetGlbPath, Buffer.from(glbBuffer));
  console.log(`[SUCCESS] Wrote ${targetGlbPath} (${(glbBuffer.byteLength / 1024 / 1024).toFixed(2)} MB).`);

  // 6. Validation: Re-load and verify
  console.log('\nValidating exported GLB...');
  const verifyLoader = new GLTFLoader();
  const verifyGltf = await new Promise<any>((resolve, reject) => {
    verifyLoader.parse(glbBuffer, '', resolve, reject);
  });

  let loadedMeshes = 0;
  let loadedVerts = 0;
  verifyGltf.scene.traverse((c: any) => {
    if (c.isMesh) {
      loadedMeshes++;
      loadedVerts += c.geometry.getAttribute('position').count;
    }
  });

  console.log(`[VERIFIED] Exported GLB successfully parsed:`);
  console.log(`  Meshes: ${loadedMeshes}`);
  console.log(`  Vertices: ${loadedVerts.toLocaleString()}`);
  console.log(`  Target path: ${targetGlbPath}`);
}

exportHeroModel().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});

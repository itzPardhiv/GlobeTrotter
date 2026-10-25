import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(globalThis as any).self = globalThis;
(globalThis as any).window = globalThis;

// Node polyfill for GLTFLoader
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

interface ModelAudit {
  name: string;
  path: string;
  sizeBytes: number;
  meshes: number;
  skinnedMeshes: number;
  bones: number;
  totalVertices: number;
  totalTriangles: number;
  bbox: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
    center: [number, number, number];
  };
  materials: Array<{
    name: string;
    type: string;
    roughness?: number;
    metalness?: number;
    hasMap: boolean;
    hasNormalMap: boolean;
    color?: string;
  }>;
  animations: Array<{
    name: string;
    duration: number;
    tracks: number;
  }>;
  rootNodes: string[];
}

async function auditGlb(filePath: string, label: string): Promise<ModelAudit> {
  const buf = fs.readFileSync(filePath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        const scene = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        let meshCount = 0;
        let skinnedMeshCount = 0;
        let boneCount = 0;
        let totalVertices = 0;
        let totalTriangles = 0;
        const matMap = new Map<string, any>();

        scene.traverse((obj) => {
          if ((obj as THREE.Bone).isBone) {
            boneCount++;
          }
          if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
            skinnedMeshCount++;
          } else if ((obj as THREE.Mesh).isMesh) {
            meshCount++;
          }

          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            const geom = mesh.geometry;
            if (geom) {
              const pos = geom.getAttribute('position');
              if (pos) {
                totalVertices += pos.count;
              }
              if (geom.index) {
                totalTriangles += geom.index.count / 3;
              } else if (pos) {
                totalTriangles += pos.count / 3;
              }
            }

            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (m && !matMap.has(m.name || m.uuid)) {
                matMap.set(m.name || m.uuid, m);
              }
            });
          }
        });

        const bbox = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        const materials = Array.from(matMap.values()).map((m) => ({
          name: m.name || 'unnamed',
          type: m.type,
          roughness: m.roughness,
          metalness: m.metalness,
          hasMap: !!m.map,
          hasNormalMap: !!m.normalMap,
          color: m.color ? '#' + m.color.getHexString() : undefined,
        }));

        const animations = (gltf.animations || []).map((a) => ({
          name: a.name,
          duration: Number(a.duration.toFixed(3)),
          tracks: a.tracks.length,
        }));

        const rootNodes = scene.children.map((c) => `${c.name || 'unnamed'} (${c.type})`);

        resolve({
          name: label,
          path: filePath,
          sizeBytes: buf.length,
          meshes: meshCount,
          skinnedMeshes: skinnedMeshCount,
          bones: boneCount,
          totalVertices,
          totalTriangles: Math.round(totalTriangles),
          bbox: {
            min: [Number(bbox.min.x.toFixed(4)), Number(bbox.min.y.toFixed(4)), Number(bbox.min.z.toFixed(4))],
            max: [Number(bbox.max.x.toFixed(4)), Number(bbox.max.y.toFixed(4)), Number(bbox.max.z.toFixed(4))],
            size: [Number(size.x.toFixed(4)), Number(size.y.toFixed(4)), Number(size.z.toFixed(4))],
            center: [Number(center.x.toFixed(4)), Number(center.y.toFixed(4)), Number(center.z.toFixed(4))],
          },
          materials,
          animations,
          rootNodes,
        });
      },
      (err) => reject(err)
    );
  });
}

function auditObj(filePath: string, label: string): ModelAudit {
  const content = fs.readFileSync(filePath, 'utf-8');
  const buf = fs.readFileSync(filePath);
  const loader = new OBJLoader();
  const obj = loader.parse(content);

  let meshCount = 0;
  let totalVertices = 0;
  let totalTriangles = 0;

  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      meshCount++;
      const geom = (child as THREE.Mesh).geometry;
      if (geom) {
        const pos = geom.getAttribute('position');
        if (pos) totalVertices += pos.count;
        if (geom.index) totalTriangles += geom.index.count / 3;
        else if (pos) totalTriangles += pos.count / 3;
      }
    }
  });

  const bbox = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  return {
    name: label,
    path: filePath,
    sizeBytes: buf.length,
    meshes: meshCount,
    skinnedMeshes: 0,
    bones: 0,
    totalVertices,
    totalTriangles: Math.round(totalTriangles),
    bbox: {
      min: [Number(bbox.min.x.toFixed(4)), Number(bbox.min.y.toFixed(4)), Number(bbox.min.z.toFixed(4))],
      max: [Number(bbox.max.x.toFixed(4)), Number(bbox.max.y.toFixed(4)), Number(bbox.max.z.toFixed(4))],
      size: [Number(size.x.toFixed(4)), Number(size.y.toFixed(4)), Number(size.z.toFixed(4))],
      center: [Number(center.x.toFixed(4)), Number(center.y.toFixed(4)), Number(center.z.toFixed(4))],
    },
    materials: [],
    animations: [],
    rootNodes: obj.children.map((c) => `${c.name || 'unnamed'} (${c.type})`),
  };
}

async function main() {
  console.log('================================================================');
  console.log('GLOBETROTTER: 3D CHARACTER MODEL TECHNICAL INSPECTION & AUDIT');
  console.log('================================================================\n');

  const newModelDir = path.resolve(__dirname, '../../e57776c6-b85e-49ef-b2a4-9a1ba58a656a');
  const existingModelPath = path.resolve(__dirname, '../public/assets/characters/rudhra.glb');

  const files = [
    { path: path.join(newModelDir, 'base.obj'), type: 'obj', label: 'NEW: base.obj' },
    { path: path.join(newModelDir, 'base_basic_pbr.glb'), type: 'glb', label: 'NEW: base_basic_pbr.glb' },
    { path: path.join(newModelDir, 'base_basic_shaded.glb'), type: 'glb', label: 'NEW: base_basic_shaded.glb' },
    { path: existingModelPath, type: 'glb', label: 'EXISTING: rudhra.glb' },
  ];

  const results: ModelAudit[] = [];

  for (const f of files) {
    if (!fs.existsSync(f.path)) {
      console.error(`[ERROR] File missing: ${f.path}`);
      continue;
    }
    console.log(`Auditing: ${f.label} (${(fs.statSync(f.path).size / (1024 * 1024)).toFixed(2)} MB)...`);
    try {
      if (f.type === 'glb') {
        const audit = await auditGlb(f.path, f.label);
        results.push(audit);
      } else if (f.type === 'obj') {
        const audit = auditObj(f.path, f.label);
        results.push(audit);
      }
    } catch (err: any) {
      console.error(`Failed to audit ${f.label}:`, err.message || err);
    }
  }

  console.log('\n================================================================');
  console.log('DETAILED TECHNICAL COMPARISON MATRIX');
  console.log('================================================================\n');
  console.log(JSON.stringify(results, null, 2));

  // Save report JSON
  fs.writeFileSync(path.resolve(__dirname, 'model-inspection-report.json'), JSON.stringify(results, null, 2));
  console.log('\nSaved inspection data to scripts/model-inspection-report.json');
}

main().catch(console.error);

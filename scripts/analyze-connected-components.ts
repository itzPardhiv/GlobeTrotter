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

async function analyzeComponents() {
  const glbPath = path.resolve(__dirname, '../../e57776c6-b85e-49ef-b2a4-9a1ba58a656a/base_basic_pbr.glb');
  const buf = fs.readFileSync(glbPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();

  return new Promise<void>((resolve, reject) => {
    loader.parse(arrayBuffer, '', (gltf) => {
      let mesh: THREE.Mesh | null = null;
      gltf.scene.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !mesh) mesh = c as THREE.Mesh;
      });

      if (!mesh) {
        console.error('No mesh found');
        return resolve();
      }

      const geom = (mesh as THREE.Mesh).geometry;
      const pos = geom.getAttribute('position');
      const index = geom.getIndex();
      if (!index) {
        console.error('No index buffer');
        return resolve();
      }

      const numTris = index.count / 3;
      const numVerts = pos.count;
      console.log(`Analyzing ${numTris.toLocaleString()} triangles across ${numVerts.toLocaleString()} vertices...`);

      // Disjoint Set Union (Union-Find) on vertices
      const parent = new Int32Array(numVerts);
      for (let i = 0; i < numVerts; i++) parent[i] = i;

      function find(i: number): number {
        let root = i;
        while (root !== parent[root]) root = parent[root];
        let curr = i;
        while (curr !== root) {
          const next = parent[curr];
          parent[curr] = root;
          curr = next;
        }
        return root;
      }

      function union(i: number, j: number) {
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) parent[rootI] = rootJ;
      }

      for (let t = 0; t < numTris; t++) {
        const i0 = index.getX(t * 3);
        const i1 = index.getX(t * 3 + 1);
        const i2 = index.getX(t * 3 + 2);
        union(i0, i1);
        union(i1, i2);
      }

      // Group vertices and triangles by component root
      const compMap = new Map<number, {
        root: number;
        vertCount: number;
        triCount: number;
        min: [number, number, number];
        max: [number, number, number];
        indices: number[];
      }>();

      for (let v = 0; v < numVerts; v++) {
        const r = find(v);
        let c = compMap.get(r);
        const x = pos.getX(v);
        const y = pos.getY(v);
        const z = pos.getZ(v);
        if (!c) {
          c = {
            root: r,
            vertCount: 0,
            triCount: 0,
            min: [x, y, z],
            max: [x, y, z],
            indices: [],
          };
          compMap.set(r, c);
        }
        c.vertCount++;
        if (x < c.min[0]) c.min[0] = x;
        if (y < c.min[1]) c.min[1] = y;
        if (z < c.min[2]) c.min[2] = z;
        if (x > c.max[0]) c.max[0] = x;
        if (y > c.max[1]) c.max[1] = y;
        if (z > c.max[2]) c.max[2] = z;
      }

      for (let t = 0; t < numTris; t++) {
        const i0 = index.getX(t * 3);
        const r = find(i0);
        const c = compMap.get(r);
        if (c) c.triCount++;
      }

      const components = Array.from(compMap.values()).sort((a, b) => b.triCount - a.triCount);
      const majorComponents = components.filter(c => c.triCount > 100);
      console.log(`\nFound ${components.length} total components, of which ${majorComponents.length} are major (>100 triangles):\n`);

      majorComponents.forEach((c, idx) => {
        const width = (c.max[0] - c.min[0]).toFixed(3);
        const height = (c.max[1] - c.min[1]).toFixed(3);
        const depth = (c.max[2] - c.min[2]).toFixed(3);
        console.log(`Major Component #${idx + 1}:`);
        console.log(`  Triangles: ${c.triCount.toLocaleString()} | Vertices: ${c.vertCount.toLocaleString()}`);
        console.log(`  X Range: [${c.min[0].toFixed(3)}, ${c.max[0].toFixed(3)}] (Width: ${width}m)`);
        console.log(`  Y Range: [${c.min[1].toFixed(3)}, ${c.max[1].toFixed(3)}] (Height: ${height}m)`);
        console.log(`  Z Range: [${c.min[2].toFixed(3)}, ${c.max[2].toFixed(3)}] (Depth: ${depth}m)`);
        
        let label = 'Unknown/Debris';
        if (c.max[0] < -0.3) label = '*** HERO CHARACTER (Far-Left with Lantern) ***';
        else if (c.min[0] > -0.35 && c.max[0] < -0.05) label = 'Turnaround Fig 2 (Front)';
        else if (c.min[0] > -0.05 && c.max[0] < 0.20) label = 'Turnaround Fig 3 (Left Profile)';
        else if (c.min[0] > 0.20 && c.max[0] < 0.55) label = 'Turnaround Fig 4 (Back)';
        else if (c.min[0] > 0.55) label = 'Turnaround Fig 5 (Right Profile)';
        console.log(`  Identified as: ${label}\n`);
      });

      // Also let's inspect the gap between Hero and Turnaround Fig 2!
      let heroMaxX = -Infinity;
      let fig2MinX = Infinity;
      for (let v = 0; v < numVerts; v++) {
        const x = pos.getX(v);
        if (x < -0.35 && x > heroMaxX) heroMaxX = x;
        if (x > -0.35 && x < -0.05 && x < fig2MinX) fig2MinX = x;
      }
      console.log(`\nGeometric Gap between Hero and Fig 2:`);
      console.log(`  Hero Maximum X: ${heroMaxX.toFixed(4)}m`);
      console.log(`  Fig 2 Minimum X: ${fig2MinX.toFixed(4)}m`);
      console.log(`  Clearance Gap: ${(fig2MinX - heroMaxX).toFixed(4)}m (${((fig2MinX - heroMaxX) * 100).toFixed(1)} cm)`);


      resolve();
    }, (err) => reject(err));
  });
}

analyzeComponents().catch(console.error);

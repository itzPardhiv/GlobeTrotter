import struct
import json
import os
import sys

def main():
    print("=== EXPORTING ISOLATED RUDHRA PBR HERO MODEL (PYTHON PIPELINE) ===")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_glb = os.path.abspath(os.path.join(script_dir, '../../e57776c6-b85e-49ef-b2a4-9a1ba58a656a/base_basic_pbr.glb'))
    target_glb = os.path.abspath(os.path.join(script_dir, '../public/assets/characters/rudhra_pbr_hero.glb'))
    
    if not os.path.exists(source_glb):
        print(f"[ERROR] Source GLB not found at {source_glb}")
        sys.exit(1)
        
    with open(source_glb, 'rb') as f:
        magic, version, total_length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
        json_data = f.read(chunk_len).decode('utf-8')
        gltf = json.loads(json_data)
        
        bin_len, bin_type = struct.unpack('<I4s', f.read(8))
        bin_start = f.tell()
        bin_bytes = f.read(bin_len)
        
    print(f"Loaded source GLB: {len(bin_bytes)} bytes binary buffer.")
    
    # Identify accessors for the mesh
    mesh = gltf['meshes'][0]
    prim = mesh['primitives'][0]
    
    pos_acc_idx = prim['attributes']['POSITION']
    norm_acc_idx = prim['attributes']['NORMAL']
    uv_acc_idx = prim['attributes']['TEXCOORD_0']
    idx_acc_idx = prim['indices']
    
    pos_acc = gltf['accessors'][pos_acc_idx]
    norm_acc = gltf['accessors'][norm_acc_idx]
    uv_acc = gltf['accessors'][uv_acc_idx]
    idx_acc = gltf['accessors'][idx_acc_idx]
    
    buffer_views = gltf['bufferViews']
    
    def get_buffer_data(acc):
        bv = buffer_views[acc['bufferView']]
        offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
        length = acc['count'] * (3 * 4 if acc['type'] == 'VEC3' else (2 * 4 if acc['type'] == 'VEC2' else 4))
        return bin_bytes[offset : offset + length]

    # Read original indices (UNSIGNED_INT = 5125, 4 bytes)
    idx_bv = buffer_views[idx_acc['bufferView']]
    idx_offset = idx_bv.get('byteOffset', 0) + idx_acc.get('byteOffset', 0)
    idx_count = idx_acc['count']
    idx_format = '<' + str(idx_count) + 'I'
    indices = struct.unpack(idx_format, bin_bytes[idx_offset : idx_offset + idx_count * 4])
    
    # Read original positions (VEC3 FLOAT)
    pos_bv = buffer_views[pos_acc['bufferView']]
    pos_offset = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
    pos_count = pos_acc['count']
    pos_floats = struct.unpack(f'<{pos_count * 3}f', bin_bytes[pos_offset : pos_offset + pos_count * 12])
    
    # Read original normals (VEC3 FLOAT)
    norm_bv = buffer_views[norm_acc['bufferView']]
    norm_offset = norm_bv.get('byteOffset', 0) + norm_acc.get('byteOffset', 0)
    norm_floats = struct.unpack(f'<{pos_count * 3}f', bin_bytes[norm_offset : norm_offset + pos_count * 12])
    
    # Read original UVs (VEC2 FLOAT)
    uv_bv = buffer_views[uv_acc['bufferView']]
    uv_offset = uv_bv.get('byteOffset', 0) + uv_acc.get('byteOffset', 0)
    uv_floats = struct.unpack(f'<{pos_count * 2}f', bin_bytes[uv_offset : uv_offset + pos_count * 8])
    
    print(f"Original geometry: {pos_count} vertices, {idx_count // 3} triangles.")
    
    # Isolate Hero Triangles (X <= -0.34)
    hero_cutoff_x = -0.34
    vert_map = {}
    new_pos = []
    new_norm = []
    new_uv = []
    new_indices = []
    
    num_tris = idx_count // 3
    for t in range(num_tris):
        i0 = indices[t * 3]
        i1 = indices[t * 3 + 1]
        i2 = indices[t * 3 + 2]
        
        x0 = pos_floats[i0 * 3]
        x1 = pos_floats[i1 * 3]
        x2 = pos_floats[i2 * 3]
        
        if x0 <= hero_cutoff_x and x1 <= hero_cutoff_x and x2 <= hero_cutoff_x:
            for old_idx in (i0, i1, i2):
                if old_idx not in vert_map:
                    new_idx = len(new_pos) // 3
                    vert_map[old_idx] = new_idx
                    new_pos.extend([pos_floats[old_idx * 3], pos_floats[old_idx * 3 + 1], pos_floats[old_idx * 3 + 2]])
                    new_norm.extend([norm_floats[old_idx * 3], norm_floats[old_idx * 3 + 1], norm_floats[old_idx * 3 + 2]])
                    new_uv.extend([uv_floats[old_idx * 2], uv_floats[old_idx * 2 + 1]])
                new_indices.append(vert_map[old_idx])
                
    num_hero_verts = len(new_pos) // 3
    num_hero_tris = len(new_indices) // 3
    print(f"Isolated Hero: {num_hero_verts} vertices, {num_hero_tris} triangles.")
    
    # Compute bounds
    xs = [new_pos[i * 3] for i in range(num_hero_verts)]
    ys = [new_pos[i * 3 + 1] for i in range(num_hero_verts)]
    zs = [new_pos[i * 3 + 2] for i in range(num_hero_verts)]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    min_z, max_z = min(zs), max(zs)
    
    raw_width = max_x - min_x
    raw_height = max_y - min_y
    raw_depth = max_z - min_z
    center_x = (min_x + max_x) / 2
    center_z = (min_z + max_z) / 2
    
    print(f"Raw Hero Bounds:")
    print(f"  Width: {raw_width:.4f}m | Height: {raw_height:.4f}m | Depth: {raw_depth:.4f}m")
    print(f"  X Center: {center_x:.4f}m | Y Min: {min_y:.4f}m | Z Center: {center_z:.4f}m")
    
    # Scale to 1.65m target standing height
    target_height = 1.65
    scale = target_height / raw_height
    print(f"Applying scale factor: {scale:.5f}x to reach {target_height}m height.")
    
    transformed_pos = []
    for i in range(num_hero_verts):
        # Center in X and Z, align feet flush with ground Y=0, and scale
        tx = (new_pos[i * 3] - center_x) * scale
        ty = (new_pos[i * 3 + 1] - min_y) * scale
        tz = (new_pos[i * 3 + 2] - center_z) * scale
        transformed_pos.extend([tx, ty, tz])
        
    final_xs = [transformed_pos[i * 3] for i in range(num_hero_verts)]
    final_ys = [transformed_pos[i * 3 + 1] for i in range(num_hero_verts)]
    final_zs = [transformed_pos[i * 3 + 2] for i in range(num_hero_verts)]
    
    final_min_x, final_max_x = min(final_xs), max(final_xs)
    final_min_y, final_max_y = min(final_ys), max(final_ys)
    final_min_z, final_max_z = min(final_zs), max(final_zs)
    
    print(f"Final Transformed Bounds:")
    print(f"  Width (X): {final_max_x - final_min_x:.4f}m (range [{final_min_x:.4f}, {final_max_x:.4f}])")
    print(f"  Height (Y): {final_max_y - final_min_y:.4f}m (range [{final_min_y:.4f}, {final_max_y:.4f}])")
    print(f"  Depth (Z): {final_max_z - final_min_z:.4f}m (range [{final_min_z:.4f}, {final_max_z:.4f}])")
    
    # Encode new binary buffers
    # 1. POSITION buffer (VEC3 FLOAT)
    pos_bytes = struct.pack(f'<{len(transformed_pos)}f', *transformed_pos)
    # 2. NORMAL buffer (VEC3 FLOAT)
    norm_bytes = struct.pack(f'<{len(new_norm)}f', *new_norm)
    # 3. TEXCOORD_0 buffer (VEC2 FLOAT)
    uv_bytes = struct.pack(f'<{len(new_uv)}f', *new_uv)
    # 4. INDICES buffer (UNSIGNED_INT, 4 bytes each)
    idx_bytes = struct.pack(f'<{len(new_indices)}I', *new_indices)
    
    # Extract embedded image buffers from original GLB
    # In gltf, images refer to bufferViews 4, 5, 6
    image_bytes_list = []
    for img in gltf.get('images', []):
        bv_idx = img['bufferView']
        bv = buffer_views[bv_idx]
        img_data = bin_bytes[bv['byteOffset'] : bv['byteOffset'] + bv['byteLength']]
        image_bytes_list.append((img, img_data))
        print(f"Preserved embedded image '{img.get('name')}': {len(img_data)} bytes")
        
    # Build clean output BIN buffer
    out_bin = bytearray()
    new_buffer_views = []
    
    def add_buffer_view(data, target=None):
        # 4-byte alignment
        pad = (4 - (len(out_bin) % 4)) % 4
        out_bin.extend(b'\x00' * pad)
        offset = len(out_bin)
        out_bin.extend(data)
        bv_entry = {
            'buffer': 0,
            'byteOffset': offset,
            'byteLength': len(data),
        }
        if target:
            bv_entry['target'] = target
        new_buffer_views.append(bv_entry)
        return len(new_buffer_views) - 1

    # 34962 = ARRAY_BUFFER (attributes), 34963 = ELEMENT_ARRAY_BUFFER (indices)
    bv_pos = add_buffer_view(pos_bytes, 34962)
    bv_norm = add_buffer_view(norm_bytes, 34962)
    bv_uv = add_buffer_view(uv_bytes, 34962)
    bv_idx = add_buffer_view(idx_bytes, 34963)
    
    # Add image buffer views
    new_images = []
    for img_meta, img_data in image_bytes_list:
        bv_img = add_buffer_view(img_data)
        new_img = dict(img_meta)
        new_img['bufferView'] = bv_img
        new_images.append(new_img)
        
    # Build new accessors
    new_accessors = [
        {
            'bufferView': bv_pos,
            'byteOffset': 0,
            'componentType': 5126, # FLOAT
            'count': num_hero_verts,
            'max': [final_max_x, final_max_y, final_max_z],
            'min': [final_min_x, final_min_y, final_min_z],
            'type': 'VEC3'
        },
        {
            'bufferView': bv_norm,
            'byteOffset': 0,
            'componentType': 5126,
            'count': num_hero_verts,
            'type': 'VEC3'
        },
        {
            'bufferView': bv_uv,
            'byteOffset': 0,
            'componentType': 5126,
            'count': num_hero_verts,
            'type': 'VEC2'
        },
        {
            'bufferView': bv_idx,
            'byteOffset': 0,
            'componentType': 5125, # UNSIGNED_INT
            'count': len(new_indices),
            'max': [num_hero_verts - 1],
            'min': [0],
            'type': 'SCALAR'
        }
    ]
    
    # Build new GLTF JSON structure
    out_gltf = {
        'asset': {
            'generator': 'GlobeTrotter PBR Hero Model Exporter v1.0',
            'version': '2.0'
        },
        'scene': 0,
        'scenes': [{'name': 'Scene', 'nodes': [0]}],
        'nodes': [{'mesh': 0, 'name': 'Rudhra_Hero'}],
        'meshes': [
            {
                'name': 'Rudhra_Hero_Mesh',
                'primitives': [
                    {
                        'attributes': {
                            'POSITION': 0,
                            'NORMAL': 1,
                            'TEXCOORD_0': 2
                        },
                        'indices': 3,
                        'material': 0
                    }
                ]
            }
        ],
        'materials': gltf.get('materials', []),
        'textures': gltf.get('textures', []),
        'images': new_images,
        'accessors': new_accessors,
        'bufferViews': new_buffer_views,
        'buffers': [{'byteLength': len(out_bin)}]
    }
    
    # Final GLB assembly
    json_bytes = json.dumps(out_gltf, separators=(',', ':')).encode('utf-8')
    # Pad JSON to 4-byte boundary with spaces
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_pad
    
    # Pad BIN to 4-byte boundary
    bin_pad = (4 - (len(out_bin) % 4)) % 4
    out_bin.extend(b'\x00' * bin_pad)
    
    total_file_len = 12 + 8 + len(json_bytes) + 8 + len(out_bin)
    
    header = struct.pack('<4sII', b'glTF', 2, total_file_len)
    chunk0_header = struct.pack('<I4s', len(json_bytes), b'JSON')
    chunk1_header = struct.pack('<I4s', len(out_bin), b'BIN\x00')
    
    with open(target_glb, 'wb') as f_out:
        f_out.write(header)
        f_out.write(chunk0_header)
        f_out.write(json_bytes)
        f_out.write(chunk1_header)
        f_out.write(out_bin)
        
    print(f"\n[SUCCESS] Successfully exported isolated Rudhra PBR Hero model:")
    print(f"  Target: {target_glb}")
    print(f"  File size: {os.path.getsize(target_glb):,} bytes ({(os.path.getsize(target_glb) / 1024 / 1024):.2f} MB)")
    print(f"  Total Vertices: {num_hero_verts:,}")
    print(f"  Total Triangles: {num_hero_tris:,}")

if __name__ == '__main__':
    main()

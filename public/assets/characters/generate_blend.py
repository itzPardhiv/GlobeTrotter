"""
Blender Automated Import & .blend Generator for Rudhra Character Asset
GlobeTrotter: The Lost Relic

Usage:
  blender --background --python generate_blend.py
or open Blender, switch to Scripting workspace, and run this script.
It imports rudhra.glb, preserves node hierarchy, materials, and keyframed actions,
and writes out rudhra.blend.
"""
import os
import sys

try:
    import bpy
except ImportError:
    print("[ERROR] 'bpy' module is only available when executed within Blender.")
    print("To generate rudhra.blend, execute:")
    print("  blender --background --python generate_blend.py")
    sys.exit(1)

def main():
    print("=== BLENDER GENERATOR: RUDHRA 3D CHARACTER ===")
    
    # Reset to clean empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    glb_path = os.path.join(script_dir, "rudhra.glb")
    blend_path = os.path.join(script_dir, "rudhra.blend")

    if not os.path.exists(glb_path):
        print(f"[ERROR] Source GLB not found at: {glb_path}")
        return

    print(f"[INFO] Importing glTF binary: {glb_path}")
    bpy.ops.import_scene.gltf(filepath=glb_path)

    # Frame scene objects
    for obj in bpy.context.scene.objects:
        obj.select_set(True)

    # Save to native Blender format
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Generated native Blender file: {blend_path}")

if __name__ == "__main__":
    main()

import os
import numpy as np
from PIL import Image

def process_backgrounds():
    input_path = r'C:\Users\Pardhu\.gemini\antigravity-ide\brain\6713f3cc-b032-4667-8c8c-18b259f85a25\.user_uploaded\media_1792852750427.jpg'
    output_dir = r'c:\Users\Pardhu\OneDrive\Desktop\globetrotter\public\assets'
    os.makedirs(output_dir, exist_ok=True)

    img = Image.open(input_path)
    print(f"Loaded source image: {img.size}, mode: {img.mode}")

    # =========================================================================
    # 1. FAR BACKGROUND (bg_tunnel_far) -> 2160 x 720 (opaque)
    # =========================================================================
    # Clean crop inside the frame: x: 17..1009, y: 92..302
    s1 = img.crop((17, 92, 1009, 302))
    s1_res = s1.resize((2160, 720), Image.Resampling.LANCZOS)
    far_path = os.path.join(output_dir, 'bg_tunnel_far.png')
    s1_res.save(far_path, 'PNG', optimize=True)
    print(f"Saved: {far_path} ({s1_res.size})")

    # =========================================================================
    # 2. MIDGROUND ARCHITECTURE (bg_tunnel_mid) -> 3216 x 720 (transparent)
    # =========================================================================
    # Clean crop inside the frame: x: 17..1009, y: 341..510 (skipping border lines)
    s2 = img.crop((17, 341, 1009, 510))
    arr2 = np.array(s2).astype(float)
    r2 = arr2[:, :, 0]
    g2 = arr2[:, :, 1]
    b2 = arr2[:, :, 2]
    h2, w2, _ = arr2.shape

    # Detect distant blue cavern background in arch openings:
    # Sandstone pillars & capitals are warm (r > b). Vines are green (g > b, b low).
    # Openings show cool blueish atmospheric background (b > r + 5, b > 65).
    cool = (b2 - r2) / np.maximum(r2, np.maximum(b2, 1.0))
    is_opening = (cool > 0.05) & (b2 > 65)

    # Smooth transition (smoothstep)
    t = np.clip((cool - 0.05) / 0.25, 0.0, 1.0)
    smooth_t = t * t * (3.0 - 2.0 * t)
    alpha2 = (1.0 - smooth_t * is_opening.astype(float)) * 255.0

    # Ensure continuous architrave lintel (top 20px) and bottom floor plinth (bottom 16px) remain solid
    alpha2[:20, :] = 255.0
    alpha2[h2 - 16:, :] = 255.0

    # Clean RGB for zero-alpha pixels to prevent halo artifacts on resize
    arr2_clean = arr2.copy()
    zero_mask = alpha2 < 10.0
    arr2_clean[zero_mask] = [20, 28, 38] # soft dark atmospheric fill

    rgba2 = np.dstack([arr2_clean.astype(np.uint8), alpha2.astype(np.uint8)])
    s2_rgba = Image.fromarray(rgba2, 'RGBA')
    s2_res = s2_rgba.resize((3216, 720), Image.Resampling.LANCZOS)
    mid_path = os.path.join(output_dir, 'bg_tunnel_mid.png')
    s2_res.save(mid_path, 'PNG', optimize=True)
    print(f"Saved: {mid_path} ({s2_res.size})")

    # =========================================================================
    # 3. CEILING LAYER (bg_tunnel_ceiling) -> 3744 x 150 (transparent)
    # =========================================================================
    # Clean crop inside the frame: x: 17..1009, y: 548..670 (skipping border lines)
    s3 = img.crop((17, 548, 1009, 670))
    arr3 = np.array(s3).astype(float)
    r3 = arr3[:, :, 0]
    g3 = arr3[:, :, 1]
    b3 = arr3[:, :, 2]
    h3, w3, _ = arr3.shape

    brightness3 = (r3 + g3 + b3) / 3.0
    neutral3 = np.maximum(np.abs(r3 - g3), np.maximum(np.abs(g3 - b3), np.abs(b3 - r3)))

    # Checkerboard is neutral (neutral < 25) and bright (brightness > 165).
    # Rock ceiling and stalactites are either dark (brightness < 160) or warm golden (r > b + 15).
    is_checker = (brightness3 > 165) & (neutral3 < 25)

    # Smooth transition around boundary
    t3 = np.clip((brightness3 - 150.0) / 25.0, 0.0, 1.0)
    smooth_t3 = t3 * t3 * (3.0 - 2.0 * t3)
    alpha3 = (1.0 - smooth_t3 * is_checker.astype(float)) * 255.0

    # Top rock strata (top 6px) is completely solid
    alpha3[:6, :] = 255.0

    # Prevent color bleeding from checkerboard on resize
    arr3_clean = arr3.copy()
    zero_mask3 = alpha3 < 10.0
    arr3_clean[zero_mask3] = [15, 20, 28] # cavern ceiling shadow

    rgba3 = np.dstack([arr3_clean.astype(np.uint8), alpha3.astype(np.uint8)])
    s3_rgba = Image.fromarray(rgba3, 'RGBA')
    s3_res = s3_rgba.resize((3744, 150), Image.Resampling.LANCZOS)
    ceil_path = os.path.join(output_dir, 'bg_tunnel_ceiling.png')
    s3_res.save(ceil_path, 'PNG', optimize=True)
    print(f"Saved: {ceil_path} ({s3_res.size})")

    print("\nAll 3 background layers successfully generated with pristine edges!")

if __name__ == '__main__':
    process_backgrounds()

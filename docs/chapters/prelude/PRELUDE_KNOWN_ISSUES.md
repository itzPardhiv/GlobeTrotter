# GlobeTrotter: The Lost Relic — Prelude Known Issues & Mitigation Log

## 1. Known Architectural Limitations & Mitigations

### 1.1 WebGL Context Re-creation
- **Observation**: Rapidly toggling between Classic 2D (Phaser) and 3D Cinematic (Three.js) in development hot-reload can cause WebGL context churn.
- **Mitigation**: `App.tsx` cleanly calls `gameRef.current.destroy()` on mode switch, unbinding event listeners, cancelling `requestAnimationFrame`, and releasing GPU buffers.

### 1.2 Audio Context Autoplay Policy
- **Observation**: Modern browsers block Web Audio playback prior to initial user interaction (click or keypress).
- **Mitigation**: `audioManager.init()` and `audioManager.resume()` are triggered on the first `pointerdown` or keypress event. All audio calls gracefully fallback without throwing exceptions.

### 1.3 Jeep Model Procedural Mesh
- **Observation**: The open-top military jeep in Sequence 1 is constructed from physically based modular Three.js geometry meshes rather than an imported binary GLB asset to guarantee zero external network load failures.
- **Status**: The procedural 3D model features 4 rotating wheels, windshield frame, roll cage, spot beams, and suspension animation, fulfilling all cinematic arrival requirements. Future passes can swap with an external GLB if desired.

### 1.4 Single-Direction Traversal Bounds
- **Observation**: Walking far to the left of the dirt road (`X < -15m`) reaches the end of the road.
- **Mitigation**: Invisible world boundary collider prevents Rudhra from walking off the playable terrain into infinity.

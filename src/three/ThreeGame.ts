import * as THREE from 'three';
import { RudhraPlayer } from './RudhraPlayer';
import { ForgottenSanctumLevel, InteractionTarget } from './ForgottenSanctumLevel';
import { PreludeLevel, PreludeInteraction } from './PreludeLevel';
import { DialogueSystem, createBountyDialogue, DialogueState } from './DialogueSystem';
import { saveManager } from '../systems/SaveManager';
import { audioManager } from '../systems/AudioManager';

export interface GameHUDState {
  health: number;
  maxHealth: number;
  objective: string;
  interactionPrompt: string | null;
  activeToast: { message: string; sub?: string } | null;
  dialogueModal: { title: string; originalText: string; translation: string; source: string; loreNote?: string } | null;
  characterDialogue: DialogueState | null;
  mapInspectionModal: {
    isOpen: boolean;
    coordinates: string;
    legend: string;
    loreNote: string;
  } | null;
  currentLevelType: 'prelude' | 'sanctum';
  activeSequence: number;
  isJournalOpen: boolean;
  isPaused: boolean;
  isResultsOpen: boolean;
  resultsData: {
    levelName: string;
    stars: number;
    score: number;
    xpEarned: number;
    relicsFound: number;
    totalRelics: number;
    deaths: number;
    noDeathBonus: boolean;
  } | null;
}

export class ThreeGame {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  public player: RudhraPlayer;

  // Levels: Prelude (Outdoor Seq 1-5, Temple entrance Seq 6) and Sanctum (Subterranean Seq 6-12)
  public currentLevelType: 'prelude' | 'sanctum' = 'prelude';
  public preludeLevel: PreludeLevel;
  public level: ForgottenSanctumLevel;
  public dialogueSystem: DialogueSystem;

  // Loop & Clock
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private animFrameId: number = 0;

  // Environment Lighting
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private lanternWorldPosVec: THREE.Vector3 = new THREE.Vector3();

  // Key tracking
  private keys: Record<string, boolean> = {};

  // Checkpoints
  private currentCheckpoint: { x: number; y: number } = { x: 7.8, y: 0.0 };
  private activeCheckpointId: string = 'cp_prelude_start';

  // Gamification tracking for current expedition run
  private sessionXpEarned: number = 0;
  private sessionDeaths: number = 0;
  private optionalCollectiblesCount: number = 4;
  private completedMasteryChallenges: Set<string> = new Set();

  // Invulnerability timer
  private invulnerableTimer: number = 0;

  // Sequence 1: Opening Jeep Arrival Cinematic State
  private isJeepCinematic: boolean = true;
  private jeepCinematicTimer: number = 0;

  // Opening Cinematic & Title State for Sanctum
  private isOpeningCinematic: boolean = false;
  private openingCinematicTimer: number = 0;

  // 6-Beat Progressive Awakening Cinematic Sequence
  private isCinematicPlaying: boolean = false;
  private cinematicTimer: number = 0;
  private cinematicStep: number = 0;
  private cameraCinematicTarget: THREE.Vector3 = new THREE.Vector3();
  private cameraCinematicLookAt: THREE.Vector3 = new THREE.Vector3();

  // HUD callback
  private onHUDUpdate: ((state: GameHUDState) => void) | null = null;
  public hudState: GameHUDState;

  // Active interaction
  private activeTarget: InteractionTarget | null = null;
  private activePreludeTarget: PreludeInteraction | null = null;

  constructor(container: HTMLElement, onHUDUpdate?: (state: GameHUDState) => void) {
    this.container = container;
    this.onHUDUpdate = onHUDUpdate || null;
    this.clock = new THREE.Clock();

    // 1. Initial HUD state
    this.hudState = {
      health: 3,
      maxHealth: 3,
      objective: 'Track the bounty target along the jungle trail.',
      interactionPrompt: null,
      activeToast: null,
      dialogueModal: null,
      characterDialogue: null,
      mapInspectionModal: null,
      currentLevelType: 'prelude',
      activeSequence: 1,
      isJournalOpen: false,
      isPaused: false,
      isResultsOpen: false,
      resultsData: null,
    };

    // 2. WebGL Renderer with dynamic shadows & ACES Filmic tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // 3. Scene with outdoor atmosphere & sky fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3a5068);
    this.scene.fog = new THREE.FogExp2(0x3a5068, 0.006);

    // 4. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );
    this.camera.position.set(-10.0, 3.8, 18.0);

    // 5. Environmental Lighting (Outdoor late afternoon sunlight)
    this.ambientLight = new THREE.AmbientLight(0x302820, 0.45);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffd4a0, 1.6);
    this.dirLight.position.set(25, 20, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 80;
    this.dirLight.shadow.bias = -0.0006;
    this.scene.add(this.dirLight);

    // 6. Build Levels: Prelude (Outdoor) and Sanctum (Subterranean)
    this.dialogueSystem = new DialogueSystem();
    this.preludeLevel = new PreludeLevel();
    this.level = new ForgottenSanctumLevel();

    // Start in Prelude (outdoor) level
    this.scene.add(this.preludeLevel.group);

    // 7. Instantiate Rudhra Player Character
    this.player = new RudhraPlayer();
    this.player.setPosition(7.8, 0.0);
    this.scene.add(this.player.mesh);

    // Synchronize initial carried relic state
    if (saveManager.hasRelic('relic_sun_disc_fragment') && !saveManager.isEventAwarded('mech_artifact_socket')) {
      this.player.setCarryingRelic(true);
      if (this.level.artifactMesh) this.level.artifactMesh.visible = false;
    }

    // 8. Event listeners
    this.setupInputs();
    window.addEventListener('resize', this.handleResize);

    // Start Web Audio context
    audioManager.init();

    // Show initial title toast for Prelude
    this.showToast('GLOBETROTTER: THE LOST RELIC', 'Prelude: The Bounty of Vikram');

    this.pushHUD();
    if (typeof window !== 'undefined') {
      (window as any).__GLOBETROTTER_GAME__ = this;
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // 1. Dialogue input handling
    if (this.dialogueSystem.isActive()) {
      if (e.code === 'KeyE' || e.code === 'Space') {
        this.dialogueSystem.advance();
        this.hudState.characterDialogue = this.dialogueSystem.isActive() ? { ...this.dialogueSystem.state } : null;
        this.pushHUD();
        return;
      }
      if (e.code === 'Escape') {
        this.dialogueSystem.skip();
        this.hudState.characterDialogue = null;
        this.pushHUD();
        return;
      }
    }

    // 2. Map inspection modal
    if (this.hudState.mapInspectionModal?.isOpen) {
      if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') {
        this.closeMapInspection();
        return;
      }
    }

    // 3. Sanskrit inscription dialogue modal
    if (this.hudState.dialogueModal) {
      if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') {
        this.closeDialogue();
        return;
      }
    }

    if (e.code === 'KeyJ') {
      this.toggleJournal();
      return;
    }

    if (e.code === 'Escape') {
      this.togglePause();
      return;
    }

    this.keys[e.code] = true;

    if (e.code === 'KeyE') {
      this.triggerInteraction();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleBlur = () => {
    this.keys = {};
  };

  private handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
    if (typeof window !== 'undefined' && (window as any).__GLOBETROTTER_GAME__ === this) {
      (window as any).__GLOBETROTTER_GAME__ = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (!this.hudState.isPaused && !this.hudState.dialogueModal && !this.hudState.isResultsOpen) {
      this.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private update(delta: number) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);
      this.player.mesh.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
    } else {
      this.player.mesh.visible = true;
    }

    // 0. Active Character Dialogue takes exclusive control
    if (this.dialogueSystem.isActive()) {
      this.dialogueSystem.update(delta);
      this.hudState.characterDialogue = { ...this.dialogueSystem.state };
      this.pushHUD();
      return;
    } else if (this.hudState.characterDialogue !== null) {
      this.hudState.characterDialogue = null;
      this.pushHUD();
    }

    // ── PRELUDE (OUTDOOR) UPDATE ROUTE ──────────────────────────────
    if (this.currentLevelType === 'prelude') {
      // 1. Sequence 1: Opening Jeep Arrival Cinematic
      if (this.isJeepCinematic) {
        this.jeepCinematicTimer += delta;
        const progress = Math.min(1.0, this.jeepCinematicTimer / 3.6);
        const easeProg = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        this.preludeLevel.updateJeepPosition(easeProg);

        // Camera tracks the arriving jeep smoothly from wide landscape shot
        const jeepX = THREE.MathUtils.lerp(this.preludeLevel.jeepStartX, this.preludeLevel.jeepStopX, easeProg);
        this.camera.position.x = THREE.MathUtils.lerp(-10.0, 7.8, easeProg);
        this.camera.position.y = THREE.MathUtils.lerp(3.8, 2.2, easeProg);
        this.camera.position.z = THREE.MathUtils.lerp(18.0, 11.5, easeProg);
        this.camera.lookAt(THREE.MathUtils.lerp(jeepX, 7.8, easeProg * 0.4), 1.0, 0);

        if (this.jeepCinematicTimer >= 3.6) {
          this.isJeepCinematic = false;
          this.player.setPosition(7.8, 0.0);
          this.player.state.facing = 1;
          this.showToast('BOUNTY EXPEDITION BEGUN', 'Explore the trail ahead for tracks.');
        }
        return;
      }

      // 2. Player Input Kinematics
      const left = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
      const right = !!(this.keys['KeyD'] || this.keys['ArrowRight']);
      const jump = !!this.keys['Space'];
      const crouch = !!(this.keys['KeyC'] || this.keys['ControlLeft'] || this.keys['ControlRight']);
      const sprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

      this.player.update(
        delta,
        { left, right, jump, crouch, sprint },
        this.preludeLevel.colliders
      );

      this.preludeLevel.update(delta, this.player.state.x, this.player.state.y);

      // Checkpoints in prelude
      this.checkPreludeCheckpoints();

      // Proximity & interaction check in prelude
      this.checkPreludeInteractions();

      // Side-on camera tracking
      this.updatePreludeCamera(delta);
      return;
    }

    // ── SUBTERRANEAN SANCTUM UPDATE ROUTE ───────────────────────────
    // 1. Opening Cinematic Camera Pan (First 3.2 seconds)
    if (this.isOpeningCinematic) {
      this.openingCinematicTimer += delta;
      // Smoothly pan from wide entrance view to Rudhra
      const t = Math.min(1.0, this.openingCinematicTimer / 3.2);
      const easeT = t * t * (3.0 - 2.0 * t);
      this.camera.position.x = THREE.MathUtils.lerp(-1.0, 3.5, easeT);
      this.camera.position.y = THREE.MathUtils.lerp(2.8, 1.8, easeT);
      this.camera.position.z = THREE.MathUtils.lerp(13.5, 11.5, easeT);
      this.camera.lookAt(THREE.MathUtils.lerp(2.0, 3.5, easeT), 1.0, 0);

      if (this.openingCinematicTimer >= 3.2) {
        this.isOpeningCinematic = false;
      }
    }

    // 2. Cinematic Awakening Sequence
    if (this.isCinematicPlaying) {
      this.updateCinematic(delta);
      this.player.getLanternWorldPosition(this.lanternWorldPosVec);
      this.level.update(
        delta,
        this.player.state.x,
        this.player.state.y,
        this.player.state.isCrouching,
        this.lanternWorldPosVec,
        this.player.state.isLanternActive
      );
      return;
    }

    // 3. Player Input Kinematics
    const left = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
    const right = !!(this.keys['KeyD'] || this.keys['ArrowRight']);
    const jump = !!this.keys['Space'];
    const crouch = !!(this.keys['KeyC'] || this.keys['ControlLeft'] || this.keys['ControlRight']);
    const sprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    // Update Rudhra with collision resolution against level platforms
    this.player.update(
      delta,
      { left, right, jump, crouch, sprint },
      this.level.colliders
    );

    // 4. Update Level Hazards, Murals & Torches
    this.player.getLanternWorldPosition(this.lanternWorldPosVec);
    const hazardResult = this.level.update(
      delta,
      this.player.state.x,
      this.player.state.y,
      this.player.state.isCrouching,
      this.lanternWorldPosVec,
      this.player.state.isLanternActive
    );

    // 5. Hazard damage check
    if (hazardResult.hitHazard && this.invulnerableTimer <= 0) {
      this.damagePlayer(1, hazardResult.hazardName || 'Subterranean hazard');
    }

    // 6. Checkpoints
    this.checkCheckpoints();

    // 7. Interaction Proximity
    this.checkInteractions();

    // 8. Smooth Side-on Tracking Camera
    if (!this.isOpeningCinematic) {
      this.updateCamera(delta);
    }
  }

  // --- Prelude Camera & Checkpoints ---
  private checkPreludeCheckpoints() {
    const px = this.player.state.x;
    if (this.activeCheckpointId === 'cp_prelude_start' && px >= 24.0) {
      this.activeCheckpointId = 'cp_campsite';
      this.currentCheckpoint = { x: 24.0, y: 0.0 };
      this.showToast('CHECKPOINT REACHED', 'Campsite Approach (Sequence 2)');
    } else if (this.activeCheckpointId === 'cp_campsite' && px >= 52.0) {
      this.activeCheckpointId = 'cp_expedition';
      this.currentCheckpoint = { x: 52.0, y: 0.0 };
      this.showToast('CHECKPOINT REACHED', 'Expedition Trail (Sequence 5)');
    }
  }

  private updatePreludeCamera(delta: number) {
    const px = this.player.state.x;
    const py = this.player.state.y;
    const facingRight = this.player.state.facing > 0;

    const targetX = THREE.MathUtils.clamp(
      px + (facingRight ? 2.5 : -2.5),
      -5.0,
      83.0
    );
    const targetY = THREE.MathUtils.clamp(py + 1.8, 1.0, 5.0);
    const targetZ = 12.0;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, 0.08);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, 0.08);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.08);

    const lookAtX = THREE.MathUtils.lerp(px, targetX, 0.4);
    const lookAtY = py + 1.0;
    this.camera.lookAt(lookAtX, lookAtY, 0);
  }

  private checkPreludeInteractions() {
    const px = this.player.state.x;
    const py = this.player.state.y;
    let closestTarget: PreludeInteraction | null = null;
    let closestDist = 2.4;

    for (const target of this.preludeLevel.interactionTargets) {
      if (target.type === 'coin') continue;
      if (target.type === 'map' && this.preludeLevel.isMapCollected) continue;

      const d = Math.hypot(px - target.x, py - target.y);
      if (d < closestDist) {
        closestDist = d;
        closestTarget = target;
      }
    }

    this.activePreludeTarget = closestTarget;
    const prompt = closestTarget ? closestTarget.prompt : null;

    if (prompt !== this.hudState.interactionPrompt) {
      this.hudState.interactionPrompt = prompt;
      this.pushHUD();
    }
  }

  private triggerPreludeInteraction() {
    if (!this.activePreludeTarget) return;
    const target = this.activePreludeTarget;

    switch (target.type) {
      case 'clue':
        this.player.playInteract();
        audioManager.playGem();
        const clueTitle = (target.data?.title as string) || 'Archaeological Clue';
        const clueDesc = (target.data?.description as string) || 'Signs of human presence.';
        this.showToast(clueTitle, clueDesc);
        this.awardXP('event_' + target.id, 15, clueTitle);
        break;

      case 'bounty_target':
        this.player.playInteract();
        this.dialogueSystem.start(
          createBountyDialogue(() => {
            this.awardXP('event_vikram_confronted', 50, 'Bounty Confronted: Vikram');
            saveManager.unlockJournal('entry_bounty_target');
            saveManager.unlockAchievement('first_steps');
            this.showToast('BOUNTY CONFRONTED', 'Vikram spoke of 1,000,000,000 gold coins.');
            this.hudState.objective = 'Pick up the ancient map dropped near the campsite.';
            this.pushHUD();
          })
        );
        this.hudState.characterDialogue = { ...this.dialogueSystem.state };
        this.pushHUD();
        break;

      case 'map':
        if (this.preludeLevel.isMapCollected) return;
        this.player.playInteract();
        this.preludeLevel.collectMap();
        saveManager.collectRelic('relic_ancient_map');
        audioManager.playArtifactHarmonic();
        this.awardXP('event_ancient_map_collected', 30, 'Ancient Expedition Map');
        saveManager.unlockJournal('entry_ancient_map');
        this.openMapInspection();
        this.hudState.objective = 'Follow the map coordinates eastward across the jungle trail toward the temple.';
        this.showToast('+30 XP: ANCIENT MAP RECOVERED', 'Coordinates: 24°18\'N 82°45\'E');
        this.pushHUD();
        break;

      case 'temple_entrance':
        this.player.playInteract();
        audioManager.playArtifactHarmonic();
        this.transitionToSanctum(2.0, 0.0);
        break;
    }
  }

  // --- Hazard Damage & Recovery ---
  private damagePlayer(amount: number, reason: string) {
    this.invulnerableTimer = 1.4;
    audioManager.playHit();
    this.hudState.health = Math.max(0, this.hudState.health - amount);
    this.showToast('DAMAGE SUSTAINED!', reason);
    this.pushHUD();

    if (this.hudState.health <= 0) {
      this.handlePlayerDeath(reason);
    }
  }

  private handlePlayerDeath(reason: string) {
    this.sessionDeaths++;
    this.showToast('EXPEDITION FAILED', reason);
    audioManager.playExplosion();

    this.player.state.canMove = false;

    // Restore to current checkpoint after brief failure response
    setTimeout(() => {
      this.player.setPosition(this.currentCheckpoint.x, this.currentCheckpoint.y);
      this.player.state.vx = 0;
      this.player.state.vy = 0;
      this.player.state.isDead = false;
      this.player.state.canMove = true;
      this.hudState.health = this.hudState.maxHealth;
      this.invulnerableTimer = 1.0;

      // Preserve carried relic state upon respawn!
      if (saveManager.hasRelic('relic_sun_disc_fragment') && !saveManager.isEventAwarded('mech_artifact_socket')) {
        this.player.setCarryingRelic(true);
      }

      this.showToast('CHECKPOINT RESTORED', 'Rudhra gathered his strength.');
      this.pushHUD();
    }, 950);
  }

  // --- Checkpoints ---
  private checkCheckpoints() {
    const px = this.player.state.x;

    // Checkpoint 1: Scene 04 Ancient Archives ($X \ge 60.5m)
    if (this.activeCheckpointId === 'cp_start' && px >= 60.5) {
      this.activeCheckpointId = 'cp_archives';
      this.currentCheckpoint = { x: 61.0, y: -7.2 };
      audioManager.playCoin();
      this.showToast('CHECKPOINT REACHED', 'Ancient Archives (Scene 04)');
      this.hudState.objective = 'Follow the solar symbols to the dormant celestial mechanism chamber.';
      this.pushHUD();
    }

    // Checkpoint 2: Scene 07 Safe Bridge Landing ($X \ge 106.0m)
    if (this.activeCheckpointId === 'cp_archives' && px >= 106.0) {
      this.activeCheckpointId = 'cp_bridge';
      this.currentCheckpoint = { x: 107.0, y: -7.2 };
      audioManager.playCoin();
      this.showToast('CHECKPOINT REACHED', 'Bridge Abutment Secured (Scene 07)');
      this.hudState.objective = 'Enter the root-covered archway into the Inner Sanctum.';
      this.completedMasteryChallenges.add('bridge_survivor');
      saveManager.unlockAchievement('bridge_crosser');
      this.awardXP('event_bridge_crosser', 35, 'Monumental Crossing Traversed');
      this.pushHUD();
    }

    // Checkpoint 3: Inner Temple Sanctum ($X \ge 120.0m)
    if (this.activeCheckpointId === 'cp_bridge' && px >= 120.0) {
      this.activeCheckpointId = 'cp_sanctum';
      this.currentCheckpoint = { x: 120.5, y: -7.2 };
      audioManager.playCoin();
      this.showToast('CHECKPOINT REACHED', 'Grand Surya Sanctum');
      this.hudState.objective = 'Unseal the final monumental Surya Mandala Vault Gate.';
      this.pushHUD();
    }
  }

  // --- Interaction & Proximity ---
  private checkInteractions() {
    const px = this.player.state.x;
    const py = this.player.state.y;
    let closestTarget: InteractionTarget | null = null;
    let closestDist = 2.4;

    for (const target of this.level.interactionTargets) {
      const d = Math.hypot(px - target.x, py - target.y);
      if (d < closestDist) {
        closestDist = d;
        closestTarget = target;
      }
    }

    this.activeTarget = closestTarget;
    const prompt = closestTarget ? closestTarget.prompt : null;

    if (prompt !== this.hudState.interactionPrompt) {
      this.hudState.interactionPrompt = prompt;
      this.pushHUD();
    }
  }

  private triggerInteraction() {
    if (this.currentLevelType === 'prelude') {
      this.triggerPreludeInteraction();
      return;
    }

    if (!this.activeTarget) return;

    const target = this.activeTarget;
    switch (target.type) {
      case 'artifact':
        this.collectSuryaRelic();
        break;

      case 'inscription':
        this.inspectGitaInscription(target.data);
        break;

      case 'mechanism':
        this.interactWithMechanism();
        break;

      case 'secret_gem':
        this.collectStarSapphire();
        break;

      case 'dial':
        if (target.data && typeof target.data.dialIndex === 'number') {
          this.rotateSymbolDial(target.data.dialIndex);
        }
        break;

      case 'story_altar':
        if (target.id === 'target_gold_urn') {
          this.collectTempleUrn();
        } else if (target.id === 'target_final_scroll') {
          this.inspectFinalScroll(target.data);
        }
        break;

      case 'exit_gate':
        this.triggerLevelCompletion();
        break;
    }
  }

  // --- Action Handlers ---

  private collectSuryaRelic() {
    if (this.level.hasArtifact) return;

    this.player.playInteract();
    if (this.level.artifactMesh) {
      this.level.artifactMesh.visible = false;
    }
    this.level.hasArtifact = true;
    this.player.setCarryingRelic(true);
    audioManager.playArtifactHarmonic();

    saveManager.collectRelic('relic_sun_disc_fragment');
    this.awardXP('event_relic_sun_disc', 50, 'Relic Fragment: Surya-Chakra');
    saveManager.unlockJournal('entry_artifact_found');
    saveManager.unlockAchievement('first_steps');
    saveManager.unlockAchievement('relic_keeper');

    this.showToast('+50 XP: SURYA-CHAKRA RECOVERED', 'Carry the solar key down the ancient staircase into the darkness.');
    this.hudState.objective = 'Descend the monumental staircase. The ancient murals respond to your lantern.';
    this.pushHUD();
  }

  private collectTempleUrn() {
    this.player.playInteract();
    audioManager.playGem();
    saveManager.collectRelic('treasure_gold_urn');
    this.awardXP('event_treasure_urn', 25, 'Antique Temple Urn Discovered');
    this.showToast('+25 XP: ANTIQUE TEMPLE URN', 'Ritual Offering Vessel Secured');
    this.pushHUD();
  }

  private inspectGitaInscription(data?: Record<string, unknown>) {
    this.player.playInteract();
    audioManager.playGem();

    const title = (data?.title as string) || 'Rock Inscription: Karma Yoga';
    const source = (data?.source as string) || 'Bhagavad Gita 2.47 · Classical Sanskrit Inscription';
    const translation =
      (data?.translation as string) ||
      'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.';
    const loreNote =
      (data?.loreNote as string) ||
      'Carved by ancient temple scholars to guide the explorer toward selfless duty rather than blinding greed.';

    let originalText = '॥ कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ॥\n॥ मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥';
    if (data?.recordId === 'target_ramayana_satya') {
      originalText = '॥ आहुः सत्यं हि परमं धर्मं धर्मविदो जनाः ॥\n॥ सत्यमाश्रित्य हि मया त्वं च धर्मं प्रचोदितः ॥';
    }

    const recordId = (data?.recordId as string) || 'record_gita_karma';
    saveManager.collectRelic(recordId);
    this.awardXP(`event_${recordId}`, 15, title);
    saveManager.unlockJournal('entry_gita_karma');
    saveManager.unlockAchievement('ancient_knowledge');

    this.hudState.dialogueModal = {
      title,
      originalText,
      translation,
      source,
      loreNote,
    };
    this.pushHUD();
  }

  private interactWithMechanism() {
    if (this.level.isMechanismSolved) return;
    this.player.playInteract();

    // Verify player is carrying the Surya-Chakra relic
    if (!this.player.isCarryingRelic() && !saveManager.hasRelic('relic_sun_disc_fragment')) {
      audioManager.playHit();
      this.showToast(
        'MECHANISM SEALED',
        'The circular socket requires the Surya-Chakra relic discovered at the entrance altar!'
      );
      return;
    }

    // Install the relic: transition from carried to installed state!
    this.player.setCarryingRelic(false);
    this.level.isMechanismSolved = true;
    saveManager.awardEvent('mech_artifact_socket');

    // Trigger the Progressive 6-Beat Cinematic Sanctum Awakening Sequence
    this.isCinematicPlaying = true;
    this.cinematicTimer = 0;
    this.cinematicStep = 1;
    this.player.state.canMove = false;
    this.player.state.vx = 0;
    audioManager.playEngine();
    this.showToast('SURYA-CHAKRA INSTALLED', 'The Sunken Sanctum awakens...');
  }

  private updateCinematic(delta: number) {
    this.cinematicTimer += delta;

    switch (this.cinematicStep) {
      case 1: // Beat 1: First flame & relic seating (0s to 1.8s)
        this.cameraCinematicTarget.set(76.0, -4.5, 9.5);
        this.cameraCinematicLookAt.set(76.0, -5.4, 0);
        if (this.cinematicTimer > 1.8) {
          this.cinematicStep = 2;
          audioManager.playGem();
          if (this.level.mechanismGlow) this.level.mechanismGlow.intensity = 3.0;
        }
        break;

      case 2: // Beat 2: Chain of braziers ignites sequentially (1.8s to 4.2s)
        this.cameraCinematicTarget.set(79.0, -4.0, 13.0);
        this.cameraCinematicLookAt.set(82.0, -5.0, 0);
        if (this.cinematicTimer > 4.2) {
          this.cinematicStep = 3;
          this.level.activateSequentialTorches();
          audioManager.playArtifactHarmonic();
        }
        break;

      case 3: // Beat 3: Mechanical movement — concentric bronze gear rings rotate (4.2s to 6.8s)
        if (this.level.mechanismRings) {
          this.level.mechanismRings.rotation.z += delta * 2.8;
        }
        if (this.cinematicTimer > 6.8) {
          this.cinematicStep = 4;
          audioManager.playEngine();
        }
        break;

      case 4: // Beat 4: Ancient temple lighting systems activate (6.8s to 9.2s)
        this.ambientLight.intensity = Math.min(0.28, this.ambientLight.intensity + delta * 0.08);
        this.cameraCinematicTarget.set(84.0, -2.5, 16.0);
        this.cameraCinematicLookAt.set(88.0, -4.5, 0);
        if (this.cinematicTimer > 9.2) {
          this.cinematicStep = 5;
        }
        break;

      case 5: // Beat 5: Blue daylight shafts pierce ceiling apertures (9.2s to 12.0s)
        this.cameraCinematicTarget.set(90.0, -1.5, 18.0);
        this.cameraCinematicLookAt.set(96.0, -5.5, 0);
        if (this.cinematicTimer > 12.0) {
          this.cinematicStep = 6;
        }
        break;

      case 6: // Beat 6: Monumental reveal — sweep across grand bridge & restore control (12.0s to 14.8s)
        const px = this.player.state.x;
        const py = this.player.state.y;
        this.cameraCinematicTarget.set(px, py + 2.2, 12.5);
        this.cameraCinematicLookAt.set(px, py + 1.0, 0);

        if (this.cinematicTimer > 14.8) {
          this.isCinematicPlaying = false;
          this.player.state.canMove = true;
          saveManager.unlockJournal('entry_mechanism_solved');
          saveManager.unlockAchievement('light_in_darkness');
          saveManager.unlockAchievement('mechanism_master');
          this.awardXP('event_puzzle_mechanism', 40, 'Celestial Mechanism Activated');
          this.completedMasteryChallenges.add('mechanism_master');
          this.showToast('+40 XP: MECHANISM ACTIVATED', 'Vast sanctum revealed! Cross the monumental bridge.');
          this.hudState.objective = 'Cross the monumental ancient bridge and traverse the chasm.';
          this.pushHUD();
        }
        break;
    }

    // Smooth camera interpolation during cinematic
    this.camera.position.lerp(this.cameraCinematicTarget, 0.05);
    const curDir = new THREE.Vector3();
    this.camera.getWorldDirection(curDir);
    const targetDir = new THREE.Vector3()
      .subVectors(this.cameraCinematicLookAt, this.camera.position)
      .normalize();
    curDir.lerp(targetDir, 0.05);
    this.camera.lookAt(this.camera.position.clone().add(curDir.multiplyScalar(10)));
  }

  private collectStarSapphire() {
    if (this.level.secretGemMesh) {
      this.level.secretGemMesh.visible = false;
    }
    this.level.isGemCollected = true;
    audioManager.playArtifactHarmonic();

    saveManager.collectRelic('relic_vedic_sapphire');
    this.awardXP('event_relic_sapphire', 50, 'Hidden Treasure: Vedic Star Sapphire');
    this.awardXP('event_secret_vimana', 40, 'Secret Shrine Discovered');
    saveManager.unlockJournal('entry_vimana_secret');
    saveManager.unlockAchievement('keen_observer');
    saveManager.unlockAchievement('secret_seeker');

    this.showToast('+90 XP: VEDIC STAR SAPPHIRE RECOVERED', 'Secret Vimana Shrine Unearthed!');
    this.pushHUD();
  }

  private rotateSymbolDial(dialIndex: number) {
    const isNowSolved = this.level.rotateDial(dialIndex);
    const dialNames = ['Surya (Sun)', 'Padma (Lotus)', 'Trishula (Trident)'];
    this.showToast(`DIAL ${dialIndex + 1} ROTATED`, `${dialNames[dialIndex]} Symbol Aligned`);

    if (isNowSolved) {
      audioManager.playPuzzleSolve();
      this.awardXP('event_puzzle_dials', 40, 'Temple Symbol Dials Mastered');
      this.completedMasteryChallenges.add('dial_puzzle');
      this.showToast('+40 XP: TEMPLE GEARS UNLOCKED', 'The inner sanctum portcullis rises!');
      this.hudState.objective = 'Proceed through into the Grand Surya Vault to examine the final codex.';
      this.pushHUD();
    }
  }

  private inspectFinalScroll(data?: Record<string, unknown>) {
    audioManager.playGem();
    saveManager.collectRelic('record_satya_inscr');
    this.awardXP('event_record_satya', 15, 'Mundaka Upanishad Scripture');
    saveManager.unlockJournal('entry_surya_vault');

    this.hudState.dialogueModal = {
      title: 'Codex of the Eternal Relics',
      originalText: '॥ सत्यमेव जयते नानृतम् ॥\n॥ सत्येन पन्था विततो देवयानः ॥',
      translation:
        'Truth alone triumphs, not falsehood. The cosmic relics are not treasures of gold, but keys to universal equilibrium.',
      source: 'Mundaka Upanishad 3.1.6 · Classical Sanskrit Lintel Scripture',
      loreNote: 'Unlocks the next expedition chapter into the hidden Himalayan and Deccan ruins.',
    };
    this.pushHUD();
  }

  private triggerLevelCompletion() {
    this.level.openVaultGate();
    audioManager.playArtifactHarmonic();

    const P = 100;
    const collectedDiscoveries = [
      saveManager.hasRelic('relic_sun_disc_fragment'),
      saveManager.hasRelic('treasure_gold_urn'),
      saveManager.hasRelic('record_gita_karma'),
      saveManager.hasRelic('relic_vedic_sapphire'),
    ].filter(Boolean).length;

    const D = 100 * (collectedDiscoveries / this.optionalCollectiblesCount);
    const totalMasteryChallenges = 2;
    const M = 100 * (this.completedMasteryChallenges.size / totalMasteryChallenges);

    const overallScore = Math.round(0.4 * P + 0.3 * D + 0.3 * M);

    let stars = 1;
    if (overallScore >= 85) {
      stars = 3;
    } else if (overallScore >= 60) {
      stars = 2;
    }

    this.awardXP('event_level_complete', 100, 'Level 1: The Forgotten Sanctum Completed');
    let noDeathBonus = false;
    if (this.sessionDeaths === 0) {
      this.awardXP('event_no_death_bonus', 50, 'Flawless Explorer Bonus');
      noDeathBonus = true;
    }

    saveManager.setLevelRating(1, {
      stars,
      score: overallScore,
      xp: this.sessionXpEarned,
    });
    saveManager.unlockLevel(2);

    if (stars === 3) {
      saveManager.unlockAchievement('perfect_explorer');
    }

    this.hudState.isResultsOpen = true;
    this.hudState.resultsData = {
      levelName: 'Level 1: The Forgotten Sanctum',
      stars,
      score: overallScore,
      xpEarned: this.sessionXpEarned,
      relicsFound: collectedDiscoveries,
      totalRelics: this.optionalCollectiblesCount,
      deaths: this.sessionDeaths,
      noDeathBonus,
    };
    this.pushHUD();
  }

  private awardXP(eventId: string, amount: number, label: string) {
    const isNew = saveManager.awardXP(eventId, amount);
    if (isNew) {
      this.sessionXpEarned += amount;
      this.showToast(`+${amount} XP EARNED`, label);
    }
  }

  private updateCamera(delta: number) {
    const px = this.player.state.x;
    const py = this.player.state.y;
    const facingRight = this.player.state.facing > 0;

    const targetX = THREE.MathUtils.clamp(
      px + (facingRight ? 2.5 : -2.5),
      3.0,
      122.0
    );
    const targetY = THREE.MathUtils.clamp(py + 1.8, -6.5, 4.0);
    const targetZ = 12.0;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, 0.08);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, 0.08);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.08);

    const lookAtX = THREE.MathUtils.lerp(px, targetX, 0.4);
    const lookAtY = py + 1.0;
    this.camera.lookAt(lookAtX, lookAtY, 0);

    // Exterior skylight spill: active ONLY at surface entrance (X < 14m), fading to 0 in subterranean darkness!
    if (this.isCinematicPlaying) {
      this.dirLight.intensity = 0.45;
    } else {
      const surfaceSpill = Math.max(0, 0.35 * (1 - (px - 10) / 8));
      this.dirLight.intensity = THREE.MathUtils.lerp(this.dirLight.intensity, surfaceSpill, 0.1);
    }
  }

  public skipOpeningCinematic() {
    this.isOpeningCinematic = false;
    this.openingCinematicTimer = 3.5;
    this.snapCameraToPlayer();
  }

  public snapCameraToPlayer() {
    const px = this.player.state.x;
    const py = this.player.state.y;
    const facingRight = this.player.state.facing > 0;
    const targetX = THREE.MathUtils.clamp(px + (facingRight ? 2.5 : -2.5), 3.0, 122.0);
    const targetY = THREE.MathUtils.clamp(py + 1.8, -6.5, 4.0);
    this.camera.position.set(targetX, targetY, 12.0);
    this.camera.lookAt(targetX, py + 1.0, 0);
  }

  private showToast(message: string, sub?: string) {
    this.hudState.activeToast = { message, sub };
    this.pushHUD();

    setTimeout(() => {
      if (this.hudState.activeToast?.message === message) {
        this.hudState.activeToast = null;
        this.pushHUD();
      }
    }, 3500);
  }

  public closeDialogue() {
    this.hudState.dialogueModal = null;
    this.pushHUD();
  }

  public toggleJournal() {
    this.hudState.isJournalOpen = !this.hudState.isJournalOpen;
    this.pushHUD();
  }

  public togglePause() {
    this.hudState.isPaused = !this.hudState.isPaused;
    this.pushHUD();
  }

  public restartFromCheckpoint() {
    this.hudState.isPaused = false;
    this.hudState.health = this.hudState.maxHealth;
    this.player.setPosition(this.currentCheckpoint.x, this.currentCheckpoint.y);
    this.player.state.vx = 0;
    this.player.state.vy = 0;
    this.pushHUD();
  }

  public restartLevel() {
    this.hudState.isPaused = false;
    this.hudState.isResultsOpen = false;
    this.hudState.health = this.hudState.maxHealth;
    this.currentCheckpoint = { x: 2.0, y: 0.0 };
    this.activeCheckpointId = 'cp_start';
    this.player.setPosition(2.0, 0.0);
    this.player.state.vx = 0;
    this.player.state.vy = 0;
    this.sessionDeaths = 0;
    this.sessionXpEarned = 0;
    this.completedMasteryChallenges.clear();
    this.pushHUD();
  }

  public transitionToSanctum(startX = 2.0, startY = 0.0) {
    this.currentLevelType = 'sanctum';
    this.scene.remove(this.preludeLevel.group);
    this.scene.add(this.level.group);

    this.scene.background = new THREE.Color(0x020408);
    this.scene.fog = new THREE.FogExp2(0x020408, 0.028);
    this.ambientLight.color.setHex(0x060c14);
    this.ambientLight.intensity = 0.12;
    this.dirLight.color.setHex(0x7799bb);
    this.dirLight.intensity = 0.35;
    this.dirLight.position.set(6, 14, 8);

    this.player.setPosition(startX, startY);
    this.player.state.vx = 0;
    this.player.state.vy = 0;
    this.currentCheckpoint = { x: startX, y: startY };
    this.activeCheckpointId = 'cp_sanctum_start';
    this.isOpeningCinematic = false;

    this.hudState.currentLevelType = 'sanctum';
    this.hudState.activeSequence = 6;
    this.hudState.objective = 'Explore the archaeological entrance and discover the Surya-Chakra artifact.';
    saveManager.unlockJournal('entry_arrival');
    this.showToast('ENTERING THE SUNKEN SANCTUM', 'Sequence 6: The Forgotten Temple');
    this.snapCameraToPlayer();
    this.pushHUD();
  }

  public transitionToPrelude(startX = 7.8, startY = 0.0, skipCinematic = false) {
    this.currentLevelType = 'prelude';
    this.scene.remove(this.level.group);
    this.scene.add(this.preludeLevel.group);

    this.scene.background = new THREE.Color(0x3a5068);
    this.scene.fog = new THREE.FogExp2(0x3a5068, 0.006);
    this.ambientLight.color.setHex(0x302820);
    this.ambientLight.intensity = 0.45;
    this.dirLight.color.setHex(0xffd4a0);
    this.dirLight.intensity = 1.6;
    this.dirLight.position.set(25, 20, 10);

    this.player.setPosition(startX, startY);
    this.player.state.vx = 0;
    this.player.state.vy = 0;
    this.currentCheckpoint = { x: startX, y: startY };
    this.activeCheckpointId = 'cp_prelude_start';

    this.hudState.currentLevelType = 'prelude';
    if (skipCinematic) {
      this.isJeepCinematic = false;
      this.preludeLevel.updateJeepPosition(1.0);
      this.snapCameraToPlayer();
    } else {
      this.isJeepCinematic = true;
      this.jeepCinematicTimer = 0;
      this.preludeLevel.updateJeepPosition(0);
    }
    this.pushHUD();
  }

  public jumpToSequence(seq: number) {
    this.closeDialogue();
    this.closeMapInspection();
    this.isCinematicPlaying = false;
    this.player.state.canMove = true;
    this.hudState.activeSequence = seq;

    switch (seq) {
      case 1: // Seq 1: Jeep Arrival
        this.transitionToPrelude(7.8, 0.0, false);
        this.hudState.objective = 'Track the bounty target along the jungle trail.';
        this.showToast('SEQUENCE 1: JEEP ARRIVAL', 'Remote Deccan Wilderness');
        break;

      case 2: // Seq 2: Tracking the Bounty
        this.transitionToPrelude(22.0, 0.0, true);
        this.hudState.objective = 'Follow the footprints and discarded gear toward the campsite.';
        this.showToast('SEQUENCE 2: BOUNTY TRACKING', 'Investigate clues along the trail.');
        break;

      case 3: // Seq 3: Bounty Confrontation
        this.transitionToPrelude(36.0, 0.0, true);
        this.hudState.objective = 'Confront Vikram at the jungle campsite.';
        this.showToast('SEQUENCE 3: CONFRONTATION', 'Corner the bounty target.');
        this.triggerPreludeInteraction();
        break;

      case 4: // Seq 4: Map Discovery
        this.transitionToPrelude(34.0, 0.0, true);
        this.openMapInspection();
        this.hudState.objective = 'Examine the ancient map coordinates for the billion gold coins.';
        this.showToast('SEQUENCE 4: MAP DISCOVERY', 'Cartography of the Sunken Sanctum');
        break;

      case 5: // Seq 5: The Expedition
        this.transitionToPrelude(52.0, 0.0, true);
        this.hudState.objective = 'Traverse the expedition trail, stream bridge, and chasm gap.';
        this.showToast('SEQUENCE 5: THE EXPEDITION', 'Following coordinates to the ancient temple.');
        break;

      case 6: // Seq 6: Temple Gates
        this.transitionToPrelude(78.0, 0.0, true);
        this.hudState.objective = 'Enter the monumental ancient sandstone gateway.';
        this.showToast('SEQUENCE 6: TEMPLE GATES', 'The Monumental Entrance Facade');
        break;

      case 7: // Seq 7: Stepped Descent & Relic Altar
        this.transitionToSanctum(6.0, 0.0);
        this.hudState.objective = 'Recover the Surya-Chakra artifact from the sun altar.';
        this.showToast('SEQUENCE 7: RELIC ALTAR', 'Recover the solar key.');
        this.collectSuryaRelic();
        break;

      case 8: // Seq 8: Murals & Stepped Descent
        this.transitionToSanctum(23.1, -2.4);
        this.hudState.objective = 'Descend the grand staircase. Murals respond to your lantern.';
        this.showToast('SEQUENCE 8: ANCIENT MURALS', 'Sacred carvings illuminated by lantern.');
        break;

      case 9: // Seq 9: Deeper Passage & Archives
        this.transitionToSanctum(51.5, -7.2);
        this.hudState.objective = 'Navigate past subterranean hazards to the Sanskrit tablets.';
        this.showToast('SEQUENCE 9: DEEPER PASSAGE', 'Ancient Archives & Inscriptions');
        break;

      case 10: // Seq 10: Relic Chamber / Mechanism
        this.transitionToSanctum(76.0, -7.2);
        this.hudState.objective = 'Engage the Surya-Chakra into the dormant celestial socket.';
        this.showToast('SEQUENCE 10: RELIC CHAMBER', 'Dormant Celestial Mechanism');
        break;

      case 11: // Seq 11: Sanctum Awakening
        this.transitionToSanctum(76.0, -7.2);
        this.interactWithMechanism();
        this.hudState.objective = 'Witness the 6-beat progressive awakening of the sanctum.';
        this.showToast('SEQUENCE 11: SANCTUM AWAKENING', 'Ancient mechanisms return to life.');
        break;

      case 12: // Seq 12: Final Crossing
        this.transitionToSanctum(95.0, -7.2);
        this.hudState.objective = 'Cross the monumental bridge and unseal the Grand Surya Vault.';
        this.showToast('SEQUENCE 12: FINAL CROSSING', 'Chasm Bridge & Cosmic Revelation');
        break;
    }
  }

  public openMapInspection() {
    this.hudState.mapInspectionModal = {
      isOpen: true,
      coordinates: "24°18'N 82°45'E · Deccan Ridge Wilderness",
      legend: "ONE BILLION GOLD COINS · SACRED SOLAR MANDALA",
      loreNote: "Warns of an astronomical threat to Earth. The relic is not wealth to be spent, but an ancient defense mechanism.",
    };
    this.pushHUD();
  }

  public closeMapInspection() {
    if (this.hudState.mapInspectionModal) {
      this.hudState.mapInspectionModal = null;
      this.pushHUD();
    }
  }

  public skipDialogue() {
    this.dialogueSystem.skip();
    this.hudState.characterDialogue = null;
    this.pushHUD();
  }

  private pushHUD() {
    if (this.onHUDUpdate) {
      this.onHUDUpdate({ ...this.hudState });
    }
  }
}

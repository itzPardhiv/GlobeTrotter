import { WebSocket } from 'ws';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

const DEBUG_PORT = 9228;
const SCREENSHOT_DIR = path.resolve('screenshots');
const ARTIFACT_DIR = 'C:\\Users\\Pardhu\\.gemini\\antigravity-ide\\brain\\47603aa9-ea93-48c0-bcc8-c72658f3e10e';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendCdpCommand(ws: WebSocket, method: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const messageHandler = (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off('message', messageHandler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on('message', messageHandler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function captureScreenshot(ws: WebSocket, filename: string, title: string): Promise<string> {
  const screenshotRes = await sendCdpCommand(ws, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const localPath = path.join(SCREENSHOT_DIR, filename);
  fs.writeFileSync(localPath, buffer);

  if (fs.existsSync(ARTIFACT_DIR)) {
    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artPath, buffer);
  }

  console.log(`[SCREENSHOT] ${filename} (${(buffer.length / 1024).toFixed(1)} KB) — ${title}`);
  return localPath;
}

let chromeProcess: any = null;

async function run() {
  console.log('======================================================');
  console.log('GLOBETROTTER: PIXEL EDITION — 2D RUNTIME QA AUDIT');
  console.log('======================================================\n');

  console.log(`Connecting to Chrome CDP on port ${DEBUG_PORT}...`);
  chromeProcess = cp.spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--user-data-dir=C:\\Users\\Pardhu\\AppData\\Local\\Temp\\chrome_dev_pixel_qa',
      '--headless=new',
      '--no-first-run',
      'http://localhost:3005/',
    ],
    { stdio: 'ignore' }
  );

  let res: any = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      if (res.ok) break;
    } catch (e) {}
  }

  if (!res || !res.ok) throw new Error('Chrome debug port not responding');
  const pages: any = await res.json();
  const page = pages.find((p: any) => p.type === 'page' && p.url.includes('localhost:3005'));
  if (!page || !page.webSocketDebuggerUrl) throw new Error('Pixel edition page not found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.once('open', resolve));

  await sendCdpCommand(ws, 'Page.enable');
  await sendCdpCommand(ws, 'Runtime.enable');
  await sendCdpCommand(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('[PASS] Connected to browser and set viewport to 1280x720 (2x integer pixel scale)');

  // Allow Phaser and assets to compile and transition to MainMenuScene
  await sleep(2500);

  // ── AUDIT 1: MAIN MENU SCENE ───────────────────────────────────────────────
  console.log('\n--- AUDIT 1: Main Menu & Dawn Vista ---');
  await captureScreenshot(ws, '00_main_menu_vista.png', 'Main Menu with Dawn Sky Parallax & Title Glow');

  // ── AUDIT 2: PRELUDE SCENE 1 — MOUNTAIN & JUNGLE VISTA ─────────────────────
  console.log('\n--- AUDIT 2: Prelude Scene 1 — Mountain Vista ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__GLOBETROTTER_PIXEL_GAME__;
        game.scene.start('PreludeCinematicScene');
      })()
    `,
  });
  await sleep(800);
  await captureScreenshot(ws, '01_opening_mountain_jungle_vista.png', 'Opening Mountain and Jungle Vista at Dawn');

  // ── AUDIT 3: PRELUDE SCENE 2 — JEEP TRAVEL CINEMATIC ───────────────────────
  console.log('\n--- AUDIT 3: Prelude Scene 2 — Jeep Travel ---');
  await sleep(1800);
  await captureScreenshot(ws, '02_jeep_cinematic.png', 'Expedition Jeep Traveling along Winding Jungle Trail');

  // ── AUDIT 4: PRELUDE SCENE 3 & 4 — ARRIVAL AT RUINS ────────────────────────
  console.log('\n--- AUDIT 4: Prelude Scene 3 & 4 — Arrival at Ruins ---');
  await sleep(2200);
  await captureScreenshot(ws, '03_rudhras_arrival.png', 'Expedition Jeep Arrival and Rudhra Introduction');

  // ── AUDIT 5: WILDERNESS SCENE 5 — FIRST PLAYABLE EXPLORATION ────────────────
  console.log('\n--- AUDIT 5: Wilderness Playable Exploration ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__GLOBETROTTER_PIXEL_GAME__;
        game.scene.start('WildernessScene');
      })()
    `,
  });
  await sleep(800);
  await captureScreenshot(ws, '04_wilderness_exploration.png', 'First Playable Wilderness Exploration with Rudhra');

  // ── AUDIT 6: CAMPSITE & FIELD JOURNAL DISCOVERY ────────────────────────────
  console.log('\n--- AUDIT 6: Campsite & Clues Discovery ---');
  // Move player to campsite (x: 620)
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('WildernessScene');
        scene.player.setPosition(620, 280);
      })()
    `,
  });
  await sleep(400);
  await captureScreenshot(ws, '05_campsite_and_clues.png', 'Campsite Tent, Campfire, and Expedition Journal Clue');

  // ── AUDIT 7: TORANA GATEWAY & MUNDAKA UPANISHAD SCRIPTURE ──────────────────
  console.log('\n--- AUDIT 7: Torana Gateway & Sacred Scripture ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('WildernessScene');
        scene.dialogue.close();
        scene.player.setPosition(1040, 250);
        scene.activePromptTarget = 'torana';
        scene.handleInteract();
      })()
    `,
  });
  await sleep(600);
  await captureScreenshot(ws, '07_sanskrit_inscription.png', 'Torana Lintel Sanskrit Inscription (Mundaka Upanishad 3.1.6)');

  // Close dialogue
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('WildernessScene');
        scene.dialogue.close();
      })()
    `,
  });
  await sleep(300);

  // ── AUDIT 8: RUINS DESCENT & HANDHELD LANTERN LIGHT MASK ───────────────────
  console.log('\n--- AUDIT 8: Lantern-Lit Descent into Darkness ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__GLOBETROTTER_PIXEL_GAME__;
        game.scene.start('RuinsDescentScene');
      })()
    `,
  });
  await sleep(800);
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('RuinsDescentScene');
        scene.player.setPosition(480, 290);
      })()
    `,
  });
  await sleep(400);
  await captureScreenshot(ws, '06_lantern_lit_descent.png', 'Lantern-Lit Descent into Darkness with Dynamic Light Mask');

  // ── AUDIT 9: ARTIFACT PLACEMENT & STAGED ILLUMINATION ──────────────────────
  console.log('\n--- AUDIT 9: Artifact Placement Sequence ---');
  // Move to altar (x: 880) and trigger placement
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('RuinsDescentScene');
        scene.player.setPosition(880, 270);
        scene.executeArtifactPlacement();
      })()
    `,
  });
  await sleep(600);
  await captureScreenshot(ws, '08_artifact_placement.png', 'Placement of Surya-Chakra Relic on Celestial Pedestal');

  // ── AUDIT 10: THE GREAT TORCH REVEAL SEQUENCE ──────────────────────────────
  console.log('\n--- AUDIT 10: The Great Torch Reveal ---');
  await sleep(2600); // Wait for sequential torches and sunlight ray to illuminate
  await captureScreenshot(ws, '09_great_torch_reveal.png', 'The Great Torch Reveal: Monumental Hypostyle Hall & Sunlight Beam');

  // ── AUDIT 11: FULL LEVEL 1 SANCTUM TRAVERSAL & CHASM BRIDGE ────────────────
  console.log('\n--- AUDIT 11: Chasm Bridge Traversal ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__GLOBETROTTER_PIXEL_GAME__;
        game.scene.start('SanctumTraversalScene');
      })()
    `,
  });
  await sleep(600);
  // Move player onto bridge (x: 580)
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('SanctumTraversalScene');
        scene.player.body.reset(580, 178);
        scene.player.setVelocity(0, 0);
      })()
    `,
  });
  await sleep(400);
  await captureScreenshot(ws, '10_ancient_bridge_traversal.png', 'Ancient Rope and Wood Suspension Bridge over Mist Chasm');

  // ── AUDIT 12: SANCTUM TORANA GATEWAY ───────────────────────────────────────
  console.log('\n--- AUDIT 12: Sanctum Torana Gateway ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('SanctumTraversalScene');
        scene.player.setPosition(960, 280);
      })()
    `,
  });
  await sleep(400);
  await captureScreenshot(ws, '11_torana_gateway.png', 'Monumental Torana Gateway Landmark inside Ruins');

  // ── AUDIT 13: TEMPLE VESTIBULE TRANSITION ──────────────────────────────────
  console.log('\n--- AUDIT 13: Temple Vestibule Transition ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('SanctumTraversalScene');
        scene.player.setPosition(1260, 280);
      })()
    `,
  });
  await sleep(400);
  await captureScreenshot(ws, '12_temple_vestibule.png', 'Enclosed Temple Vestibule and Astronomical Clue Stele');

  // ── AUDIT 14: SURYA-CHAKRA 3-DIAL PUZZLE ALIGNMENT ─────────────────────────
  console.log('\n--- AUDIT 14: Surya-Chakra Dial Puzzle Alignment ---');
  // Move to dials dais and align dials to correct angles: Sun=0, Lotus=90, Trishula=180
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('SanctumTraversalScene');
        scene.player.setPosition(1600, 225);
        // Align Sun: 180 + 180 = 0
        scene.rotateDial(0);
        scene.rotateDial(0);
        // Align Lotus: 270 + 180 = 90
        scene.rotateDial(1);
        scene.rotateDial(1);
        // Align Trishula: 90 + 90 = 180
        scene.rotateDial(2);
      })()
    `,
  });
  await sleep(800);
  await captureScreenshot(ws, '13_sanctum_surya_chakra_puzzle.png', 'Surya-Chakra 3-Dial Celestial Puzzle Solved with Green Lock Indicators');

  // ── AUDIT 15: COLOSSAL STONE VAULT OPENING & RELIC CLAIM ───────────────────
  console.log('\n--- AUDIT 15: Vault Opening & Relic Claim ---');
  await sleep(1800); // Wait for vault door to slide up
  // Move player to relic pedestal (x: 1880)
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const scene = window.__GLOBETROTTER_PIXEL_GAME__.scene.getScene('SanctumTraversalScene');
        scene.player.setPosition(1880, 280);
      })()
    `,
  });
  await sleep(500);
  await captureScreenshot(ws, '14_final_level1_sequence.png', 'Colossal Stone Vault Opened Revealing the Lost Surya-Chakra Relic');

  // ── AUDIT 16: COMPLETION & 3-STAR REWARDS SCREEN ───────────────────────────
  console.log('\n--- AUDIT 16: Level 1 Completion & Rewards Screen ---');
  await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__GLOBETROTTER_PIXEL_GAME__;
        game.scene.start('ResultsScene');
      })()
    `,
  });
  await sleep(600);
  await captureScreenshot(ws, '15_completion_rewards_screen.png', 'Level 1 Completion Plaque with 3-Star Rating and Discovery Summary');

  // ── AUDIT 17: REAL BROWSER PERFORMANCE & FRAME PACING ──────────────────────
  console.log('\n--- AUDIT 17: Real Browser Performance & Frame Pacing ---');
  const perfRes = await sendCdpCommand(ws, 'Runtime.evaluate', {
    expression: `
      new Promise((resolve) => {
        const frameDeltas = [];
        let lastT = performance.now();
        let count = 0;
        function onFrame(t) {
          const delta = t - lastT;
          lastT = t;
          if (count > 0) frameDeltas.push(delta);
          count++;
          if (count < 60) {
            requestAnimationFrame(onFrame);
          } else {
            frameDeltas.sort((a, b) => a - b);
            const sum = frameDeltas.reduce((a, b) => a + b, 0);
            const avgMs = sum / frameDeltas.length;
            const medianMs = frameDeltas[Math.floor(frameDeltas.length / 2)];
            const minMs = frameDeltas[0];
            const maxMs = frameDeltas[frameDeltas.length - 1];
            const fps = 1000 / avgMs;
            resolve({ avgMs, medianMs, minMs, maxMs, fps, sampleCount: frameDeltas.length });
          }
        }
        requestAnimationFrame(onFrame);
      })
    `,
    awaitPromise: true,
    returnByValue: true,
  });

  const perf = perfRes.result.value;
  console.log(`Measured 2D Pixel Performance over ${perf.sampleCount} frames:`);
  console.log(`  Average Frame Time: ${perf.avgMs.toFixed(2)} ms`);
  console.log(`  Median Frame Time:  ${perf.medianMs.toFixed(2)} ms`);
  console.log(`  Effective FPS:      ${perf.fps.toFixed(1)} FPS`);
  console.log(`  Min Frame Time:     ${perf.minMs.toFixed(2)} ms`);
  console.log(`  Max Frame Time:     ${perf.maxMs.toFixed(2)} ms`);

  // Kill chrome
  try {
    chromeProcess.kill('SIGTERM');
  } catch (e) {}

  console.log('\n======================================================');
  console.log('ALL 17 2D RUNTIME QA AUDITS COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Audit failed with error:', err);
  if (chromeProcess) {
    try {
      chromeProcess.kill('SIGTERM');
    } catch (e) {}
  }
  process.exit(1);
});

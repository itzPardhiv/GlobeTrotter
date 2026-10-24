/**
 * GlobeTrotter - Main Menu Scene
 * Cinematic title screen with ancient temple landscape, drifting embers,
 * gold typography, chapter select, and expedition settings.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';

export class MainMenuScene extends Phaser.Scene {
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private isModalOpen: boolean = false;
  private isStarting: boolean = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  public create() {
    this.isModalOpen = false;
    this.isStarting = false;
    const w = this.scale.width;
    const h = this.scale.height;

    audioManager.playMusic('menu');

    // 1. Layered Cinematic HD-2D Background
    // Deep starry night sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x060913, 0x060913, 0x141829, 0x181c2d, 1);
    sky.fillRect(0, 0, w, h);

    // Distant mountain ranges (parallax silhouette)
    const mountains = this.add.graphics();
    mountains.fillStyle(0x0c101c, 0.9);
    mountains.beginPath();
    mountains.moveTo(0, h * 0.7);
    mountains.lineTo(w * 0.2, h * 0.45);
    mountains.lineTo(w * 0.45, h * 0.65);
    mountains.lineTo(w * 0.75, h * 0.4);
    mountains.lineTo(w, h * 0.68);
    mountains.lineTo(w, h);
    mountains.lineTo(0, h);
    mountains.closePath();
    mountains.fill();

    // Ancient Temple Gopuram & Sanctum Silhouettes in the distance
    const templeDistant = this.add.graphics();
    templeDistant.fillStyle(0x090c14, 0.95);
    // Left temple tower
    templeDistant.fillRect(w * 0.12, h * 0.38, 70, h * 0.4);
    templeDistant.beginPath();
    templeDistant.moveTo(w * 0.12 - 10, h * 0.38);
    templeDistant.lineTo(w * 0.12 + 35, h * 0.22);
    templeDistant.lineTo(w * 0.12 + 80, h * 0.38);
    templeDistant.closePath();
    templeDistant.fill();

    // Central Grand Gopuram Pyramid Tower
    const gx = w * 0.48;
    templeDistant.beginPath();
    templeDistant.moveTo(gx - 80, h * 0.65);
    templeDistant.lineTo(gx - 40, h * 0.18);
    templeDistant.lineTo(gx + 40, h * 0.18);
    templeDistant.lineTo(gx + 80, h * 0.65);
    templeDistant.closePath();
    templeDistant.fill();

    // Sacred Kalasa finial pinnacle
    templeDistant.fillStyle(0xd4af37, 0.85);
    templeDistant.fillRect(gx - 4, h * 0.14, 8, h * 0.05);

    // Golden Sunset / Moonlight Beam behind temple
    const glow = this.add.graphics();
    glow.fillGradientStyle(0xffd700, 0xffd700, 0x000000, 0x000000, 0.25, 0.25, 0, 0);
    glow.fillCircle(gx, h * 0.22, 160);

    // Foreground ancient carved ruins ledge
    const ledge = this.add.graphics();
    ledge.fillStyle(0x07090f, 1);
    ledge.beginPath();
    ledge.moveTo(0, h * 0.72);
    ledge.lineTo(w * 0.35, h * 0.68);
    ledge.lineTo(w * 0.7, h * 0.76);
    ledge.lineTo(w, h * 0.7);
    ledge.lineTo(w, h);
    ledge.lineTo(0, h);
    ledge.closePath();
    ledge.fill();

    // Foreground stone arch pillars on left and right using uploaded assets
    this.add.image(70, h * 0.52, 'asset_pillar_intact').setTint(0x2a221b).setScale(1.4);
    this.add.image(w - 70, h * 0.52, 'asset_pillar_intact').setTint(0x2a221b).setScale(1.4);

    // Dr. Harrison Vance standing on the left cliff with fedora & lantern
    const explorerSil = this.add.sprite(w * 0.22, h * 0.64, 'explorer_sheet', 0).setScale(1.7);
    explorerSil.setTint(0x111116);

    // 2. Drifting Golden Dust and Embers
    if (this.textures.exists('particle_gold')) {
      this.particles = this.add.particles(0, 0, 'particle_gold', {
        x: { min: 0, max: w },
        y: { min: h * 0.2, max: h },
        speedY: { min: -15, max: -45 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.7, end: 0.1 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 3500,
        frequency: 180,
      });
      this.particles.setDepth(5);
    }

    // 3. Bespoke Typography & Title Lockup
    const titleContainer = this.add.container(w / 2, h * 0.26);

    const titleText = this.add.text(0, -25, 'GLOBETROTTER', {
      fontFamily: 'Cinzel Decorative, Cinzel, serif',
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#fff1b8',
      stroke: '#3a2707',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5);

    // Gold gradient style on title
    const subText = this.add.text(0, 32, 'THE LOST RELIC', {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      color: '#d4af37',
      letterSpacing: 8,
      align: 'center',
    }).setOrigin(0.5);

    const taglineText = this.add.text(0, 64, '— BEYOND BORDERS. BEYOND TIME. —', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      color: '#bfa36c',
      letterSpacing: 4,
      align: 'center',
    }).setOrigin(0.5);

    titleContainer.add([titleText, subText, taglineText]);

    // Subtle breathing animation on logo
    this.tweens.add({
      targets: titleContainer,
      y: h * 0.26 - 5,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 4. Interactive Menu Navigation Buttons
    const save = saveManager.get();
    const btnStartY = h * 0.52;
    const btnGap = 52;

    const createMenuBtn = (y: number, text: string, onClick: () => void, isPrimary: boolean = false) => {
      const btn = this.add.container(w / 2, y);

      const bg = this.add.rectangle(0, 0, 280, 42, isPrimary ? 0x241c0e : 0x111622, 0.88);
      bg.setStrokeStyle(isPrimary ? 2 : 1, isPrimary ? 0xd4af37 : 0x48556f);

      const label = this.add.text(0, 0, text, {
        fontFamily: 'Cinzel, serif',
        fontSize: isPrimary ? '18px' : '16px',
        color: isPrimary ? '#ffe58f' : '#cbd5e1',
        letterSpacing: 2,
      }).setOrigin(0.5);

      btn.add([bg, label]);
      btn.setSize(280, 42);
      btn.setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        bg.setFillStyle(0x382c16, 0.95);
        bg.setStrokeStyle(2, 0xffd700);
        label.setColor('#ffffff');
        this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 120 });
        audioManager.playFootstep();
      });

      btn.on('pointerout', () => {
        bg.setFillStyle(isPrimary ? 0x241c0e : 0x111622, 0.88);
        bg.setStrokeStyle(isPrimary ? 2 : 1, isPrimary ? 0xd4af37 : 0x48556f);
        label.setColor(isPrimary ? '#ffe58f' : '#cbd5e1');
        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 120 });
      });

      btn.on('pointerdown', () => {
        audioManager.playCoin();
        onClick();
      });

      return btn;
    };

    // Primary: Start / Begin Expedition
    createMenuBtn(btnStartY, 'BEGIN EXPEDITION', () => {
      this.startExpedition();
    }, true);

    // Secondary: Chapter Select
    createMenuBtn(btnStartY + btnGap, 'CHAPTER SELECT', () => {
      this.showChapterSelectModal();
    });

    // Settings
    createMenuBtn(btnStartY + btnGap * 2, 'EXPEDITION SETTINGS', () => {
      this.showSettingsModal();
    });

    // Control Hint Line at bottom
    this.add.text(w / 2, h - 38, 'WASD / Arrows: Move · Space: Jump · S: Crouch · J: Shoot · E: Interact · Esc: Pause', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      color: '#94a3b8',
      letterSpacing: 1.5,
    }).setOrigin(0.5);

    // Keyboard shortcut to start: Enter or Space
    this.input.keyboard?.on('keydown-SPACE', () => this.startExpedition());
    this.input.keyboard?.on('keydown-ENTER', () => this.startExpedition());
  }

  private startExpedition() {
    if (this.isModalOpen || this.isStarting) return;
    this.isStarting = true;
    audioManager.init();
    audioManager.resume();
    const save = saveManager.get();
    if (!save.hasSeenIntro) {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('IntroScene');
      });
    } else {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TunnelScene');
      });
    }
  }

  private showChapterSelectModal() {
    this.isModalOpen = true;
    const w = this.scale.width;
    const h = this.scale.height;
    const modal = this.add.container(w / 2, h / 2).setDepth(50);

    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.75).setInteractive();
    const panel = this.add.rectangle(0, 0, 680, 480, 0x121722).setStrokeStyle(2, 0xd4af37);

    const title = this.add.text(0, -200, 'EXPEDITION CHAPTERS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      color: '#ffd700',
    }).setOrigin(0.5);

    modal.add([overlay, panel, title]);

    const chapters = [
      { num: 1, name: 'Chapter I: The Sunken Tunnel', key: 'TunnelScene', desc: 'Monolithic rock-cut Ellora mandapas, lotus platforms & Surya vault' },
      { num: 2, name: 'Chapter II: The Celestial Gear Lock', key: 'PuzzleScene', desc: 'Surya, Padma & Trishula ancient astronomical mechanisms' },
      { num: 3, name: 'Chapter III: The Canyon Pursuit', key: 'ChaseScene', desc: 'High-speed expedition jeep vehicle chase & bridge leap' },
      { num: 4, name: 'Chapter IV: The Last Stand', key: 'CombatScene', desc: 'Outer sanctum tactical defense & mercenary standoff' },
      { num: 5, name: 'Chapter V: The Grand Reveal', key: 'GrandRevealScene', desc: 'Monumental golden deity statues & The Lost Relic' },
    ];

    const save = saveManager.get();

    chapters.forEach((chap, idx) => {
      const y = -140 + idx * 64;
      const unlocked = chap.num <= save.unlockedLevel;

      const rowBg = this.add.rectangle(0, y, 620, 52, 0x1a2130, 0.9).setStrokeStyle(1, 0x3d4a66);
      const nameText = this.add.text(-280, y - 10, chap.name, {
        fontFamily: 'Cinzel, serif',
        fontSize: '16px',
        color: unlocked ? '#ffffff' : '#64748b',
      });
      const descText = this.add.text(-280, y + 10, chap.desc, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
      });

      const launchBtn = this.add.rectangle(240, y, 90, 32, 0x2e2413).setStrokeStyle(1, 0xd4af37);
      const launchTxt = this.add.text(240, y, 'EXPLORE', {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: '#ffd700',
      }).setOrigin(0.5);

      if (unlocked) {
        launchBtn.setInteractive({ useHandCursor: true });
        launchBtn.on('pointerover', () => launchBtn.setFillStyle(0x4a3818));
        launchBtn.on('pointerout', () => launchBtn.setFillStyle(0x2e2413));
        launchBtn.on('pointerdown', () => {
          if (this.isStarting) return;
          this.isStarting = true;
          this.isModalOpen = false;
          audioManager.playCoin();
          modal.destroy();
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(chap.key);
          });
        });
      } else {
        launchBtn.setFillStyle(0x131722).setStrokeStyle(1, 0x3d4a66).setAlpha(0.55);
        launchTxt.setColor('#64748b').setAlpha(0.6);
      }

      modal.add([rowBg, nameText, descText, launchBtn, launchTxt]);
    });

    const closeBtn = this.add.text(0, 195, '[ CLOSE CHAPTER LOG ]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      color: '#d4af37',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.isModalOpen = false;
      audioManager.playFootstep();
      modal.destroy();
    });

    modal.add(closeBtn);
  }

  private showSettingsModal() {
    this.isModalOpen = true;
    const w = this.scale.width;
    const h = this.scale.height;
    const modal = this.add.container(w / 2, h / 2).setDepth(50);

    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.75).setInteractive();
    const panel = this.add.rectangle(0, 0, 520, 380, 0x121722).setStrokeStyle(2, 0xd4af37);

    const title = this.add.text(0, -140, 'EXPEDITION SETTINGS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '22px',
      color: '#ffd700',
    }).setOrigin(0.5);

    // Mute toggle
    const muteTxt = this.add.text(-180, -70, 'AUDIO OUTPUT:', {
      fontFamily: 'Cinzel, serif',
      fontSize: '16px',
      color: '#f8fafc',
    });

    const muteBtn = this.add.rectangle(140, -60, 130, 36, audioManager.isMuted ? 0x7f1d1d : 0x14532d);
    muteBtn.setStrokeStyle(1, 0xd4af37);
    const muteBtnTxt = this.add.text(140, -60, audioManager.isMuted ? 'MUTED' : 'ENABLED', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
    }).setOrigin(0.5);

    muteBtn.setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      const newMuted = !audioManager.isMuted;
      audioManager.setMuted(newMuted);
      muteBtn.setFillStyle(newMuted ? 0x7f1d1d : 0x14532d);
      muteBtnTxt.setText(newMuted ? 'MUTED' : 'ENABLED');
      saveManager.updateAudioSettings(newMuted, audioManager.musicVolume, audioManager.sfxVolume);
    });

    // Music Volume
    const musicLabel = this.add.text(-180, -10, 'MUSIC LEVEL:', {
      fontFamily: 'Cinzel, serif',
      fontSize: '16px',
      color: '#f8fafc',
    });

    const musicVolTxt = this.add.text(140, -10, `${Math.round(audioManager.musicVolume * 100)}%`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '18px',
      color: '#ffd700',
    }).setOrigin(0.5);

    // SFX Volume
    const sfxLabel = this.add.text(-180, 50, 'SOUND EFFECTS:', {
      fontFamily: 'Cinzel, serif',
      fontSize: '16px',
      color: '#f8fafc',
    });

    const sfxVolTxt = this.add.text(140, 50, `${Math.round(audioManager.sfxVolume * 100)}%`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '18px',
      color: '#ffd700',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(0, 130, '[ SAVE & RETURN ]', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      color: '#d4af37',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.isModalOpen = false;
      audioManager.playFootstep();
      modal.destroy();
    });

    modal.add([overlay, panel, title, muteTxt, muteBtn, muteBtnTxt, musicLabel, musicVolTxt, sfxLabel, sfxVolTxt, closeBtn]);
  }
}

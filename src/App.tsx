import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './config';
import { audioManager } from './systems/AudioManager';
import { saveManager } from './systems/SaveManager';
import { Volume2, VolumeX, Maximize2, Compass, Layers, Box } from 'lucide-react';
import { ThreeGameView } from './three/ThreeGameView';

export default function App() {
  const [gameMode, setGameMode] = useState<'3d' | 'classic'>('3d');
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => saveManager.get().soundMuted);
  const [activeChapter, setActiveChapter] = useState<string>('BootScene');
  const [showQuickSelect, setShowQuickSelect] = useState<boolean>(false);

  // Mount/unmount Phaser only when in classic 2D mode
  useEffect(() => {
    if (gameMode !== 'classic') {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      return;
    }

    if (!gameRef.current && containerRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);

      const checkSceneInterval = setInterval(() => {
        if (gameRef.current) {
          const activeScenes = gameRef.current.scene.getScenes(true);
          if (activeScenes.length > 0) {
            const current = activeScenes[0].scene.key;
            setActiveChapter(current);
          }
        }
      }, 500);

      const handleBlur = () => {
        if (gameRef.current) {
          const activeScenes = gameRef.current.scene.getScenes(true);
          activeScenes.forEach((s) => {
            s.input.keyboard?.resetKeys();
          });
        }
      };
      window.addEventListener('blur', handleBlur);

      return () => {
        clearInterval(checkSceneInterval);
        window.removeEventListener('blur', handleBlur);
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }
  }, [gameMode]);

  useEffect(() => {
    const syncMuteState = (event: Event) => {
      setIsMuted((event as CustomEvent<boolean>).detail);
    };
    window.addEventListener('globetrotter:mute-state-change', syncMuteState);
    return () => window.removeEventListener('globetrotter:mute-state-change', syncMuteState);
  }, []);

  const toggleMute = () => {
    const next = !audioManager.isMuted;
    audioManager.setMuted(next);
    saveManager.updateAudioSettings(next, audioManager.musicVolume, audioManager.sfxVolume);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const jumpToChapter = (sceneKey: string) => {
    if (!gameRef.current) return;
    audioManager.init();
    audioManager.resume();

    const currentScenes = gameRef.current.scene.getScenes(true);
    currentScenes.forEach((s) => s.scene.stop());
    gameRef.current.scene.start(sceneKey);
    setShowQuickSelect(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] flex items-center justify-center select-none font-['Rajdhani',sans-serif]">
      {/* 3D Cinematic Adventure Engine (Primary) */}
      {gameMode === '3d' ? (
        <ThreeGameView onToggleClassicMode={() => setGameMode('classic')} />
      ) : (
        /* Classic 2D Phaser Viewport Container */
        <div
          id="game-container"
          ref={containerRef}
          className="w-full h-full flex items-center justify-center cursor-default"
        />
      )}

      {/* Persistent Audio & Mode Controls Bar */}
      <div className="absolute top-3 right-4 z-40 flex items-center gap-2 pointer-events-auto">
        {/* Toggle between 3D Cinematic Adventure & Classic 2D Engine */}
        <button
          onClick={() => setGameMode(gameMode === '3d' ? 'classic' : '3d')}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs tracking-wider bg-[#101522]/90 hover:bg-[#1a2336] text-[#ffd700] border border-[#d4af37]/60 hover:border-[#ffd700] rounded shadow-lg transition-all"
          title={gameMode === '3d' ? 'Switch to Classic 2D Mode' : 'Switch to 3D Cinematic Adventure'}
        >
          {gameMode === '3d' ? <Layers className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
          <span className="font-semibold uppercase tracking-widest hidden sm:inline">
            {gameMode === '3d' ? 'Classic 2D' : '3D Adventure'}
          </span>
        </button>

        {/* In Classic mode, Chapter Select dropdown */}
        {gameMode === 'classic' && import.meta.env.DEV && (
          <div className="relative">
            <button
              onClick={() => setShowQuickSelect(!showQuickSelect)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs tracking-wider bg-[#101522]/85 hover:bg-[#1a2336] text-[#ffd700] border border-[#d4af37]/40 hover:border-[#ffd700] rounded shadow-lg transition-all"
              title="Expedition Chapters"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="font-semibold uppercase tracking-widest hidden sm:inline">Chapters</span>
            </button>

            {showQuickSelect && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0d121c]/95 border border-[#d4af37] rounded-lg shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-[#bfa15f] px-2 py-1 uppercase tracking-widest border-b border-[#2a364d] mb-1">
                  Expedition Waypoints
                </div>
                {[
                  { label: 'Prologue: Sanctum Arrival', key: 'IntroScene' },
                  { label: 'Chapter I: The Sunken Tunnel', key: 'TunnelScene' },
                  { label: 'Chapter II: The Celestial Gear Lock', key: 'PuzzleScene' },
                  { label: 'Chapter III: Canyon Pursuit', key: 'ChaseScene' },
                  { label: 'Interlude: Time Flash', key: 'TimeFlashScene' },
                  { label: 'Chapter IV: The Last Stand', key: 'CombatScene' },
                  { label: 'Chapter V: The Grand Reveal', key: 'GrandRevealScene' },
                  { label: 'Main Menu & Title', key: 'MainMenuScene' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => jumpToChapter(item.key)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded flex items-center justify-between transition-colors ${
                      activeChapter === item.key
                        ? 'bg-[#d4af37]/20 text-[#ffd700] font-semibold'
                        : 'text-slate-300 hover:bg-[#1a2438] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {activeChapter === item.key && <span className="w-1.5 h-1.5 rounded-full bg-[#00f7ff]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audio Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-1.5 bg-[#101522]/85 hover:bg-[#1a2336] text-[#ffd700] border border-[#d4af37]/40 hover:border-[#ffd700] rounded shadow-lg transition-all"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Toggle Mute"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-[#101522]/85 hover:bg-[#1a2336] text-[#ffd700] border border-[#d4af37]/40 hover:border-[#ffd700] rounded shadow-lg transition-all"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

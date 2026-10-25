import React, { useState } from 'react';
import { GameHUDState, ThreeGame } from './ThreeGame';
import { saveManager } from '../systems/SaveManager';
import { audioManager } from '../systems/AudioManager';
import { JOURNAL_ENTRIES, RELIC_REGISTRY, ACHIEVEMENTS } from '../systems/Gamification';
import {
  Heart,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Flag,
  Award,
  Star,
  CheckCircle2,
  Compass,
  X,
  Sparkles,
} from 'lucide-react';

interface ThreeHUDProps {
  game: ThreeGame | null;
  hudState: GameHUDState;
  onToggleClassicMode?: () => void;
}

export const ThreeHUD: React.FC<ThreeHUDProps> = ({ game, hudState, onToggleClassicMode }) => {
  const [activeJournalTab, setActiveJournalTab] = useState<
    'story' | 'relic' | 'inscription' | 'location' | 'puzzle' | 'secret'
  >('story');

  if (!game) return null;

  const progress = saveManager.get();

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 font-['Rajdhani',sans-serif]">
      {/* ── TOP HUD BAR ──────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-auto">
        {/* Left: Health & Status */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 bg-[#0b101d]/85 border border-[#d4af37]/40 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl">
            <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold mr-1">Rudhra</span>
            {Array.from({ length: hudState.maxHealth }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-all duration-300 ${
                  i < hudState.health
                    ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                    : 'text-slate-600 fill-transparent'
                }`}
              />
            ))}
          </div>

          <div className="text-[11px] uppercase tracking-wider text-[#9bb0c9] bg-[#0b101d]/60 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700/30">
            XP: <span className="text-[#ffd700] font-bold">{progress.totalXp}</span>
          </div>
        </div>

        {/* Center: Current Objective Pill */}
        <div className="hidden md:flex items-center gap-2 bg-[#0c1424]/90 border border-[#d4af37]/50 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl max-w-lg text-center animate-in fade-in duration-300">
          <Compass className="w-4 h-4 text-[#ffd700] shrink-0 animate-spin-slow" />
          <span className="text-xs tracking-wider text-slate-200 font-medium">
            {hudState.objective}
          </span>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {onToggleClassicMode && (
            <button
              onClick={onToggleClassicMode}
              className="px-2.5 py-1 text-xs tracking-wider bg-[#10192e]/85 hover:bg-[#1a2948] text-[#ffd700] border border-[#d4af37]/40 hover:border-[#ffd700] rounded shadow-lg transition-all font-semibold uppercase"
              title="Switch to Classic 2D View"
            >
              Classic 2D
            </button>
          )}

          <button
            onClick={() => game.toggleJournal()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs tracking-wider bg-[#10192e]/85 hover:bg-[#1a2948] text-[#ffd700] border border-[#d4af37]/40 hover:border-[#ffd700] rounded shadow-lg transition-all"
            title="Discovery Journal [J]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">Journal (J)</span>
          </button>

          <button
            onClick={() => game.togglePause()}
            className="px-2 py-1 text-xs tracking-wider bg-[#10192e]/85 hover:bg-[#1a2948] text-slate-300 border border-slate-600 rounded shadow-lg transition-all"
            title="Pause Menu [Esc]"
          >
            ESC
          </button>
        </div>
      </div>

      {/* ── INTERACTION PROMPT (PULSING AT SCREEN BOTTOM) ───────────────────── */}
      {hudState.interactionPrompt && !hudState.dialogueModal && !hudState.isJournalOpen && !hudState.isPaused && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto animate-bounce duration-1000">
          <div className="flex items-center gap-2 bg-[#0c1424]/95 border-2 border-[#ffd700] px-5 py-2.5 rounded-full shadow-[0_0_25px_rgba(255,215,0,0.4)] backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#ffd700] animate-pulse" />
            <span className="text-sm font-bold tracking-widest text-[#ffd700] uppercase">
              {hudState.interactionPrompt}
            </span>
          </div>
        </div>
      )}

      {/* ── SUBTLE TOAST NOTIFICATIONS (TOP RIGHT) ─────────────────────────── */}
      {hudState.activeToast && (
        <div className="absolute top-16 right-4 pointer-events-auto max-w-sm animate-in slide-in-from-right-8 duration-300">
          <div className="bg-[#0c1527]/95 border-l-4 border-l-[#ffd700] border border-slate-700/60 p-3 rounded-r-lg shadow-2xl backdrop-blur-md">
            <div className="text-xs font-bold tracking-wider text-[#ffd700] uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#ffd700]" />
              {hudState.activeToast.message}
            </div>
            {hudState.activeToast.sub && (
              <div className="text-[11px] text-slate-300 mt-0.5 tracking-wide">
                {hudState.activeToast.sub}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM TRAVEL CONTROLS GUIDE ───────────────────────────────────── */}
      <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 bg-[#070b14]/75 px-3 py-1 rounded-full border border-slate-800/80 backdrop-blur-sm">
        <span className="text-[#ffd700] font-semibold">Controls:</span> [A/D] Move · [Space] Jump · [C] Crouch (Low Passages) · [Shift] Sprint · [E] Interact · [J] Journal · [Esc] Pause
      </div>

      {/* ── CINEMATIC CHARACTER DIALOGUE (SEQUENCE 3: VIKRAM & RUDHRA) ───────── */}
      {hudState.characterDialogue && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-[92%] pointer-events-auto z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-[#0b1120]/95 border-2 border-[#d4af37] rounded-2xl p-5 shadow-[0_0_40px_rgba(212,175,55,0.35)] backdrop-blur-md flex flex-col gap-3">
            {/* Speaker badge & progress */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded text-xs font-bold tracking-widest uppercase ${
                    hudState.characterDialogue.currentSpeaker === 'RUDHRA'
                      ? 'bg-[#1a3a5c] text-[#ffd700] border border-[#d4af37]'
                      : 'bg-[#4a2e18] text-[#ffb347] border border-[#ff8c00]'
                  }`}
                >
                  {hudState.characterDialogue.currentSpeaker || 'OBSERVATION'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {hudState.characterDialogue.lineIndex + 1} / {hudState.characterDialogue.totalLines}
              </span>
            </div>

            {/* Stage direction if present */}
            {hudState.characterDialogue.currentAction && (
              <div className="text-xs text-[#ffd700]/90 italic font-medium">
                *{hudState.characterDialogue.currentAction}*
              </div>
            )}

            {/* Dialogue Text */}
            <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed min-h-[3rem]">
              {hudState.characterDialogue.displayedText && `"${hudState.characterDialogue.displayedText}"`}
              {hudState.characterDialogue.isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-[#ffd700] animate-pulse" />
              )}
            </div>

            {/* Controls footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-[11px] text-slate-400">
              <span className="text-[#ffd700]">Press [Space] or [E] to advance</span>
              <button
                onClick={() => game.skipDialogue()}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors"
              >
                Skip Dialogue (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANCIENT MAP INSPECTION MODAL (SEQUENCE 4) ───────────────────────── */}
      {hudState.mapInspectionModal?.isOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto z-50 animate-in zoom-in-95 duration-200">
          <div
            className="border-4 border-[#8c6b3e] max-w-2xl w-full rounded-2xl p-6 shadow-[0_0_60px_rgba(212,175,55,0.45)] flex flex-col gap-4 text-[#3d2c1d] relative"
            style={{
              backgroundImage: 'radial-gradient(ellipse at center, #dfc699 0%, #be9c66 70%, #876236 100%)',
              boxShadow: 'inset 0 0 50px rgba(45,30,15,0.7), 0 0 50px rgba(0,0,0,0.85)',
            }}
          >
            {/* Map Header */}
            <div className="text-center border-b-2 border-[#5c4024]/60 pb-3">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#5c4024] font-bold">
                Ancient Cartography & Expedition Coordinates
              </div>
              <h3 className="text-2xl font-bold tracking-wider text-[#2d1b0a] mt-1 font-serif">
                CARTOGRAPHY OF THE SUNKEN SANCTUM
              </h3>
              <div className="text-xs font-mono text-[#5c3e1c] font-bold mt-1">
                COORDINATES: {hudState.mapInspectionModal.coordinates}
              </div>
            </div>

            {/* Map Visual Depiction */}
            <div className="relative h-60 rounded-lg border-2 border-[#6d4f2d]/60 bg-[#ceb389]/70 p-4 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Compass Rose */}
              <div className="absolute top-3 right-4 text-center opacity-80">
                <div className="w-12 h-12 border-2 border-[#5c4024] rounded-full flex items-center justify-center font-bold text-xs text-[#4a3219] font-serif">
                  ✦ N ✦
                </div>
              </div>

              {/* Route */}
              <div className="flex flex-col gap-2 z-10 max-w-md">
                <div className="text-xs font-bold text-[#4a3015] uppercase tracking-wider">
                  Expedition Route: Remote Deccan Outpost → Jungle Ravine → Sunken Facade
                </div>
                <p className="text-xs italic text-[#38230e] leading-relaxed">
                  "Follow the eastern dried riverbed past the carved monoliths. Where the ancient roots strangle the sandstone pillars, the subterranean descent begins."
                </p>
              </div>

              {/* Legend & Cosmic Warning */}
              <div className="bg-[#4a321a]/25 border border-[#6d4b26]/60 p-3 rounded text-xs text-[#2a1705]">
                <div className="font-bold text-[#7a1515] uppercase tracking-wide">
                  LEGEND: {hudState.mapInspectionModal.legend}
                </div>
                <div className="mt-1 text-[11px] italic text-[#38230e]">
                  {hudState.mapInspectionModal.loreNote}
                </div>
              </div>
            </div>

            {/* Footer Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => game.closeMapInspection()}
                className="py-2.5 px-8 bg-[#4a3219] hover:bg-[#5e4021] text-[#f7e6c4] font-bold text-sm tracking-widest uppercase rounded-lg shadow-lg border border-[#8c6b3e] transition-transform hover:scale-105 active:scale-95"
              >
                Stow Map & Begin Expedition (E / Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SANSKRIT INSCRIPTION & CODEX DIALOGUE MODAL ────────────────────── */}
      {hudState.dialogueModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto z-50 animate-in fade-in duration-200">
          <div className="bg-[#0b1120] border-2 border-[#d4af37] max-w-xl w-full rounded-2xl p-6 shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col gap-4 text-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#d4af37] font-bold border-b border-[#d4af37]/30 pb-2">
              Archaeological Inscription Translation
            </div>

            <h3 className="text-xl font-bold tracking-wider text-[#ffd700]">
              {hudState.dialogueModal.title}
            </h3>

            {/* Original Sanskrit Text in Devanagari */}
            <div className="bg-[#121b2d] border border-[#d4af37]/40 rounded-xl py-4 px-6 text-lg sm:text-xl font-serif text-[#ffe899] leading-relaxed tracking-wide drop-shadow-[0_2px_10px_rgba(255,215,0,0.2)]">
              {hudState.dialogueModal.originalText}
            </div>

            {/* Verified Translation */}
            <div className="text-slate-200 text-sm leading-relaxed italic bg-[#0d1526]/60 p-4 rounded-lg border border-slate-700/40">
              "{hudState.dialogueModal.translation}"
            </div>

            {/* Scholarly Source */}
            <div className="text-xs text-[#a0b5ce] flex items-center justify-center gap-1.5">
              <span>Verified Source:</span>
              <span className="text-[#ffd700] font-semibold">{hudState.dialogueModal.source}</span>
            </div>

            {hudState.dialogueModal.loreNote && (
              <div className="text-[11px] text-slate-400">
                {hudState.dialogueModal.loreNote}
              </div>
            )}

            <button
              onClick={() => game.closeDialogue()}
              className="mt-2 py-2.5 px-6 self-center bg-gradient-to-r from-[#d4af37] to-[#ffd700] hover:from-[#e5c158] hover:to-[#ffe033] text-[#0b1120] font-bold text-sm tracking-widest uppercase rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Resume Expedition (E / Space)
            </button>
          </div>
        </div>
      )}

      {/* ── DISCOVERY JOURNAL MODAL [J] ────────────────────────────────────── */}
      {hudState.isJournalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto z-50 animate-in fade-in duration-200">
          <div className="bg-[#0b1120] border border-[#d4af37] max-w-3xl w-full h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d4af37]/30 bg-[#0f172a]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#ffd700]" />
                <h2 className="text-lg font-bold tracking-widest text-[#ffd700] uppercase">
                  Archaeological Discovery Journal
                </h2>
              </div>
              <button
                onClick={() => game.toggleJournal()}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-700/60 bg-[#090d18] px-4 overflow-x-auto">
              {[
                { id: 'story', label: 'Story Log' },
                { id: 'relic', label: 'Relics' },
                { id: 'inscription', label: 'Inscriptions' },
                { id: 'location', label: 'Locations' },
                { id: 'puzzle', label: 'Puzzles' },
                { id: 'secret', label: 'Secrets' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveJournalTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors whitespace-nowrap border-b-2 ${
                    activeJournalTab === tab.id
                      ? 'border-[#ffd700] text-[#ffd700] bg-[#121a2e]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Journal Content list */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {Object.values(JOURNAL_ENTRIES)
                .filter((entry) => entry.category === activeJournalTab)
                .map((entry) => {
                  const isUnlocked = saveManager.isJournalUnlocked(entry.id);
                  return (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isUnlocked
                          ? 'bg-[#0f182c] border-[#d4af37]/40 shadow-md'
                          : 'bg-[#080d16] border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${isUnlocked ? 'text-[#ffd700]' : 'text-slate-600'}`}
                          />
                          <h4 className="text-sm font-bold tracking-wide text-white">
                            {isUnlocked ? entry.title : '??? [Undiscovered Entry]'}
                          </h4>
                        </div>
                        <span className="text-[11px] text-[#d4af37] uppercase tracking-wider">
                          {isUnlocked ? entry.location : 'Unknown'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                        {isUnlocked
                          ? entry.description
                          : 'Explore further through the ruins to uncover this archaeological entry.'}
                      </p>
                      {isUnlocked && entry.translation && (
                        <div className="mt-2 p-2.5 bg-[#090f1d] rounded border border-slate-700/50 text-xs italic text-[#ffeaa7]">
                          "{entry.translation}"
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Footer Summary */}
            <div className="px-6 py-3 border-t border-slate-800 bg-[#090d18] flex items-center justify-between text-xs text-slate-400">
              <div>
                Unlocked Journal Entries:{' '}
                <span className="text-[#ffd700] font-bold">
                  {progress.unlockedJournalIds.length} / {Object.keys(JOURNAL_ENTRIES).length}
                </span>
              </div>
              <button
                onClick={() => game.toggleJournal()}
                className="px-4 py-1.5 bg-[#1b263b] hover:bg-[#253450] text-slate-200 rounded font-semibold text-xs tracking-wider"
              >
                Close (Esc / J)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAUSE MENU [ESC] ──────────────────────────────────────────────── */}
      {hudState.isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto z-50 animate-in fade-in duration-200">
          <div className="bg-[#0b1120] border-2 border-[#d4af37] max-w-md w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            <h2 className="text-xl font-bold tracking-widest text-[#ffd700] uppercase border-b border-[#d4af37]/30 pb-3">
              Expedition Paused
            </h2>

            <div className="flex flex-col gap-2.5 my-2">
              <button
                onClick={() => game.togglePause()}
                className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#ffd700] hover:from-[#e5c158] hover:to-[#ffe033] text-[#0b1120] font-bold text-sm tracking-wider uppercase rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume Expedition
              </button>

              <button
                onClick={() => game.restartFromCheckpoint()}
                className="w-full py-2 bg-[#141e33] hover:bg-[#1c2b4a] border border-slate-700 text-slate-200 font-semibold text-xs tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Flag className="w-3.5 h-3.5 text-[#ffd700]" />
                Restart from Checkpoint
              </button>

              <button
                onClick={() => game.restartLevel()}
                className="w-full py-2 bg-[#141e33] hover:bg-[#1c2b4a] border border-slate-700 text-slate-200 font-semibold text-xs tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Restart Level 1
              </button>
            </div>

            {/* Audio Settings */}
            <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span>Sound & Music</span>
              <button
                onClick={() => {
                  const next = !audioManager.isMuted;
                  audioManager.setMuted(next);
                  saveManager.updateAudioSettings(next, audioManager.musicVolume, audioManager.sfxVolume);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1a253c] hover:bg-[#233252] rounded border border-slate-600 font-semibold text-[#ffd700]"
              >
                {audioManager.isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                {audioManager.isMuted ? 'Muted' : 'Enabled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL COMPLETION RESULTS SCREEN (SECTION 11 & 6.4) ─────────────── */}
      {hudState.isResultsOpen && hudState.resultsData && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 pointer-events-auto z-50 animate-in zoom-in-95 duration-300">
          <div className="bg-[#0b1120] border-2 border-[#ffd700] max-w-xl w-full rounded-2xl p-6 shadow-[0_0_60px_rgba(255,215,0,0.3)] flex flex-col gap-5 text-center">
            {/* Header */}
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-bold">
                Expedition Milestone Achieved
              </div>
              <h2 className="text-2xl font-bold tracking-wider text-[#ffd700] mt-1">
                {hudState.resultsData.levelName}
              </h2>
            </div>

            {/* Animated Stars (0 to 3 Stars calculated via S = 0.40P + 0.30D + 0.30M) */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[1, 2, 3].map((starNum) => {
                const isEarned = starNum <= hudState.resultsData!.stars;
                return (
                  <div
                    key={starNum}
                    className={`p-3 rounded-full border-2 transition-all duration-500 ${
                      isEarned
                        ? 'bg-[#1b253b] border-[#ffd700] scale-110 shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                        : 'bg-[#0d121c] border-slate-700 opacity-40'
                    }`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isEarned ? 'text-[#ffd700] fill-[#ffd700]' : 'text-slate-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Results Grid Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Overall Score</div>
                <div className="text-lg font-bold text-[#ffd700]">{hudState.resultsData.score} / 100</div>
              </div>

              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Exploration XP</div>
                <div className="text-lg font-bold text-emerald-400">+{hudState.resultsData.xpEarned} XP</div>
              </div>

              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Relics & Secrets</div>
                <div className="text-lg font-bold text-sky-400">
                  {hudState.resultsData.relicsFound} / {hudState.resultsData.totalRelics}
                </div>
              </div>

              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Expedition Deaths</div>
                <div className="text-lg font-bold text-slate-200">
                  {hudState.resultsData.deaths}{' '}
                  {hudState.resultsData.noDeathBonus && (
                    <span className="text-xs text-amber-400 font-semibold">(Flawless +50 XP!)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => game.restartLevel()}
                className="flex-1 py-3 bg-[#141e33] hover:bg-[#1d2d4c] border border-slate-600 text-slate-200 font-bold text-xs tracking-wider uppercase rounded-xl transition-all"
              >
                Replay Level
              </button>

              <button
                onClick={() => {
                  game.restartLevel();
                  game.hudState.isResultsOpen = false;
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#d4af37] to-[#ffd700] hover:from-[#e5c158] hover:to-[#ffe033] text-[#0b1120] font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Continue Expedition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRELUDE 12-SEQUENCE NAVIGATOR (DEV & QA AUDIT) ────────────────── */}
      <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-wrap gap-1 max-w-lg justify-end z-40 bg-[#0a0f1d]/90 border border-[#d4af37]/40 p-1.5 rounded-lg backdrop-blur-md shadow-2xl">
        <button
          id="btn-seq-1"
          onClick={() => game.jumpToSequence(1)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-[#ffd700] rounded border border-slate-700"
          title="Sequence 1: Opening Jeep Arrival"
        >
          Seq 1: Jeep
        </button>
        <button
          id="btn-seq-2"
          onClick={() => game.jumpToSequence(2)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-amber-300 rounded border border-slate-700"
          title="Sequence 2: Bounty Tracking"
        >
          Seq 2: Track
        </button>
        <button
          id="btn-seq-3"
          onClick={() => game.jumpToSequence(3)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-amber-300 rounded border border-slate-700"
          title="Sequence 3: Bounty Confrontation"
        >
          Seq 3: Vikram
        </button>
        <button
          id="btn-seq-4"
          onClick={() => game.jumpToSequence(4)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-yellow-300 rounded border border-slate-700"
          title="Sequence 4: Map Discovery"
        >
          Seq 4: Map
        </button>
        <button
          id="btn-seq-5"
          onClick={() => game.jumpToSequence(5)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-emerald-300 rounded border border-slate-700"
          title="Sequence 5: The Expedition"
        >
          Seq 5: Expedition
        </button>
        <button
          id="btn-seq-6"
          onClick={() => game.jumpToSequence(6)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-sky-300 rounded border border-slate-700"
          title="Sequence 6: Temple Gates Facade"
        >
          Seq 6: Gates
        </button>
        <button
          id="btn-seq-7"
          onClick={() => game.jumpToSequence(7)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-[#ffd700] rounded border border-slate-700"
          title="Sequence 7: Stepped Descent & Relic Altar"
        >
          Seq 7: Relic
        </button>
        <button
          id="btn-seq-8"
          onClick={() => game.jumpToSequence(8)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-amber-300 rounded border border-slate-700"
          title="Sequence 8: Dynamic Lantern Murals"
        >
          Seq 8: Murals
        </button>
        <button
          id="btn-seq-9"
          onClick={() => game.jumpToSequence(9)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-emerald-300 rounded border border-slate-700"
          title="Sequence 9: Deeper Passage & Archives"
        >
          Seq 9: Sanskrit
        </button>
        <button
          id="btn-seq-10"
          onClick={() => game.jumpToSequence(10)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-sky-300 rounded border border-slate-700"
          title="Sequence 10: Celestial Relic Chamber"
        >
          Seq 10: Mechanism
        </button>
        <button
          id="btn-seq-11"
          onClick={() => game.jumpToSequence(11)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-yellow-400 rounded border border-slate-700"
          title="Sequence 11: 6-Beat Sanctum Awakening"
        >
          Seq 11: Awaken
        </button>
        <button
          id="btn-seq-12"
          onClick={() => game.jumpToSequence(12)}
          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#141e33] hover:bg-[#203052] text-rose-300 rounded border border-slate-700"
          title="Sequence 12: Final Monumental Crossing"
        >
          Seq 12: Bridge
        </button>
      </div>
    </div>
  );
};

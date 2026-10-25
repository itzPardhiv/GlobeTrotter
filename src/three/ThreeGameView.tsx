import React, { useEffect, useRef, useState } from 'react';
import { ThreeGame, GameHUDState } from './ThreeGame';
import { ThreeHUD } from './ThreeHUD';

interface ThreeGameViewProps {
  onToggleClassicMode?: () => void;
}

export const ThreeGameView: React.FC<ThreeGameViewProps> = ({ onToggleClassicMode }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<ThreeGame | null>(null);
  const [hudState, setHudState] = useState<GameHUDState>({
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
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate 3D Three.js game engine
    const game = new ThreeGame(containerRef.current, (newHud) => {
      setHudState({ ...newHud });
    });
    gameRef.current = game;
    game.start();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#060c16]">
      {/* 3D Canvas container */}
      <div ref={containerRef} className="w-full h-full cursor-default select-none" />

      {/* Cinematic React HUD overlay */}
      <ThreeHUD
        game={gameRef.current}
        hudState={hudState}
        onToggleClassicMode={onToggleClassicMode}
      />
    </div>
  );
};

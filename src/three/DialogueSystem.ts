/**
 * DialogueSystem.ts — GlobeTrotter: The Lost Relic
 * 
 * Cinematic dialogue presentation system for character conversations.
 * Supports speaker names, sequential lines, typing animation, skip/advance,
 * and reliable control restoration after completion.
 */

export interface DialogueLine {
  speaker: string;
  text: string;
  /** Optional pause in seconds before auto-advancing (0 = wait for player input) */
  pause?: number;
  /** Optional stage direction / action description shown in italics */
  action?: string;
}

export interface DialogueSequence {
  id: string;
  lines: DialogueLine[];
  /** Called when dialogue completes */
  onComplete?: () => void;
}

export interface DialogueState {
  isActive: boolean;
  currentSpeaker: string;
  currentText: string;
  displayedText: string;
  currentAction: string | null;
  lineIndex: number;
  totalLines: number;
  isTyping: boolean;
  canAdvance: boolean;
}

export class DialogueSystem {
  private sequence: DialogueSequence | null = null;
  private lineIndex: number = 0;
  private charIndex: number = 0;
  private typingTimer: number = 0;
  private pauseTimer: number = 0;
  private isPaused: boolean = false;
  private isComplete: boolean = false;

  /** Characters per second for typing effect */
  private readonly TYPING_SPEED = 45;
  /** Minimum time between advance inputs to prevent accidental skips */
  private readonly ADVANCE_COOLDOWN = 0.15;
  private advanceCooldown: number = 0;

  public state: DialogueState = {
    isActive: false,
    currentSpeaker: '',
    currentText: '',
    displayedText: '',
    currentAction: null,
    lineIndex: 0,
    totalLines: 0,
    isTyping: false,
    canAdvance: false,
  };

  /** Start a new dialogue sequence */
  public start(sequence: DialogueSequence): void {
    this.sequence = sequence;
    this.lineIndex = 0;
    this.charIndex = 0;
    this.typingTimer = 0;
    this.pauseTimer = 0;
    this.isPaused = false;
    this.isComplete = false;
    this.advanceCooldown = 0.3; // Brief delay before first input

    this.state.isActive = true;
    this.state.totalLines = sequence.lines.length;
    this.loadCurrentLine();
  }

  /** Stop and reset dialogue */
  public stop(): void {
    const onComplete = this.sequence?.onComplete;
    this.sequence = null;
    this.lineIndex = 0;
    this.charIndex = 0;
    this.state.isActive = false;
    this.state.currentSpeaker = '';
    this.state.currentText = '';
    this.state.displayedText = '';
    this.state.currentAction = null;
    this.state.isTyping = false;
    this.state.canAdvance = false;
    this.isComplete = true;

    if (onComplete) onComplete();
  }

  /** Advance to next line or complete typing */
  public advance(): void {
    if (!this.sequence || this.advanceCooldown > 0) return;

    // If still typing, complete the current line instantly
    if (this.state.isTyping) {
      this.charIndex = this.state.currentText.length;
      this.state.displayedText = this.state.currentText;
      this.state.isTyping = false;
      this.state.canAdvance = true;
      this.advanceCooldown = this.ADVANCE_COOLDOWN;
      return;
    }

    // Move to next line
    this.lineIndex++;
    this.advanceCooldown = this.ADVANCE_COOLDOWN;

    if (this.lineIndex >= this.sequence.lines.length) {
      this.stop();
      return;
    }

    this.loadCurrentLine();
  }

  /** Skip entire dialogue */
  public skip(): void {
    if (this.sequence) {
      this.stop();
    }
  }

  /** Update typing animation — call each frame */
  public update(delta: number): void {
    if (!this.state.isActive || !this.sequence) return;

    // Cooldown between advances
    if (this.advanceCooldown > 0) {
      this.advanceCooldown = Math.max(0, this.advanceCooldown - delta);
    }

    // Typing animation
    if (this.state.isTyping) {
      this.typingTimer += delta * this.TYPING_SPEED;
      const targetChars = Math.floor(this.typingTimer);
      if (targetChars > this.charIndex) {
        this.charIndex = Math.min(targetChars, this.state.currentText.length);
        this.state.displayedText = this.state.currentText.substring(0, this.charIndex);

        if (this.charIndex >= this.state.currentText.length) {
          this.state.isTyping = false;
          this.state.canAdvance = true;

          // Check for auto-advance pause
          const line = this.sequence.lines[this.lineIndex];
          if (line.pause && line.pause > 0) {
            this.pauseTimer = line.pause;
            this.isPaused = true;
          }
        }
      }
    }

    // Auto-advance pause timer
    if (this.isPaused) {
      this.pauseTimer -= delta;
      if (this.pauseTimer <= 0) {
        this.isPaused = false;
        this.advance();
      }
    }
  }

  /** Load the current line's data into state */
  private loadCurrentLine(): void {
    if (!this.sequence) return;
    const line = this.sequence.lines[this.lineIndex];

    this.state.currentSpeaker = line.speaker;
    this.state.currentText = line.text;
    this.state.displayedText = '';
    this.state.currentAction = line.action || null;
    this.state.lineIndex = this.lineIndex;
    this.state.isTyping = true;
    this.state.canAdvance = false;
    this.charIndex = 0;
    this.typingTimer = 0;
    this.isPaused = false;
  }

  /** Check if dialogue is currently active */
  public isActive(): boolean {
    return this.state.isActive;
  }
}

/** Bounty Confrontation dialogue — Sequence 3 */
export function createBountyDialogue(onComplete: () => void): DialogueSequence {
  return {
    id: 'bounty_confrontation',
    onComplete,
    lines: [
      {
        speaker: 'VIKRAM',
        text: 'You followed me all the way out here for a bounty? You have no idea what you\'ve walked into.',
      },
      {
        speaker: 'RUDHRA',
        text: 'Funny. Most people start talking when they realize they have nowhere left to run.',
      },
      {
        speaker: 'VIKRAM',
        text: 'I\'m serious. There are things buried out there that should never be disturbed.',
      },
      {
        speaker: 'RUDHRA',
        text: 'Then you won\'t mind telling me why you were carrying a map.',
      },
      {
        speaker: '',
        text: '',
        action: 'Vikram hesitates. Rudhra notices the old map on the ground.',
        pause: 1.8,
      },
      {
        speaker: 'RUDHRA',
        text: 'Now that\'s interesting.',
      },
      {
        speaker: 'VIKRAM',
        text: 'Leave it alone.',
      },
      {
        speaker: 'RUDHRA',
        text: 'What\'s it lead to?',
      },
      {
        speaker: 'VIKRAM',
        text: 'One billion gold coins. That\'s what the stories say.',
      },
      {
        speaker: 'RUDHRA',
        text: 'One billion?',
      },
      {
        speaker: 'VIKRAM',
        text: 'Coordinates are marked on the map. An ancient temple. No one who\'s gone looking has come back with the treasure.',
      },
      {
        speaker: 'RUDHRA',
        text: 'And you expect me to believe you just happened to have it?',
      },
      {
        speaker: 'VIKRAM',
        text: 'I went looking. I found something else. Something I wish I\'d never seen.',
      },
      {
        speaker: '',
        text: '',
        action: 'Rudhra examines the map carefully.',
        pause: 2.0,
      },
      {
        speaker: 'RUDHRA',
        text: 'Well, you\'ve just made my day a lot more interesting.',
      },
      {
        speaker: 'VIKRAM',
        text: 'Listen to me. If you reach that temple, don\'t touch anything you don\'t understand.',
      },
      {
        speaker: 'RUDHRA',
        text: 'That\'s generally how I get paid.',
      },
    ],
  };
}

/** Shared, deterministic movement and interaction rules used by gameplay and tests. */
export const WORLD_GRAVITY = 980;
export const PLAYER_RUN_SPEED = 210;
export const PLAYER_JUMP_SPEED = 460;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 46;
export const GATE_INTERACTION_RANGE = 140;

export type PitRange = readonly [startX: number, endX: number];

export function maxJumpRise(jumpSpeed = PLAYER_JUMP_SPEED, gravity = WORLD_GRAVITY): number {
  if (jumpSpeed <= 0 || gravity <= 0) return 0;
  return (jumpSpeed * jumpSpeed) / (2 * gravity);
}

/** Horizontal travel available when landing on a surface `rise` pixels above takeoff. */
export function horizontalJumpReach(
  rise: number,
  jumpSpeed = PLAYER_JUMP_SPEED,
  gravity = WORLD_GRAVITY,
  horizontalSpeed = PLAYER_RUN_SPEED,
): number {
  if (jumpSpeed <= 0 || gravity <= 0 || horizontalSpeed < 0) return 0;
  const discriminant = jumpSpeed * jumpSpeed - 2 * gravity * rise;
  if (discriminant < 0) return 0;
  const descendingTime = (jumpSpeed + Math.sqrt(discriminant)) / gravity;
  return descendingTime * horizontalSpeed;
}

export function isInPitRange(playerX: number, ranges: readonly PitRange[]): boolean {
  return ranges.some(([startX, endX]) => playerX >= startX && playerX <= endX);
}

export function hasReachedPitBottom(
  playerX: number,
  bodyBottom: number,
  worldHeight: number,
  ranges: readonly PitRange[],
): boolean {
  return bodyBottom >= worldHeight - 0.5 && isInPitRange(playerX, ranges);
}

export function isWithinGateRange(playerX: number, gateX: number): boolean {
  return Math.abs(playerX - gateX) < GATE_INTERACTION_RANGE;
}

// ─── Gamification & Mastery Rules ───────────────────────────────────────────
export const REWARD_CONFIG = {
  LOCATION_DISCOVERY: 25,
  HIDDEN_ROUTE: 20,
  INSPECT_INSCRIPTION: 15,
  SOLVE_PUZZLE: 40,
  TRAVERSAL_CHALLENGE: 25,
  RECOVER_RELIC: 50,
  SECRET_CHAMBER: 40,
  LEVEL_COMPLETE: 100,
  NO_DEATH_BONUS: 50,
} as const;

export interface LevelRatingResult {
  score: number;
  stars: number;
  p: number;
  d: number;
  m: number;
}

/**
 * 3-Star Rating Scoring Model:
 * S = 0.40 * P + 0.30 * D + 0.30 * M
 * D = 100 if N=0 else 100 * (discoveries / N)
 * M = 100 if no challenges else 100 * (challenges / total)
 * One star: level completed
 * Two stars: level completed with S >= 60
 * Three stars: level completed with S >= 85
 */
export function calculateStarRating(
  p: number,
  dCollected: number,
  dTotal: number,
  mCompleted: number,
  mTotal: number,
): LevelRatingResult {
  const pScore = Math.max(0, Math.min(100, p));
  const dScore = dTotal <= 0 ? 100 : Math.max(0, Math.min(100, (100 * dCollected) / dTotal));
  const mScore = mTotal <= 0 ? 100 : Math.max(0, Math.min(100, (100 * mCompleted) / mTotal));
  const s = Math.round((0.40 * pScore + 0.30 * dScore + 0.30 * mScore) * 100) / 100;

  let stars = 1; // Completed level always receives at least one star
  if (s >= 85) {
    stars = 3;
  } else if (s >= 60) {
    stars = 2;
  }

  return { score: s, stars, p: pScore, d: dScore, m: mScore };
}


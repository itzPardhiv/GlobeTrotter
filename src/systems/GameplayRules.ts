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

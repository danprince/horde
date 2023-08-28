export interface Point {
  x: number;
  y: number;
}

export const TWO_PI = 2 * Math.PI;

export const NORTH = 0;
export const NORTH_EAST = 1;
export const EAST = 2;
export const SOUTH_EAST = 3;
export const SOUTH = 4;
export const SOUTH_WEST = 5;
export const WEST = 6;
export const NORTH_WEST = 7;

export type Direction =
  | typeof NORTH
  | typeof NORTH_EAST
  | typeof EAST
  | typeof SOUTH_EAST
  | typeof SOUTH
  | typeof SOUTH_WEST
  | typeof WEST
  | typeof NORTH_WEST;

export function getAngleBetweenPoints(p1: Point, p2: Point): number {
  return Math.atan2(p1.y - p2.y, p1.x - p2.x);
}

export function normalizeAngle(radians: number): number {
  let t = radians % TWO_PI;
  return t < 0 ? TWO_PI + t : t;
}

export function getDirectionFromAngle(radians: number): Direction {
  let normal = normalizeAngle(radians) / TWO_PI;
  return (Math.round(normal * 8) % 8) as Direction;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const TWO_PI = 2 * Math.PI;

export const WEST = 0;
export const NORTH_WEST = 1;
export const NORTH = 2;
export const NORTH_EAST = 3;
export const EAST = 4;
export const SOUTH_EAST = 5;
export const SOUTH = 6;
export const SOUTH_WEST = 7;

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

export function getDistanceBetweenPoints(p1: Point, p2: Point): number {
  return Math.hypot(p2.y - p1.y, p2.x - p1.x);
}

export function getPointOnCircle(
  x: number,
  y: number,
  angle: number,
  radius: number,
): Point {
  return {
    x: x + Math.sin(angle) * radius,
    y: y + Math.cos(angle) * radius,
  }
}

export function isPointInRect(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x1 &&
    point.y >= rect.y1 &&
    point.x <= rect.x2 &&
    point.y <= rect.y2
  );
}

import { Unit } from "./game";

import {
  Point,
  getAngleBetweenPoints,
  getDistanceBetweenPoints,
  getDirectionFromAngle,
} from "./geometry";

export function moveTo(unit: Unit, position: Point) {
  let p1 = { x: unit.x, y: unit.y };
  let p2 = { x: position.x, y: position.y };

  let angle = getAngleBetweenPoints(p1, p2);
  let distance = getDistanceBetweenPoints(p1, p2);
  let duration = (distance / unit.speed) * 1000;
  let hops = Math.floor(duration / 1000) * 3;
  let timer = 0;

  unit.direction = getDirectionFromAngle(angle);
  unit.heading = p2;
  unit.goal = dt => {
    timer += dt;

    let t = Math.min(1, timer / duration);
    unit.x = p1.x + (p2.x - p1.x) * t;
    unit.y = p1.y + (p2.y - p1.y) * t;
    unit.z = Math.abs(Math.sin(t * Math.PI * hops)) * 2;

    if (t >= 1) {
      delete unit.goal;
      delete unit.heading;
    }
  };
}

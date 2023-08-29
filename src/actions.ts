import { easeInOutQuad, randomInt } from "./engine";
import { Unit } from "./game";

import {
  Point,
  getAngleBetweenPoints,
  getDistanceBetweenPoints,
  getDirectionFromAngle,
  getRandomPointInCircle,
  TWO_PI,
  getPointOnCircle,
} from "./geometry";

export function moveTo(unit: Unit, position: Point) {
  let p1 = { x: unit.x, y: unit.y };
  let p2 = { x: position.x, y: position.y };

  let angle = getAngleBetweenPoints(p1, p2);
  let distance = getDistanceBetweenPoints(p1, p2);
  let duration = (distance / unit.speed) * 1000;
  let hops = Math.floor(duration / 1000) * 3;
  let timer = 0;

  if (unit.isLeader()) {
    for (let follower of unit.group!.units) {
      if (follower !== unit) {
        let radius = randomInt(10, unit.influence);
        let angle = Math.random() * TWO_PI;
        let point = getPointOnCircle(p2.x, p2.y, angle, radius);
        moveTo(follower, point);
      }
    }
  }

  unit.direction = getDirectionFromAngle(angle);
  unit.heading = p2;
  unit.goal = dt => {
    timer += dt;

    let t = Math.min(1, timer / duration);
    let k = easeInOutQuad(t);
    unit.x = Math.round(p1.x + (p2.x - p1.x) * k);
    unit.y = Math.round(p1.y + (p2.y - p1.y) * k);
    unit.z = Math.round(Math.abs(Math.sin(t * Math.PI * hops)) * 2);

    if (t >= 1) {
      delete unit.goal;
      delete unit.heading;
    }
  };
}

export function wander(unit: Unit) {
  let position: Point;

  if (unit.isWithGroup()) {
    return;
  } else if (unit.group) {
    let leader = unit.group.leader;
    let distance = randomInt(0, leader.influence);
    position = getRandomPointInCircle(leader.x, leader.y, distance);
  } else {
    let distance = 50 + Math.random() * 50;
    position = getRandomPointInCircle(unit.x, unit.y, distance);
  }

  unit.goal = () => moveTo(unit, position);
}

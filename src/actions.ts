import * as sprites from "./sprites";
import { easeInOutQuad, easeOutQuad, lerp, randomInt, slice, timer } from "./engine";
import { Decoration, Projectile, Unit, game } from "./game";

import {
  Point,
  getAngleBetweenPoints,
  getDistanceBetweenPoints,
  getDirectionFromAngle,
  getRandomPointInCircle,
  TWO_PI,
  getPointOnCircle,
  EAST,
  SOUTH_EAST,
  WEST,
  SOUTH_WEST,
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

  let easing = unit.heading ? easeOutQuad : easeInOutQuad;

  unit.direction = getDirectionFromAngle(angle);
  unit.heading = p2;
  unit.goal = dt => {
    timer += dt;

    let t = Math.min(1, timer / duration);
    let k = easing(t);
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

  if (unit.group?.contains(unit) && !unit.isLeader()) {
    return;
  } else if (unit.group) {
    let leader = unit.group.leader;
    let distance = randomInt(0, leader.influence);
    position = getRandomPointInCircle(leader.x, leader.y, distance);
  } else {
    let distance = 50 + Math.random() * 50;
    position = getRandomPointInCircle(unit.x, unit.y, distance);
  }

  moveTo(unit, position);
}

export function hunt(unit: Unit) {
  let vision = 100;

  let targets = game
    .getUnitsInCircle(unit.x, unit.y, vision)
    .filter(target => !target.group)
    .sort((a, b) => unit.distance(a) - unit.distance(b));

  let target = targets[0];

  if (target) {
    moveTo(unit, target);
  } else {
    let position = getRandomPointInCircle(unit.x, unit.y, unit.speed * 5);
    moveTo(unit, position);
  }
}

export function throw_(unit: Unit, target: Point) {
  let angle = getAngleBetweenPoints(unit, target);
  let distance = getDistanceBetweenPoints(unit, target);
  let range = Math.min(200, distance);
  let speed = 300;
  let time = range / speed * 1000;
  let p1 = { x: unit.x, y: unit.y };
  let p2 = getPointOnCircle(unit.x, unit.y, angle + Math.PI, range);
  let direction = getDirectionFromAngle(angle);

  for (let follower of unit.followers()) {
    let point = getRandomPointInCircle(target.x, target.y, 10);
    throw_(follower, point);
  }

  let projectile = new Projectile(
    slice(sprites.javelin, 7),
    p1.x,
    p1.y,
    direction,
  );

  timer(time, t => {
    projectile.x = lerp(p1.x, p2.x, t);
    projectile.y = lerp(p1.y, p2.y, t);
    projectile.z = Math.sin(t * Math.PI) * 10;
  }).then(() => {
    let units = game.getUnitsInCircle(projectile.x, projectile.y, 10);

    for (let unit of units) {
      unit.damage();
    }

    game.projectiles.delete(projectile);
    let direction = projectile.direction;
    if (direction === EAST) direction = SOUTH_EAST;
    if (direction === WEST) direction = SOUTH_WEST;
    game.decorate(
      new Decoration([projectile.sprites[direction]]),
      projectile.x,
      projectile.y,
    );
  });

  game.projectiles.add(projectile);
}

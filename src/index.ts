import {
  clear,
  drawSprite,
  loop,
  resize,
  screenToCanvasCoords,
  timer,
  updateTimers,
} from "./engine";
import { Unit, game } from "./game";
import { Point, getAngleBetweenPoints, getDirectionFromAngle, getDistanceBetweenPoints } from "./geometry";
import { slice } from "./utils";
import * as sprites from "./sprites";

onresize = resize;

onpointermove = event => {
  let pos = screenToCanvasCoords(event.clientX, event.clientY);
  let rad = getAngleBetweenPoints(game.player, pos);
  let dir = getDirectionFromAngle(rad);
  game.player.direction = dir;
};

onpointerdown = event => {
  let position = screenToCanvasCoords(event.clientX, event.clientY);
  move(game.player, position);
}

function move(unit: Unit, position: Point) {
  let angle = getAngleBetweenPoints(unit, position);
  let direction = getDirectionFromAngle(angle);
  let distance = getDistanceBetweenPoints(unit, position);
  let time = distance / unit.speed * 1000;

  let x1 = unit.x;
  let y1 = unit.y;
  let x2 = position.x;
  let y2 = position.y;

  let jumps = Math.floor(time / 1000) * 3;

  timer(time, t => {
    unit.direction = direction;
    unit.x = x1 + (x2 - x1) * t;
    unit.y = y1 + (y2 - y1) * t;
    unit.z = Math.abs(Math.sin(t * Math.PI * jumps)) * 2;
  });
}

function update(dt: number) {
  updateTimers(dt);
  render();
}

function render() {
  clear();
  for (let unit of game.units) {
    drawSprite(sprites.shadow, unit.x, unit.y);

    if (unit.mount) {
      drawSprite(unit.mount.sprites[unit.direction], unit.x, unit.y - unit.z);
    }

    drawSprite(unit.sprites[unit.direction], unit.x, unit.y - unit.z);
  }
}

function init() {
  game.player.sprites = slice(sprites.rider, 16);
  game.player.x = 50;
  game.player.y = 50;

  let horse = new Unit();
  horse.sprites = slice(sprites.horse, 16);
  game.player.mount = horse;

  resize();
  loop(update);
}

init();

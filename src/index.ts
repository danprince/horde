import {
  clear,
  drawSprite,
  loop,
  resize,
  screenToCanvasCoords,
  updateTimers,
  slice,
} from "./engine";
import { Unit, game } from "./game";
import {
  getAngleBetweenPoints,
  getDirectionFromAngle,
} from "./geometry";
import * as sprites from "./sprites";
import { moveTo } from "./actions";

onresize = resize;

onpointermove = event => {
  let pos = screenToCanvasCoords(event.clientX, event.clientY);
  let rad = getAngleBetweenPoints(game.player, pos);
  let dir = getDirectionFromAngle(rad);
  if (!game.player.goal) game.player.direction = dir;
};

onpointerdown = event => {
  let position = screenToCanvasCoords(event.clientX, event.clientY);
  moveTo(game.player, position);
};

function update(dt: number) {
  updateTimers(dt);
  game.update(dt);
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

  if (game.player.heading) {
    drawSprite(sprites.shadow, game.player.heading.x, game.player.heading.y);
    drawSprite(sprites.flag, game.player.heading.x, game.player.heading.y);
  }
}

function init() {
  game.player.sprites = slice(sprites.rider, 16);
  game.player.speed = 
  game.player.x = 50;
  game.player.y = 50;

  let horse = new Unit();
  horse.sprites = slice(sprites.horse, 16);
  game.player.mount = horse;

  resize();
  loop(update);
}

init();

import {
  clear,
  drawSprite,
  loop,
  resize,
  screenToCanvasCoords,
  updateTimers,
} from "./engine";
import { Unit, game } from "./game";
import { getAngleBetweenPoints, getDirectionFromAngle } from "./geometry";
import { slice } from "./utils";
import * as sprites from "./sprites";

onresize = resize;

onpointermove = event => {
  let pos = screenToCanvasCoords(event.clientX, event.clientY);
  let rad = getAngleBetweenPoints(game.player, pos);
  let dir = getDirectionFromAngle(rad);
  game.player.direction = dir;
};

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

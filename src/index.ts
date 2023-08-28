import { clear, drawSprite, loop, resize, screenToCanvasCoords, updateTimers } from "./engine";
import { game } from "./game";
import { getAngleBetweenPoints, getDirectionFromAngle } from "./geometry";
import { rider } from "./sprites";
import { slice } from "./utils";

onresize = resize;

onpointermove = event => {
  let pos = screenToCanvasCoords(event.clientX, event.clientY);
  let rad = getAngleBetweenPoints(game.player, pos);
  let dir = getDirectionFromAngle(rad);
  game.player.direction = dir;
}

function update(dt: number) {
  updateTimers(dt);
  render();
}

function render() {
  clear();
  for (let unit of game.units) {
    let spr = unit.sprites[unit.direction];
    drawSprite(spr, unit.x, unit.y - unit.z);
  }
}

function init() {
  resize();
  loop(update);
  game.player.sprites = slice(rider, 16);
  game.player.x = 50;
  game.player.y = 50;
}

init();

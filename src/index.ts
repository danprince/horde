import { drawSprite, loop, resize, updateTimers } from "./engine";
import { Unit, game } from "./game";
import { rider } from "./sprites";
import { slice } from "./utils";

onresize = resize;

function update(dt: number) {
  updateTimers(dt);
  render();
}

function render() {
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

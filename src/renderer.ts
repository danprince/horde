import { clear, drawSprite } from "./engine";
import { game } from "./game";
import * as sprites from "./sprites";

export function render() {
  clear();

  for (let unit of game.units) {
    drawSprite(sprites.shadow, unit.x, unit.y);

    if (unit.mount) {
      drawSprite(unit.mount.sprites[unit.direction], unit.x, unit.y - unit.z);
    }

    drawSprite(unit.sprites[unit.direction], unit.x, unit.y - unit.z);
  }

  if (game.player.heading) {
    let { x, y } = game.player.heading;
    drawSprite(sprites.shadow, x, y);
    drawSprite(sprites.flag, x, y);
  }
}

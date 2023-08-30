import { clear, ctx, drawSprite } from "./engine";
import { game } from "./game";
import { TWO_PI, getAngleBetweenPoints, getPointOnCircle, isPointInRect } from "./geometry";
import * as sprites from "./sprites";

export function render() {
  let view = game.viewport();

  clear();
  ctx.save();
  ctx.translate(-view.x1, -view.y1);

  for (let deco of game.decorations) {
    if (isPointInRect(deco, view)) {
      drawSprite(deco.sprite, deco.x, deco.y);
    }
  }

  for (let group of game.groups) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = group.color;
    ctx.beginPath();
    ctx.arc(group.leader.x, group.leader.y, group.leader.influence, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  for (let unit of game.units) {
    if (!isPointInRect(unit, view)) {
      continue;
    }

    drawSprite(sprites.shadow, unit.x, unit.y);

    if (unit.isLeader()) {
      drawSprite(sprites.flag, unit.x, unit.y - unit.z - 10, unit.palette);
      if (unit.group?.honorable) {
        drawSprite(sprites.skull, unit.x, unit.y - unit.z - 22);
      }
    }

    if (unit.mount) {
      drawSprite(
        unit.mount.sprites[unit.direction],
        unit.x,
        unit.y - unit.z,
        unit.mount.palette,
      );
    }

    drawSprite(
      unit.sprites[unit.direction],
      unit.x,
      unit.y - unit.z,
      unit.palette,
    );
  }

  for (let projectile of game.projectiles) {
    drawSprite(projectile.sprites[projectile.direction], projectile.x, projectile.y - projectile.z);
  }

  if (game.player.heading) {
    let { x, y } = game.player.heading;
    drawSprite(sprites.shadow, x, y);
    drawSprite(sprites.flag, x, y, game.player.palette);
  }

  for (let group of game.groups) {
    if (group === game.player.group) continue;
    let angle = getAngleBetweenPoints(game.player, group.leader) - Math.PI;
    let radius = game.player.influence;
    let point = getPointOnCircle(game.player.x, game.player.y, angle, radius);
    drawSprite(sprites.horde_indicator, point.x, point.y, group.palette);
  }

  ctx.restore();
}

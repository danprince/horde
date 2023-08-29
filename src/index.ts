import { loop, randomInt, resize, updateTimers } from "./engine";
import { game } from "./game";
import { getAngleBetweenPoints, getDirectionFromAngle } from "./geometry";
import { moveTo, throw_ } from "./actions";
import { render } from "./renderer";
import { Player, Rider } from "./units";
import { Dirt, Grass, Rock } from "./decorations";

onresize = resize;

onpointermove = event => {
  let pos = game.screenToWorld({ x: event.clientX, y: event.clientY });
  let rad = getAngleBetweenPoints(game.player, pos);
  let dir = getDirectionFromAngle(rad);

  game.cursor = pos;

  if (!game.player.goal) {
    game.player.direction = dir;
  }

  for (let unit of game.player.group!.units) {
    if (Math.random() > 0.9 && !unit.goal) {
      unit.direction = dir;
    }
  }
};

onpointerdown = event => {
  let position = game.screenToWorld({ x: event.clientX, y: event.clientY });
  game.cursor = position;
  moveTo(game.player, position);
};

onkeydown = event => {
  if (event.key === " " && game.cursor) {
    throw_(game.player, game.cursor);
  }
};

function update(dt: number) {
  updateTimers(dt);
  game.update(dt);
  render();
}

function init() {
  game.player = Player();
  game.spawn(game.player, 100, 100);
  game.spawn(Rider(), 40, 20);

  for (let i = 0; i < 100; i++) {
    game.spawn(Rider(), randomInt(0, 1000), randomInt(0, 1000));
  }

  for (let i = 0; i < 1000; i++) {
    game.decorate(Grass(), randomInt(0, 1000), randomInt(0, 1000));
    game.decorate(Dirt(), randomInt(0, 1000), randomInt(0, 1000));
  }

  for (let i = 0; i < 20; i++) {
    game.decorate(Rock(), randomInt(0, 1000), randomInt(0, 1000));
  }

  resize();
  loop(update);
}

init();

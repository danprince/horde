import { loop, randomInt, resize, updateTimers } from "./engine";
import { game } from "./game";
import { getAngleBetweenPoints, getDirectionFromAngle } from "./geometry";
import { moveTo } from "./actions";
import { render } from "./renderer";
import { Player, Rider } from "./units";
import { Dirt, Grass, Rock } from "./decorations";

onresize = resize;

onpointermove = event => {
  let pos = game.screenToWorld({ x: event.clientX, y: event.clientY });
  let rad = getAngleBetweenPoints(game.player, pos);
  let dir = getDirectionFromAngle(rad);
  if (!game.player.goal) game.player.direction = dir;
};

onpointerdown = event => {
  let position = game.screenToWorld({ x: event.clientX, y: event.clientY });
  moveTo(game.player, position);
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

  for (let i = 0; i < 10; i++) {
    game.spawn(Rider(), 100, 40);
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

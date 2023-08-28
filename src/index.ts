import { loop, resize, updateTimers } from "./engine";
import { game } from "./game";
import { getAngleBetweenPoints, getDirectionFromAngle } from "./geometry";
import { moveTo } from "./actions";
import { render } from "./renderer";
import { Player, Rider } from "./units";

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
  game.spawn(Rider(), 100, 40);
  resize();
  loop(update);
}

init();

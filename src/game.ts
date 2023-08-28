import { Sprite } from "./engine";
import { Direction, EAST } from "./geometry";

export class Unit {
  x = 0;
  y = 0;
  z = 0;
  speed: number = 30;
  sprites: Sprite[] = [];
  direction: Direction = EAST;
  mount?: Unit;
}

export class Game {
  player: Unit = new Unit();
  units = new Set<Unit>([this.player]);
}

export let game = new Game();

import { Sprite } from "./engine";
import { Direction, EAST, Point } from "./geometry";

export class Game {
  player: Unit = new Unit();
  units = new Set<Unit>([this.player]);

  update(dt: number) {
    for (let unit of this.units) {
      unit.update(dt);
    }
  }
}

export class Unit {
  x = 0;
  y = 0;
  z = 0;
  speed: number = 30;
  sprites: Sprite[] = [];
  direction: Direction = EAST;
  mount?: Unit;
  heading?: Point;
  goal?: Goal;

  update(dt: number) {
    this.goal?.(this, dt);
  }
}

export type Goal = (unit: Unit, dt: number) => void;

export let game = new Game();

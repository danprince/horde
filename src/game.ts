import { Sprite } from "./engine";
import { Direction, EAST, Point } from "./geometry";

export class Game {
  player: Unit = undefined!;
  units = new Set<Unit>();

  update(dt: number) {
    for (let unit of this.units) {
      unit.update(dt);
    }
  }

  spawn(unit: Unit, x: number, y: number) {
    unit.x = x;
    unit.y = y;
    this.units.add(unit);
  }

  despawn(unit: Unit) {
    this.units.delete(unit);
  }
}

export class Unit {
  x = 0;
  y = 0;
  z = 0;
  speed: number = 10;
  sprites: Sprite[] = [];
  direction: Direction = EAST;
  mount?: Unit;
  heading?: Point;
  goal?(dt: number): void;
  bored?(unit: Unit) {}

  update(dt: number) {
    this.goal?.(dt);

    if (!this.goal) {
      this.bored?.(this);
    }
  }
}

export let game = new Game();

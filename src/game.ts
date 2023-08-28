import { Palette, Sprite } from "./engine";
import { Direction, EAST, Point, Rectangle } from "./geometry";

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

  viewport(): Rectangle {
    return {
      x1: (this.player.x - c.width / 2) | 0,
      y1: (this.player.y - c.height / 2) | 0,
      x2: (this.player.x + c.width / 2) | 0,
      y2: (this.player.y + c.height / 2) | 0,
    };
  }

  screenToWorld(point: Point): Point {
    let rect = c.getBoundingClientRect();
    let x = ((point.x - rect.x) / (rect.width / c.width)) | 0;
    let y = ((point.y - rect.y) / (rect.height / c.height)) | 0;
    let { x1, y1 } = this.viewport();
    return { x: x + x1, y: y + y1 };
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
  palette?: Palette;
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
